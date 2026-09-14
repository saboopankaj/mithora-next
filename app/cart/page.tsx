"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getAuthToken, getCurrentUser } from "@/lib/auth";
import { useAuth } from "@/components/auth/AuthContext";
import { useCart } from "@/components/cart/CartProvider";
import { fetchAddresses, setDefaultAddress, createCheckoutOrder } from "@/lib/order";
import type { Address, Customer } from "@/components/cart/types";
import CartItem from "@/components/cart/CartItem";
import CartSummary from "@/components/cart/CartSummary";
import DeliveryAddress from "@/components/cart/DeliveryAddress";
import AddressForm from "@/components/cart/AddressForm";
import AddressPicker from "@/components/cart/AddressPicker";
import DistanceChargeModal from "@/components/cart/DistanceChargeModal";
import PaymentFooter from "@/components/cart/PaymentFooter";

declare global { interface Window { Razorpay?: new (options: Record<string, unknown>) => { open:()=>void }; } }
function loadRazorpay(){return new Promise<void>((resolve,reject)=>{if(window.Razorpay)return resolve();const existing=document.querySelector<HTMLScriptElement>('script[src="https://checkout.razorpay.com/v1/checkout.js"]');if(existing){existing.addEventListener('load',()=>resolve(),{once:true});existing.addEventListener('error',()=>reject(new Error('Razorpay failed to load.')),{once:true});return;}const script=document.createElement('script');script.src='https://checkout.razorpay.com/v1/checkout.js';script.async=true;script.onload=()=>resolve();script.onerror=()=>reject(new Error('Razorpay failed to load.'));document.body.appendChild(script);});}

