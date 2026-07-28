import{_}from"./preload-helper.BB_ImrUI.js";import{j as r}from"./jsx-runtime.TBa3i5EZ.js";import{r as a}from"./index.CVf8TyFT.js";import{w as M}from"./webp-utils.DIF5Iopg.js";function L({images:f,videos:k=[],interval:i=5e3,pauseOnHover:w=!0,syncWithMusic:p=!0}){const[s,d]=a.useState(0),[c,g]=a.useState(!0),[m,x]=a.useState(!1),[b,v]=a.useState(null),E=a.useRef(null),h=a.useRef(null),u=a.useRef([]),l=a.useRef(null),n=[...f.map((e,t)=>({...e,type:"image",index:t})),...k.map((e,t)=>({...e,type:"video",index:t+f.length}))];a.useEffect(()=>{typeof window<"u"&&_(()=>import("./audio-manager.CoLjmNho.js"),[]).then(e=>{l.current=e.getAudioManager()})},[]),a.useEffect(()=>{u.current=u.current.slice(0,n.length)},[n.length]),a.useEffect(()=>{u.current.forEach((e,t)=>{e&&(t===s?(e.currentTime=0,e.play().catch(()=>{})):e.pause())})},[s]);const o=a.useCallback(()=>{d(e=>(e+1)%n.length)},[n.length]),y=a.useCallback(()=>{d(e=>(e-1+n.length)%n.length)},[n.length]),C=a.useCallback(e=>{d(e)},[]);a.useEffect(()=>{if(!(!c||m))return h.current=setInterval(o,i),()=>{h.current&&clearInterval(h.current)}},[c,m,o,i]),a.useEffect(()=>{if(!c)return;const e=setTimeout(o,i);return()=>clearTimeout(e)},[s,c,i,o]);const I=()=>{w&&x(!0)},T=()=>{x(!1)},N=e=>{v(e.touches[0].clientX)},R=e=>{if(b===null)return;const t=b-e.changedTouches[0].clientX;Math.abs(t)>50&&(t>0?o():y()),v(null)},S=()=>{p&&l.current&&l.current.setVideoPlaying(!0),g(!1)},j=()=>{p&&l.current&&l.current.setVideoPlaying(!1),g(!0)};return r.jsxs("div",{ref:E,className:"fleet-carousel",onMouseEnter:I,onMouseLeave:T,onTouchStart:N,onTouchEnd:R,role:"region","aria-label":"Galería de flota",children:[r.jsx("div",{className:"carousel-track",style:{transform:`translateX(-${s*100}%)`},children:n.map((e,t)=>r.jsx("div",{className:"carousel-slide",children:e.type==="image"?r.jsx("div",{class:"watermark-container",style:{width:"100%",height:"100%"},children:r.jsx("img",{src:M(e.src),alt:e.alt,loading:"lazy",className:"carousel-image",style:{objectFit:"contain",width:"100%",height:"100%"}})}):r.jsx("video",{ref:P=>{u.current[t]=P},src:e.src,poster:e.poster,preload:"auto",className:"carousel-video",onPlay:S,onEnded:j,onPause:j,playsInline:!0,muted:!1,style:{objectFit:"contain",width:"100%",height:"100%"},children:r.jsx("track",{kind:"captions"})})},t))}),r.jsxs("div",{className:"carousel-controls","aria-label":"Controles de carrusel",children:[r.jsx("button",{className:"carousel-btn prev",onClick:y,"aria-label":"Anterior",disabled:n.length<=1,children:r.jsx("svg",{width:"24",height:"24",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",children:r.jsx("polyline",{points:"15 18 9 12 15 6"})})}),r.jsx("button",{className:"carousel-btn next",onClick:o,"aria-label":"Siguiente",disabled:n.length<=1,children:r.jsx("svg",{width:"24",height:"24",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",children:r.jsx("polyline",{points:"9 18 15 12 9 6"})})})]}),r.jsx("div",{className:"carousel-indicators","aria-label":"Indicadores de slide",children:n.map((e,t)=>r.jsx("button",{className:`indicator ${t===s?"active":""}`,onClick:()=>C(t),"aria-label":`Ir a slide ${t+1}`,"aria-current":t===s?"true":"false"},t))}),r.jsx("style",{jsx:!0,children:`
        .fleet-carousel {
          position: relative;
          width: 77%;
          margin: 0 auto;
          overflow: hidden;
          border-radius: 8px;
          background: var(--color-black);
        }
            .carousel-track {
            display: flex;
            transition: transform 0.5s ease;
            min-height: 358px;
          }
        .carousel-slide {
          flex-shrink: 0;
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 358px;
          max-height: 358px;
          background: var(--color-black);
        }
        .carousel-image,
        .carousel-video {
          max-width: 100%;
          max-height: 100%;
          object-fit: contain;
        }
        .carousel-controls {
          position: absolute;
          top: 50%;
          left: 0;
          right: 0;
          transform: translateY(-50%);
          display: flex;
          justify-content: space-between;
          padding: 0 1rem;
          pointer-events: none;
          opacity: 0.8;
          transition: opacity 0.3s ease;
        }
        .fleet-carousel:hover .carousel-controls {
          opacity: 1;
        }
        .carousel-btn {
          pointer-events: all;
          background: rgba(0, 0, 0, 0.5);
          border: none;
          border-radius: 50%;
          width: 48px;
          height: 48px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--color-white);
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .carousel-btn:hover:not(:disabled) {
          background: rgba(0, 0, 0, 0.8);
          transform: scale(1.1);
        }
        .carousel-btn:disabled {
          opacity: 0.3;
          cursor: not-allowed;
        }
        .carousel-indicators {
          position: absolute;
          bottom: 1rem;
          left: 50%;
          transform: translateX(-50%);
          display: flex;
          gap: 0.5rem;
          z-index: 10;
        }
        .indicator {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.5);
          border: none;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .indicator.active {
          background: var(--color-white);
          transform: scale(1.2);
        }
        .indicator:hover {
          background: var(--color-white);
        }
      `})]})}export{L as FleetCarousel};
