# Mithora Cart-First Checkout

This replacement makes `/cart` the complete checkout experience.

## Flow
Guest cart -> View Cart -> Login to Review Cart -> Add/select delivery address -> pincode validation -> delivery charge/free-delivery/distance calculation -> coupon/summary -> Place Order -> Razorpay.

There is intentionally no `app/checkout/page.tsx` and no `components/checkout/` folder.

## Important
- Address pincode is the delivery-location input. There is no separate Check Pincode step on Cart.
- New address starts with pincode or browser location detection. Once a valid pincode is confirmed, address fields appear.
- Saved addresses show the matching/default address automatically after login. Change opens the address picker; a new address can be added.
- Place Order stays disabled until the user is authenticated, an address with a valid pincode is selected, and the cart has been server-validated.
- The checkout API receives raw cart items/coupon/address ID and the Worker revalidates prices, shipping, coupon and total server-side before creating the Razorpay order.
- The Worker included here is the secured cart/create-order version, with `handleCreateOrder` active.
- Production is not targeted; deploy/test only against the dev Worker.
