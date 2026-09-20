/**
 * Mithora Cloudflare Worker - Full Backend (Part B)
 *
 * Bindings expected in env:
 *  - DB (D1)
 *  - SENDGRID_API_KEY
 *  - SENDGRID_FROM
 *  - RAZORPAY_KEY_ID
 *  - RAZORPAY_KEY_SECRET
 *  - RAZORPAY_WEBHOOK_SECRET
 *  - JWT_SECRET
 *  - ADMIN_KEY
 *  - BASE_URL
 *  - DEFAULT_CURRENCY (optional, default INR)
 *
 * Note: This is a single-file Worker that provides REST endpoints.
 */

const encoder = new TextEncoder();
const decoder = new TextDecoder();
// =========================
// EMAIL CONSTANTS
// =========================
const EMAIL_TYPES = {
  SIGNUP: 'signup',
  ORDER: 'order',
  ADMIN_ALERT: 'admin_alert',
  PIN_RESET_OTP: 'pin_reset_otp'
};

// ==========================
// REFERRAL CONFIG
// ==========================
const REFERRAL_CONFIG = {
  welcome_coupon: {
    prefix: "WELCOME",
    discount_type: "flat",
    discount_value: 250,
    min_order: 1000,
    validity_days: 30
  },
  referral_reward_referrer: {
    prefix: "BONUS", // This will create: BONUS500REG{referrerId}
    discount_type: "flat",
    discount_value: 500,
    min_order: 2000,
    validity_days: 30
  },
  referral_reward_new_user: {
    prefix: "REFER",
    discount_type: "flat",
    discount_value: 250,
    min_order: 500,
    validity_days: 30
  }
};

function nowUTC() { return new Date(); }


function timeToTodayUTC(timeStr) {
  if (!timeStr) return null;
  const [h, m] = timeStr.split(':').map(Number);
  const now = nowUTC();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), h, m, 0));
}

function nowIST() { 
  const now = new Date(); 
  return new Date(now.getTime() + 5.5 * 60 * 60 * 1000); // IST
}

function timeToTodayIST(timeStr) {
  if (!timeStr) return null;
  const [h, m] = timeStr.split(':').map(Number);
  const nowIST = nowIST();
  return new Date(Date.UTC(
    nowIST.getUTCFullYear(), 
    nowIST.getUTCMonth(), 
    nowIST.getUTCDate(), 
    h, m, 0
  ));
}


function addMinutes(date, mins) {
  return new Date(date.getTime() + mins * 60000);
}

function isBefore10PMIST() {
  const now = new Date();
  const istHour = (now.getUTCHours() + 5) % 24;
  const istMin = now.getUTCMinutes();
  return istHour < 22 || (istHour === 22 && istMin === 0);
}

function subscriptionStartDateUTC() {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + (isBefore10PMIST() ? 1 : 2));
  d.setUTCHours(3, 30, 0, 0); // 9:00 AM IST
  return d.toISOString();
}


// ---------- Helpers: crypto, JWT, password hashing ----------
async function pbkdf2Hash(password, salt = null) {
  if (!salt) {
    const array = crypto.getRandomValues(new Uint8Array(16));
    salt = Array.from(array).map(b => b.toString(16).padStart(2,'0')).join('');
  }

  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveBits']
  );

  const key = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: hexToUint8Array(salt),
      iterations: 100000, // ✅ CF MAX
      hash: 'SHA-256'
    },
    keyMaterial,
    256
  );

  const hashHex = Array.from(new Uint8Array(key))
    .map(b => b.toString(16).padStart(2,'0'))
    .join('');

  return { salt, hash: hashHex };
}


async function pbkdf2Verify(password, salt, expectedHex) {
  const k = await pbkdf2Hash(password, salt);
  return k.hash === expectedHex;
}

function hexToUint8Array(hex) {
  const res = new Uint8Array(hex.length/2);
  for (let i=0;i<res.length;i++) res[i] = parseInt(hex.substr(i*2,2),16);
  return res;
}

//new helper 21Jan26





function evaluatePrepCategory(category, kitchen) {
  const now = nowUTC();
  const kitchenOpen = timeToTodayUTC(kitchen.kitchenopentime);
  const kitchenClose = timeToTodayUTC(kitchen.kitchenclosetime);
  
  if (kitchenOpen && kitchenClose && now >= kitchenOpen && now <= kitchenClose) {
    const prepTime = category.prep_time_minutes || 20;
    const deliveryTime = category.delivery_time_minutes || 20;
    const totalTime = prepTime + deliveryTime;
    const readyAt = addMinutes(now, totalTime);
    
    return {
      status: 'OPEN',
      delivery_type: 'PREPTIME',
      orderable_now: true,
      ready_at: readyAt.toISOString(),
      user_message: `Ready in ${prepTime} prep + ${deliveryTime} delivery = ${totalTime} mins`,
      prep_time_minutes: prepTime,
      delivery_time_minutes: deliveryTime,
      total_prep_delivery: totalTime,
      delivery_day: 'today',
      kitchen_open: kitchen.kitchenopentime,
      kitchen_close: kitchen.kitchenclosetime
    };
  }
  
  return {
    status: 'CLOSED',
    orderable_now: false,
    user_message: `Kitchen closed. Opens ${kitchen.kitchenopentime}`,
    kitchen_open: kitchen.kitchenopentime,
    kitchen_close: kitchen.kitchenclosetime
  };
}



