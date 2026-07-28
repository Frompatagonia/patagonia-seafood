import{_ as F}from"./preload-helper.BB_ImrUI.js";import{j as e}from"./jsx-runtime.TBa3i5EZ.js";import{r as a}from"./index.CVf8TyFT.js";import{w as C}from"./webp-utils.RZQNHNQo.js";function G({images:h,videos:N=[],interval:g=6e3,pauseOnHover:E=!0,syncWithMusic:m=!0,showMosaic:V=!0,mosaicImages:p=[]}){const[s,n]=a.useState(0),[x,f]=a.useState(!0),[b,v]=a.useState(!1),[j,y]=a.useState(null),[S,d]=a.useState(!1),P=a.useRef(null),u=a.useRef(null),l=a.useRef([]),i=a.useRef(null),o=[...h.map((r,t)=>({...r,type:"image",index:t})),...N.map((r,t)=>({...r,type:"video",index:t+h.length}))];a.useEffect(()=>{typeof window<"u"&&F(()=>import("./audio-manager.CoLjmNho.js"),[]).then(r=>{i.current=r.getAudioManager()})},[]),a.useEffect(()=>{l.current=l.current.slice(0,o.length)},[o.length]),a.useEffect(()=>{l.current.forEach((r,t)=>{r&&(t===s?(r.currentTime=0,r.play().catch(()=>{})):r.pause())})},[s]);const c=a.useCallback(()=>{n(r=>(r+1)%o.length)},[o.length]),w=a.useCallback(()=>{n(r=>(r-1+o.length)%o.length)},[o.length]),R=a.useCallback(r=>{n(r)},[]);a.useEffect(()=>{if(!(!x||b))return u.current=setInterval(c,g),()=>{u.current&&clearInterval(u.current)}},[x,b,c,g]);const I=()=>{E&&v(!0)},M=()=>{v(!1)},T=r=>{y(r.touches[0].clientX)},_=r=>{if(j===null)return;const t=j-r.changedTouches[0].clientX;Math.abs(t)>50&&(t>0?c():w()),y(null)},z=()=>{m&&i.current&&i.current.setVideoPlaying(!0),f(!1)},k=()=>{m&&i.current&&i.current.setVideoPlaying(!1),f(!0)},B=()=>{d(!1)};return e.jsxs("div",{ref:P,className:"plant-carousel",onMouseEnter:I,onMouseLeave:M,onTouchStart:T,onTouchEnd:_,role:"region","aria-label":"Galería de plantas procesadoras",children:[S?e.jsxs("div",{className:"mosaic-modal",role:"dialog","aria-modal":"true","aria-label":"Galería mosaico de planta",children:[e.jsx("button",{className:"mosaic-close",onClick:B,"aria-label":"Cerrar galería",children:e.jsxs("svg",{width:"24",height:"24",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",children:[e.jsx("line",{x1:"18",y1:"6",x2:"6",y2:"18"}),e.jsx("line",{x1:"6",y1:"6",x2:"18",y2:"18"})]})}),e.jsx("div",{className:"mosaic-grid",children:p.map((r,t)=>e.jsx("div",{className:"mosaic-item",onClick:()=>{n(t),d(!1)},children:e.jsx("div",{class:"watermark-container",children:e.jsx("img",{src:C(r.src),alt:r.alt,loading:"lazy"})})},t))})]}):e.jsxs(e.Fragment,{children:[e.jsx("div",{className:"carousel-track",style:{transform:`translateX(-${s*100}%)`},children:o.map((r,t)=>e.jsx("div",{className:"carousel-slide",children:r.type==="image"?e.jsx("div",{class:"watermark-container",style:{width:"100%",height:"100%"},children:e.jsx("img",{src:C(r.src),alt:r.alt,loading:"lazy",className:"carousel-image"+(r.className?" "+r.className:""),style:{objectFit:"contain",width:"100%",height:"100%"}})}):e.jsx("video",{ref:X=>{l.current[t]=X},src:r.src,poster:r.poster,preload:"auto",className:"carousel-video",onPlay:z,onEnded:k,onPause:k,playsInline:!0,muted:!1,style:{objectFit:"contain",width:"100%",height:"100%"},children:e.jsx("track",{kind:"captions"})})},t))}),e.jsxs("div",{className:"carousel-controls","aria-label":"Controles de carrusel",children:[e.jsx("button",{className:"carousel-btn prev",onClick:w,"aria-label":"Video anterior",disabled:o.length<=1,children:e.jsx("svg",{width:"24",height:"24",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",children:e.jsx("polyline",{points:"15 18 9 12 15 6"})})}),e.jsx("button",{className:"carousel-btn next",onClick:c,"aria-label":"Video siguiente",disabled:o.length<=1,children:e.jsx("svg",{width:"24",height:"24",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",children:e.jsx("polyline",{points:"9 18 15 12 9 6"})})})]}),e.jsx("div",{className:"carousel-indicators","aria-label":"Indicadores de video",children:o.map((r,t)=>e.jsx("button",{className:`indicator ${t===s?"active":""}`,onClick:()=>R(t),"aria-label":`Ver video ${t+1}`,"aria-current":t===s?"true":"false"},t))}),V&&p.length>0&&e.jsxs("button",{className:"mosaic-toggle",onClick:()=>d(!0),"aria-label":"Ver galería completa",children:[e.jsxs("svg",{width:"24",height:"24",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",children:[e.jsx("rect",{x:"3",y:"3",width:"7",height:"7",rx:"1"}),e.jsx("rect",{x:"14",y:"3",width:"7",height:"7",rx:"1"}),e.jsx("rect",{x:"3",y:"14",width:"7",height:"7",rx:"1"}),e.jsx("rect",{x:"14",y:"14",width:"7",height:"7",rx:"1"})]}),e.jsx("span",{children:"Ver galería completa"})]})]}),e.jsx("style",{jsx:!0,children:`
        .plant-carousel {
          position: relative;
          width: 50%;
          margin: 0 auto;
          overflow: hidden;
          border-radius: 8px;
          background: var(--color-black);
        }
        .carousel-track {
          display: flex;
          transition: transform 1.2s cubic-bezier(0.25, 0.46, 0.45, 0.94);
          min-height: 300px;
        }
        .carousel-slide {
          flex-shrink: 0;
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 300px;
          max-height: 300px;
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
          opacity: 0;
          transition: opacity 0.3s ease;
        }
        .plant-carousel:hover .carousel-controls {
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
        .mosaic-toggle {
          position: absolute;
          bottom: 1rem;
          right: 1rem;
          background: rgba(0, 0, 0, 0.7);
          border: none;
          border-radius: 8px;
          padding: 0.75rem 1rem;
          color: var(--color-white);
          display: flex;
          align-items: center;
          gap: 0.5rem;
          cursor: pointer;
          font-size: 0.875rem;
          backdrop-filter: blur(4px);
          transition: all 0.2s ease;
          z-index: 10;
        }
        .mosaic-toggle:hover {
          background: rgba(0, 0, 0, 0.9);
        }
        .mosaic-modal {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.95);
          z-index: 1000;
          display: flex;
          flex-direction: column;
          padding: 2rem;
          overflow-y: auto;
        }
        .carousel-image.rotate-right {
          transform: rotate(90deg);
        }
        .carousel-image.rotate-left {
          transform: rotate(-90deg);
        }
        .mosaic-close {
          position: absolute;
          top: 1rem;
          right: 1rem;
          background: transparent;
          border: none;
          color: var(--color-white);
          cursor: pointer;
          padding: 0.5rem;
          z-index: 1001;
        }
        .mosaic-grid {
          flex: 1;
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 1rem;
          padding: 2rem 0;
        }
        .mosaic-item {
          aspect-ratio: 4/3;
          border-radius: 8px;
          overflow: hidden;
          cursor: pointer;
          transition: transform 0.2s ease;
        }
        .mosaic-item:hover {
          transform: scale(1.02);
        }
        .mosaic-item img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
      `})]})}export{G as PlantCarousel};
