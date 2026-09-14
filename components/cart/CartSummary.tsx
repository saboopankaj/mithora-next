"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useCart } from "./CartProvider";
import { useAuth } from "@/components/auth/AuthContext";
import CouponDrawer from "./CouponDrawer";

function money(value:number|undefined){return `₹${Number(value||0).toFixed(0)}`;}

type Props={onLogin:()=>void;onAddAddress:()=>void;onPlaceOrder:()=>void;canPlaceOrder:boolean;paymentLoading:boolean;addressReady:boolean};
export default function CartSummary({onLogin,onAddAddress,onPlaceOrder,canPlaceOrder,paymentLoading,addressReady}:Props){
 const {isAuthenticated}=useAuth();
 const {cart,validatedCart,loading,setCoupon,removeCoupon,validate,pincode}=useCart();
 const [couponOpen,setCouponOpen]=useState(false); const [couponMessage,setCouponMessage]=useState("");
 useEffect(()=>{if(!cart.coupon_code||!validatedCart)return;const info=validatedCart.coupon_info;const discount=Number(validatedCart.discount||0);if(info?.status==='error'){setCouponMessage(info.message||'Coupon is not applicable.');return;}setCouponMessage(discount>0?`🎉 Yay! You saved ${money(discount)} with ${cart.coupon_code}.`:'Coupon applied successfully.');},[cart.coupon_code,validatedCart]);
 async function applyCoupon(code:string){setCouponMessage("");setCoupon(code);const response=await validate();if(!response.validatedCart){setCouponMessage(response.error||response.message||'Coupon could not be applied.');return;}const info=response.validatedCart.coupon_info;const discount=Number(response.validatedCart.discount||0);if(info?.status==='error')setCouponMessage(info.message||'Coupon is not applicable.');else setCouponMessage(discount>0?`🎉 Yay! You saved ${money(discount)} with ${code}.`:'Coupon applied successfully.');}
if(!validatedCart){
  return (
    <section className="mk-cart-summary">
      <div className="mk-summary-header">
        <h2>Order Summary</h2>
        {loading && <span>Updating…</span>}
      </div>

      {!isAuthenticated && cart.items.length ? (
        <>
          <p className="mk-summary-empty">
            Login to review your cart and add a delivery address.
          </p>
          <button
            type="button"
            className="mk-primary-button mk-full-button"
            onClick={onLogin}
          >
            LOGIN TO REVIEW CART
          </button>
        </>
      ) : !addressReady && cart.items.length ? (
        <>
          <p className="mk-summary-empty">
            Add a delivery address to calculate your total.
          </p>
          <button
            type="button"
            className="mk-primary-button mk-full-button"
            onClick={onAddAddress}
          >
            ADD DELIVERY ADDRESS
          </button>
        </>
      ) : cart.items.length ? (
        <div className="mk-summary-updating">
          <span>Updating your order total…</span>
        </div>
      ) : (
        <>
          <p className="mk-summary-empty">Your cart is empty.</p>
          <Link href="/menu" className="mk-primary-button">
            BROWSE MENU
          </Link>
        </>
      )}
    </section>
  );
}
 return <><section className="mk-cart-summary"><div className="mk-summary-header"><h2>Order Summary</h2>{loading&&<span>Updating…</span>}</div><div className="mk-summary-lines"><div><span>Item Total</span><strong>{money(validatedCart.subtotal)}</strong></div><div><span>Delivery Fee</span><strong>{validatedCart.is_free_delivery?'FREE':money(validatedCart.shipping)}</strong></div>{Number(validatedCart.free_delivery_min||0)>0&&!validatedCart.is_free_delivery&&Number(validatedCart.free_delivery_remaining||0)>0&&<div className="mk-free-delivery-message">🚚 Add ₹{Number(validatedCart.free_delivery_remaining).toFixed(0)} more for FREE delivery</div>}{Number(validatedCart.free_delivery_min||0)>0&&validatedCart.is_free_delivery&&<div className="mk-free-delivery-message">🚚 FREE delivery unlocked</div>}{validatedCart.discount>0&&<div className="mk-discount-line"><span>Coupon Discount</span><strong>−{money(validatedCart.discount)}</strong></div>}</div>{validatedCart.is_external_zone&&<div className="mk-distance-warning">⚠️ Distance charges applied for this location.</div>}{cart.coupon_code?<div className="mk-applied-coupon"><span>Coupon <strong>{cart.coupon_code}</strong></span><button type="button" onClick={async()=>{removeCoupon();setCouponMessage('Coupon removed.');await validate();}}>REMOVE</button></div>:<button type="button" className="mk-coupon-trigger" onClick={()=>setCouponOpen(true)}>🏷 Apply coupon</button>}{couponMessage&&<p className="mk-coupon-message">{couponMessage}</p>}<div className="mk-summary-total"><span>To Pay</span><strong>{money(validatedCart.total)}</strong></div><button type="button" className="mk-primary-button mk-full-button" disabled={!canPlaceOrder||paymentLoading||loading} onClick={onPlaceOrder}>{paymentLoading?'PROCESSING…':canPlaceOrder?'PLACE ORDER':'SELECT DELIVERY ADDRESS'}</button></section><CouponDrawer open={couponOpen} onClose={()=>setCouponOpen(false)} currentCode={cart.coupon_code} subtotal={validatedCart.subtotal??0} onApply={applyCoupon}/></>;
}
