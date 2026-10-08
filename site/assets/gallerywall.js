const L={"2-panel":[2,2],"3-panel":[3,3],"4-panel":[2,4],"6-panel":[3,6],"Grid 3×3":[3,9]};
const g={l:"3-panel",s:0,gap:2,imgs:[],files:[]};let pick=0;const OK=/^image\/(jpeg|png|webp)$/;
function sz(){const[w,h]=CONFIG.sizes[g.s];return w===h?[w,h]:[Math.min(w,h),Math.max(w,h)]}
function opts(id,name,vals,cur,fn){$(id).innerHTML=vals.map(([v,l])=>`<label><input type="radio" name="${name}" value="${v}" ${String(v)===String(cur)?"checked":""}><span>${l}</span></label>`).join("");$(id).onchange=e=>{fn(e.target.value);draw()}}
function put(i,f){if(!OK.test(f.type)||f.size>41943040)return false;g.imgs[i]=URL.createObjectURL(f);g.files[i]=f;return true}
function fill(files){const n=L[g.l][1];let bad=0,skip=0,i=0;for(const f of files){while(i<n&&g.files[i])i++;if(i>=n){skip++;continue}put(i,f)?i++:bad++}
 if(bad)toast(bad+" file(s) skipped. Use JPG, PNG or WEBP under 40 MB.");if(skip)toast("This layout has only "+n+" panels.");draw()}
function draw(){const[c,n]=L[g.l],[w,h]=sz(),r=Math.ceil(n/c),tw=c*w+(c-1)*g.gap,th=r*h+(r-1)*g.gap;
 const px=Math.min(22,Math.max(200,$("#gwall").clientWidth-48)/tw);
 $("#gw").style.cssText=`gap:${g.gap*px}px;grid-template-columns:repeat(${c},${w*px}px)`;
 $("#gw").innerHTML=Array.from({length:n},(_,i)=>`<button class="p" data-i="${i}" style="--ar:${w}/${h};${g.imgs[i]?`background-image:url(${g.imgs[i]})`:""}" aria-label="Panel ${i+1}">${g.imgs[i]?"":"+ Add photo"}</button>`).join("");
 $("#np").textContent=`${n} (${g.files.slice(0,n).filter(Boolean).length} with photos)`;$("#tsz").textContent=`${tw} × ${th} in`;$("#gv").textContent=g.gap;
 const u=unit({d:[w,h],finish:"Gloss",mount:"Standard",enh:"None"});$("#gp").textContent=money(u*n*(1-disc(n)))}
$("#gw").onclick=e=>{const b=e.target.closest("button");if(b){pick=+b.dataset.i;$("#gf").click()}};
$("#gf").onchange=e=>{const f=e.target.files[0];if(f&&!put(pick,f))toast("Use a JPG, PNG or WEBP under 40 MB.");draw();e.target.value=""};
$("#gm").onchange=e=>{fill([...e.target.files]);e.target.value=""};
const wl=$("#gwall");wl.ondragover=e=>e.preventDefault();wl.ondrop=e=>{e.preventDefault();fill([...e.dataTransfer.files])};
$("#gap").oninput=e=>{g.gap=+e.target.value;$$("#gpre input").forEach(i=>i.checked=+i.value===g.gap);draw()};
opts("#gpre","gp",[0,1,2,3].map(v=>[v,v+" in"]),g.gap,v=>{g.gap=+v;$("#gap").value=v});
opts("#lay","lay",Object.keys(L).map(k=>[k,k]),g.l,v=>g.l=v);opts("#gs","gs",CONFIG.sizes.map((s,i)=>[i,s.join(" × ")]),g.s,v=>g.s=+v);
addEventListener("resize",draw);
const thumb=src=>new Promise(r=>{const t=document.createElement("canvas");t.width=t.height=128;const im=new Image();im.onload=()=>{const k=Math.max(128/im.width,128/im.height);t.getContext("2d").drawImage(im,0,0,im.width*k,im.height*k);r(t.toDataURL("image/jpeg",.7))};im.onerror=()=>r(t.toDataURL());im.src=src});
$("#gadd").onclick=async e=>{const n=L[g.l][1],btn=e.currentTarget;
 for(let i=0;i<n;i++)if(!g.files[i]){toast(`Add a photo to panel ${i+1} first.`);return}
 btn.disabled=true;btn.textContent="Uploading...";
 try{const files=[];for(let i=0;i<n;i++)files.push(await uploadDesign(g.files[i]));
  Cart.add({files,name:"Gallery wall ("+g.l+")",d:sz(),finish:"Gloss",mount:"Standard",enh:"None",qty:n,thumb:await thumb(g.imgs[0])});toast("Added to cart");openCart()}
 catch(err){}finally{btn.disabled=false;btn.textContent="Add set to cart"}};
draw();
