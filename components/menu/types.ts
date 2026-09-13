export type Category = {
  id: number | string;
  name: string;
  image_path?: string | null;
  icon_svg?: string | null;

  slot_wise?: number;
  prep_time_minutes?: number;
  delivery_time_minutes?: number;
  shipping_type?: string;
  next_day_delivery?: number;
  subscription_allowed?: number;
};

export type Variant = {
  id: number | string;
  variant_name?: string;
  description?: string;
  price?: number | string;
  old_price?: number | string | null;
  [key: string]: unknown;
};

export type ProductBadge = {
  id: number | string;
  name: string;
  slug: string;
  display_text: string;
  icon?: string | null;
  priority?: number;
};

export type ProductTag = {
  id: number | string;
  name: string;
  slug: string;
};

export type Product = {
  id: number | string;
  name: string;
  description?: string | null;
  image_path?: string | null;
  category_id: number | string;

  category_name?: string | null;

  avg_rating?: number | null;
  review_count?: number | null;

  is_featured?: number | boolean;

 variants?: Variant[];

  badges?: ProductBadge[];
  tags?: ProductTag[];
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