function evaluateSlotCategory(category, slots, kitchen) {
  // ✅ INLINE IST - No global function conflicts
  const getISTNowLocal = () => {
    const now = new Date();
    return new Date(now.getTime() + 5.5 * 60 * 60 * 1000); // UTC → IST
  };
  
  const timeToTodayISTLocal = (timeStr) => {
    if (!timeStr) return null;
    const clean = timeStr.toString().replace(/[^0-9]/g, '').padStart(4, '0');
    const hour = parseInt(clean.slice(0,2));
    const min = parseInt(clean.slice(2,4));
    const nowIST = getISTNowLocal();
    return new Date(Date.UTC(nowIST.getUTCFullYear(), nowIST.getUTCMonth(), nowIST.getUTCDate(), hour, min, 0));
  };
  
  const now = getISTNowLocal();
  const kitchenClose = timeToTodayISTLocal(kitchen.kitchenclosetime);
  
  if (kitchenClose && now > kitchenClose) {
    const formatTime12hr = (time) => {
      const clean = time.toString().replace(/[^0-9]/g, '').padStart(4, '0');
      const hour = parseInt(clean.slice(0,2));
      const min = clean.slice(2,4);
      const period = hour >= 12 ? 'PM' : 'AM';
      const displayHour = hour % 12 || 12;
      return `${displayHour}:${min} ${period}`;
    };
    return {
      status: 'KITCHENCLOSED',
      orderable_now: false,
      user_message: `Kitchen closed. Next available tomorrow at ${formatTime12hr(kitchen.kitchenopentime)}`,
      kitchen_open: kitchen.kitchenopentime,
      kitchen_close: kitchen.kitchenclosetime,
      delivery_day: 'tomorrow'
    };
  }

  const safeSlots = Array.isArray(slots) ? slots : [];
  if (safeSlots.length === 0) {
    return {
      status: 'NOSLOTS',
      orderable_now: false,
      user_message: "No delivery slots available"
    };
  }

  // 🔥 FIXED: Next available slot only
  let futureSlots = [];
  for (const slot of safeSlots) {
    const orderEnd = timeToTodayISTLocal(slot.orderendtime);
    if (orderEnd && now < orderEnd) {
      futureSlots.push({ slot, orderEnd });
    }
  }

  let availableSlot;
  if (futureSlots.length > 0) {
    futureSlots.sort((a, b) => a.orderEnd - b.orderEnd);
    availableSlot = futureSlots[0].slot;
} else {
  // No today slots → Tomorrow's first slot (NOT ORDERABLE)
  const firstSlot = safeSlots[0];
  
  // ✅ MOVE FUNCTION BEFORE USE
  const formatTime12hr = (time) => {
    const clean = time.toString().replace(/[^0-9]/g, '').padStart(4, '0');
    const hour = parseInt(clean.slice(0,2));
    const min = clean.slice(2,4);
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${min} ${period}`;
  };
  
  return {
    status: 'NEXTDAY',
    delivery_type: 'SLOT',
    orderable_now: false,       // ✅ BLOCK ADVANCE ORDERS
    slot_name: `${firstSlot.name} (Tomorrow)`,
    user_message: `Next available: ${formatTime12hr(firstSlot.orderstarttime)} tomorrow`,
    delivery_day: 'tomorrow'
  };
}


  const formatTime12hr = (time) => {
    const clean = time.toString().replace(/[^0-9]/g, '').padStart(4, '0');
    const hour = parseInt(clean.slice(0,2));
    const min = clean.slice(2,4);
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${min} ${period}`;
  };

  return {
    status: 'OPEN',
    delivery_type: 'SLOT',
    orderable_now: true,
    slot_name: availableSlot.name,
    order_window: { start: availableSlot.orderstarttime, end: availableSlot.orderendtime },
    delivery_window: { start: availableSlot.deliverystarttime, end: availableSlot.deliveryendtime },
    user_message: `Order before ${formatTime12hr(availableSlot.orderendtime)} Delivery ${formatTime12hr(availableSlot.deliverystarttime)}-${formatTime12hr(availableSlot.deliveryendtime)}`,
    delivery_day: 'today'
  };
}








async function handleCategoryAvailability(env) {
  // 1. Date formatting
  function formatDate(date) {
    const d = new Date(date);
    return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
  }

  // 2. IST helper (inline - no naming conflicts)
  const getISTNow = () => {
    const now = new Date();
    return new Date(now.getTime() + 5.5 * 60 * 60 * 1000); // IST offset
  };

  const timeToTodayIST = (timeStr) => {
    if (!timeStr) return null;
    const [h, m] = timeStr.split(':').map(Number);
    const nowIST = getISTNow();
    return new Date(Date.UTC(nowIST.getUTCFullYear(), nowIST.getUTCMonth(), nowIST.getUTCDate(), h, m, 0));
  };

  // 3. Current IST time
  const nowIST = getISTNow();
  
  // 4. Subscription logic: 23:42 > 22:00 = next day
  const todayIST = new Date(nowIST.getFullYear(), nowIST.getMonth(), nowIST.getDate());
  const cutoffTodayIST = new Date(todayIST.getTime() + 22 * 60 * 60 * 1000);
  const nextCutoffDay = nowIST > cutoffTodayIST ? 
    new Date(todayIST.getTime() + 24 * 60 * 60 * 1000) : todayIST;
  const nextCutoffTime = new Date(nextCutoffDay.getTime() + 22 * 60 * 60 * 1000);
  const subscriptionStartDay = new Date(nextCutoffTime.getTime() + 24 * 60 * 60 * 1000);

  // 5. Kitchen settings
  const kitchen = await env.DB.prepare(`
    SELECT kitchen_open_time as kitchenopentime,
           kitchen_close_time as kitchenclosetime
    FROM kitchen_settings WHERE id = 1
  `).first() || { kitchenopentime: '06:00', kitchenclosetime: '23:55' };

  const kitchenCloseIST = timeToTodayIST(kitchen.kitchenclosetime);
  const isKitchenClosed = nowIST > kitchenCloseIST; // 23:42 > 21:00 = TRUE

  // 6. Database queries
  const categoriesResult = await env.DB.prepare(`
    SELECT id, name, slot_wise,
           prep_time_minutes, delivery_time_minutes,
           next_day_delivery, shipping_type, subscription_allowed
    FROM categories WHERE is_active = 1
  `).all();
  const categories = categoriesResult.results || [];

  const slotsResult = await env.DB.prepare(`
    SELECT id, name, 
           order_start_time as orderstarttime,
           order_end_time as orderendtime,
           delivery_start_time as deliverystarttime,
           delivery_end_time as deliveryendtime
    FROM delivery_slots WHERE is_active = 1
  `).all();
  const slots = slotsResult.results || [];

  const mappingsResult = await env.DB.prepare(`
    SELECT category_id as categoryid, slot_id as slotid 
    FROM category_slots
  `).all();
  const mappings = mappingsResult.results || [];

  const slotMap = {};
  mappings.forEach(m => {
    if (!slotMap[m.categoryid]) slotMap[m.categoryid] = [];
    slotMap[m.categoryid].push(m.slotid);
  });

  // 7. Result structure
  const result = {
    kitchen_open: kitchen.kitchenopentime,
    kitchen_close: kitchen.kitchenclosetime,
    is_kitchen_closed: isKitchenClosed,
    subscription_next_cutoff: formatDate(nextCutoffTime),
    current_time_ist: nowIST.toLocaleString('en-IN'),
    total_categories_found: categories.length,
    categories: []
  };

  // 8. Process categories
  categories.forEach(c => {
    let res;
    
    if (c.subscription_allowed == 1) {
      res = { 
        status: 'OPEN', 
        delivery_type: 'SUBSCRIPTION', 
        orderable_now: true, 
        //user_message: `Subscribe Before 10PM on ${formatDate(nextCutoffTime)} to start delievry by ${formatDate(subscriptionStartDay)}`,
		user_message: `Subscribe Before 10PM & get delivery by ${formatDate(subscriptionStartDay)}`,
        subscription_next_cutoff: formatDate(nextCutoffTime),
        subscription_start_date: formatDate(subscriptionStartDay),
        delivery_day: 'future'
      };
    }
    else if (c.shipping_type === 'panindia' || c.shipping_type === 'pan_india') {
      res = { status: 'OPEN', delivery_type: 'PANINDIA', orderable_now: true,
        user_message: "Pan India delivery (2-7 days). Enter pincode for exact time.", 
        delivery_day: '2-7days' 
      };
    }
    else if (c.next_day_delivery == 1) {
      res = { status: 'NEXTDAY', delivery_type: 'NEXTDAY', orderable_now: true,
        user_message: "Delivery within 48 hours.", delivery_day: 'tomorrow' 
      };
    }
    else if (c.slot_wise == 1 && slotMap[c.id] && slotMap[c.id].length > 0) {
      if (isKitchenClosed) {
        res = {
          status: 'KITCHENCLOSED',
          delivery_type: 'SLOT',
          orderable_now: false,
          user_message: `Kitchen closed at ${kitchen.kitchenclosetime}. Reopens ${kitchen.kitchenopentime} tomorrow`,
          kitchen_closed: true
        };
      } else {
        const allowedSlots = slots.filter(s => slotMap[c.id].includes(s.id));
        res = evaluateSlotCategory(c, allowedSlots, kitchen);
      }
    }  // ✅ THIS CLOSING BRACE FIXES IT
    else {
  // PREPTIME - Respect kitchen hours
  const formatTime12hr = (time) => {
    const clean = time.toString().replace(/[^0-9]/g, '').padStart(4, '0');
    const hour = parseInt(clean.slice(0,2));
    const min = clean.slice(2,4);
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${min} ${period}`;
  };
  
  if (isKitchenClosed) {
    res = {
      status: 'KITCHENCLOSED',
      delivery_type: 'PREPTIME',
      orderable_now: false,
      user_message: `Kitchen closed. Next available tomorrow at ${formatTime12hr(kitchen.kitchenopentime)}`
    };
  } else {
    const prepTime = c.prep_time_minutes || 20;
    const deliveryTime = c.delivery_time_minutes || 20;
    const totalTime = prepTime + deliveryTime;
    res = {
      status: 'OPEN',
      delivery_type: 'PREPTIME',
      orderable_now: true,
      user_message: `Ready in ${totalTime} mins`
    };
  }
}



    result.categories.push({
      category_id: c.id, category_name: c.name,
      orderable_now: res.orderable_now ?? false,
      status: res.status || 'OPEN', delivery_type: res.delivery_type || 'PREPTIME',
      user_message: res.user_message || 'Available now', shipping_type: c.shipping_type || 'local',
      slot_name: res.slot_name || null,
      order_window_open: res.order_window?.start || null,
      order_window_close: res.order_window?.end || null,
      delivery_start: res.delivery_window?.start || null,
      delivery_end: res.delivery_window?.end || null,
      subscription_next_cutoff: res.subscription_next_cutoff || null,
      subscription_start_date: res.subscription_start_date || null,
      kitchen_closed: res.kitchen_closed || false,
      kitchen_open: kitchen.kitchenopentime,
      kitchen_close: kitchen.kitchenclosetime,
      has_slots: !!slotMap[c.id],
      slot_count: slotMap[c.id]?.length || 0,
      delivery_day: res.delivery_day || 'today'
    });
  });
  
  return jsonResponse(result);
}








// JWT using HMAC-SHA256
async function signJWT(payload, secret, expiresInSeconds = 60*60*24*7) {
	if (!secret || secret.length < 16) {
    throw new Error("JWT_SECRET is missing or too short");
  }
  const header = { alg: 'HS256', typ: 'JWT' };
  const exp = Math.floor(Date.now()/1000) + expiresInSeconds;
  const tokenPayload = Object.assign({}, payload, { exp });
  const toSign = btoa(JSON.stringify(header)) + '.' + btoa(JSON.stringify(tokenPayload));
  const sig = await hmacHex(secret, toSign);
  return `${toSign}.${sig}`;
}
async function verifyJWT(token, secret) {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const [h64, p64, sig] = parts;
    const data = `${h64}.${p64}`;
    const expected = await hmacHex(secret, data);
    if (expected !== sig) return null;
    const payload = JSON.parse(atob(p64));
    if (payload.exp && Date.now()/1000 > payload.exp) return null;
    return payload;
  } catch (e) {
    return null;
  }
}
async function hmacHex(secret, message) {
  const key = await crypto.subtle.importKey('raw', encoder.encode(secret), {name:'HMAC', hash:'SHA-256'}, false, ['sign']);
  const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(message));
  return Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2,'0')).join('');
}

// Utility: parse JSON safely
async function jsonBody(request) {
  try {
    return await request.json();
  } catch (e) {
    return null;
  }
}

// Small helper to build responses
function jsonResponse(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Cache-Control': 'no-store'
    }
  });
}

// 🔒 FINAL D1 SANITIZER (ABSOLUTE SAFETY)
function d1(value) {
  if (value === undefined) return null;
  if (typeof value === 'number' && Number.isNaN(value)) return 0;
  return value;
}


// 🔒 D1 SAFE VALUE HELPER
function safe(value, fallback = null) {
  return value === undefined ? fallback : value;
}


// Helper: Basic validation helper
function requireFields(obj, fields) {
  const missing = [];
  for (const f of fields) if (!obj || obj[f] === undefined || obj[f] === null || (typeof obj[f]==='string' && obj[f].trim()==='')) missing.push(f);
  return missing;
}

// ---------- Shipping helpers ----------
async function computeChargeableGramsFromVariants(env, items) {
  // items = [{ variant_id, qty }]
  if (!items || items.length === 0) return 0;
  const ids = items.map(i=>i.variant_id);
  const placeholders = ids.map(()=>'?').join(',');
  const q = `SELECT id, weight_grams, length_cm, width_cm, height_cm FROM product_variants WHERE id IN (${placeholders})`;
  const res = await env.DB.prepare(q).bind(...ids).all();
  const rows = res.results || [];
  const map = new Map(rows.map(r => [r.id, r]));

  let totalActual = 0;
  let totalVolGrams = 0;
  for (const it of items) {
    const v = map.get(it.variant_id);
    const actual = (v?.weight_grams || 0) * (it.qty || 1);
    totalActual += actual;
    const volKg = ((v?.length_cm || 0) * (v?.width_cm || 0) * (v?.height_cm || 0)) / 5000; // kg
    const volGrams = Math.ceil((volKg * 1000) * (it.qty || 1));
    totalVolGrams += volGrams;
  }
  const chargeable = Math.max(totalActual, totalVolGrams);
  // Round up to nearest 500g
  return Math.max(500, Math.ceil(chargeable / 500) * 500);
}

async function getJaipurShipping(env, areaName, subtotal) {
  if (!areaName) return { charge: 50, min_order: 0, warnings: ['Area not provided; default charge applied'] };
  const r = await env.DB.prepare('SELECT shipping_charge, min_order_amount FROM jaipur_area_shipping WHERE area_name = ? AND is_active=1').bind(areaName).first();
  if (!r) return { charge: 50, min_order: 0, warnings: ['Area not configured; default charge'] };
  return { charge: r.shipping_charge || 0, min_order: r.min_order_amount || 0, warnings: [] };
}

async function getPanIndiaShipping(env, stateName, grams) {
  // grams must be integer grams
  // find zone whose states include stateName
  const rz = await env.DB.prepare('SELECT * FROM shipping_zones WHERE is_active=1').all();
  let zone = null;
  for (const z of rz.results || []) {
    try {
      const states = JSON.parse(z.states || '[]');
      if (states.includes(stateName)) { zone = z; break; }
    } catch (e) {}
  }
  if (!zone) {
    // fallback default
    return { cost: 150, zone: 'default' };
  }
  const first = parseFloat(zone.base_first_500g || 0);
  const extra = parseFloat(zone.extra_500g || 0);
  const extraUnits = Math.max(0, Math.ceil((grams - 500)/500));
  const cost = first + (extraUnits * extra);
  return { cost, zone: zone.name };
}


// =========================
// EMAIL PROVIDER ROUTER
// =========================
async function sendEmail(env, type, to, subject, html) {
  let fromEmail;
  let fromName = env.EMAIL_FROM_NAME || 'Mithora Kitchen';

if (type === EMAIL_TYPES.SIGNUP) {
  fromEmail = env.SIGNUP_FROM_EMAIL;
}
else if (type === EMAIL_TYPES.ORDER) {
  fromEmail = env.ORDER_FROM_EMAIL;
}
else if (type === EMAIL_TYPES.ADMIN_ALERT) {
  fromEmail = env.ADMIN_FROM_EMAIL
    || env.ORDER_FROM_EMAIL;
}
else if (type === EMAIL_TYPES.PIN_RESET_OTP) {
  fromEmail = env.SIGNUP_FROM_EMAIL;
}
else {
  throw new Error('Invalid email type');
}

  const payload = {
    to,
    subject,
    html,
    from: {
      email: fromEmail,
      name: fromName
    }
  };


//Sendgrid Switch

  /*switch (env.EMAIL_PROVIDER) {
    case 'sendgrid':
      return sendWithSendGrid(env, payload);
    default:
      throw new Error('Unsupported EMAIL_PROVIDER');
  }*/
  
switch (env.EMAIL_PROVIDER) {
  case 'brevo':
    return sendWithBrevo(env, {
      to,
      subject,
      html,
      type
    });

  case 'sendgrid':
    return sendWithSendGrid(env, payload);

  default:
    throw new Error('Unsupported EMAIL_PROVIDER');
}

}



// Brevo Adapter

// =========================
// BREVO (Sendinblue) ADAPTER
// =========================
async function sendWithBrevo(env, { to, subject, html, type }) {

const templateMap = {
  signup: env.BREVO_TEMPLATE_SIGNUP_ID,
  order: env.BREVO_TEMPLATE_ORDER_ID,
  admin_alert: env.BREVO_TEMPLATE_ADMIN_ID,
  pin_reset_otp: env.BREVO_TEMPLATE_PIN_RESET_OTP_ID
};

  const templateId = templateMap[type];

  if (!templateId) {
    throw new Error('Missing Brevo templateId for type: ' + type);
  }

  const res = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'api-key': env.BREVO_API_KEY,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      to: [{ email: to }],
      templateId: parseInt(templateId),

      // ✅ FIX: pass full object
      params: html   // 👈 THIS IS THE FIX
    })
  });

  if (!res.ok) {
    const err = await res.text();
    console.error('Brevo failed:', err);
    throw new Error('Brevo email failed');
  }
}


// =========================
// SENDGRID ADAPTER
// =========================
async function sendWithSendGrid(env, { to, subject, html, from }) {
  const res = await fetch('https://api.sendgrid.com/v3/mail/send', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.SENDGRID_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      personalizations: [{ to: [{ email: to }], subject }],
      from,
      content: [{ type: 'text/html', value: html }]
    })
  });

  if (!res.ok) {
    const err = await res.text();
    console.error('SendGrid failed:', err);
    throw new Error('Email send failed');
  }
}


// ---------- Razorpay order creation ----------
async function createRazorpayOrder(env, amountPaise, receipt) {
  const url = 'https://api.razorpay.com/v1/orders';
  const body = { amount: amountPaise, currency: env.DEFAULT_CURRENCY || 'INR', receipt, payment_capture: 1 };
  const auth = `${env.RAZORPAY_KEY_ID}:${env.RAZORPAY_KEY_SECRET}`;
  const resp = await fetch(url, { method: 'POST', headers: { Authorization: 'Basic ' + btoa(auth), 'Content-Type':'application/json' }, body: JSON.stringify(body) });
  const data = await resp.json();
  if (!resp.ok) {
    console.error('Razorpay order create failed', data);
    return null;
  }
  return data;
}


// new addtion

// 🔥 ADD THIS requireUser FUNCTION HERE 🔥
async function requireUser(request, env) {
  const authHeader = request.headers.get('Authorization');

  if (!authHeader?.startsWith('Bearer ')) {
    return jsonResponse({ error: 'Missing Bearer token' }, 401);
  }

  const token = authHeader.slice(7).trim();

  if (!token) {
    return jsonResponse({ error: 'Missing Bearer token' }, 401);
  }

  try {
    const payload = await verifyJWT(token, env.JWT_SECRET);

    if (!payload) {
      return jsonResponse({ error: 'Invalid token' }, 401);
    }

    // JWT user ID is the source of truth.
    // Never trust user_id supplied by the client.
    const userId = Number(payload.uid);

    if (!Number.isInteger(userId) || userId <= 0) {
      return jsonResponse({ error: 'Invalid token payload' }, 401);
    }

    const user = await env.DB.prepare(
      'SELECT id, email, phone, name, is_admin FROM users WHERE id = ?'
    ).bind(userId).first();

    if (!user) {
      return jsonResponse({ error: 'User not found' }, 401);
    }

    return {
      id: user.id,
      email: user.email,
      phone: user.phone,
      name: user.name,
      is_admin: user.is_admin || 0
    };

  } catch (e) {
    console.error('JWT authentication error:', e);
    return jsonResponse({ error: 'Authentication failed' }, 401);
  }
}


// ---------- Main Router ----------
export default {
  async fetch(request, env) {
    try {
      const url = new URL(request.url);
      const path = url.pathname;
      const method = request.method;
	  const pathname = url.pathname;  // ✅ FIXED!


	  // ===============================
// CORS PREFLIGHT
// ===============================
if (method === 'OPTIONS') {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400'
    }
  });
}

      // AUTH
// ======================================================
// AUTH ROUTES
// ======================================================

// Existing login
if (
  method === 'POST' &&
  path === '/api/auth/login'
) {
  return await handleLogin(request, env);
}


// Check mobile
if (
  method === 'POST' &&
  path === '/api/auth/check-mobile'
) {
  return await handleCheckMobile(request, env);
}


// ------------------------------------------------------
// NEW SIGNUP OTP FLOW
// ------------------------------------------------------

// Step 1: Request email OTP
if (
  method === 'POST' &&
  path === '/api/auth/signup/request-otp'
) {
  return await handleSignupRequestOTP(request, env);
}


// Step 2: Verify email OTP
if (
  method === 'POST' &&
  path === '/api/auth/signup/verify-otp'
) {
  return await handleSignupVerifyOTP(request, env);
}


// Step 3: Complete signup / create account
if (
  method === 'POST' &&
  path === '/api/auth/signup/complete'
) {
  return await handleSignupComplete(request, env);
}


// ------------------------------------------------------
// PIN RESET
// ------------------------------------------------------

if (
  method === 'POST' &&
  path === '/api/auth/request-pin-reset'
) {
  return await handleRequestPinResetOTP(request, env);
}


if (
  method === 'POST' &&
  path === '/api/auth/reset-pin'
) {
  return await handleResetPin(request, env);
}


// ------------------------------------------------------
// ADMIN LOGIN
// ------------------------------------------------------

if (
  method === 'POST' &&
  path === '/api/auth/admin/login'
) {
  return await handleAdminLogin(request, env);
}


// ------------------------------------------------------
// OLD AUTH ROUTES
// Keep temporarily for backward compatibility
// ------------------------------------------------------

if (
  method === 'POST' &&
  path === '/api/auth/signup'
) {
  return await handleSignup(request, env);
}


if (
  method === 'POST' &&
  path === '/api/auth/forgot-password'
) {
  return await handleForgotPassword(request, env);
}


if (
  method === 'POST' &&
  path === '/api/auth/reset-password'
) {
  return await handleResetPassword(request, env);
}

    // ===============================
if (
  method === 'POST' &&
  (path === '/api/mithora-feedback' || path === '/api/mithora-feedback/')
) {
  return await handleMithoraFeedback(request, env);
}

if (method === 'GET' && path === '/api/location/suggest') {
  return await handleLocationSuggest(request, env);
}

if (method === 'GET' && path === '/api/menu/category-availability') {
  return await handleCategoryAvailability(env);
}

if (method === 'GET' && path.startsWith('/api/orders/order-no/')) {
  return await handleGetOrderByOrderNo(request, env);
}


if (method === 'GET' && path.startsWith('/api/orders/invoice/')) {
  return await handleInvoiceDownload(request, env);
}

// Add this inside the export default { async fetch... } block in your worker
if (method === 'GET' && path === '/api/orders') {
  const result = await requireUser(request, env);
  if (!result.id) return result;
  
  const { results } = await env.DB.prepare(`
    SELECT * FROM orders 
    WHERE user_id = ? 
    ORDER BY created_at DESC
  `).bind(result.id).all();
  
  return jsonResponse({ ok: true, orders: results });
}

// ========================================
// CART SAVE/LOAD - FIXED VERSION
// ========================================
// ========================================
// CART SAVE/LOAD - CORRECTED VERSION
// ========================================
if (url.pathname === "/api/cart/save" && request.method === "POST") {
  const result = await requireUser(request, env);
  if (!result.id) return result;  // ✅ CORRECT - check for id property
  
  const body = await jsonBody(request);
  if (!body) return jsonResponse({ error: 'Invalid cart data' }, 400);
  
  const cartJson = JSON.stringify(body);
  if (!Array.isArray(body.items)) {
  return jsonResponse({ error: 'Invalid cart structure' }, 400);
}

  await env.DB.prepare(`
    INSERT INTO carts (user_id, cart_json, updated_at)
    VALUES (?, ?, datetime('now'))
    ON CONFLICT(user_id) DO UPDATE SET
      cart_json = excluded.cart_json,
      updated_at = datetime('now')
  `).bind(result.id, cartJson).run();

  return jsonResponse({ ok: true });
}

if (url.pathname === "/api/cart/load" && request.method === "GET") {
  const result = await requireUser(request, env);
  if (!result.id) return result;  // ✅ CORRECT
  
  const row = await env.DB.prepare(
    "SELECT cart_json FROM carts WHERE user_id = ?"
  ).bind(result.id).first();

  return jsonResponse({ cart: row?.cart_json ? JSON.parse(row.cart_json) : null });
}


//end of cart save & load

// 🔥 DELETE YOUR CURRENT 3 ROUTES & REPLACE WITH THIS 🔥

// ✅ 1. GET /api/user/addresses
if (request.method === 'GET' && pathname === '/api/user/addresses') {
  const result = await requireUser(request, env);
  if (!result.id) return result;
  
  const { results } = await env.DB.prepare(`
    SELECT id, name, phone, house, street, area, city, state, pincode, is_default
    FROM addresses 
    WHERE user_id = ?
    ORDER BY is_default DESC, created_at DESC
    LIMIT 10
  `).bind(result.id).all();
  
  return Response.json(results);
}

if (path === '/api/user/profile' && method === 'GET') {

  const auth = await requireUser(request, env);
  if (!auth.id) return auth;

  const user = await env.DB.prepare(
    'SELECT * FROM users WHERE id = ?'
  ).bind(auth.id).first();

  if (!user) {
    return jsonResponse({ error: 'User not found' }, 404);
  }

  return jsonResponse({
    ok: true,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      referral_code: user.referral_code || `BONUS500REG${user.id}`,
      is_admin: user.is_admin || 0
    }
  });
}

// ✅ 2. POST /api/user/addresses  
// GET /api/user/addresses
if (url.pathname === '/api/user/addresses' && request.method === 'GET') {
  const auth = await requireUser(request, env);
  if (!auth.id) return auth;
  
  const addresses = await env.DB.prepare(`
    SELECT * FROM addresses 
    WHERE user_id = ? 
    ORDER BY is_default DESC, created_at DESC
  `).bind(auth.id).all();
  
  return jsonResponse({ addresses: addresses.results || [] });
}

// POST /api/user/addresses  
if (url.pathname === '/api/user/addresses' && request.method === 'POST') {
  const auth = await requireUser(request, env);
  if (!auth.id) return auth;
  
  const body = await jsonBody(request);
  const result = await env.DB.prepare(`
    INSERT INTO addresses (
      user_id, name, phone, house, street, area, 
      city, state, pincode, is_default, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
  `).bind(
    auth.id,
    body.name, body.phone, body.house || null, 
    body.street || null, body.area, body.city, 
    body.state, body.pincode,
    body.is_default ? 1 : 0
  ).run();
  
  return jsonResponse({ 
    success: true, 
    id: result.lastInsertRowId,
    address: { id: result.lastInsertRowId, ...body, user_id: auth.id }
  });
}


// ✅ FIXED: Flexible pathname matching
if (request.method === 'PATCH') {
  const pathParts = pathname.split('/').filter(Boolean);
  if (pathParts.length === 5 && pathParts[0] === 'api' && pathParts[1] === 'user' && 
      pathParts[2] === 'addresses' && pathParts[4] === 'set-default') {
    
    const addressId = pathParts[3];  // "13"
    const result = await requireUser(request, env);
    if (!result.id) return result;
    
    console.log('🔄 Setting address', addressId, 'default for user', result.id);
    
    // 1. Reset all defaults
    await env.DB.prepare('UPDATE addresses SET is_default = 0 WHERE user_id = ?')
      .bind(result.id).run();
      
    // 2. FIXED: parseInt + rows check
    const addressIdInt = parseInt(addressId);
    const updateResult = await env.DB.prepare(`
      UPDATE addresses 
      SET is_default = 1, updated_at = datetime('now')
      WHERE id = ? AND user_id = ?
    `).bind(addressIdInt, result.id).run();
    
    console.log('📊 Rows updated:', updateResult.meta.changes);
    
    if (updateResult.meta.changes === 0) {
      return new Response('Address not found', { status: 404 });
    }
    
    return Response.json({ success: true }, { status: 200 });
  }
}


      // MENU & Pincode
      if (method === 'GET' && path.startsWith('/api/menu/categories')) return await handleGetCategories(request, env);
      if (method === 'GET' && path.startsWith('/api/menu/products')) return await handleGetProducts(request, env);
      if (method === 'GET' && path.startsWith('/api/menu/product/')) return await handleGetProduct(request, env);
	  if (path === '/api/menu/reviews' && method === 'GET') {
  return handleGetProductReviews(request, env);
}

// Add this near your other location/pincode routes
if (method === 'GET' && path === '/api/location/google-geocode') {
  return await handleGoogleGeocode(request, env);
}


if (path === '/api/menu/reviews' && method === 'POST') {
  return handleSubmitReview(request, env);
}
if (path === '/api/menu/reviews/user' && method === 'GET') {
  return handleGetUserReviews(request, env);
}
      if (method === 'GET' && path.match(/^\/api\/pincode\/\d{6}$/)) return await handlePincode(request, env);


// === START PARTY MENU TOP-UP ===
/*{
  const menuUrl = new URL(request.url);

  if (menuUrl.pathname === "/api/party-menu") {
    // 1. Define data ONCE at the top so both OPTIONS and GET can see it
    const menuData = {
// CONFIG SECTION: Control discounts here
  "config": {
	  "minOrderForFreebies": 3000, // Minimum subtotal (₹) required to keep items free
    "welcomeDiscount": {
      "enabled": true,
      "amount": 150,
      "minSubtotal": 1000
    },
    "milestoneDiscounts": {
      "enabled": true,
      "rules": [
        { "minGuests": 30, "targetSubtotal": 8000, "discount": 1000 },
        { "minGuests": 25, "targetSubtotal": 6000, "discount": 600 },
        { "minGuests": 20, "targetSubtotal": 5000, "discount": 450 },
        { "minGuests": 0,  "targetSubtotal": 4000, "discount": 250 }
      ]
    }
  },

      "starters": [
        { "name": "Samosa", "price": 15, "unit": "pc", "pp": 1, "step": 1, "img": "/images/party-order/samosa.webp" },
        { "name": "Paneer Pakoda", "price": 30, "unit": "pc", "pp": 2, "step": 1, "img": "/images/party-order/paneer-pakoda-kofta.webp" },
        { "name": "Aloo Kofta", "price": 10, "unit": "pc", "pp": 1, "step": 1, "img": "/images/party-order/kofta.webp" },
		{ "name": "Veg Manchurian", "price": 10, "unit": "pc", "pp": 2, "step": 1, "img": "/images/party-order/manchurian.webp" },
        { "name": "Spring Roll", "price": 20, "unit": "pc", "pp": 2, "step": 1, "img": "/images/party-order/starter-plate.webp" }
      ],
      "breads": [
        { "name": "Ghee Roti", "price": 10, "unit": "pc", "pp": 2, "step": 1, "img": "/images/party-order/tawa-roti.webp" },
        { "name": "Ghee Paratha", "price": 15, "unit": "pc", "pp": 2, "step": 1, "img": "/images/party-order/ghee-paratha.webp" }
      ],
      "mains": [
        { "name": "Mix Veg", "price": 0.35, "unit": "gm", "pp": 150, "step": 25, "img": "/images/party-order/mix-veg.webp" },
        { "name": "Gatta Masala", "price": 0.40, "unit": "gm", "pp": 150, "step": 25, "img": "/images/party-order/gatta-masala.webp" },
        { "name": "Paneer Gravy", "price": .50, "unit": "gm", "pp": 150, "step": 25, "img": "/images/party-order/paneer-gravy.webp" },
        { "name": "Dal Tadka", "price": 0.20, "unit": "ml", "pp": 150, "step": 25, "img": "/images/party-order/dal-tadka.webp" },
        { "name": "Panchmel Dal", "price": 0.25, "unit": "ml", "pp": 150, "step": 25, "img": "/images/party-order/panchmel-dal.webp" },
        { "name": "Stuff Shimla Mirch", "price": 10, "unit": "pc", "pp": 1, "step": 1, "img": "/images/party-order/shimla.webp" }
      ],
      "sides": [
        { "name": "Steamed Rice", "price": 0.10, "unit": "gm", "pp": 150, "step": 25, "img": "/images/party-order/steamed-rice.webp" },
        { "name": "Jeera Tadka Rice", "price": 0.15, "unit": "gm", "pp": 150, "step": 25, "img": "/images/party-order/jeera-rice.webp" },
        { "name": "Veg Pulav", "price": 0.20, "unit": "gm", "pp": 150, "step": 25, "img": "/images/party-order/veg-pulao.webp" },
        { "name": "Veg Raita", "price": 0.10, "unit": "ml", "pp": 150, "step": 25, "img": "/images/party-order/veg-raita.webp" },
        { "name": "Boondi Raita", "price": 0.10, "unit": "ml", "pp": 150, "step": 25, "img": "/images/party-order/dahi-raita.webp" },
        { "name": "Green Salad", "price": 10, "unit": "serve", "pp": 1, "step": 1, "complimentary": true, "img": "/images/party-order/green-salad.webp" },
        { "name": "Roasted Papad", "price": 5, "unit": "pc", "pp": 1, "step": 1, "complimentary": true, "img": "/images/party-order/papad.webp" }
      ],
      "desserts": [
        { "name": "Gulab Jamun", "price": 25, "unit": "pc", "pp": 1, "step": 1, "img": "/images/party-order/gulab-jamun.webp" },
        { "name": "Ras Malai", "price": 30, "unit": "pc", "pp": 1, "step": 1, "img": "/images/party-order/rasmalai.webp" }
      ],
     "drinks": [
  { 
    "name": "Soft Drink (150 ml)",
    "price": 10,
    "unit": "serve",
    "pp": 1,
    "step": 1,
    "complimentary": false,
    "img": "/images/party-order/soft-drink.webp"
  }
]
    };

    // 2. Handle OPTIONS (Pre-flight)
    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
          "Cache-Control": "public, max-age=86400"
        },
      });
    }

    // 3. Handle GET (Actual Data)
    return new Response(JSON.stringify(menuData), {
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "no-store, no-cache, must-revalidate", // Force fresh prices
      },
    });
  }
}*/
// === END PARTY MENU TOP-UP ===


// === START PARTY MENU TOP-UP Edge Cahche===
{
  const menuUrl = new URL(request.url);

  if (menuUrl.pathname === "/api/party-menu") {

    const cache = caches.default;
    const cacheKey = new Request(menuUrl.toString(), request);
    let response = await cache.match(cacheKey);

    if (!response) {

      const menuData = {

        // CONFIG SECTION
        "config": {
          "minOrderForFreebies": 5000,
          "welcomeDiscount": {
            "enabled": true,
            "amount": 150,
            "minSubtotal": 2000
          },
          "milestoneDiscounts": {
            "enabled": true,
            "rules": [
              { "minGuests": 30, "targetSubtotal": 8000, "discount": 1000 },
              { "minGuests": 25, "targetSubtotal": 6000, "discount": 600 },
              { "minGuests": 20, "targetSubtotal": 5000, "discount": 450 },
              { "minGuests": 0,  "targetSubtotal": 4000, "discount": 250 }
            ]
          }
        },

        "starters": [
        { "name": "Samosa", "price": 25, "unit": "pc", "pp": 1, "step": 1, "img": "/images/party-order/samosa.webp" },
        { "name": "Paneer Pakoda", "price": 40, "unit": "pc", "pp": 2, "step": 1, "img": "/images/party-order/paneer-pakoda-kofta.webp" },
        { "name": "Aloo Kofta", "price": 20, "unit": "pc", "pp": 1, "step": 1, "img": "/images/party-order/kofta.webp" },
	{ "name": "Veg Manchurian", "price": 30, "unit": "pc", "pp": 2, "step": 1, "img": "/images/party-order/manchurian.webp" },
	
	{ "name": "Veg Steamed Momo", "price": 25, "unit": "pc", "pp": 4, "step": 1, "img": "/images/party-order/veg-steamed-momo.webp" },
        { "name": "Red Sause Pasta", "price": 0.40, "unit": "gm", "pp": 150, "step": 25, "img": "/images/party-order/red-sause-pasta.webp" },
	{ "name": "White Sause Pasta", "price": 0.55, "unit": "gm", "pp": 150, "step": 25, "img": "/images/party-order/white-sause-pasta.webp" },
	{ "name": "Veg Hakka Noodles", "price": 0.40, "unit": "gm", "pp": 150, "step": 25, "img": "/images/party-order/veg-hakka-noodles.webp" },
	{ "name": "Honey Chilli Potato", "price": 0.55, "unit": "gm", "pp": 150, "step": 25, "img": "/images/party-order/honey-chilli-potato.webp" },

	{ "name": "Spring Roll", "price": 35, "unit": "pc", "pp": 2, "step": 1, "img": "/images/party-order/starter-plate.webp" }
      ],
      "breads": [
        { "name": "Ghee Roti", "price": 15, "unit": "pc", "pp": 2, "step": 1, "img": "/images/party-order/tawa-roti.webp" },
	
	{ "name": "Poori", "price": 10, "unit": "pc", "pp": 2, "step": 1, "img": "/images/party-order/poori.webp" },
        
	{ "name": "Ghee Paratha", "price": 20, "unit": "pc", "pp": 2, "step": 1, "img": "/images/party-order/ghee-paratha.webp" },

	{ "name": "Bati", "price": 22, "unit": "pc", "pp": 1, "step": 1, "img": "/images/party-order/bati.webp" },
      ],
      "mains": [
        { "name": "Mix Veg", "price": 0.45, "unit": "gm", "pp": 150, "step": 25, "img": "/images/party-order/mix-veg.webp" },
        { "name": "Gatta Masala", "price": 0.45, "unit": "gm", "pp": 150, "step": 25, "img": "/images/party-order/gatta-masala.webp" },
        { "name": "Paneer Butter Masala", "price": .90, "unit": "gm", "pp": 150, "step": 25, "img": "/images/party-order/paneer-gravy.webp" },

	{ "name": "Aloo ki Sabji", "price": .20, "unit": "gm", "pp": 150, "step": 25, "img": "/images/party-order/aloo-sabji.webp" },
	{ "name": "Kaju Kari", "price": .99, "unit": "gm", "pp": 150, "step": 25, "img": "/images/party-order/kaju-kari.webp" },
	{ "name": "Lauki Kofta", "price": .30, "unit": "gm", "pp": 150, "step": 25, "img": "/images/party-order/lauki-kofta.webp" },
	{ "name": "Aloo Dum", "price": .45, "unit": "gm", "pp": 150, "step": 25, "img": "/images/party-order/aloo-dum.webp" },
	{ "name": "Stuff Tinda", "price": .40, "unit": "gm", "pp": 150, "step": 25, "img": "/images/party-order/stuffed-tinda.webp" },
	{ "name": "Chana Masala ( Gravy )", "price": .35, "unit": "gm", "pp": 150, "step": 25, "img": "/images/party-order/chana-masala-gravy.webp" },
	{ "name": "Pindi Chole", "price": .75, "unit": "gm", "pp": 150, "step": 25, "img": "/images/party-order/pindi-chole.webp" },
	{ "name": "Aloo Pyaz Paneer", "price": .80, "unit": "gm", "pp": 150, "step": 25, "img": "/images/party-order/aloo-pyaz-paneer.webp" },
	{ "name": "Lehsun Chatni", "price": .99, "unit": "gm", "pp": 25, "step": 25, "img": "/images/party-order/lehsun-chatni.webp" },

        { "name": "Dal Tadka", "price": 0.25, "unit": "ml", "pp": 150, "step": 25, "img": "/images/party-order/dal-tadka.webp" },

	{ "name": "Dal Fry", "price": 0.30, "unit": "ml", "pp": 150, "step": 25, "img": "/images/party-order/dal-Fry.webp" },
	{ "name": "Dal Makhani", "price": 0.60, "unit": "ml", "pp": 150, "step": 25, "img": "/images/party-order/dal-makhani.webp" },
        { "name": "Panchmel Dal", "price": 0.75, "unit": "ml", "pp": 150, "step": 25, "img": "/images/party-order/panchmel-dal.webp" },

        { "name": "Stuff Shimla Mirch", "price": 7, "unit": "pc", "pp": 1, "step": 1, "img": "/images/party-order/shimla.webp" }
      ],
      "sides": [
        { "name": "Steamed Rice", "price": 0.15, "unit": "gm", "pp": 150, "step": 25, "img": "/images/party-order/steamed-rice.webp" },
        { "name": "Jeera Tadka Rice", "price": 0.20, "unit": "gm", "pp": 150, "step": 25, "img": "/images/party-order/jeera-rice.webp" },
        { "name": "Veg Pulav", "price": 0.35, "unit": "gm", "pp": 150, "step": 25, "img": "/images/party-order/veg-pulao.webp" },


	{ "name": "Veg Soya Biryani", "price": 0.70, "unit": "gm", "pp": 150, "step": 25, "img": "/images/party-order/veg-soya-biryani.webp" },
        

	{ "name": "Veg Raita", "price": 0.25, "unit": "ml", "pp": 150, "step": 25, "img": "/images/party-order/veg-raita.webp" },
        { "name": "Boondi Raita", "price": 0.20, "unit": "ml", "pp": 150, "step": 25, "img": "/images/party-order/dahi-raita.webp" },
        { "name": "Green Salad", "price": 5, "unit": "serve", "pp": 1, "step": 1, "complimentary": true, "img": "/images/party-order/green-salad.webp" },
        { "name": "Roasted Papad", "price": 5, "unit": "pc", "pp": 1, "step": 1, "complimentary": true, "img": "/images/party-order/papad.webp" }
      ],
      "desserts": [
        { "name": "Gulab Jamun", "price": 25, "unit": "pc", "pp": 1, "step": 1, "img": "/images/party-order/gulab-jamun.webp" },


	{ "name": "Besan Barfi", "price": 35, "unit": "pc", "pp": 1, "step": 1, "img": "/images/party-order/besan-barfi.webp" },
        
	
	{ "name": "Ras Malai", "price": 30, "unit": "pc", "pp": 1, "step": 1, "img": "/images/party-order/rasmalai.webp" }
      ],
     "drinks": [
  { 
    "name": "Soft Drink (150 ml)",
    "price": 10,
    "unit": "serve",
    "pp": 1,
    "step": 1,
    "complimentary": false,
    "img": "/images/party-order/soft-drink.webp"
  },
    { 
    "name": "Aam Panna (150 ml)",
    "price": 25,
    "unit": "serve",
    "pp": 1,
    "step": 1,
    "complimentary": false,
    "img": "/images/party-order/aam-panna.webp"
  },
    { 
    "name": "Aamras ( Mango Shake ) (200 ml)",
    "price": 95,
    "unit": "serve",
    "pp": 1,
    "step": 1,
    "complimentary": false,
    "img": "/images/party-order/mango-shake.webp"
  }
]
      };

      response = new Response(JSON.stringify(menuData), {
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
          "Cache-Control": "public, max-age=3600"
        }
      });

      await cache.put(cacheKey, response.clone());
    }

    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
          "Cache-Control": "public, max-age=86400"
        }
      });
    }

    return response;
  }
}
// === END PARTY MENU TOP-UP ===

// Updated Party Menu API
if (url.pathname === "/api/party-plans") {
  const master = {
    starters: [
      { name: "Samosa", img: "https://assets.mithora.in/images/party-order/samosa.webp", tiers: ["delight", "premium", "royal"], servingInfo: "2 Pcs", badge: "Bestseller" },
      { name: "Veg Cutlet", img: "https://assets.mithora.in/images/party-order/veg-cutlet.webp", tiers: ["delight", "premium", "royal"], servingInfo: "2 Pcs", badge: null },
      { name: "Veg Sandwich", img: "https://assets.mithora.in/images/party-order/veg-sandwich.webp", tiers: ["delight", "premium", "royal"], servingInfo: "2 Pcs", badge: null },
      { name: "Veg Mayonees Sandwich", img: "https://assets.mithora.in/images/party-order/veg-mayo-sandwich.webp", tiers: ["premium", "royal"], servingInfo: "2 Pcs", badge: null },
      { name: "Aloo Kofta", img: "https://assets.mithora.in/images/party-order/kofta.webp", tiers: ["delight", "premium", "royal"], servingInfo: "2 Pcs", badge: null },
      { name: "Veg Manchurian", img: "https://assets.mithora.in/images/party-order/manchurian.webp", tiers: ["premium", "royal"], servingInfo: "120g", badge: "Popular" },
      { name: "Veg Steamed Momo", img: "https://assets.mithora.in/images/party-order/veg-steamed-momo.webp", tiers: ["premium", "royal"], servingInfo: "3 Pcs", badge: null },
      { name: "Paneer Pakoda", img: "https://assets.mithora.in/images/party-order/paneer-pakoda-kofta.webp", tiers: ["premium", "royal"], servingInfo: "3 Pcs", badge: "Must Try" },
      { name: "Spring Roll", img: "https://assets.mithora.in/images/party-order/starter-plate.webp", tiers: ["premium", "royal"], servingInfo: "2 Pcs", badge: null },
      { name: "Honey Chilli Potato", img: "https://assets.mithora.in/images/party-order/honey-chilli-potato.webp", tiers: ["premium", "royal"], servingInfo: "120g", badge: "Chef Special" },
      { name: "Veg Hakka Noodle", img: "https://assets.mithora.in/images/party-order/veg-hakka-noodles.webp", tiers: ["delight", "premium", "royal"], servingInfo: "150g", badge: null },
      { name: "Chilli Paneer Dry", img: "https://assets.mithora.in/images/party-order/chilli-paneer-dry.webp", tiers: ["delight", "premium", "royal"], servingInfo: "150g", badge: null },
      { name: "Hara Bhara Kabab", img: "https://assets.mithora.in/images/party-order/hara-bhara-kabab.webp", tiers: ["delight", "premium", "royal"], servingInfo: "150g", badge: null },
      { name: "Pasta (Red/White)", img: "https://assets.mithora.in/images/party-order/red-sause-pasta.webp", tiers: ["premium", "royal"], servingInfo: "150g", badge: null }
    ],
    combos: [
      { name: "Pav Bhaji Combo", img: "https://assets.mithora.in/images/party-order/pav-bhaji.webp", tiers: ["delight", "premium", "royal"], servingInfo: "150g + 4 Pav", badge: "Bestseller" },
      { name: "Veg Cutlet", img: "https://assets.mithora.in/images/party-order/veg-cutlet.webp", tiers: ["delight", "premium", "royal"], servingInfo: "2 Pcs", badge: null },
      { name: "Veg Mayonees Sandwich", img: "https://assets.mithora.in/images/party-order/veg-mayo-sandwich.webp", tiers: ["premium", "royal"], servingInfo: "2 Pcs", badge: null },
      { name: "Veg Manchurian", img: "https://assets.mithora.in/images/party-order/manchurian.webp", tiers: ["premium", "royal"], servingInfo: "120g", badge: null },
      { name: "Veg Steamed Momo", img: "https://assets.mithora.in/images/party-order/veg-steamed-momo.webp", tiers: ["premium", "royal"], servingInfo: "3 Pcs", badge: null },
      { name: "Vada Pav Combo", img: "https://assets.mithora.in/images/party-order/vada-pav.webp", tiers: ["delight", "premium", "royal"], servingInfo: "2 Pcs", badge: "Popular" },
      { name: "Honey Chilli Potato", img: "https://assets.mithora.in/images/party-order/honey-chilli-potato.webp", tiers: ["premium", "royal"], servingInfo: "120g", badge: null },
      { name: "Hakka Noodles Combo", img: "https://assets.mithora.in/images/party-order/veg-hakka-noodles.webp", tiers: ["delight", "premium", "royal"], servingInfo: "250g", badge: null },
      { name: "Pasta (Red/White)", img: "https://assets.mithora.in/images/party-order/red-sause-pasta.webp", tiers: ["premium", "royal"], servingInfo: "150g", badge: null },
      { name: "Aloo Sandwich Combo", img: "https://assets.mithora.in/images/party-order/veg-sandwich.webp", tiers: ["delight", "premium", "royal"], servingInfo: "2 Pcs", badge: null }
    ],
    mains: [
      { name: "Mix Veg", img: "https://assets.mithora.in/images/party-order/mix-veg.webp", tiers: ["standard", "delight", "premium", "royal"], servingInfo: "150g", badge: null },
      { name: "Aloo ki Sabji", img: "https://assets.mithora.in/images/party-order/aloo-sabji.webp", tiers: ["economy", "standard", "delight", "premium", "royal"], servingInfo: "150g", badge: null },
      { name: "Dal Tadka", img: "https://assets.mithora.in/images/party-order/dal-tadka.webp", tiers: ["standard","delight", "premium", "royal"], servingInfo: "150g", badge: "Popular" },
      { name: "Pindi Chole", img: "https://assets.mithora.in/images/party-order/pindi-chole.webp", tiers: ["standard","economy", "delight", "premium", "royal"], servingInfo: "150g", badge: null },
      { name: "Aaloo Chole", img: "https://assets.mithora.in/images/party-order/aloo-chola.webp", tiers: ["economy", "standard", "delight", "premium", "royal"], servingInfo: "150g", badge: null },
      { name: "Gatta Masala", img: "https://assets.mithora.in/images/party-order/gatta-masala.webp", tiers: ["standard","desi-light", "premium", "royal", "desi"], servingInfo: "150g", badge: "Authentic" },
      { name: "Panchmel Mix Dal", img: "https://assets.mithora.in/images/party-order/panchmel-dal.webp", tiers: ["desi-light", "desi"], servingInfo: "150g", badge: "Special" },
      { name: "Kadhi", img: "https://assets.mithora.in/images/party-order/kadhi.webp", tiers: ["desi-light", "desi"], servingInfo: "150g", badge: null },
      { name: "Lehsun Chatni", img: "https://assets.mithora.in/images/party-order/lehsun-chatni.webp", tiers: ["desi"], servingInfo: "150g", badge: null },
      { name: "Mirch Tipore", img: "https://assets.mithora.in/images/party-order/mirch-tipore.webp", tiers: ["desi-light", "desi"], servingInfo: "150g", badge: null },
      { name: "Paneer Butter Masala", img: "https://assets.mithora.in/images/party-order/paneer-gravy.webp", tiers: ["standard","delight", "premium", "royal"], servingInfo: "150g", badge: "Bestseller" },
      { name: "Veg Jalferrazi", img: "https://assets.mithora.in/images/party-order/veg-jalferrazi.webp", tiers: ["delight", "premium", "royal"], servingInfo: "150g", badge: null },
      { name: "Dal Fry", img: "https://assets.mithora.in/images/party-order/dal-Fry.webp", tiers: ["economy", "standard", "delight", "premium", "royal"], servingInfo: "150g", badge: null },
      { name: "Paneer Lababdar", img: "https://assets.mithora.in/images/party-order/paneer-gravy.webp", tiers: ["delight", "premium", "royal"], servingInfo: "150g", badge: "Chef Special" },
      { name: "Palak Paneer", img: "https://assets.mithora.in/images/party-order/palak-paneer.webp", tiers: ["standard","delight", "premium", "royal"], servingInfo: "150g", badge: "Chef Special" },
      { name: "Bhindi Masala", img: "https://assets.mithora.in/images/party-order/bhindi-masala.webp", tiers: ["delight", "premium", "royal"], servingInfo: "150g", badge: null },
      { name: "Stuff Tinda", img: "https://assets.mithora.in/images/party-order/stuff-tinda.webp", tiers: ["delight", "premium", "royal"], servingInfo: "150g", badge: null },
      { name: "Special Aloo Dum", img: "https://assets.mithora.in/images/party-order/aloo-dum.webp", tiers: ["delight", "premium", "royal"], servingInfo: "150g", badge: null },
      { name: "Aloo Pyaz Paneer", img: "https://assets.mithora.in/images/party-order/aloo-pyaz-paneer.webp", tiers: ["premium", "royal"], servingInfo: "150g", badge: null },
      { name: "Kaju Kari", img: "https://assets.mithora.in/images/party-order/kaju-kari.webp", tiers: ["royal"], servingInfo: "150g", badge: "Royal" },
      { name: "Dal Makkhani", img: "https://assets.mithora.in/images/party-order/dal-makhani.webp", tiers: ["premium", "royal"], servingInfo: "150g", badge: "Bestseller" }
    ],
    breads: [
      { name: "Ghee Roti", img: "https://assets.mithora.in/images/party-order/tawa-roti.webp", servingInfo: "4 Pcs", tiers: ["economy", "standard", "delight", "premium", "royal"], badge: null },
      { name: "Missi Roti", img: "https://assets.mithora.in/images/party-order/missi-roti.webp", servingInfo: "4 Pcs", tiers: ["premium", "royal"], badge: "Popular" },
      { name: "Poori", img: "https://assets.mithora.in/images/party-order/poori.webp", servingInfo: "5 Pcs", tiers: ["economy", "standard", "premium", "royal", "delight"], badge: null },
      { name: "Ghee Paratha", img: "https://assets.mithora.in/images/party-order/ghee-paratha.webp", servingInfo: "4 Pcs", tiers: ["premium", "royal"], badge: null },
      { name: "Ghee Bati", img: "https://assets.mithora.in/images/party-order/bati.webp", servingInfo: "2 Pcs", tiers: ["desi-light", "desi"], badge: "Traditional" },
      { name: "Masala Bati", img: "https://assets.mithora.in/images/party-order/masala-bati.webp", servingInfo: "2 Pcs", tiers: ["desi"], badge: "Special" }
    ],
    sides: [
      { name: "Jeera Tadka Rice", img: "https://assets.mithora.in/images/party-order/jeera-rice.webp", tiers: ["economy","desi-light", "standard", "delight", "premium", "royal", "desi"], servingInfo: "150g", badge: null },
      { name: "Veg Pulav", img: "https://assets.mithora.in/images/party-order/veg-pulao.webp", tiers: ["premium", "royal"], servingInfo: "150g", badge: null },
      { name: "Veg Biryani", img: "https://assets.mithora.in/images/party-order/veg-biryani.webp", tiers: ["royal"], servingInfo: "150g", badge: "Bestseller" },
      { name: "Gatta Pulav", img: "https://assets.mithora.in/images/party-order/veg-soya-biryani.webp", tiers: ["royal"], servingInfo: "150g", badge: null },
      { name: "Masala Raita", img: "https://assets.mithora.in/images/party-order/masala-raita.webp", tiers: ["desi-light", "standard", "delight", "premium", "royal", "desi"], servingInfo: "150ml", badge: null },
      { name: "Boondi Raita", img: "https://assets.mithora.in/images/party-order/dahi-raita.webp", tiers: ["economy","standard", "delight", "premium", "royal", "desi"], servingInfo: "150ml", badge: null },
      { name: "Veg Raita", img: "https://assets.mithora.in/images/party-order/veg-raita.webp", tiers: ["premium", "royal"], servingInfo: "150ml", badge: null },
      { name: "Soft Drink", img: "https://assets.mithora.in/images/party-order/soft-drink.webp", tiers: ["combo"], servingInfo: "200ml", badge: null },
      { name: "Aam Panna", img: "https://assets.mithora.in/images/party-order/aam-panna.webp", tiers: ["combo"], servingInfo: "150ml", badge: "Seasonal" },
      { name: "Aamras", img: "https://assets.mithora.in/images/party-order/mango-shake.webp", tiers: ["combo"], servingInfo: "150ml", badge: "Must Try" }
    ],
    desserts: [
      { name: "Gulab Jamun", img: "https://assets.mithora.in/images/party-order/gulab-jamun.webp", tiers: ["delight", "premium", "royal"], servingInfo: "1 Pc", badge: "Bestseller" },
      { name: "Churma", img: "https://assets.mithora.in/images/party-order/churma.webp", tiers: ["desi-light", "desi"], servingInfo: "1 Pc", badge: "Traditional" },
      { name: "Gulab Churma", img: "https://assets.mithora.in/images/party-order/gulab-churma.webp", tiers: ["desi-light", "desi"], servingInfo: "1 Pc", badge: "Special" },
      { name: "Besan Churma", img: "https://assets.mithora.in/images/party-order/besan-churma.webp", tiers: ["desi"], servingInfo: "1 Pc", badge: null },
      { name: "Besan Barfi", img: "https://assets.mithora.in/images/party-order/besan-barfi.webp", tiers: ["premium", "royal"], servingInfo: "1 Pc", badge: null },
      { name: "Rasgulla", img: "https://assets.mithora.in/images/party-order/rasgulla.webp", tiers: ["delight", "premium", "royal"], servingInfo: "1 Pc", badge: null },
      { name: "Chenna Toast", img: "https://assets.mithora.in/images/party-order/chena-toast.webp", tiers: ["royal"], servingInfo: "1 Pc", badge: null },
      { name: "Fruit Custard", img: "https://assets.mithora.in/images/party-order/fruit-custard.webp", tiers: ["premium", "royal"], servingInfo: "1 Pc", badge: null },
      { name: "Ras Malai", img: "https://assets.mithora.in/images/party-order/rasmalai.webp", tiers: ["royal"], servingInfo: "1 Pc", badge: "Must Try" }
    ],
    drinks: [
      { name: "Soft Drink", img: "https://assets.mithora.in/images/party-order/soft-drink.webp", tiers: ["royal"], servingInfo: "200ml", badge: null },
      { name: "Aam Panna", img: "https://assets.mithora.in/images/party-order/aam-panna.webp", tiers: ["royal"], servingInfo: "150ml", badge: null },
      { name: "Kokum Sharbat", img: "https://assets.mithora.in/images/party-order/kokum-sharbat.webp", tiers: ["royal"], servingInfo: "150ml", badge: null },
      { name: "Aamras", img: "https://assets.mithora.in/images/party-order/mango-shake.webp", tiers: ["royal"], servingInfo: "150ml", badge: null }
    ]
  };

  const response = {
    plans: {
      "180": {
        sortOrder: 1,
        name: "Homestyle Economy",
        badge: "Budget Choice",
        description: "Fresh Home-Style Food for Poojas & Get-togethers",
        perPersonIncludes: "4-5 Roti • 1 Sabji",
        limits: { starters: 0, breads: 1, mains: 1, sides: 2, desserts: 0 },
        inventory: {
          starters: master.starters.filter(i => i.tiers.includes("economy")),
          mains: master.mains.filter(i => i.tiers.includes("economy")),
          breads: master.breads.filter(i => i.tiers.includes("economy")),
          sides: master.sides.filter(i => i.tiers.includes("economy")),
          desserts: []
        }
      },
      "240": {
        sortOrder: 2,
        name: "Homestyle Basic",
        badge: null,
        description: "Fresh Home-Style Food for Poojas & Get-togethers",
        perPersonIncludes: "4 Roti • Rice • 1 Sabji • 1 Dal • Raita",
        limits: { starters: 0, breads: 1, mains: 2, sides: 2, desserts: 0 },
        inventory: {
          starters: master.starters.filter(i => i.tiers.includes("standard")),
          mains: master.mains.filter(i => i.tiers.includes("standard")),
          breads: master.breads.filter(i => i.tiers.includes("standard")),
          sides: master.sides.filter(i => i.tiers.includes("standard")),
          desserts: []
        }
      },
      "199": {
        sortOrder: 3,
        name: "Snacks Combo Light",
        badge: "Light Bite",
        description: "Quick snack combos and popular bites",
        perPersonIncludes: "2 Snack Combos • Welcome drink",
        limits: { combos: 2, sides: 1 },
        inventory: {
          combos: master.combos,
          sides: master.sides.filter(i => i.tiers.includes("combo"))
        }
      },
      "220": {
        sortOrder: 4,
        name: "Dal Baati Treat Light",
        badge: "Desi Special",
        description: "Fresh Home-Style Food for Poojas & Get-togethers",
        perPersonIncludes: "2 Bati • 1 Sabji/Dal • Rice/Raita • Churma",
        limits: { starters: 1, breads: 1, mains: 1, sides: 1, desserts: 1 },
        inventory: {
          starters: [],
          mains: master.mains.filter(i => i.tiers.includes("desi-light")),
          breads: master.breads.filter(i => i.tiers.includes("desi-light")),
          sides: master.sides.filter(i => i.tiers.includes("desi-light")),
          desserts: master.desserts.filter(i => i.tiers.includes("desi-light"))
        }
      },
      "270": {
        sortOrder: 5,
        name: "Snacks Combo Delight",
        badge: "Snacks Special",
        description: "Quick snack combos and popular bites",
        perPersonIncludes: "4 Snack Combos • Welcome drink",
        limits: { combos: 4, sides: 1 },
        inventory: {
          combos: master.combos,
          sides: master.sides.filter(i => i.tiers.includes("combo"))
        }
      },
      "280": {
        sortOrder: 6,
        name: "Family Delight",
        badge: "Most Popular",
        description: "Fresh Home-Style Food for Poojas & Get-togethers",
        perPersonIncludes: "1 Starter • 4 Roti • Rice • 2 Sabji • 1 Dal • Raita • Salad",
        limits: { starters: 1, breads: 1, mains: 2, sides: 2, desserts: 0 },
        inventory: {
          starters: master.starters.filter(i => i.tiers.includes("delight")),
          mains: master.mains.filter(i => i.tiers.includes("delight")),
          breads: master.breads.filter(i => i.tiers.includes("delight")),
          sides: master.sides.filter(i => i.tiers.includes("delight")),
          desserts: []
        }
      },
      "299": {
        sortOrder: 7,
        name: "Dal Baati Treat",
        badge: "Authentic Choice",
        description: "Fresh Home-Style Food for Poojas & Get-togethers",
        perPersonIncludes: "2 Bati • 3 Sabji/Dal/Chatni etc • Rice • Choice of Raita • Churma",
        limits: { starters: 1, breads: 1, mains: 3, sides: 2, desserts: 1 },
        inventory: {
          starters: [],
          mains: master.mains.filter(i => i.tiers.includes("desi")),
          breads: master.breads.filter(i => i.tiers.includes("desi")),
          sides: master.sides.filter(i => i.tiers.includes("desi")),
          desserts: master.desserts.filter(i => i.tiers.includes("desi"))
        }
      },
      "385": {
        sortOrder: 8,
        name: "Occasion Special",
        badge: "Recommended",
        description: "Premium selection for special events",
        perPersonIncludes: "1 Starter • 4 Roti/Paratha • 1 Rice • 2 Sabji • Mix Dal • Raita • Salad • Sweet",
        limits: { starters: 1, breads: 1, mains: 3, sides: 2, desserts: 1 },
        inventory: {
          starters: master.starters.filter(i => i.tiers.includes("premium")),
          mains: master.mains.filter(i => i.tiers.includes("premium")),
          breads: master.breads.filter(i => i.tiers.includes("premium")),
          sides: master.sides.filter(i => i.tiers.includes("premium")),
          desserts: master.desserts.filter(i => i.tiers.includes("premium"))
        }
      },
      "450": {
        sortOrder: 9,
        name: "Royal Feast",
        badge: "Premium Experience",
        description: "Luxury spread with drinks and premium variety",
        perPersonIncludes: "2 Starters • 4 Roti • Rice/Biryani • 2 Royal Sabji • 1 Dal • Raita • Salad • 2 Sweets • Welcome Drink",
        limits: { starters: 2, breads: 2, mains: 3, sides: 2, desserts: 1, drinks: 1 },
        inventory: {
          starters: master.starters.filter(i => i.tiers.includes("royal")),
          mains: master.mains.filter(i => i.tiers.includes("royal")),
          breads: master.breads.filter(i => i.tiers.includes("royal")),
          sides: master.sides.filter(i => i.tiers.includes("royal")),
          desserts: master.desserts.filter(i => i.tiers.includes("royal")),
          drinks: master.drinks.filter(i => i.tiers.includes("royal"))
        }
      },
      "custom": {
        sortOrder: 10,
        name: "Custom Plan",
        badge: "Build Your Own",
        description: "Design your own signature menu",
        perPersonIncludes: "Customized portion sizes & items",
        limits: { starters: 25, breads: 25, mains: 25, sides: 25, desserts: 25, drinks: 25, combos: 25 },
        inventory: master
      }
    }
  };

  return new Response(JSON.stringify(response), {
    headers: { 
      "Content-Type": "application/json", 
      "Access-Control-Allow-Origin": "*" 
    }
  });
}
// --- GET /api/coupons ---
if (method === 'GET' && path === '/api/coupons') {

  try {

    const auth = await requireUser(request, env);
    if (!auth.id) return auth;

    const userId = auth.id;

    const coupons = await env.DB.prepare(`
      SELECT 
        code,
        discount_type,
        discount_value,
        min_order_amount
      FROM coupons
      WHERE is_active = 1
      AND (valid_to IS NULL OR valid_to > datetime('now'))
      AND (usage_limit IS NULL OR times_used < usage_limit)
      AND (
            user_specific = 0
            OR EXISTS (
                 SELECT 1
                 FROM json_each(allowed_user_ids)
                 WHERE value = ?
            )
          )
      ORDER BY min_order_amount ASC
    `)
    .bind(userId)
    .all();

    return jsonResponse(coupons.results || []);

  } catch (e) {

    console.error("Coupon API error:", e);

    return jsonResponse({ error: e.message }, 500);

  }
}
      // ✅ NEW: GET /api/pincode/{pin}/areas - Multiple areas dropdown
if (method === 'GET' && path.match(/^\/api\/pincode\/(\d{6})\/areas$/)) {
  const pincode = path.match(/^\/api\/pincode\/(\d{6})\/areas$/)[1];
  const areasRes = await env.DB.prepare(`
    SELECT DISTINCT area_name 
    FROM pincode_master 
    WHERE pincode = ? 
      AND area_name IS NOT NULL 
      AND TRIM(area_name) != '' 
      AND service_tier <= 2
    ORDER BY area_name ASC
  `).bind(pincode).all();
  
  const areas = areasRes.results.map(r => r.area_name);
  
  if (areas.length === 0) {
    return jsonResponse({ 
      areas: [], 
      message: 'No serviceable areas found for this pincode',
      pincode_status: 'inactive'
    });
  }
  
  // Also fetch basic pin info for consistency
  const pinData = await env.DB.prepare(`
    SELECT city, state, local_shipping_fee 
    FROM pincode_master 
    WHERE pincode = ? LIMIT 1
  `).bind(pincode).first();
  
  return jsonResponse({ 
    areas, 
    city: pinData?.city || '',
    state: pinData?.state || '',
    shipping: pinData?.local_shipping_fee || 0,
    pincode_status: 'active'
  });
}

      // CART sync & checkout
      if (method === 'POST' && path === '/api/cart/sync') return await handleCartSync(request, env);
      if (method === 'POST' && path === '/api/checkout/create-order') return await handleCreateOrder(request, env);

      // Razorpay webhook (raw body needed)
      if (method === 'POST' && path === '/api/razorpay/webhook') return await handleRazorpayWebhook(request, env);

      // Admin CRUD (protected by admin JWT or ADMIN_KEY)
      if (path.startsWith('/api/admin')) return await handleAdminRoutes(request, env);

      // Cron endpoint for subscriptions
      if (method === 'POST' && path === '/cron/subscriptions') return await handleProcessSubscriptions(request, env);

      return new Response('Not Found', { status: 404 });
    } catch (err) {
      console.error('Error in worker', err);
      return jsonResponse({ error: err.message || String(err) }, 500);
    }
  }
};

/* =========================
   AUTH HANDLERS
   ========================= */

/**
 * Generates a professional 7-character referral code
 * Example: "Ashish" -> ASH3Y3D
 */
function generateReferralCode(name) {
  // 1. Get first 3 letters of name, uppercase, remove special chars
  const prefix = (name || "USR")
    .replace(/[^a-zA-Z]/g, '')
    .substring(0, 3)
    .toUpperCase()
    .padEnd(3, 'X'); 

  // 2. Define allowed characters (Removed confusing 0, O, 1, I)
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let randomPart = "";
  
  // 3. Generate 4 random alphanumeric characters
  for (let i = 0; i < 4; i++) {
    randomPart += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  return prefix + randomPart;
}


/**
 * 1. HELPER: createCouponForUser
 * MUST be outside handleSignup and defined before it's called.
 */
async function createCouponForUser(env, userId, config, prefix = "WELCOME") {
  if (!userId) return;

  // Format: PREFIX + VALUE + "REG" + USER_ID
  const code = `${prefix}${config.discount_value}REG${userId}`;

  const validTo = new Date(
    Date.now() + (config.validity_days || 30) * 86400000
  ).toISOString();

  const allowedUsers = JSON.stringify([Number(userId)]);

  await env.DB.prepare(`
    INSERT INTO coupons (
      code, discount_type, discount_value, min_order_amount, 
      valid_from, valid_to, user_specific, allowed_user_ids, is_active
    )
    VALUES (?, ?, ?, ?, datetime('now'), ?, 1, ?, 1)
  `)
  .bind(
    code,
    config.discount_type,
    config.discount_value,
    config.min_order_amount || config.min_order || 0,
    validTo,
    allowedUsers
  )
  .run();

  console.log("✅ Unique Coupon created:", code);
}

// ======================================================
// SIGNUP EMAIL OTP FLOW
// ======================================================

// Generate a secure 6-digit OTP
function generateOTP() {
  const random = new Uint32Array(1);
  crypto.getRandomValues(random);

  return String(
    100000 + (random[0] % 900000)
  );
}


// ======================================================
// 1. REQUEST SIGNUP OTP
// POST /api/auth/signup/request-otp
// ======================================================

async function handleSignupRequestOTP(request, env) {
  try {
    const body = await jsonBody(request);

    const name = String(body?.name || '').trim();
    const email = String(body?.email || '').trim().toLowerCase();
    const phone = String(body?.phone || '').trim();

    if (!name || !email || !phone) {
      return jsonResponse({
        error: 'Name, email and phone are required'
      }, 400);
    }

    // Basic phone validation
    if (!/^\d{10}$/.test(phone)) {
      return jsonResponse({
        error: 'Invalid mobile number'
      }, 400);
    }

    // Basic email validation
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return jsonResponse({
        error: 'Invalid email address'
      }, 400);
    }

    // --------------------------------------------------
    // Check whether email is already registered
    // --------------------------------------------------

    const existingEmail = await env.DB.prepare(`
      SELECT id
      FROM users
      WHERE LOWER(email) = ?
      LIMIT 1
    `).bind(email).first();

    if (existingEmail) {
      return jsonResponse({
        error: 'Email already registered'
      }, 400);
    }


    // --------------------------------------------------
    // Check whether phone is already registered
    // --------------------------------------------------

    const existingPhone = await env.DB.prepare(`
      SELECT id, password_hash
      FROM users
      WHERE phone = ?
      LIMIT 1
    `).bind(phone).first();

    if (existingPhone) {
      return jsonResponse({
        error: 'Mobile number already registered'
      }, 400);
    }


    // --------------------------------------------------
    // Generate OTP
    // --------------------------------------------------

    const otp = generateOTP();

    // Hash OTP before storing
    const {
      salt,
      hash
    } = await pbkdf2Hash(otp);

    // OTP valid for 10 minutes
    const expiresAt = new Date(
      Date.now() + 10 * 60 * 1000
    ).toISOString();


    // --------------------------------------------------
    // Invalidate previous signup OTPs
    // --------------------------------------------------

    await env.DB.prepare(`
      UPDATE signup_otps
      SET used = 1
      WHERE phone = ?
        AND used = 0
    `).bind(phone).run();


    // --------------------------------------------------
    // Store new OTP
    // --------------------------------------------------

    await env.DB.prepare(`
      INSERT INTO signup_otps (
        phone,
        email,
        name,
        otp_salt,
        otp_hash,
        expires_at,
        attempts,
        used,
        verified,
        created_at
      )
      VALUES (?, ?, ?, ?, ?, ?, 0, 0, 0, datetime('now'))
    `).bind(
      phone,
      email,
      name,
      salt,
      hash,
      expiresAt
    ).run();


    // --------------------------------------------------
    // Send OTP through Brevo
    // --------------------------------------------------

    try {

      await sendEmail(
        env,
        EMAIL_TYPES.PIN_RESET_OTP,
        email,
        null,
        {
          FIRSTNAME: name || 'Customer',
          OTP: otp
        }
      );

    } catch (emailError) {

      console.error(
        '❌ Signup OTP email failed:',
        emailError
      );

      // Invalidate OTP if email failed
      await env.DB.prepare(`
        UPDATE signup_otps
        SET used = 1
        WHERE phone = ?
          AND used = 0
      `).bind(phone).run();

      return jsonResponse({
        error: 'Unable to send OTP. Please try again later.'
      }, 500);
    }


    console.log(
      `✅ Signup OTP sent to ${email}`
    );


    return jsonResponse({
      ok: true,
      message: 'OTP sent successfully'
    });


  } catch (error) {

    console.error(
      '❌ Signup request OTP error:',
      error
    );

    return jsonResponse({
      error: 'Unable to process signup OTP request'
    }, 500);
  }
}



// ======================================================
// 2. VERIFY SIGNUP OTP
// POST /api/auth/signup/verify-otp
// ======================================================

async function handleSignupVerifyOTP(request, env) {
  try {

    const body = await jsonBody(request);

    const phone = String(body?.phone || '').trim();
    const otp = String(body?.otp || '').trim();


    if (!phone || !otp) {
      return jsonResponse({
        error: 'Phone and OTP are required'
      }, 400);
    }


    if (!/^\d{10}$/.test(phone)) {
      return jsonResponse({
        error: 'Invalid mobile number'
      }, 400);
    }


    if (!/^\d{6}$/.test(otp)) {
      return jsonResponse({
        error: 'OTP must be 6 digits'
      }, 400);
    }


    // --------------------------------------------------
    // Get latest unused OTP
    // --------------------------------------------------

    const otpRow = await env.DB.prepare(`
      SELECT *
      FROM signup_otps
      WHERE phone = ?
        AND used = 0
      ORDER BY id DESC
      LIMIT 1
    `).bind(phone).first();


    if (!otpRow) {
      return jsonResponse({
        error: 'OTP is invalid or has expired'
      }, 400);
    }


    // --------------------------------------------------
    // Check expiry
    // --------------------------------------------------

    const expiresAt = new Date(
      otpRow.expires_at
    );

    if (
      Number.isNaN(expiresAt.getTime()) ||
      Date.now() > expiresAt.getTime()
    ) {

      await env.DB.prepare(`
        UPDATE signup_otps
        SET used = 1
        WHERE id = ?
      `).bind(otpRow.id).run();

      return jsonResponse({
        error: 'OTP has expired. Please request a new OTP.'
      }, 400);
    }


    // --------------------------------------------------
    // Maximum attempts
    // --------------------------------------------------

    if (Number(otpRow.attempts || 0) >= 5) {

      await env.DB.prepare(`
        UPDATE signup_otps
        SET used = 1
        WHERE id = ?
      `).bind(otpRow.id).run();

      return jsonResponse({
        error: 'Too many incorrect attempts. Please request a new OTP.'
      }, 429);
    }


    // --------------------------------------------------
    // Verify OTP
    // --------------------------------------------------

    const otpValid = await pbkdf2Verify(
      otp,
      otpRow.otp_salt,
      otpRow.otp_hash
    );


    if (!otpValid) {

      await env.DB.prepare(`
        UPDATE signup_otps
        SET attempts = attempts + 1
        WHERE id = ?
      `).bind(otpRow.id).run();

      return jsonResponse({
        error: 'Invalid OTP'
      }, 400);
    }


    // --------------------------------------------------
    // OTP verified
    // --------------------------------------------------

    await env.DB.prepare(`
      UPDATE signup_otps
      SET verified = 1
      WHERE id = ?
    `).bind(otpRow.id).run();


    console.log(
      `✅ Signup OTP verified for ${phone}`
    );


    return jsonResponse({
      ok: true,
      verified: true,
      phone: otpRow.phone,
      email: otpRow.email,
      name: otpRow.name,
      message: 'Email verified successfully'
    });


  } catch (error) {

    console.error(
      '❌ Signup OTP verification error:',
      error
    );

    return jsonResponse({
      error: 'Unable to verify OTP'
    }, 500);
  }
}



// ======================================================
// 3. COMPLETE SIGNUP
// POST /api/auth/signup/complete
// ======================================================

async function handleSignupComplete(request, env) {

  try {

    const body = await jsonBody(request);

    const name = String(body?.name || '').trim();
    const email = String(body?.email || '').trim().toLowerCase();
    const phone = String(body?.phone || '').trim();
    const pin = String(body?.pin || '').trim();
    const referralInput = body?.referral_code || null;


    // --------------------------------------------------
    // Validate fields
    // --------------------------------------------------

    if (!name || !email || !phone || !pin) {
      return jsonResponse({
        error: 'Name, email, phone and PIN are required'
      }, 400);
    }


    if (!/^\d{10}$/.test(phone)) {
      return jsonResponse({
        error: 'Invalid mobile number'
      }, 400);
    }


    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return jsonResponse({
        error: 'Invalid email address'
      }, 400);
    }


    if (!/^\d{4}$/.test(pin)) {
      return jsonResponse({
        error: 'PIN must be exactly 4 digits'
      }, 400);
    }


    // --------------------------------------------------
    // Find verified signup OTP
    // --------------------------------------------------

    const otpRow = await env.DB.prepare(`
      SELECT *
      FROM signup_otps
      WHERE phone = ?
        AND LOWER(email) = ?
        AND verified = 1
        AND used = 0
      ORDER BY id DESC
      LIMIT 1
    `).bind(
      phone,
      email
    ).first();


    if (!otpRow) {
      return jsonResponse({
        error: 'Please verify your email before creating your account.'
      }, 400);
    }


    // --------------------------------------------------
    // Make sure verification has not expired
    // --------------------------------------------------

    const expiresAt = new Date(
      otpRow.expires_at
    );

    if (
      Number.isNaN(expiresAt.getTime()) ||
      Date.now() > expiresAt.getTime()
    ) {

      await env.DB.prepare(`
        UPDATE signup_otps
        SET used = 1
        WHERE id = ?
      `).bind(otpRow.id).run();

      return jsonResponse({
        error: 'Verification has expired. Please request a new OTP.'
      }, 400);
    }


    // --------------------------------------------------
    // Check again for duplicate email/phone
    // --------------------------------------------------

    const exEmail = await env.DB.prepare(`
      SELECT id
      FROM users
      WHERE LOWER(email) = ?
      LIMIT 1
    `).bind(email).first();


    if (exEmail) {
      return jsonResponse({
        error: 'Email already registered'
      }, 400);
    }


    const exPhone = await env.DB.prepare(`
      SELECT id
      FROM users
      WHERE phone = ?
      LIMIT 1
    `).bind(phone).first();


    if (exPhone) {
      return jsonResponse({
        error: 'Mobile number already registered'
      }, 400);
    }


    // --------------------------------------------------
    // Validate referral
    // --------------------------------------------------

    let referredByUserId = null;

    if (referralInput) {

      const refUser = await env.DB.prepare(`
        SELECT id
        FROM users
        WHERE referral_code = ?
        LIMIT 1
      `).bind(referralInput).first();

      if (refUser) {
        referredByUserId = refUser.id;
      }
    }


    // --------------------------------------------------
    // Generate unique referral code
    // --------------------------------------------------

    let myReferralCode;
    let isUnique = false;
    let referralAttempts = 0;


    while (
      !isUnique &&
      referralAttempts < 10
    ) {

      myReferralCode =
        generateReferralCode(name);

      const collision =
        await env.DB.prepare(`
          SELECT id
          FROM users
          WHERE referral_code = ?
          LIMIT 1
        `).bind(myReferralCode).first();


      if (!collision) {
        isUnique = true;
      } else {
        referralAttempts++;
      }
    }


    if (!myReferralCode) {
      return jsonResponse({
        error: 'Unable to generate referral code'
      }, 500);
    }


    // --------------------------------------------------
    // Hash PIN
    // --------------------------------------------------

    const {
      salt,
      hash
    } = await pbkdf2Hash(pin);


    // --------------------------------------------------
    // CREATE USER
    // --------------------------------------------------

    const result = await env.DB.prepare(`
      INSERT INTO users (
        name,
        email,
        phone,
        password_hash,
        referral_code,
        referred_by,
        created_at
      )
      VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
    `).bind(
      name,
      email,
      phone,
      `${salt}:${hash}`,
      myReferralCode,
      referredByUserId
    ).run();


    const userId = result.meta.last_row_id;


    // --------------------------------------------------
    // Brevo Contact
    // --------------------------------------------------

    try {

      const response = await fetch(
        "https://api.brevo.com/v3/contacts",
        {
          method: "POST",
          headers: {
            "api-key": env.BREVO_API_KEY,
            "Content-Type": "application/json",
            "accept": "application/json"
          },
          body: JSON.stringify({
            email: email,
            attributes: {
              FIRSTNAME: name || "",
              SMS: phone ? `+91${phone}` : "",
              STAGE: "signup"
            },
            updateEnabled: true
          })
        }
      );


      const text =
        await response.text();

      console.log(
        "Brevo response:",
        text
      );


      if (!response.ok) {
        console.error(
          "❌ Brevo failed:",
          text
        );
      } else {
        console.log(
          "✅ Brevo success"
        );
      }

    } catch (err) {

      console.error(
        "❌ Brevo error:",
        err
      );
    }


    // --------------------------------------------------
    // COUPON LOGIC
    // --------------------------------------------------

    if (referredByUserId) {

      await createCouponForUser(
        env,
        userId,
        REFERRAL_CONFIG.referral_reward_new_user,
        REFERRAL_CONFIG.referral_reward_new_user.prefix
      );

    } else {

      await createCouponForUser(
        env,
        userId,
        REFERRAL_CONFIG.welcome_coupon,
        REFERRAL_CONFIG.welcome_coupon.prefix
      );
    }


    // --------------------------------------------------
    // Generate JWT
    // --------------------------------------------------

    const token = await signJWT(
      {
        uid: userId,
        email: email
      },
      env.JWT_SECRET
    );


    // --------------------------------------------------
    // Signup emails
    // --------------------------------------------------

    try {

      // USER WELCOME EMAIL
      await sendEmail(
        env,
        EMAIL_TYPES.SIGNUP,
        email,
        null,
        {
          FIRSTNAME: name
        }
      );


      // ADMIN ALERT
      await sendEmail(
        env,
        EMAIL_TYPES.ADMIN_ALERT,
        'seeumithora@gmail.com',
        null,
        {
          NAME: name || 'N/A',
          EMAIL: email || 'N/A',
          PHONE: phone || 'N/A',
          TIME: new Date().toLocaleString('en-IN')
        }
      );

    } catch (e) {

      console.error(
        'Signup email failed',
        e
      );
    }


    // --------------------------------------------------
    // Mark signup OTP as used
    // --------------------------------------------------

    await env.DB.prepare(`
      UPDATE signup_otps
      SET used = 1
      WHERE id = ?
    `).bind(otpRow.id).run();


    // --------------------------------------------------
    // FINAL RESPONSE
    // --------------------------------------------------

    return jsonResponse({

      success: true,

      ok: true,

      token: token,

      userId: userId,

      user: {
        id: userId,
        name: name,
        email: email,
        phone: phone,
        referral_code: myReferralCode
      },

      message: 'Signup successful'

    });


  } catch (error) {

    console.error(
      '❌ Signup completion error:',
      error
    );

    return jsonResponse({
      error: 'Unable to complete signup'
    }, 500);
  }
}

/**
 * 2. MAIN: handleSignup
 */
async function handleSignup(request, env) {
  const body = await jsonBody(request);
  const missing = requireFields(body, ['name', 'email', 'phone', 'pin']);
  const referralInput = body.referral_code || null;
  
  if (missing.length) return jsonResponse({ error: 'Missing fields: ' + missing.join(',') }, 400);

  // 1. Check existing email/phone
  const exEmail = await env.DB.prepare('SELECT id FROM users WHERE email = ?').bind(body.email).first();
  if (exEmail) return jsonResponse({ error: 'Email already registered' }, 400);
  const exPhone = await env.DB.prepare('SELECT id FROM users WHERE phone = ?').bind(body.phone).first();
  if (exPhone) return jsonResponse({ error: 'Phone already registered' }, 400);

  // 2. Validate Referral
  let referredByUserId = null;
  if (referralInput) {
    const refUser = await env.DB.prepare("SELECT id FROM users WHERE referral_code = ?").bind(referralInput).first();
    if (refUser) referredByUserId = refUser.id;
  }

  // 3. Generate Unique Referral Code
  let myReferralCode;
  let isUnique = false;
  let attempts = 0;
  while (!isUnique && attempts < 10) {
    myReferralCode = generateReferralCode(body.name);
    const collision = await env.DB.prepare("SELECT id FROM users WHERE referral_code = ?").bind(myReferralCode).first();
    if (!collision) isUnique = true;
    else attempts++;
  }

  // 4. Hash PIN and Insert User
  const { salt, hash } = await pbkdf2Hash(body.pin);
  const result = await env.DB.prepare(`
    INSERT INTO users (name, email, phone, password_hash, referral_code, referred_by, created_at)
    VALUES (?, ?, ?, ?, ?, ?, datetime("now"))
  `)
  .bind(body.name, body.email, body.phone, `${salt}:${hash}`, myReferralCode, referredByUserId)
  .run();

  // FIX: Access ID correctly via result.meta
  const userId = result.meta.last_row_id;

// Brevo Contact Code

try {
  const response = await fetch("https://api.brevo.com/v3/contacts", {
    method: "POST",
    headers: {
      "api-key": env.BREVO_API_KEY,
      "Content-Type": "application/json",
      "accept": "application/json"
    },
    body: JSON.stringify({
      email: body.email,
      attributes: {
        FIRSTNAME: body.name || "",
        SMS: body.phone ? `+91${body.phone}` : "",
		STAGE: "signup"
      },
      updateEnabled: true
    })
  });

  const text = await response.text();
  console.log("Brevo response:", text);

  if (!response.ok) {
    console.error("❌ Brevo failed:", text);
  } else {
    console.log("✅ Brevo success");
  }

} catch (err) {
  console.error("❌ Brevo error:", err);
}

//Brevo Send Template email

/*try {
  const emailRes = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      "api-key": env.BREVO_API_KEY,
      "Content-Type": "application/json",
      "accept": "application/json"
    },
    body: JSON.stringify({
      to: [
        {
          email: body.email,
          name: body.name
        }
      ],
      templateId: 2,
      params: {
        FIRSTNAME: body.name || "User"
      }
    })
  });

  const emailText = await emailRes.text();
  console.log("📧 Email response:", emailText);

} catch (err) {
  console.error("❌ Email error:", err);
}*/

// Brevo Logic Ends 

  // 5. COUPON LOGIC
  if (referredByUserId) {
    await createCouponForUser(env, userId, REFERRAL_CONFIG.referral_reward_new_user, REFERRAL_CONFIG.referral_reward_new_user.prefix);
  } else {
    await createCouponForUser(env, userId, REFERRAL_CONFIG.welcome_coupon, REFERRAL_CONFIG.welcome_coupon.prefix);
  }

  // 6. Generate Token
  const token = await signJWT({ uid: userId, email: body.email }, env.JWT_SECRET);


/* OLd block
  // 🔔 7. EMAILS
  try {
    await sendEmail(env, EMAIL_TYPES.SIGNUP, body.email, 'Welcome to Mithora Kitchen 🍲', `
      <p>Hi ${body.name},</p>
      <p>Welcome to <b>Mithora Kitchen</b>! Your account is ready.</p>
    `);
    
    await sendEmail(env, EMAIL_TYPES.ADMIN_ALERT, 'seeumithora@gmail.com', '🚨 New User Signup', `
      <p><b>New user signed up</b></p>
      <p>👤 Name: ${body.name}<br>📧 Email: ${body.email}</p>
    `);
  } catch (e) { console.error('Signup email failed', e); }
*/

// 🔔 7. EMAILS (Brevo Template Based)
try {
  // USER EMAIL (Signup)
  await sendEmail(env, EMAIL_TYPES.SIGNUP, body.email, null, {
    FIRSTNAME: body.name
  });

  // ADMIN ALERT
await sendEmail(env, EMAIL_TYPES.ADMIN_ALERT, 'seeumithora@gmail.com', null, {
  NAME: body.name || 'N/A',
  EMAIL: body.email || 'N/A',
  PHONE: body.phone || 'N/A',
  TIME: new Date().toLocaleString('en-IN')
});

} catch (e) {
  console.error('Signup email failed', e);
}

  // 8. FINAL RETURN
  // 9. FINAL SINGLE RETURN (The "Bulletproof" Response)
  return jsonResponse({
    success: true,
    ok: true,               // Frontend might check .ok
    token: token,           // Required for Auth.saveToken
    userId: userId,         // Standard ID
    user: {                 // Standard User Object
      id: userId, 
      name: body.name, 
      email: body.email, 
      phone: body.phone, 
      referral_code: myReferralCode 
    },
    message: "Signup successful"
  });
}

async function handleLogin(request, env) {
  const body = await jsonBody(request);
  
  // Handle PIN login (phone + pin) OR email/password
  if (body.phone && body.pin) {
    // PIN login flow
    const row = await env.DB.prepare('SELECT * FROM users WHERE phone = ?').bind(body.phone).first();
    if (!row) return jsonResponse({ error: 'Invalid credentials' }, 401);

    const [salt, hash] = (row.password_hash || '').split(':');
    if (!salt || !hash) return jsonResponse({ error: 'Invalid credentials' }, 401);
    
    const ok = await pbkdf2Verify(body.pin, salt, hash);
    if (!ok) return jsonResponse({ error: 'Invalid PIN' }, 401);

    const token = await signJWT({ uid: row.id, email: row.email }, env.JWT_SECRET);
    return jsonResponse({ 
      ok: true, 
      token, 
      user: { id: row.id, name: row.name, email: row.email, phone: row.phone } 
    });
    
  } else if ((body.email || body.phone) && body.password) {
    // Existing email/password flow (unchanged)
    let row;
    if (body.email) row = await env.DB.prepare('SELECT * FROM users WHERE email = ?').bind(body.email).first();
    else row = await env.DB.prepare('SELECT * FROM users WHERE phone = ?').bind(body.phone).first();
    
    if (!row) return jsonResponse({ error: 'Invalid credentials' }, 401);
    const [salt, hash] = (row.password_hash || '').split(':');
    const ok = await pbkdf2Verify(body.password, salt, hash);
    if (!ok) return jsonResponse({ error: 'Invalid credentials' }, 401);

    const token = await signJWT({ uid: row.id, email: row.email }, env.JWT_SECRET);
    return jsonResponse({ ok: true, token, user: { id: row.id, name: row.name, email: row.email, phone: row.phone } });
  }
  
  return jsonResponse({ error: 'Missing credentials' }, 400);
}


async function handleForgotPassword(request, env) {
  const body = await jsonBody(request);
  if (!body || (!body.email && !body.phone)) return jsonResponse({ error: 'Provide email or phone' }, 400);

  let row;
  if (body.email) row = await env.DB.prepare('SELECT id,email FROM users WHERE email = ?').bind(body.email).first();
  else row = await env.DB.prepare('SELECT id,phone,email FROM users WHERE phone = ?').bind(body.phone).first();
  if (!row) return jsonResponse({ ok: true, message: 'If the account exists, a reset link will be sent' }); // don't reveal

  // create token (use JWT with short expiry)
  const token = await signJWT({ uid: row.id }, env.JWT_SECRET, 60 * 30); // 30 min
  // store in password_resets
  await env.DB.prepare('INSERT INTO password_resets (user_id, token, expires_at, created_at) VALUES (?, ?, ?, datetime(\'now\'))').bind(row.id, token, new Date(Date.now() + 30*60*1000).toISOString()).run();

  // send email with link
  const resetUrl = `${env.BASE_URL}/reset-password?token=${encodeURIComponent(token)}`;
  const html = `<p>You requested a password reset. Click here to reset: <a href="${resetUrl}">${resetUrl}</a></p><p>This link works for 30 minutes.</p>`;
  const to = row.email || body.email;
  try { await sendEmail(env, to, 'Reset your Mithora password', html); } catch (e) { console.error('sendgrid forgot error', e); }

  return jsonResponse({ ok: true, message: 'If an account exists, a reset link has been sent.' });
}

async function handleResetPassword(request, env) {
  const body = await jsonBody(request);
  const missing = requireFields(body, ['token','password']);
  if (missing.length) return jsonResponse({ error: 'Missing token/password' }, 400);

  // find token row
  const row = await env.DB.prepare('SELECT * FROM password_resets WHERE token = ? AND used = 0').bind(body.token).first();
  if (!row) return jsonResponse({ error: 'Invalid or expired token' }, 400);
  // optional check expires_at
  // decode token to ensure not expired
  const payload = await verifyJWT(body.token, env.JWT_SECRET);
  if (!payload) return jsonResponse({ error: 'Invalid or expired token' }, 400);

  // update password
  const { salt, hash } = await pbkdf2Hash(body.password);
  await env.DB.prepare('UPDATE users SET password_hash = ? WHERE id = ?').bind(`${salt}:${hash}`, row.user_id).run();
  await env.DB.prepare('UPDATE password_resets SET used = 1 WHERE id = ?').bind(row.id).run();

  return jsonResponse({ ok: true, message: 'Password reset successful' });
}


// ======================================================
// REQUEST PIN RESET OTP
// POST /api/auth/request-pin-reset
// ======================================================

async function handleRequestPinResetOTP(request, env) {
  try {
    const body = await jsonBody(request);

    const email = String(body?.email || '')
      .trim()
      .toLowerCase();

    if (!email) {
      return jsonResponse({
        error: 'Email is required'
      }, 400);
    }

    // Find registered user
    const user = await env.DB.prepare(`
      SELECT id, name, email
      FROM users
      WHERE LOWER(email) = ?
      LIMIT 1
    `).bind(email).first();

    // Do not reveal whether email exists
    if (!user) {
      return jsonResponse({
        ok: true,
        message: 'If this email is registered, an OTP has been sent.'
      });
    }

    // Generate 6-digit OTP
const random = new Uint32Array(1);
crypto.getRandomValues(random);

const otp = String(
  100000 + (random[0] % 900000)
);

    // Hash OTP before storing
    const { salt, hash } = await pbkdf2Hash(otp);

    const expiresAt = new Date(
      Date.now() + 10 * 60 * 1000
    ).toISOString();

    // Invalidate previous unused OTPs
    await env.DB.prepare(`
      UPDATE pin_reset_otps
      SET used = 1
      WHERE user_id = ?
        AND used = 0
    `).bind(user.id).run();

    // Store new OTP
    await env.DB.prepare(`
      INSERT INTO pin_reset_otps (
        user_id,
        email,
        otp_salt,
        otp_hash,
        expires_at,
        attempts,
        used,
        created_at
      )
      VALUES (?, ?, ?, ?, ?, 0, 0, datetime('now'))
    `).bind(
      user.id,
      email,
      salt,
      hash,
      expiresAt
    ).run();

    // Send OTP through Brevo template
    try {
      await sendEmail(
        env,
        EMAIL_TYPES.PIN_RESET_OTP,
        email,
        null,
        {
          FIRSTNAME: user.name || 'Customer',
          OTP: otp
        }
      );
    } catch (emailError) {
      console.error(
        '❌ PIN reset OTP email failed:',
        emailError
      );

      // Invalidate OTP if email could not be sent
      await env.DB.prepare(`
        UPDATE pin_reset_otps
        SET used = 1
        WHERE user_id = ?
          AND used = 0
      `).bind(user.id).run();

      return jsonResponse({
        error: 'Unable to send OTP. Please try again later.'
      }, 500);
    }

    console.log(
      `✅ PIN reset OTP sent to ${email}`
    );

    return jsonResponse({
      ok: true,
      message: 'If this email is registered, an OTP has been sent.'
    });

  } catch (error) {
    console.error(
      '❌ Request PIN reset OTP error:',
      error
    );

    return jsonResponse({
      error: 'Unable to process PIN reset request'
    }, 500);
  }
}

// ======================================================
// VERIFY OTP + RESET PIN
// POST /api/auth/reset-pin
// ======================================================

async function handleResetPin(request, env) {
  try {
    const body = await jsonBody(request);

    const email = String(body?.email || '')
      .trim()
      .toLowerCase();

    const otp = String(body?.otp || '').trim();
    const pin = String(body?.pin || '').trim();

    if (!email || !otp || !pin) {
      return jsonResponse({
        error: 'Email, OTP and PIN are required'
      }, 400);
    }

    // OTP must be exactly 6 digits
    if (!/^\d{6}$/.test(otp)) {
      return jsonResponse({
        error: 'Invalid OTP'
      }, 400);
    }

    // PIN must be exactly 4 digits
    if (!/^\d{4}$/.test(pin)) {
      return jsonResponse({
        error: 'PIN must be exactly 4 digits'
      }, 400);
    }

    // Find user
    const user = await env.DB.prepare(`
      SELECT id, email
      FROM users
      WHERE LOWER(email) = ?
      LIMIT 1
    `).bind(email).first();

    if (!user) {
      return jsonResponse({
        error: 'Invalid OTP or email'
      }, 400);
    }

    // Get latest unused OTP
    const otpRow = await env.DB.prepare(`
      SELECT *
      FROM pin_reset_otps
      WHERE user_id = ?
        AND email = ?
        AND used = 0
      ORDER BY id DESC
      LIMIT 1
    `).bind(user.id, email).first();

    if (!otpRow) {
      return jsonResponse({
        error: 'OTP is invalid or has expired'
      }, 400);
    }

    // Check expiry
    const expiresAt = new Date(otpRow.expires_at);

    if (
      Number.isNaN(expiresAt.getTime()) ||
      Date.now() > expiresAt.getTime()
    ) {
      await env.DB.prepare(`
        UPDATE pin_reset_otps
        SET used = 1
        WHERE id = ?
      `).bind(otpRow.id).run();

      return jsonResponse({
        error: 'OTP has expired. Please request a new OTP.'
      }, 400);
    }

    // Maximum OTP attempts
    if (Number(otpRow.attempts || 0) >= 5) {
      await env.DB.prepare(`
        UPDATE pin_reset_otps
        SET used = 1
        WHERE id = ?
      `).bind(otpRow.id).run();

      return jsonResponse({
        error: 'Too many incorrect attempts. Please request a new OTP.'
      }, 429);
    }

    // Verify OTP
    const otpValid = await pbkdf2Verify(
      otp,
      otpRow.otp_salt,
      otpRow.otp_hash
    );

    if (!otpValid) {
      await env.DB.prepare(`
        UPDATE pin_reset_otps
        SET attempts = attempts + 1
        WHERE id = ?
      `).bind(otpRow.id).run();

      return jsonResponse({
        error: 'Invalid OTP'
      }, 400);
    }

    // OTP is correct.
    // Hash the new 4-digit PIN.
    const {
      salt: pinSalt,
      hash: pinHash
    } = await pbkdf2Hash(pin);

    // Update user's PIN
    const updateResult = await env.DB.prepare(`
      UPDATE users
      SET password_hash = ?
      WHERE id = ?
    `).bind(
      `${pinSalt}:${pinHash}`,
      user.id
    ).run();

    if (!updateResult.meta?.changes) {
      return jsonResponse({
        error: 'Unable to update PIN'
      }, 500);
    }

    // Mark OTP as used
    await env.DB.prepare(`
      UPDATE pin_reset_otps
      SET used = 1
      WHERE id = ?
    `).bind(otpRow.id).run();

    // Invalidate any other unused OTPs
    await env.DB.prepare(`
      UPDATE pin_reset_otps
      SET used = 1
      WHERE user_id = ?
        AND used = 0
    `).bind(user.id).run();

    console.log(
      `✅ PIN successfully reset for user ${user.id}`
    );

    return jsonResponse({
      ok: true,
      message: 'PIN reset successful'
    });

  } catch (error) {
    console.error(
      '❌ Reset PIN error:',
      error
    );

    return jsonResponse({
      error: 'Unable to reset PIN'
    }, 500);
  }
}


async function handleAdminLogin(request, env) {
  // Allow admin to login via email+password similar to user, but enforce is_admin
  const body = await jsonBody(request);
  if (!body || (!body.email && !body.phone) || !body.password) return jsonResponse({ error: 'Missing credentials' }, 400);

  let row;
  if (body.email) row = await env.DB.prepare('SELECT * FROM users WHERE email = ?').bind(body.email).first();
  else row = await env.DB.prepare('SELECT * FROM users WHERE phone = ?').bind(body.phone).first();
  if (!row || !row.is_admin) return jsonResponse({ error: 'Unauthorized' }, 401);

  const ph = row.password_hash || '';
  const [salt, hash] = ph.split(':');
  const ok = await pbkdf2Verify(body.password, salt, hash);
  if (!ok) return jsonResponse({ error: 'Invalid credentials' }, 401);

  const token = await signJWT({ uid: row.id, email: row.email, is_admin: row.is_admin }, env.JWT_SECRET);
  return jsonResponse({ ok: true, token, user: { id: row.id, name: row.name, email: row.email, phone: row.phone, is_admin: row.is_admin } });
}


async function handleCheckMobile(request, env) {
  const { phone } = await jsonBody(request);
  if (!phone || phone.length !== 10) {
    return jsonResponse({ exists: false }, 400);
  }
  
  // Check if user exists by phone
  const row = await env.DB.prepare('SELECT id, name, password_hash FROM users WHERE phone = ?').bind(phone).first();
  
  if (row) {
    // User exists - check if they have PIN (password_hash exists)
    return jsonResponse({ exists: !!row.password_hash });
  }
  
  return jsonResponse({ exists: false });
}


// Hadnle get Order Status

async function handleGetOrderByOrderNo(request, env) {
  const orderNo = request.url.split('/').pop();

  if (!orderNo) {
    return jsonResponse(
      { ok: false, message: 'Invalid order number' },
      400
    );
  }

  const auth = await requireUser(request, env);

  if (!auth.id) {
    return auth;
  }

  const order = await env.DB.prepare(`
    SELECT *
    FROM orders
    WHERE order_no = ?
      AND user_id = ?
  `).bind(orderNo, auth.id).first();

  if (!order) {
    return jsonResponse({ ok:false, message: "Order not found" }, 404);
  }

  const items = await env.DB.prepare(`
    SELECT name, variant_name, qty, total_price
    FROM order_items
    WHERE order_id = ?
  `).bind(order.id).all();

  // Updated query to include 'note'
  const timeline = await env.DB.prepare(`
    SELECT status, note, created_at
    FROM order_tracking
    WHERE order_id = ?
    ORDER BY created_at ASC
  `).bind(order.id).all();

  return jsonResponse({
    ok: true,
    order: {
      ...order,
      items: items.results || [],
      timeline: timeline.results || []
    }
  });
}

//Download Invoice PDF

async function handleInvoiceDownload(request, env) {
  const orderNo = request.url.split("/").pop();
  if (!orderNo) return new Response("Invalid order", { status: 400 });

const auth = await requireUser(request, env);

if (!auth.id) {
  return auth;
}

const order = await env.DB.prepare(
  "SELECT * FROM orders WHERE order_no = ? AND user_id = ?"
).bind(orderNo, auth.id).first();

  if (!order || order.payment_status !== "paid") {
    return new Response("Invoice not available", { status: 404 });
  }

  const itemsRes = await env.DB.prepare(`
    SELECT name, variant_name, qty, price_per_unit, total_price
    FROM order_items
    WHERE order_id = ?
  `).bind(order.id).all();

  const items = itemsRes.results || [];

  let y = 780;
  let textLines = [];

  function line(t) {
    textLines.push(`1 0 0 1 40 ${y} Tm (${escapePdf(t)}) Tj`);
    y -= 16;
  }

  // ===== CONTENT =====
  line("MITHORA KITCHEN");
  line("INVOICE");
  line("------------------------------");
  line(`Order No : ${order.order_no}`);
  line(`Date     : ${order.created_at}`);
  line("");
  line(`Customer : ${order.customer_name || ""}`);
  line(`Phone    : ${order.customer_phone || ""}`);
  line("");
  line("------------------------------");
  line("ITEMS");

  items.forEach(i => {
    line(`${i.name} ${i.variant_name || ""}`);
    line(`  ${i.qty} x ₹${i.price_per_unit} = ₹${i.total_price}`);
    line("");
  });

  line("------------------------------");
  line(`Subtotal : ₹${order.amount_subtotal}`);
  line(`Shipping : ₹${order.shipping_amount}`);
  line(`Discount : ₹${order.discount_amount}`);
  line("------------------------------");
  line(`TOTAL    : ₹${order.amount_total}`);
  line("");
  line("Payment Status : PAID");
  line("");
  line("Thank you for ordering from Mithora!");

  const content = `
BT
/F1 11 Tf
${textLines.join("\n")}
ET
`;

  const pdf = `%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<<
  /Type /Page
  /Parent 2 0 R
  /MediaBox [0 0 595 842]
  /Contents 4 0 R
  /Resources << /Font << /F1 5 0 R >> >>
>>
endobj
4 0 obj
<< /Length ${content.length} >>
stream
${content}
endstream
endobj
5 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>
endobj
xref
0 6
0000000000 65535 f
trailer
<< /Size 6 /Root 1 0 R >>
startxref
0
%%EOF`;

  return new Response(pdf, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="invoice-${orderNo}.pdf"`,
      "Cache-Control": "no-store"
    }
  });
}

function escapePdf(str) {
  return String(str)
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)");
}




/* =========================
   MENU & PINCODE
   ========================= */

async function handleGetCategories(request, env) {
  // GET /api/menu/categories?active=1
  const url = new URL(request.url);
  const active = url.searchParams.get('active');
  let q = 'SELECT * FROM categories';
  if (active) q += ' WHERE is_active = 1';
  q += ' ORDER BY id';
  const r = await env.DB.prepare(q).all();
  return new Response(JSON.stringify({
  categories: r.results || []
}), {
  headers: {
    "Content-Type": "application/json",
    "Cache-Control": "public, max-age=3600"
  }
});
}

async function handleLocationSuggest(request, env) {
  const url = new URL(request.url);
  const q = (url.searchParams.get('q') || '').toLowerCase();

  if (q.length < 2) {
    return jsonResponse({ suggestions: [] });
  }

  const isNumeric = /^\d+$/.test(q);

  const res = await env.DB.prepare(`
    SELECT DISTINCT area_name, pincode
    FROM pincode_master
    WHERE is_active = 1
      AND (
        LOWER(area_name) LIKE ?
        OR (${isNumeric ? 'pincode LIKE ?' : '0'})
      )
    ORDER BY area_name
    LIMIT 8
  `).bind(
    `%${q}%`,
    isNumeric ? `${q}%` : null
  ).all();

  return jsonResponse({
    suggestions: (res.results || []).map(r => ({
      area: r.area_name,
      pincode: r.pincode
    }))
  });
}


// 🔥 ENHANCED PRODUCTS API (with reviews)
async function handleGetProducts(request, env) {
  const url = new URL(request.url);
  const category = url.searchParams.get('category_id');
  const qstr = url.searchParams.get('q');
  const featured = url.searchParams.get('featured');
  const page = parseInt(url.searchParams.get('page')||'1');
  //Product limit to 50
  const size = parseInt(url.searchParams.get('size')||'50');
  const offset = (page-1)*size;
  
  let base = `
    SELECT p.*, c.name as category_name, c.shipping_type, 
           c.prep_time_minutes, c.delivery_time_minutes,
           ROUND(AVG(pr.rating), 1) as avg_rating,
           COUNT(pr.id) as review_count
    FROM products p 
    LEFT JOIN categories c ON p.category_id = c.id
    LEFT JOIN product_reviews pr ON pr.product_id = p.id AND pr.status = 'active'
    WHERE p.is_active = 1
  `;
  const params = [];
  
  if (category) {
    base += ' AND p.category_id = ?';
    params.push(category);
  }
  if (qstr) {
    base += ' AND (p.name LIKE ? OR p.description LIKE ?)';
    params.push(`%${qstr}%`, `%${qstr}%`);
  }
  if (featured) {
    base += ' AND p.is_featured = 1';
  }
  
  base += ' GROUP BY p.id ORDER BY p.id DESC LIMIT ? OFFSET ?';
  params.push(size, offset);
  
  const res = await env.DB.prepare(base).bind(...params).all();
  const products = res.results || [];
  
  // Fetch variants for each product
// Fetch all variants in one query
const productIds = products.map(p => p.id);

if (productIds.length) {

  const placeholders = productIds.map(()=>'?').join(',');

  const variantRes = await env.DB.prepare(`
    SELECT id, product_id, variant_name, price, old_price, ship_type,
           stock, weight_grams, description, is_default
    FROM product_variants
    WHERE product_id IN (${placeholders}) AND is_active=1
  `).bind(...productIds).all();

  const variants = variantRes.results || [];

  // attach variants to products
  for (const p of products) {
    p.variants = variants.filter(v => v.product_id === p.id);
  }

}

// =====================================================
// FETCH PRODUCT BADGES
// =====================================================

if (productIds.length) {

  const placeholders = productIds.map(() => '?').join(',');

  const badgeRes = await env.DB.prepare(`
    SELECT
      pbm.product_id,
      pb.id,
      pb.name,
      pb.slug,
      pb.display_text,
      pb.icon,
      pb.priority
    FROM product_badge_map pbm
    JOIN product_badges pb
      ON pb.id = pbm.badge_id
    WHERE pbm.product_id IN (${placeholders})
      AND pb.is_active = 1
    ORDER BY pb.priority ASC
  `).bind(...productIds).all();

  const badges = badgeRes.results || [];


  // ===================================================
  // FETCH PRODUCT TAGS
  // ===================================================

  const tagRes = await env.DB.prepare(`
    SELECT
      ptm.product_id,
      pt.id,
      pt.name,
      pt.slug
    FROM product_tag_map ptm
    JOIN product_tags pt
      ON pt.id = ptm.tag_id
    WHERE ptm.product_id IN (${placeholders})
      AND pt.is_active = 1
    ORDER BY pt.name ASC
  `).bind(...productIds).all();

  const tags = tagRes.results || [];


  // ===================================================
  // ATTACH BADGES + TAGS TO PRODUCTS
  // ===================================================

  for (const p of products) {

    p.badges = badges.filter(
      b => b.product_id === p.id
    );

    p.tags = tags.filter(
      t => t.product_id === p.id
    );

  }

}

return new Response(JSON.stringify({ products }), {
  headers: {
    "Content-Type": "application/json",
    //"Cache-Control": "public, max-age=300" // max-age: browser cache

	"Cache-Control": "public, max-age=300, s-maxage=300" // CDN / Cloudflare cache - faster edge cache
  }
});
}

// 🔥 REVIEWS ENDPOINTS
async function handleGetProductReviews(request, env) {
  const url = new URL(request.url);
  const productId = url.searchParams.get('product_id');
  
  if (!productId) {
    return jsonResponse({ error: 'Missing product_id' }, 400);
  }
  
  const [reviews, summary] = await Promise.all([
    env.DB.prepare(`
      SELECT 
        pr.id, pr.rating, pr.review_title, pr.review_text, pr.created_at,
        u.name as reviewer_name
      FROM product_reviews pr
      JOIN users u ON pr.user_id = u.id
      WHERE pr.product_id = ? AND pr.status = 'active'
      ORDER BY pr.created_at DESC
      LIMIT 5
    `).bind(productId).all(),
    
    env.DB.prepare(`
      SELECT 
        ROUND(AVG(rating), 1) as avg_rating,
        COUNT(*) as review_count
      FROM product_reviews 
      WHERE product_id = ? AND status = 'active'
    `).bind(productId).first()
  ]);
  
  return jsonResponse({
    reviews: reviews.results || [],
    summary: summary.result || { avg_rating: 0, review_count: 0 }
  });
}

// 🔥 NEW: Get ALL user's reviews (for Rate/Edit buttons across devices)
async function handleGetUserReviews(request, env) {
  try {
    const auth = await requireUser(request, env);

    if (!auth.id) {
      return auth;
    }

    const url = new URL(request.url);

    // NEVER trust user_id from query string.
    // Always use the authenticated user's ID.
    const user_id = auth.id;

    let query = `
      SELECT order_id, product_id, variant_id, order_no,
             rating, review_title, review_text, created_at
      FROM product_reviews
      WHERE user_id = ?
    `;

    let params = [user_id];

    // 🔥 NEW: Specific review lookup for Edit auto-fill
    // ?user_id=123&order_id=6&product_id=23&variant_id=26
    const order_id = url.searchParams.get('order_id');
    const product_id = url.searchParams.get('product_id');
    const variant_id = url.searchParams.get('variant_id');
    
    if (order_id && product_id && variant_id) {
      query += ` AND order_id = ? AND product_id = ? AND variant_id = ?`;
      params.push(parseInt(order_id), parseInt(product_id), parseInt(variant_id));
    }
    
    query += ` ORDER BY created_at DESC`;
    
    const reviews = await env.DB.prepare(query).bind(...params).all();
    
    return jsonResponse({ 
      ok: true, 
      reviews: reviews.results || [] 
    });
    
  } catch (error) {
    console.error('Get user reviews error:', error);
    return jsonResponse({ error: 'Failed to fetch reviews' }, 500);
  }
}

// ===============================
// MITHORA FEEDBACK HANDLER
// ===============================
async function handleMithoraFeedback(request, env) {

  const body = await jsonBody(request);

  if (!body) {
    return jsonResponse({ success: false, error: "Invalid JSON" }, 400);
  }

  // Required validation
  if (!body.customer_name || !body.customer_phone) {
    return jsonResponse({ success: false, error: "Missing required fields" }, 400);
  }

  if (!/^[0-9]{10}$/.test(body.customer_phone)) {
    return jsonResponse({ success: false, error: "Invalid phone" }, 400);
  }

  try {

    await env.DB.prepare(`
      INSERT INTO mithora_feedback (
        visit_reason,
        found_required,
        pricing_feedback,
        checked_competitor,
        competitor_price,
        additional_comment,
        customer_name,
        customer_phone,
        source_page,
        created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `).bind(
      body.visit_reason || null,
      body.found_required || null,
      body.pricing_feedback || null,
      body.checked_competitor || null,
      body.competitor_price || null,
      body.additional_comment || null,
      body.customer_name,
      body.customer_phone,
      body.source_page || 'direct'
    ).run();

    return jsonResponse({ success: true });

  } catch (e) {
    console.error("Feedback insert error:", e);
    return jsonResponse({ success: false, error: "Database error" }, 500);
  }
}

async function handleSubmitReview(request, env) {
  const auth = await requireUser(request, env);

  if (!auth.id) {
    return auth;
  }

  const body = await jsonBody(request);

  if (!body) {
    return jsonResponse({ error: 'Invalid JSON' }, 400);
  }

  const cleanBody = {
    user_id: auth.id,
    order_id: parseInt(body.order_id),
    variant_id: parseInt(body.variant_id),
    product_id: parseInt(body.product_id),
    order_no: body.order_no,
    rating: parseInt(body.rating),
    review_title: body.review_title || null,
    review_text: body.review_text || null
  };

  const required = [
    'user_id',
    'order_id',
    'variant_id',
    'product_id',
    'order_no',
    'rating'
  ];

  const missing = required.filter(
    f => cleanBody[f] === undefined ||
         cleanBody[f] === null ||
         Number.isNaN(cleanBody[f])
  );

  if (missing.length) {
    return jsonResponse(
      { error: `Missing: ${missing.join(', ')}` },
      400
    );
  }

  if (cleanBody.rating < 1 || cleanBody.rating > 5) {
    return jsonResponse(
      { error: 'Rating must be between 1 and 5' },
      400
    );
  }

  // Verify that this order belongs to the logged-in user.
  const order = await env.DB.prepare(`
    SELECT id, order_no
    FROM orders
    WHERE id = ?
      AND order_no = ?
      AND user_id = ?
  `).bind(
    cleanBody.order_id,
    cleanBody.order_no,
    auth.id
  ).first();

  if (!order) {
    return jsonResponse(
      { error: 'Order not found or not owned by user' },
      403
    );
  }

  // Verify that the reviewed variant/product was actually purchased.
  const purchasedItem = await env.DB.prepare(`
    SELECT id
    FROM order_items
    WHERE order_id = ?
      AND variant_id = ?
      AND product_id = ?
  `).bind(
    cleanBody.order_id,
    cleanBody.variant_id,
    cleanBody.product_id
  ).first();

  if (!purchasedItem) {
    return jsonResponse(
      { error: 'You can only review items from this order' },
      403
    );
  }
  
  if (existing) {
    // ✅ UPDATE with clean numbers
    await env.DB.prepare(`
      UPDATE product_reviews SET 
        rating = ?, review_title = ?, review_text = ?, 
        updated_at = datetime('now')
      WHERE user_id = ? AND order_id = ? AND variant_id = ?
    `).bind(
      cleanBody.rating, cleanBody.review_title, cleanBody.review_text,
      cleanBody.user_id, cleanBody.order_id, cleanBody.variant_id
    ).run();
    
    return jsonResponse({ ok: true, updated: true });
  }
  
  // ✅ INSERT new
  await env.DB.prepare(`
    INSERT INTO product_reviews (
      user_id, order_id, variant_id, product_id, order_no, 
      rating, review_title, review_text
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    cleanBody.user_id, cleanBody.order_id, cleanBody.variant_id, cleanBody.product_id,
    cleanBody.order_no, cleanBody.rating, cleanBody.review_title, cleanBody.review_text
  ).run();
  
  return jsonResponse({ ok: true, new: true });
}


async function handleGoogleGeocode(request, env) {
  const origin = request.headers.get("Origin") || request.headers.get("Referer");
  const isAllowed = origin && (origin.includes("mithora.in") || origin.includes("localhost")); 
  if (!isAllowed) return jsonResponse({ error: "Unauthorized" }, 403);

  const { searchParams } = new URL(request.url);
  const lat = searchParams.get("lat");
  const lng = searchParams.get("lng");

  if (!lat || !lng) return jsonResponse({ error: "Missing coordinates" }, 400);

  const preciseLat = parseFloat(lat).toFixed(3); 
  const preciseLng = parseFloat(lng).toFixed(3);
  const cacheKey = `geo_${preciseLat}_${preciseLng}`;

  try {
    // CACHE CHECK (unchanged)
    const cachedRow = await env.DB.prepare(
      "SELECT result FROM geo_cache WHERE cache_key = ? AND created_at > datetime('now', '-30 days')"
    ).bind(cacheKey).first();

    if (cachedRow) {
      const result = JSON.parse(cachedRow.result);
      result.is_cached = true;
      return new Response(JSON.stringify(result), { headers: { "Content-Type": "application/json" } });
    }

    // GOOGLE API
    const GOOGLE_KEY = env.GOOGLE_MAPS_API_KEY;
    if (!GOOGLE_KEY) return jsonResponse({ error: "Config Error" }, 500);

    const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${GOOGLE_KEY}`;
    const response = await fetch(url);
    const data = await response.json();

    if (data.status !== "OK" || !data.results[0]) {
      return jsonResponse({ error: data.status || "No results", message: data.error_message }, 404);
    }

    const result = data.results[0];
    const components = result.address_components;
    
    // 🔥 ENHANCED PARSING - EXACT MATCH FOR CHECKOUT
    const getComp = (types) => {
      return components.find(c => types.some(t => c.types.includes(t)))?.long_name || "";
    };

    const address = {
      ok: true,
      latitude: parseFloat(lat),
      longitude: parseFloat(lng),
      pincode: getComp(["postal_code"]),
      area: getComp(["sublocality_level_1", "sublocality", "neighborhood", "locality"]),
      city: getComp(["locality", "administrative_area_level_2"]),
      state: getComp(["administrative_area_level_1", "administrative_area_level_2"]),
      country: getComp(["country"]),
      
      // 🔥 THESE WERE MISSING - CHECKOUT NEEDS THEM
      house: getComp(["premise", "subpremise"]) || "",
      street: getComp(["route", "street_number", "street_address"]) || "",
      landmark: getComp(["point_of_interest"]) || "",
      
      formatted_address: result.formatted_address,
      is_cached: false
    };

    // ✅ VALIDATE REQUIRED FIELDS
    if (!address.pincode || !address.area) {
      return jsonResponse({ 
        error: "Could not detect serviceable address components", 
        address: address,
        raw_google: data.results[0].address_components.map(c => ({types: c.types, long_name: c.long_name}))
      }, 404);
    }

    // CACHE RESULT
    await env.DB.prepare(
      "INSERT OR REPLACE INTO geo_cache (cache_key, result, created_at) VALUES (?, ?, datetime('now'))"
    ).bind(cacheKey, JSON.stringify(address)).run();

    return new Response(JSON.stringify(address), {
      headers: { "Content-Type": "application/json" }
    });

  } catch (e) {
    console.error("GEO ERROR:", e);
    return jsonResponse({ error: "Process failed", details: e.message }, 500);
  }
}

async function handleGetProduct(request, env) {
  // GET /api/menu/product/:id
  const id = request.url.split('/').pop();
  const r = await env.DB.prepare('SELECT p.*, c.name as category_name FROM products p LEFT JOIN categories c ON p.category_id=c.id WHERE p.id = ?').bind(id).first();
  if (!r) return jsonResponse({ error: 'Not found' }, 404);
  const variants = await env.DB.prepare('SELECT * FROM product_variants WHERE product_id = ? AND is_active=1').bind(id).all();
  r.variants = variants.results || [];
  return jsonResponse({ product: r });
}

async function handlePincode(request, env) {
  const pincode = request.url.split('/').pop();

  const rows = await env.DB.prepare(`
    SELECT
      id,
      pincode,
      city,
      state,
      area_name,
      latitude,
      longitude,
      service_tier,
      zone_id,
      local_shipping_fee,
      min_order_free_delivery,
      is_active
    FROM pincode_master
    WHERE pincode = ?
  `).bind(pincode).all();

  if (!rows.results || rows.results.length === 0) {
    return jsonResponse(
      { ok: false, message: 'Pincode not found', pincode_status: 'inactive' },
      404
    );
  }

  return jsonResponse({
    ok: true,
    pincode,
    pincode_status: rows.results[0].is_active ? 'active' : 'inactive',
    total_records: rows.results.length,
    records: rows.results
  });
}


/* =========================
   CART VALIDATION
   ========================= */

/* =========================
   CART VALIDATION (handleCartSync)
   ========================= */

/* =========================================================
   CART VALIDATION (handleCartSync) — FULLY MODIFIED
   ✅ Correct Subtotal Calculation Order
   ✅ Dynamic Pincode Free Delivery Integration
   ✅ Real-time Coupon Validation
   ========================================================= */

async function handleCartSync(request, env) {

  let userId = null;

  try {

    const authHeader = request.headers.get("Authorization");

    if (authHeader && authHeader.startsWith("Bearer ")) {

      const token = authHeader.slice(7);

      const payload = await verifyJWT(token, env.JWT_SECRET);

      if (payload && payload.email) {

        const user = await env.DB.prepare(
          "SELECT id FROM users WHERE email = ?"
        ).bind(payload.email).first();

        if (user) {
          userId = user.id;
        }

      }

    }

  } catch (e) {
    console.log("Guest cart");
  }
console.log("Cart Sync User:", userId);

    const body = await jsonBody(request);
	const selectedArea = body.address?.area || null;

    if (!body || !Array.isArray(body.items)) {
      return jsonResponse({ error: 'Invalid cart' }, 400);
    }
  
    const variantIds = body.items.map(i => i.variant_id);
    
    let subtotal = 0;
    let shipping = 0; 
    let discount = 0;
    let pincode_status = 'active'; 
    let location_info = null; 
    let couponInfo = { status: 'none', message: '', applied_code: null };
    let validatedItems = [];
  
    // --- STEP 1: VALIDATE ITEMS & CALCULATE SUBTOTAL FIRST ---
    // We MUST know the subtotal before we can decide if shipping is free
    if (variantIds.length > 0) {
      const placeholders = variantIds.map(() => '?').join(',');
      const variants = (await env.DB.prepare(`
        SELECT pv.*, p.name as product_name, p.image_path 
        FROM product_variants pv 
        LEFT JOIN products p ON pv.product_id = p.id 
        WHERE pv.id IN (${placeholders})`).bind(...variantIds).all()).results || [];
  
      validatedItems = body.items.map(it => {
        const v = variants.find(x => x.id === it.variant_id);
        if (!v) return null;
        const line = v.price * it.qty;
        subtotal += line; // Adding to subtotal
        return { 
          variant_id: v.id, 
          product_id: v.product_id,
          name: v.product_name, 
          variant_name: v.variant_name, 
          image_path: v.image_path, 
          qty: it.qty, 
          price: v.price,
          line_total: line 
        };
      }).filter(Boolean);
    }
  
    // --- STEP 2: PINCODE & SHIPPING LOGIC (NOW WITH SUBTOTAL) ---
    const targetPincode = body.pincode || (body.address && body.address.pincode);
  let is_external_zone = false; // Initialize the flag
    if (targetPincode) {
  try {
    /*const pinData = await env.DB.prepare(
      'SELECT is_active, local_shipping_fee, min_order_free_delivery, city, state, area_name FROM pincode_master WHERE pincode = ?'
    ).bind(targetPincode).first();*/

	const pinData = await env.DB.prepare(
  `SELECT
    is_active,
    external_zone,
    local_shipping_fee,
    min_order_free_delivery,
    city,
    state,
    area_name
   FROM pincode_master
   WHERE pincode = ?`
).bind(targetPincode).first();

    if (!pinData || pinData.is_active === 0) {
      pincode_status = 'inactive';
      location_info = null;
      shipping = 0;
    } else {
      pincode_status = 'active';
      
      // ✅ CHECK IF IT IS AN EXTERNAL ZONE (Outside Murlipura Hub)
      /*const primaryPincodes = ["302039", "302013"];
      is_external_zone = !primaryPincodes.includes(targetPincode.toString());*/

	  // ✅ External zone is controlled by pincode_master
is_external_zone = Number(pinData.external_zone || 0) === 1;

      const baseFee = pinData.local_shipping_fee || 0;
      const freeThreshold = pinData.min_order_free_delivery || 0;

      const isFreeDelivery = freeThreshold > 0 && subtotal >= freeThreshold;
      shipping = isFreeDelivery ? 0 : baseFee;

      const remainingForFree = (!isFreeDelivery && freeThreshold > 0)
        ? Math.max(0, freeThreshold - subtotal)
        : 0;

      location_info = {
        city: pinData.city,
        state: pinData.state,
        area: selectedArea,
        area_name: selectedArea,
        min_order_free_delivery: freeThreshold
      };

      var free_delivery_min = freeThreshold;
      var free_delivery_remaining = remainingForFree;
      var is_free_delivery = isFreeDelivery;
    }
  } catch (e) { 
    console.error("Cart Sync Error:", e);
    shipping = 40; 
    pincode_status = 'active';
  }
}
  
    // --- STEP 3: COUPON / DISCOUNT LOGIC ---
    if (body.coupon_code) {
let c;

if (userId) {

  c = await env.DB.prepare(`
  SELECT *
  FROM coupons
  WHERE code = ?
  AND is_active = 1
  AND (
        user_specific = 0
        OR EXISTS (
             SELECT 1
             FROM json_each(allowed_user_ids)
             WHERE value = ?
        )
      )
  `).bind(body.coupon_code, userId).first();

} else {

  c = await env.DB.prepare(`
  SELECT *
  FROM coupons
  WHERE code = ?
  AND is_active = 1
  AND user_specific = 0
  `).bind(body.coupon_code).first();

}
      
      if (!c) {
        couponInfo = { status: 'error', message: 'Invalid code', applied_code: body.coupon_code };
      } else if (subtotal < (c.min_order_amount || 0)) {
        couponInfo = { status: 'error', message: `Add ₹${c.min_order_amount - subtotal} more for this coupon`, applied_code: body.coupon_code };
      } else {
        discount = c.discount_type === 'flat' ? c.discount_value : (subtotal * c.discount_value / 100);
        couponInfo = { status: 'success', message: 'Coupon applied!', applied_code: body.coupon_code };
      }
    }
  
    // --- STEP 4: FINAL CALCULATION ---
    const finalTotal = Math.max(0, (subtotal + shipping) - discount);
  
    return jsonResponse({
validatedCart: {
  items: validatedItems,
  subtotal: subtotal,
  shipping: shipping,
  discount: Math.round(discount),
  total: Math.round(finalTotal),

  // 🔥 FREE DELIVERY FLAGS
  is_free_delivery: is_free_delivery,
  free_delivery_min: free_delivery_min,
  free_delivery_remaining: free_delivery_remaining,
is_external_zone: is_external_zone, // 🔥 Add this flag
  pincode_status: pincode_status,
  location_info: location_info,
  coupon_info: couponInfo
}

    });
  }

/* =========================
   CHECKOUT -> CREATE ORDER (Razorpay)
   ========================= */

/*async function handleCreateOrder(request, env) {
  // Body: { validatedCart, user_token (optional), address_id or address object, customer {name,email,phone} }
  const body = await jsonBody(request);
  if (!body || !body.validatedCart) return jsonResponse({ error: 'Missing validatedCart' }, 400);

  // Basic re-validation should be done here (call validateCartAndComputeTotals). For brevity, we accept validatedCart from client but still re-check quantities and prices from DB.
  // Create order_no
  const orderNo = 'MITH' + Date.now();
  // insert into orders
  const insert = await env.DB.prepare(`INSERT INTO orders (order_no, user_id, cart_snapshot, address_snapshot, customer_name, customer_email, customer_phone, amount_subtotal, shipping_amount, discount_amount, amount_total, order_status, payment_status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'created', 'pending', datetime('now'))`)
    .bind(orderNo, body.user?.id || null, JSON.stringify(body.validatedCart.items || []), JSON.stringify(body.address || {}), body.customer?.name || null, body.customer?.email || null, body.customer?.phone || null, body.validatedCart.subtotal, body.validatedCart.shipping, body.validatedCart.discount, body.validatedCart.total)
    .run();
  const orderId = insert.lastInsertRowId;

  // insert order items
  for (const it of body.validatedCart.items || []) {
    await env.DB.prepare('INSERT INTO order_items (order_id, variant_id, product_id, name, variant_name, qty, price_per_unit, total_price, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime(\'now\'))')
      .bind(orderId, it.variant_id, it.product_id, it.name, it.variant_name || '', it.qty, it.price, it.line_total).run();
  }

  // create razorpay order
  const amountPaise = Math.round((body.validatedCart.total || 0) * 100);
  const rp = await createRazorpayOrder(env, amountPaise, orderNo);
  if (!rp || !rp.id) return jsonResponse({ error: 'Razorpay order failed' }, 500);
  // update orders with razorpay_order_id
  await env.DB.prepare('UPDATE orders SET razorpay_order_id = ? WHERE id = ?').bind(rp.id, orderId).run();

  // Return to client: razorpay order details
  return jsonResponse({ ok: true, order_id: orderId, order_no: orderNo, razorpay_order: rp });
}*/

async function handleCreateOrder(request, env) {
  const body = await jsonBody(request);
  if (!body?.validatedCart) {
    return jsonResponse({ error: "Missing validatedCart" }, 400);
  }

  /* =========================
     0️⃣ NORMALIZE INPUT
     ========================= */
  const orderNo = "MITH" + Date.now();

  // Check for user_id (from updated JS) or body.user.id (fallback)
// 🛡️ SECURITY FIX: Extract the REAL user ID from the JWT token
  // This ignores the client-provided user_id to prevent spoofing.
const auth = await requireUser(request, env);
if (!auth.id) return auth;
const userId = auth.id;


  const subtotal = Number(body.validatedCart?.subtotal ?? 0);
  const shipping = Number(body.validatedCart?.shipping ?? 0);
  const discount = Number(body.validatedCart?.discount ?? 0);
  const tax = Number(body.validatedCart?.tax ?? 0);
  const total = Number(body.validatedCart?.total ?? 0);

  const cartSnapshot = JSON.stringify(
    Array.isArray(body.validatedCart.items)
      ? body.validatedCart.items
      : []
  );

  // =========================
  // 👤 CUSTOMER + ADDRESS
  // Always read from authenticated user / DB
  // =========================

  const customer = await env.DB.prepare(`
    SELECT id, name, email, phone
    FROM users
    WHERE id = ?
  `).bind(userId).first();

  if (!customer) {
    return jsonResponse({ error: "Customer not found" }, 404);
  }

  const addressId = body.address_id;

  if (!addressId) {
    return jsonResponse({ error: "Missing address_id" }, 400);
  }

  const address = await env.DB.prepare(`
    SELECT
      id,
      user_id,
      name,
      phone,
      house,
      street,
      area,
      city,
      state,
      pincode,
      is_default
    FROM addresses
    WHERE id = ?
      AND user_id = ?
    LIMIT 1
  `).bind(addressId, userId).first();

  if (!address) {
    return jsonResponse({ error: "Delivery address not found" }, 404);
  }

  const addressSnapshot = JSON.stringify(address);

  const customerName = d1(customer.name);
  const customerEmail = d1(customer.email);
  const customerPhone = d1(customer.phone);

  /* =========================
     1️⃣ CREATE RAZORPAY ORDER
     ========================= */
  const amountPaise = Math.round(total * 100);

  const rpResponse = await fetch("https://api.razorpay.com/v1/orders", {
    method: "POST",
    headers: {
      Authorization: `Basic ${btoa(
        `${env.RAZORPAY_KEY_ID}:${env.RAZORPAY_KEY_SECRET}`
      )}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      amount: amountPaise,
      currency: "INR",
      receipt: orderNo,
      payment_capture: 1
    })
  });

  if (!rpResponse.ok) {
    const err = await rpResponse.text();
    throw new Error("Razorpay order failed: " + err);
  }

  const rp = await rpResponse.json(); // order_xxx

  /* =========================
     2️⃣ INSERT ORDER (CRITICAL)
     ========================= */
  const insert = await env.DB.prepare(`
    INSERT INTO orders (
      order_no,
      razorpay_order_id,
      user_id,
      cart_snapshot,
      address_snapshot,
      customer_name,
      customer_email,
      customer_phone,
      amount_subtotal,
      shipping_amount,
      discount_amount,
      tax_amount,
      amount_total,
      payment_status,
      order_status,
      created_at,
      updated_at
    ) VALUES (
      ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
      'pending', 'created',
      datetime('now'), datetime('now')
    )
  `).bind(
    d1(orderNo),
    d1(rp.id),
    d1(userId),
    d1(cartSnapshot),
    d1(addressSnapshot),
    d1(customerName),
    d1(customerEmail),
    d1(customerPhone),
    d1(subtotal),
    d1(shipping),
    d1(discount),
    d1(tax),
    d1(total)
  ).run();

  // 🔥 THIS IS THE KEY FIX
  const orderId = insert.meta.last_row_id;

  /* =========================
     3️⃣ INSERT ORDER ITEMS
     ========================= */
  for (const it of Array.isArray(body.validatedCart.items) ? body.validatedCart.items : []) {
    await env.DB.prepare(`
      INSERT INTO order_items (
        order_id,
        variant_id,
        product_id,
        name,
        variant_name,
        qty,
        price_per_unit,
        total_price
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      d1(orderId),
      d1(it.variant_id),
      d1(it.product_id),
      d1(it.name),
      d1(it.variant_name),
      d1(it.qty ?? 1),
      d1(it.price ?? 0),
      d1(it.line_total ?? 0)
    ).run();
  }

  /* =========================
     4️⃣ ORDER TRACKING
     ========================= */
  await env.DB.prepare(`
    INSERT INTO order_tracking (order_id, status, note)
    VALUES (?, ?, ?)
  `).bind(d1(orderId), 'created', 'Order created').run();

  await env.DB.prepare(`
    INSERT INTO order_tracking (order_id, status, note)
    VALUES (?, ?, ?)
  `).bind(d1(orderId), 'payment_initiated', 'Payment initiated').run();

// =========================
// 🚨 ADMIN ORDER CREATED ALERT
// (PAYMENT NOT DONE YET)
// =========================
try {
  const emailRes = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      "api-key": env.BREVO_API_KEY,
      "Content-Type": "application/json",
      "accept": "application/json"
    },
    body: JSON.stringify({
      to: [
        {
          email: "seeumithora@gmail.com",
          name: "Mithora Admin"
        }
      ],

      // ✅ REQUIRED (since no template)
      sender: {
        email: env.ADMIN_FROM_EMAIL || env.ORDER_FROM_EMAIL,
        name: "Mithora Kitchen"
      },

      subject: `🧾 New Order Created – ${orderNo}`,

      // ✅ DIRECT HTML CONTENT
      htmlContent: `
        <div style="font-family: Arial; max-width:480px; margin:auto;">

          <p><b>New order created (payment pending)</b></p>

          <p>
            🧾 <b>Order No:</b> ${orderNo}<br>
            👤 <b>Customer:</b> ${customerName || 'N/A'}<br>
            📧 <b>Email:</b> ${customerEmail || 'N/A'}<br>
            📱 <b>Phone:</b> ${customerPhone || 'N/A'}
          </p>

          <p>
            💰 <b>Subtotal:</b> ₹${subtotal}<br>
            🚚 <b>Shipping:</b> ₹${shipping}<br>
            🎟️ <b>Discount:</b> ₹${discount}<br>
            <b>Total:</b> ₹${total}
          </p>

          <p>
            ⏳ <b>Payment Status:</b> Pending
          </p>

          <p>
            🔗 <a href="https://mithora.in/admin/orders">
              View in Admin Panel
            </a>
          </p>

          <p>— Mithora System</p>

        </div>
      `
    })
  });

  const emailText = await emailRes.text();
  console.log("📧 Admin Order Email:", emailText);

} catch (err) {
  console.error("❌ Admin order email error:", err);
}



  /* =========================
     5️⃣ RESPONSE
     ========================= */
  return jsonResponse({
    ok: true,
    order_id: orderId,
    order_no: orderNo,
    razorpay_key_id: env.RAZORPAY_KEY_ID,
    razorpay_order: {
      id: rp.id,
      amount: rp.amount,
      currency: rp.currency
    }
  });


}



async function verifyRazorpaySignature(secret, rawBody, receivedSignature) {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const mac = await crypto.subtle.sign("HMAC", key, rawBody);

  const expectedSignature = Array.from(new Uint8Array(mac))
    .map(b => b.toString(16).padStart(2, "0"))
    .join("");

  return expectedSignature === receivedSignature;
}


async function handleRazorpayWebhook(request, env) {
  const signature = request.headers.get("x-razorpay-signature");
  if (!signature) {
    return new Response("Missing signature", { status: 400 });
  }

  const rawBody = await request.arrayBuffer();

  const isValid = await verifyRazorpaySignature(
    env.RAZORPAY_WEBHOOK_SECRET,
    rawBody,
    signature
  );

  if (!isValid) {
    console.log("❌ INVALID RAZORPAY SIGNATURE");
    return new Response("Invalid signature", { status: 401 });
  }

  const event = JSON.parse(decoder.decode(rawBody));
  const eventType = event.event;

  const payment = event.payload?.payment?.entity;
  if (!payment?.order_id) return new Response("OK", { status: 200 });

const row = await env.DB.prepare(
  "SELECT id, user_id, payment_status FROM orders WHERE razorpay_order_id = ?"
).bind(payment.order_id).first();

  if (!row) return new Response("OK", { status: 200 });

if (row.payment_status === 'paid') {
  return new Response("OK", { status: 200 });
}


 /* =========================
   PAYMENT SUCCESS & BONUS COUPON ON ORDER
   ========================= */
if (eventType === "payment.captured" && row.payment_status !== "paid") {

  await env.DB.prepare(`
    UPDATE orders SET
      razorpay_payment_id = ?,
      razorpay_payment_status = ?,
      payment_status = 'paid',
      order_status = 'confirmed',
      updated_at = datetime('now')
    WHERE id = ?
  `).bind(payment.id, payment.status, row.id).run();

// Clear the customer's saved cart after successful payment
if (row.user_id) {
  await env.DB.prepare(`
    DELETE FROM carts
    WHERE user_id = ?
  `).bind(row.user_id).run();
}

  await env.DB.prepare(`
    INSERT INTO order_tracking (order_id, status, note)
    VALUES (?, ?, ?)
  `).bind(row.id, 'paid', 'Payment successful').run();

  // 🎁 START REFERRAL BONUS LOGIC
  try {
    // 1. Get the user details for this order (row.user_id now exists!)
    const buyer = await env.DB.prepare(
      "SELECT id, referred_by FROM users WHERE id = ?"
    ).bind(row.user_id).first();

    // 2. If they were referred, check if this is their first PAID order
    if (buyer && buyer.referred_by) {
      const orderCount = await env.DB.prepare(
        "SELECT COUNT(*) as count FROM orders WHERE user_id = ? AND payment_status = 'paid'"
      ).bind(buyer.id).first();

      // If count is 1, it means this is the very first order they just paid for
      if (orderCount.count === 1) {
        const referrerId = buyer.referred_by;

        // Create the ₹500 Bonus Coupon
        await createCouponForUser(
          env, 
          referrerId, 
          REFERRAL_CONFIG.referral_reward_referrer, 
          REFERRAL_CONFIG.referral_reward_referrer.prefix
        );

        // 🔔 NOTIFY THE REFERRER
        const referrer = await env.DB.prepare("SELECT email, name FROM users WHERE id = ?").bind(referrerId).first();
        if (referrer?.email) {
          await sendEmail(
            env,
            EMAIL_TYPES.ADMIN_ALERT,
            referrer.email,
            'You earned a ₹500 Bonus! 🎁',
            `<p>Hi ${referrer.name},</p>
             <p>Great news! Your friend just placed their first order.</p>
             <p>As a thank you, we've added a <b>₹500 Bonus Coupon</b> to your account.</p>
             <p>Check your profile to use it on your next meal! 🍲</p>`
          );
        }
        console.log(`✅ Referrer ${referrerId} rewarded for User ${buyer.id}'s first order.`);
      }
    }
  } catch (refErr) {
    console.error('Referral bonus failed', refErr);
  }
  // 🎁 END REFERRAL BONUS LOGIC

  // ✅ SEND PAYMENT SUCCESS EMAIL
// =========================
// ✅ CUSTOMER PAYMENT SUCCESS EMAIL
// =========================
try {
  const order = await env.DB.prepare(
    "SELECT order_no, customer_email, customer_name, amount_total FROM orders WHERE id = ?"
  ).bind(row.id).first();

  console.log("📦 Order fetched:", order);

  if (order?.customer_email) {

const amount = Number(order.amount_total || 0).toFixed(0);

    const emailRes = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "api-key": env.BREVO_API_KEY,
        "Content-Type": "application/json",
        "accept": "application/json"
      },
      body: JSON.stringify({
        to: [
          {
            email: order.customer_email,
            name: order.customer_name || "Customer"
          }
        ],

        sender: {
          email: env.ORDER_FROM_EMAIL,
          name: "Mithora Kitchen"
        },

        subject: `Payment Successful – Order Confirmed ${order.order_no}`,

        htmlContent: `
          <div style="font-family: Arial, sans-serif; background:#F7F7F0; padding:20px;">
            
            <div style="max-width:480px; margin:auto; background:#ffffff; border-radius:10px; padding:20px;">

              <p style="margin:0 0 10px;">Hi ${order.customer_name || 'there'},</p>

              <p style="margin:0 0 15px;">
                🎉 Your payment was successful and your order 
                <b>${order.order_no}</b> is now confirmed!
              </p>

              <!-- 💰 Amount -->
              <div style="background:#f9f9f9; padding:12px; border-radius:8px; margin-bottom:15px;">
                💰 <b>Amount Paid:</b> ₹${amount}
              </div>

              <!-- CTA -->
              <div style="text-align:center; margin:20px 0;">
                <a href="https://mithora.in/my-profile"
                   style="display:inline-block; padding:12px 20px; background:#000; color:#fff; font-weight:700; text-decoration:none; border-radius:6px;">
                  📦 Track Your Order
                </a>
              </div>

              <!-- Support -->
              <p style="margin:0 0 10px;">
                📲 Need help? WhatsApp us at 
                <a href="https://wa.me/918657427432">+91 86574 27432</a>
              </p>

              <!-- Footer -->
              <p style="margin-top:15px;">
                Thanks for choosing Mithora 😋<br>
                <b>— Team Mithora Kitchen</b>
              </p>

            </div>
          </div>
        `
      })
    });

    const emailText = await emailRes.text();
    console.log("📧 Customer Email Response:", emailText);

  } else {
    console.log("⚠️ No customer email found");
  }

} catch (e) {
  console.error("❌ Customer email error:", e);
}



