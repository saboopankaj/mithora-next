"use client";
import type { Address } from "./types";

type Props = { open: boolean; addresses: Address[]; selectedId?: number|string; onClose:()=>void; onSelect:(a:Address)=>void; onAdd:()=>void; onSetDefault:(id:number|string)=>void };
export default function AddressPicker({open,addresses,selectedId,onClose,onSelect,onAdd,onSetDefault}:Props){
 if(!open)return null;
 return <div className="mk-overlay" onClick={onClose}><aside className="mk-address-drawer" onClick={e=>e.stopPropagation()}>
  <div className="mk-drawer-header"><div><span className="mk-cart-eyebrow">SAVED ADDRESSES</span><h2>Choose delivery address</h2></div><button type="button" onClick={onClose}>×</button></div>
  <div className="mk-address-list">{addresses.map((a,i)=>{const id=a.id??i;const selected=selectedId!=null&&String(selectedId)===String(id);return <button type="button" key={String(id)} className={`mk-address-option ${selected?'is-selected':''}`} onClick={()=>onSelect(a)}><div><strong>{a.full_name||a.name||'Address'}</strong>{a.is_default&&<span className="mk-default-badge">DEFAULT</span>}</div><p>{[a.house_flat||a.house,a.street,a.area||a.area_name,a.city,a.pincode||a.pin].filter(Boolean).join(', ')}</p>{a.id!=null&&!a.is_default&&<span className="mk-set-default" onClick={e=>{e.stopPropagation();onSetDefault(a.id!)}}>Mark Default</span>}</button>})}</div>
  <button type="button" className="mk-primary-button mk-full-button" onClick={onAdd}>+ ADD NEW ADDRESS</button>
 </aside></div>
}
