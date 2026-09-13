# Mithora Cart → Checkout → Payment Modules

This dump is designed to be added to the existing `mithora-next` project.

## Included

- Modular cart state with localStorage persistence
- Cart item add/update/remove
- Global cart count
- Sticky "View Cart" bar
- `/cart` page
- Pincode entry/change
- Browser "Use my location" flow through the existing geocode API
- Pincode suggestions
- Coupon drawer and coupon application
- Server-side cart validation through `/api/cart/sync`
- Reusable long-distance/external-zone popup for Cart and Checkout
- `/checkout` page
- Saved address selection
- Add-new-address form
- Mark-default address support
- Razorpay checkout
- Payment success/failure handling
- API helpers
- Types

## Existing backend endpoints used

- `POST /api/cart/sync`
- `POST /api/cart/save`
- `GET /api/coupons`
- `GET /api/location/suggest?q=...`
- `GET /api/location/google-geocode?lat=...&lng=...`
- `GET /api/pincode/:pin`
- `GET /api/user/addresses`
- `POST /api/user/addresses`
- `PATCH /api/user/addresses/:id/set-default`
- `POST /api/checkout/create-order`

## Important security note

The browser never decides the final payable amount.

Cart totals displayed by Next.js are based on `/api/cart/sync`. Before creating the Razorpay order, the Worker should validate/recalculate the cart again from D1 rather than trusting a client-supplied `validatedCart.total`.

A Worker patch outline is included under `worker-patch/`.

## Install

Copy the `components`, `lib`, `app`, and `styles` folders into the existing Next.js project.

Then make the small integration changes described in `INTEGRATION.md`.

