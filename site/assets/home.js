function pop(){$("#pop").innerHTML=productCards(CONFIG.products.filter(p=>p[4]).concat(CONFIG.products.filter(p=>!p[4])).slice(0,4))}
pop();document.addEventListener("catalog",pop);