let view="scene",vz=1;
const ROOM=`<svg class="room" viewBox="0 0 1200 800" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><defs><radialGradient id="rgl" cx="12%" cy="18%" r="85%"><stop offset="0" stop-color="#fff" stop-opacity=".38"/><stop offset="1" stop-color="#000" stop-opacity=".22"/></radialGradient><linearGradient id="wood" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#c39a6b"/><stop offset="1" stop-color="#8a6642"/></linearGradient><linearGradient id="cu" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9aa7b8"/><stop offset="1" stop-color="#7a8798"/></linearGradient><filter id="bl"><feGaussianBlur stdDeviation="14"/></filter><filter id="bs"><feGaussianBlur stdDeviation="6"/></filter></defs>
<rect width="1200" height="750" style="fill:var(--wallc,#e9e4dc)"/><rect width="1200" height="750" fill="url(#rgl)"/><polygon points="780,40 1010,0 1090,560 840,600" fill="#fff" opacity=".13" filter="url(#bl)"/>
<rect y="722" width="1200" height="28" fill="#efece6"/><rect y="750" width="1200" height="6" fill="#000" opacity=".18"/><rect y="750" width="1200" height="50" fill="url(#wood)"/>
<g stroke="#6f4f32" stroke-opacity=".35" stroke-width="2"><path d="M0 775H1200M120 750V775M340 750V775M560 750V775M780 750V775M1000 750V775M230 775V800M450 775V800M670 775V800M890 775V800M1110 775V800"/></g><rect y="750" width="1200" height="14" fill="#fff" opacity=".12"/>
<ellipse cx="600" cy="784" rx="480" ry="13" fill="#000" opacity=".3" filter="url(#bs)"/>
<rect x="196" y="770" width="22" height="14" rx="3" fill="#3b2f26"/><rect x="982" y="770" width="22" height="14" rx="3" fill="#3b2f26"/>
<rect x="200" y="440" width="800" height="250" rx="30" fill="#6b7788"/><rect x="180" y="560" width="76" height="212" rx="28" fill="#657183"/><rect x="944" y="560" width="76" height="212" rx="28" fill="#657183"/><rect x="250" y="660" width="700" height="112" rx="16" fill="#5f6b7c"/>
<g fill="url(#cu)"><rect x="268" y="468" width="216" height="180" rx="24"/><rect x="492" y="468" width="216" height="180" rx="24"/><rect x="716" y="468" width="216" height="180" rx="24"/><rect x="262" y="640" width="228" height="82" rx="20"/><rect x="486" y="640" width="228" height="82" rx="20"/><rect x="710" y="640" width="228" height="82" rx="20"/></g>
<rect x="296" y="520" width="84" height="84" rx="14" fill="#d9a35b" transform="rotate(-9 338 562)"/><rect x="820" y="526" width="84" height="84" rx="14" fill="#b9553e" transform="rotate(8 862 568)"/>
<path d="M62 700h74l-10 72H72z" fill="#b4553f"/><g fill="#4f7a4a"><ellipse cx="99" cy="640" rx="14" ry="60" transform="rotate(-24 99 640)"/><ellipse cx="99" cy="630" rx="14" ry="64"/><ellipse cx="99" cy="640" rx="14" ry="58" transform="rotate(24 99 640)"/></g><g fill="#5f9158"><ellipse cx="99" cy="650" rx="12" ry="46" transform="rotate(-48 99 650)"/><ellipse cx="99" cy="650" rx="12" ry="46" transform="rotate(48 99 650)"/></g>
<path d="M1110 340V770" stroke="#2f2f2f" stroke-width="7"/><ellipse cx="1110" cy="772" rx="36" ry="8" fill="#2f2f2f"/><path d="M1068 250h84l-16 84h-52z" fill="#f4ead3"/><path d="M1068 250h84l-16 84h-52z" fill="#fff" opacity=".25"/></svg>`;
const st3={rx:6,ry:-24};
const CLIP={Hexagon:"polygon(25% 3%,75% 3%,100% 50%,75% 97%,25% 97%,0 50%)",Star:"polygon(50% 0,61% 35%,98% 35%,68% 57%,79% 91%,50% 70%,21% 91%,32% 57%,2% 35%,39% 35%)",Circle:"circle(50%)",Diamond:"polygon(50% 0,100% 50%,50% 100%,0 50%)",Octagon:"polygon(30% 0,70% 0,100% 30%,100% 70%,70% 100%,30% 100%,0 70%,0 30%)"};
const st={shape:"Rectangle",size:1,orient:"Portrait",finish:"Gloss",mount:"Standard",enh:"None",qty:1,img:null,zoom:1,ox:0,oy:0,rot:0,url:null};
function dims(){let[w,h]=CONFIG.sizes[st.size];if(st.shape!=="Rectangle"){const m=Math.min(w,h);return[m,m]}if(w===h)return[w,h];const p=Math.min(w,h),l=Math.max(w,h);return st.orient==="Landscape"?[l,p]:[p,l]}
function radios(id,name,vals,cur,fn){const el=$(id);el.innerHTML=vals.map(([v,l])=>`<label><input type="radio" name="${name}" value="${v}" ${String(v)===String(cur)?"checked":""}><span>${l}</span></label>`).join("");
 el.onchange=e=>{fn(e.target.value);update()}}
