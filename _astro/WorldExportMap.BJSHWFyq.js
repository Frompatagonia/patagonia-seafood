const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["_astro/flota.CIGW-MKW.css"])))=>i.map(i=>d[i]);
import{_ as s}from"./preload-helper.BB_ImrUI.js";import{j as i}from"./jsx-runtime.TBa3i5EZ.js";import{r as l}from"./index.CVf8TyFT.js";const e={lat:-34.6,lng:-58.38},c=[{name:"EE.UU.",lat:38,lng:-97},{name:"Europa",lat:48,lng:10,isMain:!0},{name:"Rusia",lat:55,lng:37},{name:"Bielorrusia",lat:53.9,lng:27.5},{name:"Jordania",lat:31.9,lng:35.9},{name:"Israel",lat:31,lng:34.8},{name:"Egipto",lat:30,lng:31.2},{name:"Marruecos",lat:34,lng:-6.8},{name:"China",lat:35,lng:105,isMain:!0},{name:"Japón",lat:36,lng:138},{name:"Medio Oriente",lat:25,lng:45},{name:"Brasil",lat:-15,lng:-47},{name:"Venezuela",lat:10,lng:-66},{name:"Perú",lat:-12,lng:-77},{name:"Islas Mauricio",lat:-20.3,lng:57.5}];function f(){const t=l.useRef(null),n=l.useRef(null);return l.useEffect(()=>{if(!(n.current||!t.current))return(async()=>{const r=await s(()=>import("./leaflet-src.DTmlu4rB.js").then(a=>a.l),[]);await s(()=>Promise.resolve({}),__vite__mapDeps([0]));const o=r.map(t.current,{center:[20,0],zoom:2,zoomControl:!0,scrollWheelZoom:!1});r.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",{attribution:"&copy; OpenStreetMap contributors",maxZoom:18}).addTo(o);const p=r.divIcon({className:"dest-marker",html:`<div style="
          width: 24px; height: 24px;
          background: #D4AF37;
          border: 3px solid #1B3A5C;
          border-radius: 50%;
          box-shadow: 0 2px 8px rgba(0,0,0,0.4);
          display: flex; align-items: center; justify-content: center;
          font-size: 12px;
        ">★</div>`,iconSize:[24,24],iconAnchor:[12,12]});r.marker([e.lat,e.lng],{icon:p}).addTo(o).bindTooltip("Argentina (Origen)",{direction:"top",className:"dest-tooltip"}),c.forEach(a=>{const m=r.divIcon({className:"dest-marker",html:`<div style="
            width: ${a.isMain?"18px":"12px"};
            height: ${a.isMain?"18px":"12px"};
            background: #FFD700;
            border: 2px solid #1B3A5C;
            border-radius: 50%;
            box-shadow: 0 2px 6px rgba(0,0,0,0.3);
          "></div>`,iconSize:[a.isMain?18:12,a.isMain?18:12],iconAnchor:[a.isMain?9:6,a.isMain?9:6]});r.marker([a.lat,a.lng],{icon:m}).addTo(o).bindTooltip(a.name,{direction:"top",className:"dest-tooltip"})});const d={color:"#FFD700",weight:1.5,opacity:.5,dashArray:"6,8"};c.forEach(a=>{r.polyline([[e.lat,e.lng],[a.lat,a.lng]],d).addTo(o)}),n.current=o})(),()=>{n.current&&(n.current.remove(),n.current=null)}},[]),i.jsxs("div",{children:[i.jsx("div",{ref:t,className:"world-map"}),i.jsx("style",{children:`
        .world-map {
          width: 100%;
          height: 500px;
          border-radius: 12px;
          overflow: hidden;
          border: 2px solid var(--color-border);
        }
        .dest-tooltip {
          font-family: sans-serif;
          font-size: 12px;
          font-weight: 600;
          color: #1B3A5C;
          background: rgba(255,255,255,0.95);
          border: 1px solid #D4AF37;
          border-radius: 6px;
          padding: 3px 8px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.15);
        }
      `})]})}export{f as default};
