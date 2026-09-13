import { apiFetch } from "./api";
import type { Address } from "../components/checkout/types";
import type { ValidatedCart } from "../components/cart/types";

export async function fetchAddresses() {
  return apiFetch<{ addresses?: Address[] }>("/api/user/addresses");
}

export async function createAddress(address: Partial<Address>) {
  return apiFetch<{ success?: boolean; address?: Address }>(
    "/api/user/addresses",
    {
      method: "POST",
      body: JSON.stringify(address),
    },
  );
}

export async function setDefaultAddress(id: number | string) {
  return apiFetch<{ success?: boolean }>(
    `/api/user/addresses/${encodeURIComponent(String(id))}/set-default`,
    { method: "PATCH" },
  );
}

export async function createCheckoutOrder(payload: {
  validatedCart: ValidatedCart;
  address: Address;
  customer?: unknown;
}) {
  return apiFetch<{
    success?: boolean;
    key?: string;
    order?: {
      id: string;
      amount: number;
      currency?: string;
    };
    order_no?: string;
  }>("/api/checkout/create-order", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