function sizeOpts(){const seen=new Set(),rect=st.shape==="Rectangle";
 const list=CONFIG.sizes.map((z,i)=>[i,rect?z[0]+" × "+z[1]:Math.min(...z)+" in"]).filter(x=>rect||(!seen.has(x[1])&&seen.add(x[1])));
 if(!list.some(x=>x[0]==st.size))st.size=list[0][0];radios("#sizes","size",list,st.size,v=>st.size=+v)}
function scene(){const w=$("#wall");w.classList.add("scale");
 w.insertAdjacentHTML("beforebegin",'<div class="viewtog" role="group" aria-label="Preview view"><button type="button" data-v="scene" class="on">Room view</button><button type="button" data-v="3d">3D view</button><span class="vzc"><span>Zoom view</span><button type="button" data-vz="-" aria-label="Zoom out">−</button><button type="button" data-vz="+" aria-label="Zoom in">+</button><button type="button" data-vz="0">Reset</button></span><small>In 3D view, drag the poster to rotate it (double-click resets). Ctrl + mouse wheel also zooms the view.</small></div>');
 document.querySelector(".viewtog").onclick=e=>{const d=e.target.dataset;if(d.vz!==undefined){vz=d.vz==="0"?1:Math.max(1,Math.min(5,vz*(d.vz==="+"?1.3:1/1.3)));draw();return}const v=d.v;if(!v)return;view=v;$$(".viewtog [data-v]").forEach(b=>b.classList.toggle("on",b.dataset.v===v));draw()};
 w.insertAdjacentHTML("afterbegin",'<div class="shadow3d" aria-hidden="true"></div>');w.insertAdjacentHTML("afterbegin",ROOM);
 w.insertAdjacentHTML("afterend",'<div class="swatches"><span>Wall:</span>'+[["#e9e4dc","Warm white"],["#b7c4b0","Sage"],["#3a3d42","Charcoal"]].map(c=>`<button type="button" style="background:${c[0]}" aria-label="${c[1]} wall" data-w="${c[0]}"></button>`).join("")+'<small style="color:var(--muted)">Shown to scale: the sofa is 84 in wide.</small></div>');
 document.querySelector(".swatches").onclick=e=>{if(e.target.dataset.w)w.style.setProperty("--wallc",e.target.dataset.w)};
 const stg=document.createElement("div");stg.className="stage";[...w.children].forEach(c=>stg.append(c));w.append(stg);
 w.addEventListener("wheel",e=>{if(!e.ctrlKey)return;e.preventDefault();vz=Math.max(1,Math.min(5,vz*(e.deltaY<0?1.12:1/1.12)));draw()},{passive:false})}
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
function fx3(on){const pw=$("#pw");pw.querySelectorAll(".lay,.sheen").forEach(e=>e.remove());
 pw.style.transform=on?`translate(-50%,-50%) rotateX(${st3.rx}deg) rotateY(${st3.ry}deg)`:"";if(!on)return;
 const clip=CLIP[st.shape]||"none";for(let i=1;i<=6;i++){const d=document.createElement("div");d.className="lay";d.style.cssText=`transform:translateZ(${-i*1.2}px);background:hsl(215,8%,${68-i*3}%);clip-path:${clip}`;pw.prepend(d)}
 if(st.finish==="Gloss"){const sh=document.createElement("div"),x=Math.max(0,Math.min(100,50+st3.ry*.7)),y=Math.max(0,Math.min(100,50-st3.rx*.8));sh.className="sheen";
  sh.style.cssText=`clip-path:${clip};transform:translateZ(1px);background:linear-gradient(105deg,rgba(255,255,255,0) 34%,rgba(255,255,255,.6) 46%,rgba(255,255,255,.12) 54%,rgba(255,255,255,0) 64%) ${x}% 0/260% 100% no-repeat,linear-gradient(180deg,rgba(255,255,255,.26),rgba(255,255,255,0) 50%) 0 ${y}%/100% 200% no-repeat`;pw.append(sh)}}