// =========================
// 🚨 ADMIN ORDER RECEIVED ALERT (PAYMENT SUCCESS)
// =========================
try {

  const emailRes = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      "api-key": env.BREVO_API_KEY,
      "Content-Type": "application/json",
      "accept": "application/json"
    },
    body: JSON.stringify({
      to: [
        {
          email: "seeumithora@gmail.com",
          name: "Mithora Admin"
        }
      ],

      sender: {
        email: env.ADMIN_FROM_EMAIL || env.ORDER_FROM_EMAIL,
        name: "Mithora Kitchen"
      },

      subject: `✅ Order Received & Paid – ${order?.order_no}`,

      htmlContent: `
        <div style="font-family: Arial, sans-serif; background:#F7F7F0; padding:20px;">
          
          <div style="max-width:480px; margin:auto; background:#ffffff; border-radius:10px; padding:20px;">

            <p style="font-size:16px; margin-bottom:10px;">
              <b>✅ Order received successfully (Payment Done)</b>
            </p>

            <!-- Order Info -->
            <p>
              🧾 <b>Order No:</b> ${order?.order_no}<br>
              👤 <b>Customer:</b> ${order?.customer_name || 'N/A'}<br>
              📧 <b>Email:</b> ${order?.customer_email || 'N/A'}<br>
              📱 <b>Phone:</b> ${order?.customer_phone || 'N/A'}
            </p>

            <!-- Amount -->
            <div style="background:#f9f9f9; padding:12px; border-radius:8px; margin:10px 0;">
              💰 <b>Total Paid:</b> ₹${order?.amount_total || 0}
            </div>

            <!-- Breakdown -->
            <p style="font-size:13px; color:#555;">
              Subtotal: ₹${order?.subtotal || 0} <br>
              Shipping: ₹${order?.shipping || 0} <br>
              Discount: ₹${order?.discount || 0}
            </p>

            <!-- Status -->
            <p style="margin:10px 0;">
              💳 <b>Payment Status:</b> Paid ✅
            </p>

            <!-- CTA -->
            <div style="margin:20px 0;">
              <a href="https://mithora.in/admin/orders"
                 style="display:inline-block; background:#FFE300; color:#000; padding:10px 16px; text-decoration:none; border-radius:6px; font-weight:bold;">
                View Order
              </a>
            </div>

            <!-- Quick Actions -->
            <p>
              <a href="tel:+91${order?.customer_phone || ''}" style="margin-right:10px;">📞 Call</a>
              <a href="https://wa.me/91${order?.customer_phone || ''}?text=Regarding%20Order%20${order?.order_no}">
                💬 WhatsApp
              </a>
            </p>

            <p style="margin-top:15px;">
              — Mithora System
            </p>

          </div>
        </div>
      `
    })
  });

  const emailText = await emailRes.text();
  console.log("📧 Admin Paid Order Email:", emailText);

} catch (err) {
  console.error("❌ Admin order received email error:", err);
}

}

  /* =========================
     PAYMENT FAILED
     ========================= */
  if (eventType === "payment.failed") {
    await env.DB.prepare(`
      UPDATE orders SET
        payment_status = 'failed',
        order_status = 'payment_failed',
        updated_at = datetime('now')
      WHERE id = ?
    `).bind(row.id).run();

    await env.DB.prepare(`
      INSERT INTO order_tracking (order_id, status, note)
      VALUES (?, ?, ?)
    `).bind(row.id, 'payment_failed', 'Payment failed').run();


	  // ❌ SEND PAYMENT FAILED EMAIL
try {
  const order = await env.DB.prepare(
    "SELECT order_no, customer_email, customer_name FROM orders WHERE id = ?"
  ).bind(row.id).first();

  if (order?.customer_email) {
    await sendEmail(
      env,
      EMAIL_TYPES.ORDER,
      order.customer_email,
      `Payment Failed – Order ${order.order_no}`,
      `
      <p>Hi ${order.customer_name || 'there'},</p>

      <p>
        ❌ Unfortunately, your payment for order
        <b>${order.order_no}</b> did not go through.
      </p>

      <p>
        Don’t worry — your order is saved.
        Please retry payment to complete it.
      </p>

      <p style="margin:20px 0;">
        <a href="https://mithora.in/my-profile"
           style="display:inline-block;
                  padding:12px 20px;
                  background:#FFE300;
                  color:#000;
                  font-weight:700;
                  text-decoration:none;
                  border-radius:6px;">
          🔁 Retry Payment
        </a>
      </p>

      <p>
        📲 Need help? WhatsApp us:
        <a href="https://wa.me/918657427432">+91 86574 27432</a>
      </p>

      <p>
        <b>— Team Mithora Kitchen</b>
      </p>
      `
    );
  }
} catch (e) {
  console.error('Payment failed email error', e);
}
  }




  return new Response("OK", { status: 200 });
}







