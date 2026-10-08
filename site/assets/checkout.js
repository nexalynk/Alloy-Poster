let extra=0;const ex=$('#sm input[value="25"]');
if(CONFIG.expressShip!=null){ex.value=CONFIG.expressShip;ex.nextElementSibling.textContent=`Express (+${money(CONFIG.expressShip)})`}
function paint(){const t=totals(Cart.get(),extra);$$("[data-carttotals]").forEach(e=>e.innerHTML=`<div class="row"><span>Subtotal</span><span>${money(t.sub)}</span></div><div class="row"><span>Shipping</span><span>${t.ship?money(t.ship):"Free"}</span></div><div class="row"><span>Tax (est.)</span><span>${money(t.tax)}</span></div><div class="row"><b>Total</b><b>${money(t.total)}</b></div>`)}
paint();$("#sm").addEventListener("change",e=>{extra=+e.target.value;paint()});document.addEventListener("click",()=>setTimeout(paint));
$("#co").onsubmit=async e=>{e.preventDefault();const c=Cart.get();if(!c.length){toast("Your cart is empty.");return}
 const email=$("#em").value.trim().toLowerCase(),btn=e.submitter;
 if(API.ready){btn.disabled=true;
  const{data,error}=await API.sb.functions.invoke("create-checkout",{body:{items:c.map(i=>({name:i.name,d:i.d,finish:i.finish,mount:i.mount,enh:i.enh,qty:i.qty,file:i.file||null,files:i.files||null,shape:i.shape||"Rectangle"})),customer:{email,name:$("#nm").value,address:{line1:$("#ad").value,city:$("#ci").value,postal:$("#po").value,country:$("#co2").value}},shipping:extra?"express":"standard"}});
  if(error||!data||!data.url){toast(error&&error.context&&error.context.status===429?"Too many attempts. Please wait a few minutes and try again.":"We couldn't start checkout. Please try again.");btn.disabled=false;return}
  location.href=data.url;return}
 const o={id:"AP-"+Math.floor(100000+Math.random()*900000),email,name:$("#nm").value,addr:`${$("#ad").value}, ${$("#ci").value} ${$("#po").value}, ${$("#co2").value}`,items:c,totals:totals(c,extra),date:Date.now(),status:1};
 LS.set("ag_orders",[o,...LS.get("ag_orders",[])]);LS.set("ag_cart",[]);location.href="order-confirmation.html?o="+o.id};
