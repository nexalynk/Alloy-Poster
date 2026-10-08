(async()=>{const box=$("#ol");
if(!API.ready){const os=LS.get("ag_orders",[]);box.innerHTML=os.length?os.map(o=>`<div class="box" style="margin-bottom:12px"><b>${esc(o.id)}</b> · ${money(o.totals.total)}<br>${CONFIG.statuses[o.status]}</div>`).join(""):"<p>No orders yet.</p>";return}
const{data:{session}}=await API.sb.auth.getSession();
if(!session){box.innerHTML='<form class="box" id="lf"><label class="f" for="le">Email</label><input id="le" type="email" required><button class="btn" style="margin-top:12px">Email me a sign-in link</button></form>';
 $("#lf").onsubmit=async e=>{e.preventDefault();const{error}=await API.sb.auth.signInWithOtp({email:$("#le").value,options:{emailRedirectTo:location.href}});toast(error?"We couldn't send the link. Try again.":"Check your email for a sign-in link.")};return}
const{data:os}=await API.sb.from("orders").select("*").neq("status","Pending Payment").order("created_at",{ascending:false});
box.innerHTML=`<p><button class="cartbtn" id="so">Sign out</button></p>`+((os||[]).length?os.map((o,n)=>`<div class="box" style="margin-bottom:12px"><b>${esc(o.order_number)}</b> · ${new Date(o.created_at).toLocaleDateString()} · ${money(+o.total)}<br>${esc(o.status)}${o.tracking_number?` · Tracking ${esc(o.tracking_number)}`:""}<br><button class="cartbtn" data-re="${n}" style="margin-top:8px">Reorder</button></div>`).join(""):"<p>No orders yet.</p>");
$("#so").onclick=async()=>{await API.sb.auth.signOut();location.reload()};
box.onclick=e=>{const n=e.target.dataset.re;if(n!==undefined){Cart.set([...Cart.get(),...os[n].items.map(i=>({...i,thumb:i.thumb||"data:image/gif;base64,R0lGODlhAQABAAAAACw="}))]);toast("Items added to cart");openCart()}}})();
