const CLIP={Hexagon:"polygon(25% 3%,75% 3%,100% 50%,75% 97%,25% 97%,0 50%)",Star:"polygon(50% 0,61% 35%,98% 35%,68% 57%,79% 91%,50% 70%,21% 91%,32% 57%,2% 35%,39% 35%)",Circle:"circle(50%)",Diamond:"polygon(50% 0,100% 50%,50% 100%,0 50%)",Octagon:"polygon(30% 0,70% 0,100% 30%,100% 70%,70% 100%,30% 100%,0 70%,0 30%)"};
const st={shape:"Rectangle",size:1,orient:"Portrait",finish:"Gloss",mount:"Standard",enh:"None",qty:1,img:null,zoom:1,ox:0,oy:0,rot:0,url:null};
function dims(){let[w,h]=CONFIG.sizes[st.size];if(st.shape!=="Rectangle"){const m=Math.min(w,h);return[m,m]}if(w===h)return[w,h];const p=Math.min(w,h),l=Math.max(w,h);return st.orient==="Landscape"?[l,p]:[p,l]}
function radios(id,name,vals,cur,fn){const el=$(id);el.innerHTML=vals.map(([v,l])=>`<label><input type="radio" name="${name}" value="${v}" ${String(v)===String(cur)?"checked":""}><span>${l}</span></label>`).join("");
 el.onchange=e=>{fn(e.target.value);update()}}
function sizeOpts(){const seen=new Set(),rect=st.shape==="Rectangle";
 const list=CONFIG.sizes.map((z,i)=>[i,rect?z[0]+" × "+z[1]:Math.min(...z)+" in"]).filter(x=>rect||(!seen.has(x[1])&&seen.add(x[1])));
 if(!list.some(x=>x[0]==st.size))st.size=list[0][0];radios("#sizes","size",list,st.size,v=>st.size=+v)}
function scene(){const w=$("#wall");w.classList.add("scale");w.insertAdjacentHTML("afterbegin",'<div class="sofa" aria-hidden="true"></div>');
 w.insertAdjacentHTML("afterend",'<div class="swatches"><span>Wall:</span>'+[["#e9e4dc","Warm white"],["#b7c4b0","Sage"],["#3a3d42","Charcoal"]].map(c=>`<button type="button" style="background:${c[0]}" aria-label="${c[1]} wall" data-w="${c[0]}"></button>`).join("")+'<small style="color:var(--muted)">Shown to scale: the sofa is 84 in wide.</small></div>');
 document.querySelector(".swatches").onclick=e=>{if(e.target.dataset.w)w.style.background=e.target.dataset.w}}
