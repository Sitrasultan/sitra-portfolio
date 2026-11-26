import {useEffect,useRef,useState} from 'react';import {api,img} from './api.js';
const R=({c='',children,...p})=>{const r=useRef();useEffect(()=>{const o=new IntersectionObserver(([e])=>{if(e.isIntersecting){r.current.classList.add('in');o.disconnect()}},{threshold:.15});o.observe(r.current);return()=>o.disconnect()},[]);return <div ref={r} className={'r '+c} {...p}>{children}</div>};
const Sky=()=>{const ref=useRef();useEffect(()=>{const c=ref.current,x=c.getContext('2d'),css=getComputedStyle(document.documentElement);let W,H,P=[],m={x:-999,y:-999},id;const rm=matchMedia('(prefers-reduced-motion:reduce)').matches;
const rs=()=>{W=c.width=c.offsetWidth;H=c.height=c.offsetHeight;P=Array.from({length:Math.min(70,W/18|0)},()=>({x:Math.random()*W,y:Math.random()*H,vx:(Math.random()-.5)*.35,vy:(Math.random()-.5)*.35,r:Math.random()*1.8+.8}))};rs();
const mv=e=>{const b=c.getBoundingClientRect();m={x:e.clientX-b.left,y:e.clientY-b.top}};addEventListener('resize',rs);c.parentElement.addEventListener('pointermove',mv);
const dr=()=>{const a=css.getPropertyValue('--a').trim()||'#4FD1A1',s=css.getPropertyValue('--sun').trim()||'#F0BA1F';x.clearRect(0,0,W,H);
P.forEach((p,i)=>{if(!rm){p.x+=p.vx;p.y+=p.vy}if(p.x<0||p.x>W)p.vx*=-1;if(p.y<0||p.y>H)p.vy*=-1;x.globalAlpha=.9;x.fillStyle=i%7?a:s;x.beginPath();x.arc(p.x,p.y,p.r,0,7);x.fill();
for(let j=i+1;j<P.length;j++){const q=P[j],d=Math.hypot(p.x-q.x,p.y-q.y);if(d<120){x.globalAlpha=(1-d/120)*.35;x.strokeStyle=a;x.beginPath();x.moveTo(p.x,p.y);x.lineTo(q.x,q.y);x.stroke()}}
if(Math.hypot(p.x-m.x,p.y-m.y)<160){x.globalAlpha=.6;x.strokeStyle=s;x.beginPath();x.moveTo(p.x,p.y);x.lineTo(m.x,m.y);x.stroke()}});if(!rm)id=requestAnimationFrame(dr)};dr();
return()=>{cancelAnimationFrame(id);removeEventListener('resize',rs)}},[]);return <canvas id="sky" ref={ref} aria-hidden="true"/>};
const Role=()=>{const L=['MERN stack developer','MIS professional','Prompt engineer'],[t,setT]=useState('');useEffect(()=>{let i=0,c=0,d=false,k;const f=()=>{const w=L[i];c+=d?-1:1;setT(w.slice(0,c));let ms=d?35:70;if(!d&&c===w.length){d=true;ms=1400}else if(d&&c===0){d=false;i=(i+1)%L.length;ms=300}k=setTimeout(f,ms)};f();return()=>clearTimeout(k)},[]);return <div className="role">{t}</div>};
const Shot=({p})=>{const [bad,setBad]=useState(false);const src=p.imageUrl?img(p.imageUrl):p.liveUrl?'https://image.thum.io/get/width/900/crop/600/'+p.liveUrl:'';return src&&!bad?<img className="shot" src={src} alt={p.title+' home page'} loading="lazy" onError={()=>setBad(true)}/>:<div className="shot ph"><span>🖼️ Add a screenshot</span></div>};



