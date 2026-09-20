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

type PincodeResponse = {
  areas?: string[];
  city?: string;
  state?: string;
  pincode_status?: string;
};

type GeocodeResponse = Address & {
  ok?: boolean;
  formatted_address?: string;
};

const PIN_RE = /^\d{6}$/;

export default function AddressForm({ initial, onSaved, onCancel }: Props) {
  const [form, setForm] = useState<Address>(initial || {});
  const [areas, setAreas] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [detecting, setDetecting] = useState(false);
  const [pinChecking, setPinChecking] = useState(false);
  const [pinValid, setPinValid] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setForm(initial || {});
    setAreas(initial?.area || initial?.area_name ? [String(initial.area || initial.area_name)] : []);
    setPinValid(PIN_RE.test(String(initial?.pincode || initial?.pin || "")));
  }, [initial]);

  function update<K extends keyof Address>(key: K, value: Address[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function handlePincode(pin: string) {
    update("pincode", pin);
    update("area", "");
    setAreas([]);
    setPinValid(false);
    setError("");

    if (!PIN_RE.test(pin)) return;

    setPinChecking(true);
    try {
      const data = await apiFetch<PincodeResponse>(`/api/pincode/${pin}/areas`);
      const nextAreas = Array.isArray(data.areas) ? data.areas.map(String).filter(Boolean) : [];

      if (data.pincode_status !== "active" || nextAreas.length === 0) {
        throw new Error("Delivery is currently unavailable for this pincode.");
      }

      setAreas(nextAreas);
      setPinValid(true);
      setForm((current) => ({
        ...current,
        pincode: pin,
        city: String(data.city || ""),
        state: String(data.state || ""),
        area: "",
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to check this pincode.");
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
          const data = await apiFetch<GeocodeResponse>(
            `/api/location/google-geocode?lat=${coords.latitude}&lng=${coords.longitude}`,
          );

          const pin = String(data.pincode || "").replace(/\D/g, "").slice(0, 6);
          if (!PIN_RE.test(pin)) {
            throw new Error("Could not detect a valid delivery pincode from your location.");
          }

          const detectedArea = String(data.area || data.area_name || "");
          const detectedCity = String(data.city || "");
          const detectedState = String(data.state || "");

          // Geocoding already returns the complete address. Do NOT run the
          // pincode lookup afterwards, otherwise it can overwrite the detected area.
          setForm((current) => ({
            ...current,
            name: current.name || "",
            phone: current.phone || "",
            pincode: pin,
            house: String(data.house || ""),
            street: String(data.street || ""),
            area: detectedArea,
            city: detectedCity,
            state: detectedState,
            latitude: Number.isFinite(Number(data.latitude)) ? Number(data.latitude) : coords.latitude,
            longitude: Number.isFinite(Number(data.longitude)) ? Number(data.longitude) : coords.longitude,
          }));

          // Confirm the detected pincode is serviceable, while preserving the
          // exact area returned by geocoding.
          const pinData = await apiFetch<PincodeResponse>(`/api/pincode/${pin}/areas`);
          const nextAreas = Array.isArray(pinData.areas) ? pinData.areas.map(String).filter(Boolean) : [];
          const areaIsServiceable = nextAreas.some((area) => area.toLowerCase() === detectedArea.toLowerCase());

          if (pinData.pincode_status !== "active" || !areaIsServiceable) {
            setAreas(nextAreas);
            setPinValid(pinData.pincode_status === "active" && nextAreas.length > 0);
            throw new Error(
              nextAreas.length
                ? "Your detected location is outside our current delivery areas. Please choose a serviceable area."
                : "Delivery is currently unavailable for this pincode.",
            );
          }

          setAreas(nextAreas);
          setPinValid(true);
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

    if (!pinValid || !PIN_RE.test(String(form.pincode || ""))) {
      setError("Please enter or detect a valid serviceable pincode first.");
      return;
    }
    if (!form.area) return setError("Please select your area.");
    if (!form.name) return setError("Please enter your name.");
    if (!form.phone) return setError("Please enter your phone number.");
    if (!form.house) return setError("Please enter your house / flat.");

    setLoading(true);
    try {
      const result = await createAddress({
        name: form.name,
        phone: form.phone,
        house: form.house,
        street: form.street,
        area: form.area,
        city: form.city,
        state: form.state,
        pincode: form.pincode,
        latitude: form.latitude,
        longitude: form.longitude,
        is_default: !!form.is_default,
      });
      onSaved(result.address || { ...form, id: result.id });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save address.");
    } finally {
      setLoading(false);
    }
  }

  const hasValidPin = pinValid && PIN_RE.test(String(form.pincode || ""));

  return (
    <form className="mk-address-form" onSubmit={submit}>
      <div className="mk-address-first-step">
        <div className="mk-address-step-title">How would you like to add your address?</div>
        <div className="mk-address-pin-row">
          <label>
            Pincode
            <input
              value={String(form.pincode || "")}
              onChange={(e) => handlePincode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              inputMode="numeric"
              maxLength={6}
              autoComplete="postal-code"
              placeholder="Enter 6-digit pincode"
            />
          </label>
          <span className="mk-address-or">OR</span>
          <button type="button" className="mk-location-button" onClick={useLocation} disabled={detecting}>
            <span className="mk-location-button-icon">⌖</span>
            {detecting ? "Detecting…" : "Detect my location"}
          </button>
        </div>
        {pinChecking && <p className="mk-address-status">Checking delivery areas…</p>}
        {hasValidPin && !pinChecking && <p className="mk-address-status mk-address-status-ok">✓ Pincode is serviceable. Select your area below.</p>}
      </div>

      {hasValidPin && !pinChecking && (
        <>
          <div className="mk-address-form-divider"><span>DELIVERY ADDRESS</span></div>

          <div className="mk-form-grid">
            <label>
              Name
              <input value={String(form.name || "")} onChange={(e) => update("name", e.target.value)} autoComplete="name" placeholder="Your name" />
            </label>
            <label>
              Phone
              <input value={String(form.phone || "")} onChange={(e) => update("phone", e.target.value)} inputMode="tel" autoComplete="tel" placeholder="Phone number" />
            </label>

            <label className="mk-address-field-wide">
              Area
              <select value={String(form.area || "")} onChange={(e) => update("area", e.target.value)}>
                <option value="">Select your area</option>
                {areas.map((area) => <option key={area} value={area}>{area}</option>)}
              </select>
            </label>

            <label>
              House / Flat
              <input value={String(form.house || "")} onChange={(e) => update("house", e.target.value)} autoComplete="address-line1" placeholder="House / Flat / Building" />
            </label>
            <label>
              Street
              <input value={String(form.street || "")} onChange={(e) => update("street", e.target.value)} autoComplete="address-line2" placeholder="Street / Road" />
            </label>

            <label>
              City
              <input value={String(form.city || "")} readOnly />
            </label>
            <label>
              State
              <input value={String(form.state || "")} readOnly />
            </label>
            <label>
              Pincode
              <input value={String(form.pincode || "")} readOnly />
            </label>
          </div>

          <label className="mk-default-address-toggle">
            <input
              type="checkbox"
              checked={!!form.is_default}
              onChange={(e) => update("is_default", e.target.checked)}
            />
            <span>
              <strong>Make this my default address</strong>
              <small>Use this address automatically for my next order.</small>
            </span>
          </label>

          {error && <p className="mk-cart-error">{error}</p>}

          <div className="mk-form-actions">
            {onCancel && <button type="button" className="mk-secondary-button" onClick={onCancel}>CANCEL</button>}
            <button type="submit" className="mk-primary-button" disabled={loading || !form.area}>
              {loading ? "SAVING…" : "SAVE ADDRESS"}
            </button>
          </div>
        </>
      )}

      {!hasValidPin && error && <p className="mk-cart-error">{error}</p>}
    </form>
  );
}
