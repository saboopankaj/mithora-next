"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import { createAddress } from "@/lib/order";
import type { Address } from "./types";

type Props = {
  initial?: Address | null;
  onSaved: (address: Address) => void;
  onCancel?: () => void;
};

export default function AddressForm({ initial, onSaved, onCancel }: Props) {
  const [form, setForm] = useState<Address>(initial || {});
  const [areas, setAreas] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [detecting, setDetecting] = useState(false);
  const [pinChecking, setPinChecking] = useState(false);
  const [pinValid, setPinValid] = useState(/^\d{6}$/.test(String(initial?.pincode || initial?.pin || "")));
  const [error, setError] = useState("");

  useEffect(() => {
    setForm(initial || {});
    setPinValid(/^\d{6}$/.test(String(initial?.pincode || initial?.pin || "")));
  }, [initial]);

  function update<K extends keyof Address>(key: K, value: Address[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function handlePincode(pin: string) {
    update("pincode", pin);
    setPinValid(false);
    setAreas([]);
    setError("");
    if (!/^\d{6}$/.test(pin)) return;

    setPinChecking(true);
    try {
      const result = await apiFetch<unknown>(`/api/pincode/${pin}`);
      const data = result && typeof result === "object" ? result as Record<string, unknown> : {};
      const serviceable = data.serviceable ?? data.is_serviceable ?? data.active ?? true;
      if (serviceable === false) {
        setError("Delivery is currently unavailable for this pincode.");
        return;
      }
      const nextAreas = Array.isArray(data.areas)
        ? data.areas.map(String)
        : Array.isArray(data.area_options) ? data.area_options.map(String) : [];
      setAreas(nextAreas);
      if (data.city) update("city", String(data.city));
      if (data.state) update("state", String(data.state));
      if (data.area || data.area_name) update("area", String(data.area || data.area_name));
      setPinValid(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to validate pincode.");
    } finally {
      setPinChecking(false);
    }
  }

  async function useLocation() {
    if (!navigator.geolocation) {
      setError("Location is not supported by this browser.");
      return;
    }
    setDetecting(true);
    setError("");
    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        try {
          const result = await apiFetch<unknown>(`/api/location/google-geocode?lat=${coords.latitude}&lng=${coords.longitude}`);
          const data = result && typeof result === "object" ? result as Record<string, unknown> : {};
          const pin = String(data.pincode || data.postal_code || data.zip || "").replace(/\D/g, "").slice(0, 6);
          if (!pin) throw new Error("Could not detect a valid pincode from your location.");
          setForm((current) => ({
            ...current,
            pincode: pin,
            area: String(data.area || data.area_name || data.locality || current.area || ""),
            city: String(data.city || current.city || ""),
            state: String(data.state || current.state || ""),
          }));
          await handlePincode(pin);
        } catch (err) {
          setError(err instanceof Error ? err.message : "Location lookup failed.");
        } finally {
          setDetecting(false);
        }
      },
      () => {
        setDetecting(false);
        setError("Location permission was not available.");
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    if (!pinValid || !/^\d{6}$/.test(String(form.pincode || ""))) {
      setError("Please enter or detect a valid serviceable pincode first.");
      return;
    }
    if (!form.full_name && !form.name) return setError("Please enter your full name.");
    if (!form.phone) return setError("Please enter your phone number.");
    if (!form.house_flat && !form.house) return setError("Please enter your house / flat.");
    if (!form.area && !form.area_name) return setError("Please enter or select your area.");

    setLoading(true);
    try {
      const result = await createAddress({
        name: form.full_name || form.name,
        phone: form.phone,
        house: form.house_flat || form.house,
        street: form.street,
        landmark: form.landmark,
        area: form.area || form.area_name,
        city: form.city,
        state: form.state,
        pincode: form.pincode || form.pin,
      });
      onSaved(result.address || { ...form, id: result.id });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save address.");
    } finally {
      setLoading(false);
    }
  }

  const hasValidPin = pinValid && /^\d{6}$/.test(String(form.pincode || ""));

  return (
    <form className="mk-address-form" onSubmit={submit}>
      <div className="mk-address-first-step">
        <label>
          Delivery pincode
          <input
            value={String(form.pincode || form.pin || "")}
            onChange={(e) => handlePincode(e.target.value.replace(/\D/g, "").slice(0, 6))}
            inputMode="numeric"
            maxLength={6}
            autoComplete="postal-code"
            placeholder="Enter 6-digit pincode"
            autoFocus
          />
        </label>
        <button type="button" className="mk-location-link mk-address-detect" onClick={useLocation} disabled={detecting}>
          {detecting ? "Detecting…" : "⌖ Use my location"}
        </button>
        {pinChecking && <p className="mk-address-status">Checking delivery availability…</p>}
        {hasValidPin && !pinChecking && <p className="mk-address-status mk-address-status-ok">✓ Delivery available for this pincode</p>}
      </div>

      {hasValidPin && !pinChecking && (
        <>
          <div className="mk-address-form-divider"><span>ADDRESS DETAILS</span></div>
          <div className="mk-form-grid">
            <label>Full name<input value={String(form.full_name || form.name || "")} onChange={(e) => update("full_name", e.target.value)} autoComplete="name" /></label>
            <label>Phone<input value={String(form.phone || "")} onChange={(e) => update("phone", e.target.value)} inputMode="tel" autoComplete="tel" /></label>
            <label>Area{areas.length ? <select value={String(form.area || form.area_name || "")} onChange={(e) => update("area", e.target.value)}><option value="">Select area</option>{areas.map((a) => <option key={a} value={a}>{a}</option>)}</select> : <input value={String(form.area || form.area_name || "")} onChange={(e) => update("area", e.target.value)} />}</label>
            <label>House / Flat<input value={String(form.house_flat || form.house || "")} onChange={(e) => update("house_flat", e.target.value)} autoComplete="street-address" /></label>
            <label>Street<input value={String(form.street || "")} onChange={(e) => update("street", e.target.value)} /></label>
            <label>Landmark<input value={String(form.landmark || "")} onChange={(e) => update("landmark", e.target.value)} /></label>
            <label>City<input value={String(form.city || "")} readOnly /></label>
            <label>State<input value={String(form.state || "")} readOnly /></label>
          </div>
          {error && <p className="mk-cart-error">{error}</p>}
          <div className="mk-form-actions">
            {onCancel && <button type="button" className="mk-secondary-button" onClick={onCancel}>CANCEL</button>}
            <button type="submit" className="mk-primary-button" disabled={loading}>{loading ? "SAVING…" : "SAVE ADDRESS"}</button>
          </div>
        </>
      )}
      {!hasValidPin && error && <p className="mk-cart-error">{error}</p>}
    </form>
  );
}
