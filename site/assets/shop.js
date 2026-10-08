const cats=["All",...new Set(CONFIG.products.map(p=>p[3]))];let cur="All";
function show(){$("#chips").innerHTML=cats.map(c=>`<button class="${c===cur?"on":""}" aria-pressed="${c===cur}">${c}</button>`).join("");$("#list").innerHTML=productCards(CONFIG.products.filter(p=>cur==="All"||p[3]===cur))}
$("#chips").onclick=e=>{if(e.target.tagName==="BUTTON"){cur=e.target.textContent;show()}};show();