/* =========================
   ADMIN ROUTES
   ========================= */

async function requireAdmin(request, env) {
  // 1️⃣ ADMIN_KEY (trimmed, safest)
  const headerKey = request.headers.get('x-admin-key');
  if (headerKey && env.ADMIN_KEY && headerKey.trim() === env.ADMIN_KEY.trim()) {
    return { ok: true, admin: { id: 0, via: 'admin_key' } };
  }

  // 2️⃣ JWT fallback
  const auth = request.headers.get('Authorization');
  if (auth && auth.startsWith('Bearer ')) {
    const token = auth.slice(7);
    const payload = await verifyJWT(token, env.JWT_SECRET);
    if (payload && payload.is_admin) {
      return { ok: true, admin: payload };
    }
  }

  return { ok: false };
}


async function handleAdminRoutes(request, env) {
  const auth = await requireAdmin(request, env);
  if (!auth.ok) return jsonResponse({ error: 'Unauthorized' }, 401);

  const url = new URL(request.url);
  const path = url.pathname.replace('/api/admin','') || '/';
  const method = request.method;

  // Example: LIST products GET /api/admin/products
  if (method === 'GET' && path === '/products') {
    const res = await env.DB.prepare('SELECT p.*, c.name as category_name FROM products p LEFT JOIN categories c ON p.category_id = c.id ORDER BY p.id DESC').all();
    return jsonResponse({ products: res.results || [] });
  }

  // CREATE product POST /api/admin/products body: { sku, name, description, category_id, image_path }
  if (method === 'POST' && path === '/products') {
    const body = await jsonBody(request);
    const r = await env.DB.prepare('INSERT INTO products (sku, name, description, category_id, image_path, created_at) VALUES (?, ?, ?, ?, ?, datetime(\'now\'))').bind(body.sku || null, body.name, body.description || null, body.category_id || null, body.image_path || null).run();
    return jsonResponse({ ok: true, id: r.lastInsertRowId });
  }

  // UPDATE product PUT /api/admin/products/:id
  if (method === 'PUT' && path.startsWith('/products/')) {
    const id = path.split('/')[2];
    const body = await jsonBody(request);
    await env.DB.prepare('UPDATE products SET sku=?, name=?, description=?, category_id=?, image_path=?, is_active=? WHERE id=?')
      .bind(body.sku||null, body.name, body.description||null, body.category_id||null, body.image_path||null, body.is_active?1:0, id).run();
    return jsonResponse({ ok: true });
  }

  // CRUD for variants
  if (method === 'GET' && path.startsWith('/variants')) {
    const res = await env.DB.prepare('SELECT * FROM product_variants ORDER BY id DESC').all();
    return jsonResponse({ variants: res.results || [] });
  }
  if (method === 'POST' && path === '/variants') {
    const b = await jsonBody(request);
    const r = await env.DB.prepare('INSERT INTO product_variants (product_id, variant_name, price, old_price, ship_type, weight_grams, length_cm, width_cm, height_cm, stock, max_per_order, slot_type, next_day_delivery, available_from_time, available_to_time, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime(\'now\'))')
      .bind(b.product_id, b.variant_name,b.price||0,b.old_price||null,b.ship_type||'local',b.weight_grams||0,b.length_cm||0,b.width_cm||0,b.height_cm||0,b.stock||0,b.max_per_order||0,b.slot_type||'none',b.next_day_delivery?1:0,b.available_from_time||null,b.available_to_time||null).run();
    return jsonResponse({ ok:true, id: r.lastInsertRowId });
  }
  if (method === 'PUT' && path.startsWith('/variants/')) {
    const id = path.split('/')[2]; const b = await jsonBody(request);
    await env.DB.prepare('UPDATE product_variants SET variant_name=?, price=?, old_price=?, ship_type=?, weight_grams=?, length_cm=?, width_cm=?, height_cm=?, stock=?, max_per_order=?, slot_type=?, next_day_delivery=?, available_from_time=?, available_to_time=?, is_active=? WHERE id=?')
      .bind(b.variant_name,b.price||0,b.old_price||null,b.ship_type||'local',b.weight_grams||0,b.length_cm||0,b.width_cm||0,b.height_cm||0,b.stock||0,b.max_per_order||0,b.slot_type||'none',b.next_day_delivery?1:0,b.available_from_time||null,b.available_to_time||null,b.is_active?1:0,id).run();
    return jsonResponse({ ok:true });
  }

  // JAIPUR AREAS CRUD
  if (method === 'GET' && path === '/jaipur/areas') {
    const r = await env.DB.prepare('SELECT * FROM jaipur_area_shipping ORDER BY area_name').all();
    return jsonResponse({ areas: r.results || [] });
  }
  if (method === 'POST' && path === '/jaipur/areas') {
    const b = await jsonBody(request);
    const r = await env.DB.prepare('INSERT INTO jaipur_area_shipping (area_name, shipping_charge, min_order_amount, delivery_time_estimate, created_at) VALUES (?, ?, ?, ?, datetime(\'now\'))').bind(b.area_name, b.shipping_charge||0, b.min_order_amount||0, b.delivery_time_estimate||null).run();
    return jsonResponse({ ok:true, id: r.lastInsertRowId });
  }
  if (method === 'PUT' && path.startsWith('/jaipur/areas/')) {
    const id = path.split('/')[3]; const b = await jsonBody(request);
    await env.DB.prepare('UPDATE jaipur_area_shipping SET area_name=?, shipping_charge=?, min_order_amount=?, delivery_time_estimate=?, is_active=? WHERE id=?')
      .bind(b.area_name,b.shipping_charge||0,b.min_order_amount||0,b.delivery_time_estimate||null,b.is_active?1:0,id).run();
    return jsonResponse({ ok:true });
  }

  // SHIPPING ZONES CRUD
  if (method === 'GET' && path === '/shipping/zones') {
    const r = await env.DB.prepare('SELECT * FROM shipping_zones ORDER BY id').all();
    return jsonResponse({ zones: r.results || [] });
  }
  if (method === 'POST' && path === '/shipping/zones') {
    const b = await jsonBody(request);
    const r = await env.DB.prepare('INSERT INTO shipping_zones (name, states, base_first_500g, extra_500g, oda, is_active, created_at) VALUES (?, ?, ?, ?, ?, ?, datetime(\'now\'))')
      .bind(b.name, JSON.stringify(b.states||[]), b.base_first_500g||0, b.extra_500g||0, b.oda?1:0, b.is_active?1:1).run();
    return jsonResponse({ ok:true, id: r.lastInsertRowId });
  }
  if (method === 'PUT' && path.startsWith('/shipping/zones/')) {
    const id = path.split('/')[3]; const b = await jsonBody(request);
    await env.DB.prepare('UPDATE shipping_zones SET name=?, states=?, base_first_500g=?, extra_500g=?, oda=?, is_active=? WHERE id=?')
      .bind(b.name, JSON.stringify(b.states||[]), b.base_first_500g||0, b.extra_500g||0, b.oda?1:0, b.is_active?1:1, id).run();
    return jsonResponse({ ok:true });
  }

  // COUPONS CRUD
  if (method === 'GET' && path === '/coupons') {
    const r = await env.DB.prepare('SELECT * FROM coupons ORDER BY id DESC').all();
    return jsonResponse({ coupons: r.results || [] });
  }
  if (method === 'POST' && path === '/coupons') {
    const b = await jsonBody(request);
    const r = await env.DB.prepare('INSERT INTO coupons (code, discount_type, discount_value, min_order_amount, valid_from, valid_to, is_active, user_specific, allowed_user_ids, item_specific, allowed_variant_ids, usage_limit, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime(\'now\'))')
      .bind(b.code, b.discount_type, b.discount_value||0, b.min_order_amount||0, b.valid_from||null, b.valid_to||null, b.is_active?1:1, b.user_specific?1:0, JSON.stringify(b.allowed_user_ids||[]), b.item_specific?1:0, JSON.stringify(b.allowed_variant_ids||[]), b.usage_limit||null).run();
    return jsonResponse({ ok:true, id: r.lastInsertRowId });
  }
  if (method === 'PUT' && path.startsWith('/coupons/')) {
    const id = path.split('/')[2]; const b = await jsonBody(request);
    await env.DB.prepare('UPDATE coupons SET code=?, discount_type=?, discount_value=?, min_order_amount=?, valid_from=?, valid_to=?, is_active=?, user_specific=?, allowed_user_ids=?, item_specific=?, allowed_variant_ids=?, usage_limit=? WHERE id=?')
      .bind(b.code,b.discount_type,b.discount_value||0,b.min_order_amount||0,b.valid_from||null,b.valid_to||null,b.is_active?1:0,b.user_specific?1:0,JSON.stringify(b.allowed_user_ids||[]),b.item_specific?1:0,JSON.stringify(b.allowed_variant_ids||[]),b.usage_limit||null,id).run();
    return jsonResponse({ ok:true });
  }

  // ORDERS list & update
  if (method === 'GET' && path === '/orders') {
    const q = await env.DB.prepare('SELECT * FROM orders ORDER BY id DESC LIMIT 200').all();
    return jsonResponse({ orders: q.results || [] });
  }
  if (method === 'PUT' && path.startsWith('/orders/')) {
    const id = path.split('/')[2]; const b = await jsonBody(request);
    if (b.order_status) {
      await env.DB.prepare('UPDATE orders SET order_status = ? WHERE id = ?').bind(b.order_status, id).run();
      await env.DB.prepare('INSERT INTO order_tracking (order_id, status, note, created_at) VALUES (?, ?, ?, datetime(\'now\'))').bind(id, b.order_status, b.note || 'status updated').run();
    }
    return jsonResponse({ ok:true });
  }

  // Users list
  if (method === 'GET' && path === '/users') {
    const r = await env.DB.prepare('SELECT id, name, email, phone, is_admin, created_at FROM users ORDER BY id DESC LIMIT 500').all();
    return jsonResponse({ users: r.results || [] });
  }

  return jsonResponse({ error: 'Admin route not implemented' }, 404);
}



