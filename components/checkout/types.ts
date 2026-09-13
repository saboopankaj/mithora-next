export type Address = {
  id?: number | string;
  user_id?: number | string;
  full_name?: string;
  name?: string;
  phone?: string;
  pincode?: string;
  pin?: string;
  area?: string;
  area_name?: string;
  house_flat?: string;
  house?: string;
  street?: string;
  landmark?: string;
  city?: string;
  state?: string;
  is_default?: boolean;
  [key: string]: unknown;
};

export type Customer = {
  name?: string;
  phone?: string;
  email?: string;
  [key: string]: unknown;
};
