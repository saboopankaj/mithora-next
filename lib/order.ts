import { apiFetch } from "./api";
import type { Address, Customer } from "../components/cart/types";

export async function fetchAddresses() {
  return apiFetch<{ addresses?: Address[] } | Address[]>("/api/user/addresses");
}

export async function createAddress(address: Partial<Address>) {
  return apiFetch<{ success?: boolean; id?: number | string; address?: Address }>("/api/user/addresses", { method: "POST", body: JSON.stringify(address) });
}

export async function setDefaultAddress(id: number | string) {
  return apiFetch<{ success?: boolean }>(`/api/user/addresses/${encodeURIComponent(String(id))}/set-default`, { method: "PATCH" });
}

export async function createCheckoutOrder(payload: {
  items: { variant_id: number | string; qty: number }[];
  coupon_code?: string;
  address_id: number | string;
  customer?: Customer;
}) {
  return apiFetch<{
    success?: boolean; ok?: boolean;
    key?: string; razorpay_key_id?: string;
    order?: { id: string; amount: number; currency?: string };
    razorpay_order?: { id: string; amount: number; currency?: string };
    order_no?: string; order_id?: number | string;
  }>("/api/checkout/create-order", { method: "POST", body: JSON.stringify(payload) });
}