function build(){
 radios("#shape","shape",Object.keys(CONFIG.rules.shape).map(k=>[k,k]),st.shape,v=>{st.shape=v;sizeOpts();$("#orient").parentElement.style.display=v==="Rectangle"?"":"none"});
 sizeOpts();
 radios("#orient","orient",[["Portrait","Portrait"],["Landscape","Landscape"]],st.orient,v=>st.orient=v);
 radios("#finish","finish",Object.keys(CONFIG.rules.finish).map(k=>[k,k]),st.finish,v=>st.finish=v);
 radios("#mount","mount",Object.keys(CONFIG.rules.mount).map(k=>[k,k]),st.mount,v=>st.mount=v);
 radios("#enh","enh",Object.keys(CONFIG.rules.enhance).map(k=>[k,k]),st.enh,v=>st.enh=v);
 radios("#qty","qty",[1,2,3].map(n=>[n,n]),st.qty,v=>st.qty=+v);
}
const cv=$("#cv"),cx=cv.getContext("2d");
function draw(){
 const[w,h]=dims();const wall=$("#wall");if(!wall.classList.contains("scale"))scene();const s=wall.clientWidth/120,pw=$("#pw");pw.style.width=w*s+"px";pw.style.height=h*s+"px";pw.className="panelwrap"+(st.mount==="Floating"?" float":"");cv.style.clipPath=CLIP[st.shape]||"none";
 const dpr=1,RES=800/Math.max(w,h);cv.width=Math.round(w*RES);cv.height=Math.round(h*RES);cx.setTransform(1,0,0,1,0,0);cx.fillStyle="#8a8a8a";cx.fillRect(0,0,cv.width,cv.height);
 if(!st.img)return;
 const I=st.img,r=st.rot%2?[I.height,I.width]:[I.width,I.height];
 const base=Math.max(cv.width/r[0],cv.height/r[1])*st.zoom;
 cx.save();cx.filter=st.enh==="Auto-enhance"?"contrast(1.08) saturate(1.12) brightness(1.02)":"none";
 cx.translate(cv.width/2+st.ox*cv.width,cv.height/2+st.oy*cv.height);cx.rotate(st.rot*Math.PI/2);cx.scale(base,base);cx.drawImage(I,-I.width/2,-I.height/2);cx.restore();
 if(st.mount==="Magnetic"||st.mount==="Floating"){cx.strokeStyle="rgba(255,255,255,.25)";cx.lineWidth=2*dpr;cx.strokeRect(0,0,cv.width,cv.height)}
 quality();
}
function quality(){
 const[w,h]=dims();const I=st.img,r=st.rot%2?[I.height,I.width]:[I.width,I.height];
 const cover=Math.max(w/r[0],h/r[1])*0 + Math.max(r[0]/ r[0],1); // placeholder to keep scope tidy
 const vis=Math.min(r[0]/st.zoom,r[1]/st.zoom*(w/h)),ppi=Math.min(r[0]/st.zoom/w,r[1]/st.zoom/h);
 const e=Math.round(ppi),el=$("#quality");
 const [lab,msg]=e>=150?["Excellent","Sharp at this size."]:e>=100?["Good","Should look crisp from normal viewing distance."]:e>=60?["Low resolution","Your image may look soft at this size. Try a higher-resolution image or choose a smaller print."]:["Needs review","Resolution is very low for this size. Choose a smaller print or another image."];
 el.innerHTML=`<b>Image quality: ${lab}</b> · ~${e} PPI<br><small>${msg}</small>`;
}
function update(){
 const o={d:dims(),shape:st.shape,finish:st.finish,mount:st.mount,enh:st.enh};const u=unit(o),d=disc(st.qty),t=u*st.qty*(1-d);
 $("#price").textContent=money(t);
 $("#pnote").textContent=`${money(u)} each${d?` · ${d*100}% multi-print savings applied`:""} · ${dims().join(" × ")} in`;
 $("#add").disabled=!st.img;draw();
}
function load(f){
 $("#err").textContent="";
 if(!f)return;
 if(!/^image\/(jpeg|png|webp)$/.test(f.type)){$("#err").textContent="That file type isn't supported. Please upload a JPG, PNG or WEBP image.";return}
 if(f.size>40*1048576){$("#err").textContent="That image is too large. Please choose a file under 40 MB.";return}
 st.file=f;const url=URL.createObjectURL(f),im=new Image();
 im.onload=()=>{st.img=im;st.url=url;st.zoom=1;st.ox=st.oy=0;st.rot=0;$("#zoom").value=1;update()};
 im.onerror=()=>{$("#err").textContent="We couldn't read that image. Please try another file."};
 im.src=url;
}
$("#file").onchange=e=>load(e.target.files[0]);
const dz=$("#drop");
["dragenter","dragover"].forEach(t=>dz.addEventListener(t,e=>{e.preventDefault();dz.classList.add("over")}));
["dragleave","drop"].forEach(t=>dz.addEventListener(t,e=>{e.preventDefault();dz.classList.remove("over")}));
dz.addEventListener("drop",e=>load(e.dataTransfer.files[0]));
$("#zoom").oninput=e=>{st.zoom=+e.target.value;clamp();draw()};
$("#rot").onclick=()=>{st.rot=(st.rot+1)%4;draw()};
$("#reset").onclick=()=>{st.zoom=1;st.ox=st.oy=0;st.rot=0;$("#zoom").value=1;draw()};
function clamp(){const m=(st.zoom-1)/2+.25;st.ox=Math.max(-m,Math.min(m,st.ox));st.oy=Math.max(-m,Math.min(m,st.oy))}
let drag=null;const pw=$("#pw");
pw.onpointerdown=e=>{drag={x:e.clientX,y:e.clientY};pw.setPointerCapture(e.pointerId)};
pw.onpointermove=e=>{if(!drag||!st.img)return;const r=pw.getBoundingClientRect();st.ox+=(e.clientX-drag.x)/r.width;st.oy+=(e.clientY-drag.y)/r.height;drag={x:e.clientX,y:e.clientY};clamp();draw()};
pw.onpointerup=()=>drag=null;
addEventListener("resize",draw);


$("#add").onclick=async()=>{
 const th=document.createElement("canvas");th.width=th.height=128;const c=th.getContext("2d");const s=Math.max(128/cv.width,128/cv.height);c.drawImage(cv,0,0,cv.width*s,cv.height*s);
 Cart.add({shape:st.shape,file:await uploadDesign(st.file),name:"Custom Metal Print",d:dims(),finish:st.finish,mount:st.mount,enh:st.enh,qty:st.qty,thumb:th.toDataURL("image/jpeg",.7)});toast("Added to cart");openCart()};
{const q=new URLSearchParams(location.search).get("shape");if(q&&CONFIG.rules.shape[q])st.shape=q}
build();if(st.shape!=="Rectangle")$("#orient").parentElement.style.display="none";update();
