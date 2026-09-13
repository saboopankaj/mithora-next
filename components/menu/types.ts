export type Category = {
  id: number | string;
  name: string;
  icon_svg?: string;
  [key: string]: unknown;
};

export type Variant = {
  id: number | string;
  variant_name?: string;
  description?: string;
  price?: number | string;
  old_price?: number | string | null;
  [key: string]: unknown;
};

export type Product = {
  id: number | string;
  category_id: number | string;
  name: string;
  description?: string;
  image_path?: string;
  avg_rating?: number | string;
  review_count?: number | string;
  is_featured?: number | boolean | string;
  variants?: Variant[];
  [key: string]: unknown;
};

export type CategoryAvailability = {
  category_id: number | string;
  status?: string;
  orderable_now?: boolean;
  delivery_type?: string;
  user_message?: string;
  [key: string]: unknown;
};

export type CartItem = {
  variant_id: number | string;
  qty: number;
};

export type Cart = {
  items: CartItem[];
  coupon_code?: string;
};