export type Address = {
  id?: number | string;
  user_id?: number | string;
  full_name?: string;
  name?: string;
  phone?: string;
  house_flat?: string;
  house?: string;
  street?: string;
  landmark?: string;
  area?: string;
  area_name?: string;
  city?: string;
  state?: string;
  pincode?: string;
  pin?: string;
  is_default?: number | boolean;
  [key: string]: unknown;
};

export type Customer = { name?: string; phone?: string; email?: string };

export type CartItem = {
  variant_id: number | string;
  qty: number;
};

export type ValidatedCartItem = {
  variant_id: number | string;
  product_id: number | string;
  name: string;
  variant_name?: string | null;
  image_path?: string | null;
  qty: number;
  price: number;
  line_total: number;
  available?: boolean;
  price_changed?: boolean;
  old_price?: number | null;
  availability_reason?: string | null;
};

export type CartLocationInfo = {
  city?: string | null;
  state?: string | null;
  area?: string | null;
  area_name?: string | null;
  min_order_free_delivery?: number;
  [key: string]: unknown;
};

export type CouponInfo = {
  status?: string;
  message?: string;
  applied_code?: string | null;
  code?: string | null;
  [key: string]: unknown;
};

export type ValidatedCart = {
  items: ValidatedCartItem[];
  subtotal: number;
  shipping: number;
  discount: number;
  total: number;
  is_free_delivery?: boolean;
  free_delivery_min?: number;
  free_delivery_remaining?: number;
  is_external_zone?: boolean;
  pincode_status?: string | null;
  location_info?: CartLocationInfo | null;
  coupon_info?: CouponInfo | null;
  distance_charge?: number;
  delivery_charge_type?:
    | "PINCODE"
    | "CUSTOMER_PAY"
    | "INCLUDED"
    | "CATEGORY_FREE"
    | "PINCODE_FREE"
    | string;
  delivery_message?: string | null;
  delivery_free_category?: {
    category_id?: number | string | null;
    category_name?: string | null;
    threshold?: number;
    category_subtotal?: number;
  } | null;
  [key: string]: unknown;
};

export type CartSyncResponse = {
  success?: boolean;
  validatedCart?: ValidatedCart;
  error?: string;
  message?: string;
  changes?: CartValidationChange[];
};

export type CartValidationChange = {
  variant_id: number | string;
  name: string;
  type: "price" | "unavailable";
  oldPrice?: number;
  newPrice?: number;
  reason?: string;
};

export type CartValidationNotice = {
  changes: CartValidationChange[];
};

export type CartStorage = {
  items: CartItem[];
  coupon_code: string;
};

export type PincodeSuggestion = {
  pincode?: string;
  pin?: string;
  area?: string;
  area_name?: string;
  city?: string;
  state?: string;
  [key: string]: unknown;
};

export type Coupon = {
  id?: number | string;
  code: string;
  description?: string;
  discount_type?: string;
  discount_value?: number;
  discount?: number;
  min_order?: number;
  min_order_value?: number;
  [key: string]: unknown;
};