const Gallery = ({ p }) => {
  const images = [
    ...new Set([
      ...(p.imageUrl ? [p.imageUrl] : []),
      ...(p.screenshots || [])
    ])
  ];

  const [active, setActive] = useState(0);

  useEffect(() => {
    setActive(0);
  }, [p._id]);

  const next = () => {
    setActive(current =>
      current >= images.length - 1 ? 0 : current + 1
    );
  };

  const prev = () => {
    setActive(current =>
      current <= 0 ? images.length - 1 : current - 1
    );
  };

  if (!images.length) {
    return (
      <div className="project-gallery-empty">
        No screenshots uploaded yet.
      </div>
    );
  }

  return (
    <div className="project-gallery">

      <div className="gallery-main">
        <img
          key={images[active]}
          src={img(images[active])}
          alt={`${p.title} screenshot ${active + 1}`}
          onError={e => {
            e.currentTarget.style.visibility = "hidden";
          }}
        />

        {images.length > 1 && (
          <>
            <button
              type="button"
              className="gallery-arrow left"
              onClick={prev}
              aria-label="Previous screenshot"
            >
              &#10094;
            </button>

            <button
              type="button"
              className="gallery-arrow right"
              onClick={next}
              aria-label="Next screenshot"
            >
              &#10095;
            </button>

            <span className="gallery-count">
              {active + 1} / {images.length}
            </span>
          </>
        )}
      </div>

      {images.length > 1 && (
        <>
          <div className="gallery-pagination">
            {images.map((url, index) => (
              <button
                key={url + index}
                type="button"
                className={active === index ? "active" : ""}
                onClick={() => setActive(index)}
                aria-label={`Go to screenshot ${index + 1}`}
              />
            ))}
          </div>

          <div className="gallery-thumbnails">
            {images.map((url, index) => (
              <button
                key={url + index}
                type="button"
                className={active === index ? "selected" : ""}
                onClick={() => setActive(index)}
              >
                <img src={img(url)} alt={`Screenshot ${index + 1}`} />
              </button>
            ))}
          </div>
        </>
      )}

    </div>
  );
};


