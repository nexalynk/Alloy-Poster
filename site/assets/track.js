const tl=s=>`<ul class="tl">${CONFIG.statuses.map((x,i)=>`<li class="${i<=s?"on":""}">${x}</li>`).join("")}</ul>`;
$("#tf").onsubmit=async e=>{e.preventDefault();const num=$("#on").value.trim(),em=$("#te").value.trim().toLowerCase();let o=null;
 if(API.ready){const{data}=await API.sb.rpc("track_order",{p_number:num,p_email:em});if(data)o={id:data.order_number,s:CONFIG.statuses.indexOf(data.status),t:data.tracking_number,x:data.status}}
 else{const d=LS.get("ag_orders",[]).find(x=>x.id.toLowerCase()===num.toLowerCase()&&x.email===em);if(d)o={id:d.id,s:d.status,x:CONFIG.statuses[d.status]}}
 $("#tr").innerHTML=o?`<b>Order ${esc(o.id)}: ${esc(o.x)}</b>${o.s>=0?tl(o.s):""}${o.t?`<p>Tracking number: ${esc(o.t)}</p>`:""}`:"We couldn't find an order with those details. Check the number and email."};