function draw(){
 const[w,h]=dims();const wall=$("#wall");if(!wall.classList.contains("scale"))scene();const pw=$("#pw"),t3=view==="3d";wall.classList.toggle("three",t3);
 const s=t3?Math.min(wall.clientHeight*.7/h,wall.clientWidth*.55/w):wall.clientWidth/120;
 pw.style.width=w*s+"px";pw.style.height=h*s+"px";pw.className="panelwrap"+(st.mount==="Floating"?" float":"")+(t3?" d3":"");
 cv.style.clipPath=CLIP[st.shape]||"none";fx3(t3);const stg=wall.querySelector(".stage");if(stg){stg.style.transformOrigin=t3?"50% 50%":"50% 30%";const dy=t3?0:wall.clientHeight*.2*Math.min(1,(vz-1)/1.5);stg.style.transform="translate(0,"+dy+"px) scale("+vz+")"}
 const dpr=1,RES=1600/Math.max(w,h);cv.width=Math.round(w*RES);cv.height=Math.round(h*RES);cx.setTransform(1,0,0,1,0,0);cx.fillStyle="#8a8a8a";cx.fillRect(0,0,cv.width,cv.height);
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
pw.ondblclick=()=>{if(view==="3d"){st3.rx=6;st3.ry=-24;draw()}};
pw.onpointerdown=e=>{drag={x:e.clientX,y:e.clientY};pw.setPointerCapture(e.pointerId)};
pw.onpointermove=e=>{if(drag&&view==="3d"){st3.ry=Math.max(-50,Math.min(50,st3.ry+(e.clientX-drag.x)*.4));st3.rx=Math.max(-30,Math.min(30,st3.rx-(e.clientY-drag.y)*.3));drag={x:e.clientX,y:e.clientY};draw();return}if(!drag||!st.img)return;const r=pw.getBoundingClientRect();st.ox+=(e.clientX-drag.x)/r.width;st.oy+=(e.clientY-drag.y)/r.height;drag={x:e.clientX,y:e.clientY};clamp();draw()};
pw.onpointerup=()=>drag=null;
addEventListener("resize",draw);


$("#add").onclick=async()=>{
 const th=document.createElement("canvas");th.width=th.height=128;const c=th.getContext("2d");const s=Math.max(128/cv.width,128/cv.height);c.drawImage(cv,0,0,cv.width*s,cv.height*s);
 Cart.add({shape:st.shape,file:await uploadDesign(st.file),name:"Custom Metal Print",d:dims(),finish:st.finish,mount:st.mount,enh:st.enh,qty:st.qty,thumb:th.toDataURL("image/jpeg",.7)});toast("Added to cart");openCart()};
{const q=new URLSearchParams(location.search).get("shape");if(q&&CONFIG.rules.shape[q])st.shape=q}
build();if(st.shape!=="Rectangle")$("#orient").parentElement.style.display="none";update();