const ProjectDescription = ({ text }) => {
  const paragraphs = (text || '')
    .split('\n')
    .map(line => line.trim())
    .filter(Boolean);

  return (
    <div className="project-description">
      <span className="description-label">ABOUT THIS PROJECT</span>
      {paragraphs.length ? (
        paragraphs.map((paragraph, index) => (
          <p key={index}>{paragraph}</p>
        ))
      ) : (
        <p>No project description available yet.</p>
      )}
    </div>
  );
};
const Links=({p})=><div className="btns">{p.liveUrl&&<a className="btn p" href={p.liveUrl} target="_blank" rel="noreferrer">Live demo ↗</a>}{p.githubUrl&&<a className="btn" href={p.githubUrl} target="_blank" rel="noreferrer">GitHub ↗</a>}{!p.liveUrl&&!p.githubUrl&&<span className="soon">Links coming soon</span>}</div>;
const SOCIAL=[['LinkedIn','https://www.linkedin.com/in/sitra-sultan-6a88a2353'],['GitHub','https://github.com/Sitrasultan'],['Instagram','https://instagram.com/si_sultan1140'],['Telegram','https://t.me/Rosewithblur']],EMAIL='sitrasultan1@gmail.com',CV_URL='/Sitra-Sultan-CV.pdf';
const Footer=()=>{const [t,setT]=useState(''),[g,setG]=useState(0),[cp,setCp]=useState(false);
useEffect(()=>{const f=()=>setT(new Intl.DateTimeFormat('en-GB',{hour:'2-digit',minute:'2-digit',timeZone:'Africa/Addis_Ababa'}).format(new Date()));f();const a=setInterval(f,30000),b=setInterval(()=>setG(x=>(x+1)%4),2200);return()=>{clearInterval(a);clearInterval(b)}},[]);
return <footer className="ft"><div className="w"><div className="fg"><div><h3 className="fbig">{['Selam','Akkam','Hello','مرحبا'][g]} 👋</h3><p>Let’s build something useful together.</p><span className="open"><i/>Open to internships and junior roles</span></div>
<div><b>Explore</b>{[['work','Projects'],['skills','Skills'],['certs','Certificates'],['path','Journey'],['contact','Contact']].map(([i,l])=><a key={i} href={'#'+i}>{l}</a>)}<a href={CV_URL} download>Download CV</a></div>
<div><b>Connect</b>{SOCIAL.map(([n,u])=><a key={n} href={u} target="_blank" rel="noreferrer">{n} ↗</a>)}</div>
<div><b>Get in touch</b><button className="copy" onClick={()=>{navigator.clipboard?.writeText(EMAIL);setCp(true);setTimeout(()=>setCp(false),1800)}}>{cp?'Copied ✓':EMAIL}</button><p className="soon">🇪🇹 Local time in Ethiopia: {t}</p></div></div>
<div className="fb"><span>© 2026 Sitra Sultan. Built with React, Node and MongoDB.</span><a href="#top" onClick={e=>{e.preventDefault();scrollTo({top:0,behavior:'smooth'})}}>Back to top ↑</a></div></div></footer>};
const SERVICES=[['🖥️','Frontend development','Responsive React interfaces that are fast and easy to use.'],['⚙️','Backend and APIs','Node, Express and Laravel services with clean, secure endpoints.'],['🗄️','Database design','MongoDB, MySQL and PostgreSQL schemas that scale with the app.'],['📦','Deployment','Docker and Git workflows so projects ship reliably.']];
const HABITS=[['Build in phases',90,'Every project is split into small phases that I finish one at a time.'],['Code every day',80,'Small, steady progress beats rare big pushes.'],['Learn by shipping',70,'I pick up new tools by using them in real projects.']];
const PATH=[['2026','Building a portfolio of full-stack apps','Guzoye, SplitEase and Habit Constellation, with Mahber next.'],['June to August 2025','Software Development Intern, Jimma University ICT Office','Worked on real software for the university.'],['Capstone','Led the ComputeX team of six','Planned, designed and delivered the final-year project.'],['University','BSc Information Science, Jimma University','Jimma Institute of Technology.']];
export default function App(){
 const [P,setP]=useState([]),[C,setC]=useState([]),[S,setS]=useState([]),[f,setF]=useState({name:'',email:'',message:''}),[msg,setMsg]=useState(null),[pr,setPr]=useState(0),[cat,setCat]=useState('All'),[sel,setSel]=useState(null);
 useEffect(()=>{api('/projects').then(setP).catch(()=>{});api('/certificates').then(setC).catch(()=>{});api('/skills').then(setS).catch(()=>{})},[]);
 useEffect(()=>{const h=()=>{const e=document.documentElement;setPr(e.scrollTop/(e.scrollHeight-e.clientHeight)*100)};addEventListener('scroll',h,{passive:true});return()=>removeEventListener('scroll',h)},[]);
 const send=async e=>{e.preventDefault();try{await api('/messages',{method:'POST',body:f});setMsg({ok:1,t:'Message sent. Thank you!'});setF({name:'',email:'',message:''})}catch(er){setMsg({t:er.message})}};
 const tech=[...new Set(['React','Node.js','Express','MongoDB','PostgreSQL','MySQL','Python','Laravel','Docker','Git'])],mq=[...tech,...tech];
 return <>
 <div id="bar" style={{width:pr+'%'}}/>
 <header><div className="w"><b>Sitra Sultan</b><nav>{['about','skills','work','certs','habits','path','contact'].map(i=><a key={i} href={'#'+i}>{{about:'About',skills:'Skills',work:'Projects',certs:'Certificates',habits:'Habits',path:'Journey',contact:'Contact'}[i]}</a>)}</nav></div></header>
 <div className="hero"><Sky/><div className="w"><h1>Sitra Sultan</h1><Role/><p className="lead">I build complete web apps, from the database to the screen, and ship them in clear phases. Based in Ethiopia, building for Ethiopia and beyond.</p>
 <div className="btns"><a className="btn p" href="#work">View my projects</a><a className="btn" href="#contact">Hire me</a><a className="btn" href={CV_URL} download>Download CV</a></div>
 <div className="stats">{[[P.length,'Projects'],[tech.length,'Technologies'],[6,'Team members led'],[4,'Languages spoken']].map(([n,l])=><div className="stat" key={l}><b>{n}</b><span>{l}</span></div>)}</div></div></div>
 <div className="mq" aria-hidden="true"><div>{mq.map((t,i)=><span key={i}>{t}</span>)}</div></div>
 <section id="about"><div className="w about"><R c="avatar">S</R><R><h2 className="t">About me</h2><p>I’m a full-stack developer with a BSc in Information Science from Jimma University. I like turning real local problems, like tour booking, shared bills and community savings, into software people can use.</p><p>I’ve interned in the Jimma University ICT Office, led a six-person capstone team, and I work in English, Amharic, Afaan Oromo and Arabic.</p></R></div></section>
 <section className="alt"><div className="w"><h2 className="t">What I do</h2><p className="sub">From first idea to deployed app.</p><div className="grid">{SERVICES.map(([i,t,d])=><R c="card" key={t}><div className="ico">{i}</div><h3>{t}</h3><p>{d}</p></R>)}</div></div></section>
 <section id="skills"><div className="w"><h2 className="t">Skills</h2><p className="sub">Managed from my admin panel.</p><R c="sk">{S.map(s=><div key={s._id}><label>{s.name}<em>{s.level}%</em></label><div className="trk"><i style={{'--w':s.level+'%'}}/></div></div>)}</R></div></section>
 <section id="work" className="alt"><div className="w"><h2 className="t">Projects</h2><p className="sub">Real apps and interfaces I designed and built. Open any project to see its details, live demo and code.</p>
 <div className="tabs">{['All','Full-stack','Laravel','React','UI'].map(k=><button key={k} className={cat===k?'on':''} onClick={()=>setCat(k)}>{k}</button>)}</div>
 <div className="proj">{P.filter(p=>cat==='All'||p.category===cat).map(p=><div className="pc" key={p._id}><Shot p={p}/><div className="pb"><h3>{p.title}<span className={'st'+(['Planned','In progress'].includes(p.status)?' w2':'')}>{p.status}</span></h3><p>{p.summary}</p><div className="tags">{p.tags?.map(t=><span key={t}>{t}</span>)}</div><button className="btn p view" onClick={()=>setSel(p)}>View details</button></div></div>)}</div></div></section>
 {sel&&<div className="modal" onClick={()=>setSel(null)}><div className="mbox" role="dialog" aria-label={sel.title} onClick={e=>e.stopPropagation()}><Gallery p={sel}/><div className="pb"><button className="x" onClick={()=>setSel(null)}>Close ✕</button><h3>{sel.title}<span className="st">{sel.status}</span></h3> <ProjectDescription text={sel.details || sel.summary} /><div className="tags">{sel.tags?.map(t=><span key={t}>{t}</span>)}</div><Links p={sel}/></div></div></div>}
 <section id="certs"><div className="w"><h2 className="t">Certificates</h2><p className="sub">Add yours in the admin panel.</p><div className="grid">{C.length?C.map(c=><R c="cert" key={c._id}><h3>{c.title}</h3><p>{c.issuer}{c.year&&', '+c.year}</p>{c.url&&<p><a href={c.url} target="_blank" rel="noreferrer">Verify</a></p>}</R>):<R c="cert"><h3>BSc Information Science</h3><p>Jimma University</p></R>}</div></div></section>
 <section id="habits" className="alt"><div className="w"><h2 className="t">How I work</h2><p className="sub">Habits that keep my projects moving.</p><div className="hab">{HABITS.map(([t,p,d])=><R c="card" key={t}><div className="ring" style={{'--p':p}}><b>{p}%</b></div><h3>{t}</h3><p>{d}</p></R>)}</div></div></section>
 <section id="path"><div className="w"><h2 className="t">Journey</h2><div className="tl">{PATH.map(([s,t,d])=><R key={t}><small>{s}</small><h3>{t}</h3><p>{d}</p></R>)}</div></div></section>
 <section id="contact" className="alt"><div className="w"><h2 className="t">Let’s work together</h2><p className="sub">I’m open to internships and junior full-stack or backend roles.</p>
 <form className="form" onSubmit={send}>{['name','email'].map(k=><input key={k} type={k==='email'?'email':'text'} placeholder={'Your '+k} aria-label={k} value={f[k]} onChange={e=>setF({...f,[k]:e.target.value})}/>)}<textarea rows="4" placeholder="Tell me about the role or project" aria-label="Message" value={f.message} onChange={e=>setF({...f,message:e.target.value})}/><button className="btn p" type="submit">Send message</button>{msg&&<span className={msg.ok?'ok':'err'}>{msg.t}</span>}</form>
 <div className="soc"><a href={'mailto:'+EMAIL}>{EMAIL}</a>{SOCIAL.map(([n,u])=><a key={n} href={u} target="_blank" rel="noreferrer">{n}</a>)}<a href={CV_URL} download>Download CV</a></div></div></section>
 <Footer/></>}