/* =========================
   Subscriptions cron processor
   ========================= */

async function handleProcessSubscriptions(request, env) {
  // Should be called by Cloudflare Cron trigger (or scheduled HTTP call).
  // Process small batch of due subscriptions
  const today = new Date().toISOString().split('T')[0];
  const res = await env.DB.prepare('SELECT s.*, u.email, u.id as user_id, pv.price, pv.product_id FROM subscriptions s JOIN users u ON s.user_id = u.id JOIN product_variants pv ON s.variant_id = pv.id WHERE s.status = ? AND date(s.next_delivery_date) <= date(?) LIMIT 50').bind('active', today).all();
  const subs = res.results || [];
  for (const s of subs) {
    try {
      // create an order for the subscription instance -- simple flow: no razorpay auto-charge (can extend)
      const orderNo = 'SUB' + Date.now() + Math.floor(Math.random()*1000);
      const validatedCartItems = [{ variant_id: s.variant_id, qty: 1, price: s.price, line_total: s.price }];
      const subtotal = parseFloat(s.price||0);
      const shipping = 0; // subscriptions assumed local tiffin - shipping handled by local rules; for now 0 or compute based on user's default address
      const total = subtotal + shipping;
      const insert = await env.DB.prepare('INSERT INTO orders (order_no, user_id, cart_snapshot, address_snapshot, customer_name, customer_email, customer_phone, amount_subtotal, shipping_amount, discount_amount, amount_total, order_status, payment_status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime(\'now\'))')
        .bind(orderNo, s.user_id, JSON.stringify(validatedCartItems), '{}', null, s.email||null, null, subtotal, shipping, 0, total, 'created', 'pending').run();
      const orderId = insert.lastInsertRowId;
      await env.DB.prepare('INSERT INTO order_items (order_id, variant_id, product_id, name, variant_name, qty, price_per_unit, total_price, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime(\'now\'))').bind(orderId, s.variant_id, s.product_id, 'Subscription item', '', 1, s.price, s.price).run();

      // update next_delivery_date based on frequency
      let next = new Date(s.next_delivery_date);
      if (s.frequency === 'daily') next.setDate(next.getDate() + 1);
      else if (s.frequency === 'weekly') next.setDate(next.getDate() + 7);
      else if (s.frequency === 'monthly') next.setMonth(next.getMonth() + 1);
      else next.setDate(next.getDate()+1);
      await env.DB.prepare('UPDATE subscriptions SET next_delivery_date = ?, updated_at = datetime(\'now\') WHERE id = ?').bind(next.toISOString().split('T')[0], s.id).run();
      // optionally send email to user
      try { await sendEmail(env, s.email, `Subscription order created ${orderNo}`, `<p>Your subscription order ${orderNo} is created for ${s.next_delivery_date}.</p>`); } catch(e) {}
    } catch (e) {
      console.error('Error processing subscription', e);
    }
  }
  return jsonResponse({ ok: true, processed: subs.length });
}