export default function CartPage(){
 const router=useRouter(); const {isAuthenticated,openAuth}=useAuth(); const {cart,validatedCart,validate,pincode,setPincode,clear}=useCart();
 const [addresses,setAddresses]=useState<Address[]>([]);
const [selected,setSelected]=useState<Address|null>(null);
const [addressServiceable,setAddressServiceable]=useState<boolean|null>(null);
const [pickerOpen,setPickerOpen]=useState(false);
const [formOpen,setFormOpen]=useState(false);
const [distanceOpen,setDistanceOpen]=useState(false);
const [paymentLoading,setPaymentLoading]=useState(false);
const [error,setError]=useState("");
 const loadAddresses=useCallback(async()=>{if(!isAuthenticated)return null;const result=await fetchAddresses();const list=Array.isArray(result)?result:(result.addresses||[]);setAddresses(list);const currentPin=pincode;const chosen=(currentPin&&list.find(a=>String(a.pincode||a.pin||'')===currentPin))||list.find(a=>!!a.is_default)||list[0]||null;setSelected(chosen);return chosen;},[isAuthenticated,pincode]);
 useEffect(()=>{if(!isAuthenticated){setAddresses([]);setSelected(null);return;}void loadAddresses().catch(e=>setError(e instanceof Error?e.message:'Unable to load addresses.'));},[isAuthenticated,loadAddresses]);
 useEffect(()=>{if(!isAuthenticated||!selected)return;const pin=String(selected.pincode||selected.pin||'').replace(/\D/g,'').slice(0,6);if(pin.length!==6)return;if(pin!==pincode)setPincode(pin,String(selected.area||selected.area_name||''));void (async()=>{const r=await validate(selected);if(r.validatedCart?.is_external_zone)setDistanceOpen(true);})();},[selected,isAuthenticated,pincode,setPincode,validate]);
 useEffect(() => {
  if (!isAuthenticated || !selected) {
    setAddressServiceable(null);
    return;
  }

  const pin = String(selected.pincode || selected.pin || "")
    .replace(/\D/g, "")
    .slice(0, 6);

  if (pin.length !== 6) {
    setAddressServiceable(false);
    return;
  }

  let cancelled = false;

  void fetch(`/api/pincode/${pin}/areas`)
    .then(async (response) => {
      if (!response.ok) {
        throw new Error("Unable to check delivery serviceability.");
      }

      return response.json();
    })
    .then((data) => {
      if (cancelled) return;

      const serviceable =
        data?.pincode_status === "active" &&
        Array.isArray(data?.areas) &&
        data.areas.length > 0;

      setAddressServiceable(serviceable);
    })
    .catch(() => {
      if (!cancelled) {
        setAddressServiceable(false);
      }
    });

  return () => {
    cancelled = true;
  };
}, [selected, isAuthenticated]);
 const cartValidationKey = cart.items
  .map((item) => `${item.variant_id}:${item.qty}`)
  .join("|") + `|coupon:${cart.coupon_code || ""}`;

  useEffect(() => {
  if (!isAuthenticated || selected || !cart.items.length) {
    return;
  }

  void validate();
}, [
  isAuthenticated,
  selected,
  cartValidationKey,
  validate,
]);

useEffect(() => {
  if (!isAuthenticated || !selected || !/^\d{6}$/.test(pincode)) {
    return;
  }

  void (async () => {
    const r = await validate(selected);

    if (r.validatedCart?.is_external_zone) {
      setDistanceOpen(true);
    }
  })();
}, [
  cartValidationKey,
  isAuthenticated,
  selected,
  pincode,
  validate,
]);
 if(!cart.items.length)return <main className="mk-cart-page"><header className="mk-cart-page-header"><button type="button" onClick={()=>router.back()} aria-label="Back">←</button><h1>Your Cart</h1><span/></header><section className="mk-cart-empty-page"><div className="mk-cart-empty-icon">🛒</div><h2>Your cart is empty</h2><p>Add something delicious from the Mithora menu.</p><Link href="/menu" className="mk-primary-button">BROWSE MENU</Link></section></main>;
 async function chooseAddress(address:Address){setSelected(address);setPickerOpen(false);setError("");const pin=String(address.pincode||address.pin||'').replace(/\D/g,'').slice(0,6);if(pin.length!==6){setError('This address does not have a valid pincode.');return;}setPincode(pin,String(address.area||address.area_name||''));const r=await validate(address);if(!r.validatedCart)setError(r.error||r.message||'Unable to calculate delivery.');if(r.validatedCart?.is_external_zone)setDistanceOpen(true);}
 function addAddress(){setPickerOpen(false);setFormOpen(true);setError("");}
 async function saveNewAddress(address:Address){setAddresses(current=>address.id!=null&&current.some(a=>String(a.id)===String(address.id))?current.map(a=>String(a.id)===String(address.id)?address:a):[...current,address]);setFormOpen(false);await chooseAddress(address);}
 async function makeDefault(id:number|string){try{await setDefaultAddress(id);await loadAddresses();}catch(e){setError(e instanceof Error?e.message:'Unable to set default address.');}}
 async function placeOrder(){if(!isAuthenticated){openAuth('mobile');return;}if(!selected?.id){setError('Please select a delivery address.');return;}if(!/^\d{6}$/.test(pincode)){setError('Please add a valid delivery address first.');return;}
 if(!validatedCart){setError('Please wait while your delivery charges are calculated.');
  return;}
  setPaymentLoading(true);setError("");try{const result = await createCheckoutOrder({
  items: cart.items,
  coupon_code: cart.coupon_code || '',
  address_id: selected.id,
  validatedCart
});const order=result.order||result.razorpay_order;const key=result.key||result.razorpay_key_id;if(!order?.id||!key)throw new Error('Payment order could not be created.');await loadRazorpay();if(!window.Razorpay)throw new Error('Razorpay is not available.');const customer:Customer={name:selected.full_name||selected.name,phone:selected.phone,email:getCurrentUser()?.email};const razorpay=new window.Razorpay({key,amount:order.amount,currency:order.currency||'INR',order_id:order.id,name:'Mithora Kitchen',description:'Mithora Kitchen Order',prefill:{name:customer.name||'',email:customer.email||'',contact:customer.phone||''},theme:{color:'#FF6B35'},handler:(payment:{razorpay_payment_id?:string})=>{clear();const params=new URLSearchParams();params.set('order_id',order.id);if(result.order_no)params.set('order_no',String(result.order_no));if(payment.razorpay_payment_id)params.set('payment_id',payment.razorpay_payment_id);router.replace(`/order-success?${params.toString()}`);},modal:{ondismiss:()=>setPaymentLoading(false)}});razorpay.open();}catch(e){setError(e instanceof Error?e.message:'Payment could not be started.');setPaymentLoading(false);}}
 const canPlaceOrder =
  !!isAuthenticated &&
  !!selected?.id &&
  addressServiceable === true &&
  /^\d{6}$/.test(pincode) &&
  !!validatedCart &&
  !formOpen &&
  !paymentLoading;
 return <main className="mk-cart-page"><header className="mk-cart-page-header"><button type="button" onClick={()=>router.back()} aria-label="Back">←</button><h1>Review & Place Order</h1><Link href="/menu" aria-label="Add more items">＋</Link></header><div className="mk-cart-layout"><div className="mk-cart-main-column"><DeliveryAddress
  address={selected}
  isAuthenticated={isAuthenticated}
  onLogin={()=>openAuth('mobile')}
  onChange={()=>setPickerOpen(true)}
  onAdd={addAddress}
/>

{isAuthenticated && selected && addressServiceable === false && (
  <div className="mk-address-not-serviceable">
    ⚠️ Not deliverable to this address
    <button type="button" onClick={() => setPickerOpen(true)}>
      Change Address
    </button>
  </div>
)}{isAuthenticated&&formOpen&&<section className="mk-cart-address-card"><div className="mk-cart-section-heading"><div><span className="mk-cart-eyebrow">NEW ADDRESS</span><h2>Add delivery address</h2></div></div><AddressForm initial={null} onSaved={saveNewAddress} onCancel={()=>setFormOpen(false)}/></section>}<section className="mk-cart-items-section"><div className="mk-cart-section-heading"><div><span className="mk-cart-eyebrow">YOUR ORDER</span><h2>{cart.items.reduce((s,i)=>s+i.qty,0)} items</h2></div></div>{validatedCart?.items?.length ? (
  <div className="mk-cart-items">
    {validatedCart.items.map(item => {
      const localItem = cart.items.find(
        local =>
          String(local.variant_id) ===
          String(item.variant_id)
      );

      if (!localItem) return null;

      return (
        <CartItem
          key={String(item.variant_id)}
          item={{
            ...item,
            qty: localItem.qty,
            line_total:
              Number(item.price || 0) *
              localItem.qty,
          }}
        />
      );
    })}
  </div>
) : isAuthenticated && selected ? (
  <div className="mk-cart-validation-loading">
    Calculating your delivery…
  </div>
) : (
  <div className="mk-cart-validation-loading">
    {isAuthenticated
      ? "Add a delivery address to see your total."
      : "Login to review your cart."}
  </div>
)}<Link href="/menu" className="mk-add-more">+ Add more items</Link></section>{error&&<div className="mk-checkout-error">{error}</div>}</div><aside className="mk-cart-side-column"><CartSummary onLogin={()=>openAuth('mobile')} onAddAddress={addAddress} onPlaceOrder={placeOrder} canPlaceOrder={canPlaceOrder} paymentLoading={paymentLoading} addressReady={!!selected}/></aside></div><PaymentFooter total={validatedCart?.total||0} disabled={!canPlaceOrder} loading={paymentLoading} onPay={placeOrder}/><AddressPicker open={pickerOpen} addresses={addresses} selectedId={selected?.id} onClose={()=>setPickerOpen(false)} onSelect={chooseAddress} onAdd={addAddress} onSetDefault={makeDefault}/><DistanceChargeModal open={distanceOpen} onClose={()=>setDistanceOpen(false)} validatedCart={validatedCart}/></main>;
}
