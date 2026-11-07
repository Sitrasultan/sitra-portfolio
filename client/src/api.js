const API=import.meta.env.VITE_API_URL||'';
export const api=(p,o={},t)=>fetch(API+'/api'+p,{...o,headers:{'Content-Type':'application/json',...(t&&{Authorization:'Bearer '+t})},body:o.body&&JSON.stringify(o.body)}).then(async r=>{const d=await r.json();if(!r.ok)throw new Error(d.error||'Request failed');return d});
export const img=u=>u?(u.startsWith('/')?API+u:u):'';
export const upload=async(file,t)=>{const fd=new FormData();fd.append('image',file);const r=await fetch(API+'/api/upload',{method:'POST',headers:{Authorization:'Bearer '+t},body:fd});const d=await r.json();if(!r.ok)throw new Error(d.error||'Upload failed');return d.url};
