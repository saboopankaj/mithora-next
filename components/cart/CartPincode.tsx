"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import { useCart } from "./CartProvider";
import type { PincodeSuggestion } from "./types";

type Props = {
  onExternalZone?: (open: boolean) => void;
};

export default function CartPincode({ onExternalZone }: Props) {
  const { pincode, area, setPincode, validate, validatedCart } = useCart();
  const [editing, setEditing] = useState(!pincode);
  const [value, setValue] = useState(pincode);
  const [suggestions, setSuggestions] = useState<PincodeSuggestion[]>([]);
  const [detecting, setDetecting] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    setValue(pincode);
  }, [pincode]);

  useEffect(() => {
    if (validatedCart?.is_external_zone) onExternalZone?.(true);
  }, [validatedCart, onExternalZone]);

  async function searchPin(next: string) {
    setValue(next);
    setMessage("");

    if (next.length < 2) {
      setSuggestions([]);
      return;
    }

    try {
      const response = await apiFetch<unknown>(
        `/api/location/suggest?q=${encodeURIComponent(next)}`,
      );

      const list =
        Array.isArray(response)
          ? response
          : response &&
              typeof response === "object" &&
              "suggestions" in response &&
              Array.isArray((response as { suggestions: unknown[] }).suggestions)
            ? (response as { suggestions: PincodeSuggestion[] }).suggestions
            : [];

      setSuggestions(list);
    } catch {
      setSuggestions([]);
    }
  }

  async function applyPin(pin: string, nextArea = "") {
    if (!/^\d{6}$/.test(pin)) {
      setMessage("Please enter a valid 6-digit pincode.");
      return;
    }

    try {
      const result = await apiFetch<unknown>(`/api/pincode/${pin}`);
      const info =
        result && typeof result === "object"
          ? (result as Record<string, unknown>)
          : {};

      const serviceable =
        info.serviceable ??
        info.is_serviceable ??
        info.active ??
        true;

      if (serviceable === false) {
        setMessage("Delivery is currently unavailable for this pincode.");
        return;
      }

      const detectedArea =
        nextArea ||
        String(info.area || info.area_name || info.city || "");

      setPincode(pin, detectedArea);
      setEditing(false);
      setSuggestions([]);

      const response = await validate();
      if (response.validatedCart?.is_external_zone) {
        onExternalZone?.(true);
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to check pincode.");
    }
  }

  function useLocation() {
    if (!navigator.geolocation) {
      setMessage("Location is not supported by this browser.");
      return;
    }

    setDetecting(true);
    setMessage("");

    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        try {
          const result = await apiFetch<unknown>(
            `/api/location/google-geocode?lat=${coords.latitude}&lng=${coords.longitude}`,
          );

          const data =
            result && typeof result === "object"
              ? (result as Record<string, unknown>)
              : {};

          const pin = String(
            data.pincode ||
              data.postal_code ||
              data.zip ||
              "",
          ).replace(/\D/g, "").slice(0, 6);

          const nextArea = String(
            data.area || data.area_name || data.locality || data.city || "",
          );

          if (pin.length === 6) {
            await applyPin(pin, nextArea);
          } else {
            setMessage("Could not detect a valid pincode.");
          }
        } catch (error) {
          setMessage(error instanceof Error ? error.message : "Location lookup failed.");
        } finally {
          setDetecting(false);
        }
      },
      () => {
        setDetecting(false);
        setMessage("Location permission was not available.");
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }

  return (
    <section className="mk-cart-location">
      <div className="mk-cart-section-heading">
        <div>
          <span className="mk-cart-eyebrow">DELIVERY LOCATION</span>
          <h2>{pincode ? `${pincode}${area ? ` · ${area}` : ""}` : "Add your pincode"}</h2>
        </div>
        {pincode && !editing && (
          <button type="button" onClick={() => setEditing(true)}>
            CHANGE
          </button>
        )}
      </div>

      {editing && (
        <div className="mk-cart-pincode-editor">
          <div className="mk-cart-pincode-input-row">
            <input
              value={value}
              onChange={(event) => searchPin(event.target.value.replace(/\D/g, "").slice(0, 6))}
              inputMode="numeric"
              maxLength={6}
              placeholder="Enter pincode"
              aria-label="Pincode"
            />
            <button type="button" onClick={() => applyPin(value)}>
              CHECK
            </button>
          </div>

          <button
            type="button"
            className="mk-cart-location-button"
            onClick={useLocation}
            disabled={detecting}
          >
            {detecting ? "Detecting…" : "⌖ Use my location"}
          </button>

          {suggestions.length > 0 && (
            <div className="mk-cart-suggestions">
              {suggestions.slice(0, 6).map((suggestion, index) => {
                const pin = String(suggestion.pincode || suggestion.pin || "");
                const label =
                  suggestion.area ||
                  suggestion.area_name ||
                  suggestion.city ||
                  pin;

                return (
                  <button
                    type="button"
                    key={`${pin}-${index}`}
                    onClick={() => applyPin(pin, String(label))}
                  >
                    <strong>{pin}</strong>
                    <span>{label}</span>
                  </button>
                );
              })}
            </div>
          )}

          {message && <p className="mk-cart-error">{message}</p>}
        </div>
      )}
    </section>
  );
}
