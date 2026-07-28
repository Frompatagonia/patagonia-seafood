const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["_astro/flota.CIGW-MKW.css"])))=>i.map(i=>d[i]);
import{_ as s}from"./preload-helper.BB_ImrUI.js";import{j as t}from"./jsx-runtime.TBa3i5EZ.js";import{r as i}from"./index.CVf8TyFT.js";const m=[{name:"Mar del Plata",lat:-38,lng:-57.5,isMain:!0},{name:"San Antonio Oeste",lat:-40.7,lng:-64.9},{name:"Punta Colorada",lat:-41.6,lng:-65.35},{name:"Puerto Madryn",lat:-42.77,lng:-65.04},{name:"Rawson",lat:-43.3,lng:-65.1},{name:"Bahía Camarones",lat:-44.8,lng:-65.7},{name:"Comodoro Rivadavia",lat:-45.87,lng:-67.48},{name:"Caleta Paula",lat:-46,lng:-67.5}];function f(){const n=i.useRef(null),r=i.useRef(null);return i.useEffect(()=>{if(!(r.current||!n.current))return(async()=>{const o=await s(()=>import("./leaflet-src.DTmlu4rB.js").then(a=>a.l),[]);await s(()=>Promise.resolve({}),__vite__mapDeps([0]));const e=o.map(n.current,{center:[-40,-63],zoom:5,zoomControl:!0,scrollWheelZoom:!1});o.tileLayer("https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png",{attribution:'&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>, &copy; CARTO',maxZoom:18}).addTo(e),m.forEach(a=>{const c=a.isMain?"#D4AF37":"#4A90D9",p=o.divIcon({className:"port-marker",html:`<div style="
            width: ${a.isMain?"20px":"14px"};
            height: ${a.isMain?"20px":"14px"};
            background: ${c};
            border: 3px solid #1B3A5C;
            border-radius: 50%;
            box-shadow: 0 2px 6px rgba(0,0,0,0.4);
          "></div>`,iconSize:[a.isMain?20:14,a.isMain?20:14],iconAnchor:[a.isMain?10:7,a.isMain?10:7]});o.marker([a.lat,a.lng],{icon:p}).addTo(e).bindTooltip(a.name,{direction:"top",offset:[0,-8],className:"port-tooltip"})});const l=o.divIcon({className:"malvinas-label",html:`<div style="
          font-size: 11px;
          font-weight: 700;
          color: #1B3A5C;
          background: rgba(255,255,255,0.85);
          border: 1px solid #D4AF37;
          border-radius: 4px;
          padding: 2px 6px;
          white-space: nowrap;
          box-shadow: 0 1px 4px rgba(0,0,0,0.2);
        ">Malvinas</div>`,iconSize:[0,0],iconAnchor:[70,0]});o.marker([-51.7,-59],{icon:l,interactive:!1}).addTo(e);const d=[[-36,-52.5],[-36.5,-52],[-37,-51.5],[-37.5,-51],[-38,-50.5],[-38.5,-50],[-39,-49.8],[-39.5,-49.5],[-40,-49.3],[-40.5,-49],[-41,-48.8],[-41.5,-48.5],[-42,-48.4],[-42.5,-48.4],[-43,-48.5],[-43.5,-48.6],[-44,-48.8],[-44.5,-49],[-45,-49.3],[-45.5,-49.8],[-46,-50.3],[-46.5,-51],[-47,-51.8],[-47.5,-52.5],[-48,-53.3],[-48.5,-54],[-49,-54.8],[-49.5,-55.5],[-50,-56.3],[-50.5,-57],[-51,-57.8],[-51.5,-58.5],[-52,-59.3],[-52.5,-60],[-53,-60.8],[-53.5,-61.3],[-54,-62],[-54.5,-62.5],[-55,-63.5]];o.polyline(d,{color:"#D4AF37",weight:2,opacity:.6,dashArray:"8 6"}).addTo(e),r.current=e})(),()=>{r.current&&(r.current.remove(),r.current=null)}},[]),t.jsxs("div",{className:"map-wrapper",children:[t.jsx("div",{ref:n,className:"argentina-map"}),t.jsx("style",{children:`
        .argentina-map {
          width: 100%;
          height: 500px;
          border-radius: 12px;
          overflow: hidden;
          border: 2px solid var(--color-border);
        }
        .map-wrapper {
          position: relative;
        }
        .port-tooltip {
          font-family: sans-serif;
          font-size: 13px;
          font-weight: 600;
          color: #1B3A5C;
          background: rgba(255,255,255,0.95);
          border: 1px solid #D4AF37;
          border-radius: 6px;
          padding: 4px 10px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.15);
        }
      `})]})}export{f as default};
