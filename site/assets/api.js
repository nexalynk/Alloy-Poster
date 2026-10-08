(function(){
const ok=!!(window.SB_URL&&window.SB_KEY&&window.supabase);
window.API={ready:ok,sb:ok?supabase.createClient(SB_URL,SB_KEY):null};
window.esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
if(!ok)return;
let DISC=[[2,.1],[3,.15]];
disc=q=>{let p=0;DISC.forEach(([m,r])=>{if(q>=m)p=Math.max(p,r)});return p};
function apply(c){if(!c)return;try{const R=CONFIG.rules,r=c.rules||{};
 if(c.sizes&&c.sizes.length)CONFIG.sizes=c.sizes;
 if(r.price_per_sq_in!=null)R.perSqIn=+r.price_per_sq_in;if(r.min_price!=null)R.minPrice=+r.min_price;
 if(r.tax_rate!=null)CONFIG.taxRate=+r.tax_rate;if(r.free_shipping_over!=null)CONFIG.freeShipOver=+r.free_shipping_over;
 if(r.shipping_flat!=null)CONFIG.shipFlat=+r.shipping_flat;if(r.shipping_express!=null)CONFIG.expressShip=+r.shipping_express;
 ["finish","mount","enhance","shape"].forEach(k=>{if(c[k]&&Object.keys(c[k]).length)R[k]=c[k]});
 if(c.discounts&&c.discounts.length)DISC=c.discounts.map(d=>[+d[0],+d[1]]);
 if(c.site)Object.entries(c.site).forEach(([k,v])=>{if(v!=="")CONFIG.site[k]=v});applySite();
 if(c.promo){const b=document.querySelector(".bar");if(b)b.textContent=c.promo}
 if(c.products&&c.products.length)CONFIG.products=c.products}catch(e){}}
apply(LS.get("ag_catalog",null));
API.sb.rpc("get_catalog").then(({data})=>{if(!data)return;const changed=JSON.stringify(data)!==JSON.stringify(LS.get("ag_catalog",null));LS.set("ag_catalog",data);apply(data);
 if(changed&&window.build){try{build();update()}catch(e){}}if(changed)document.dispatchEvent(new Event("catalog"));renderCart()});
window.uploadDesign=async f=>{if(!f)return null;const ext=(f.name.split(".").pop()||"").toLowerCase();
 const fail=e=>{toast(e&&e.context&&e.context.status===429?"Too many uploads. Please wait a while and try again.":"Upload failed. Check your connection and try again.");throw e||new Error("upload")};
 const{data,error}=await API.sb.functions.invoke("upload-url",{body:{ext,type:f.type,size:f.size}});
 if(error||!data||!data.token)fail(error);
 const up=await API.sb.storage.from("designs").uploadToSignedUrl(data.path,data.token,f,{contentType:f.type});
 if(up.error)fail(up.error);return data.path};
})();
window.uploadDesign=window.uploadDesign||(async()=>null);
