import{j as a}from"./jsx-runtime.TBa3i5EZ.js";import{r as d}from"./index.CVf8TyFT.js";import{w as g}from"./webp-utils.RZQNHNQo.js";function o(l){try{const t=window.__i18n;if(!t||t.lang==="es")return null;const s=l;return t.t[s]&&t.t[s]!==t.es[s]?t.t[s]:null}catch{return null}}function f({categories:l}){const[t,s]=d.useState(null),[,m]=d.useState(0);d.useEffect(()=>{const e=()=>m(r=>r+1);return window.addEventListener("i18n-ready",e),window.__i18n&&e(),()=>window.removeEventListener("i18n-ready",e)},[]);const p=e=>{s(r=>r===e?null:e)},v=(e,r)=>{e.currentTarget.src!==r&&(e.currentTarget.src=r)};return a.jsxs("div",{className:"product-accordion",role:"region","aria-label":"Catálogo de productos",children:[l.map(e=>a.jsxs("section",{className:`category-section${e.id==="elaborados"?" category-section--elaborados":""}`,children:[a.jsxs("div",{className:"category-header",children:[a.jsxs("h2",{className:"category-name",children:[a.jsxs("span",{className:"category-number",children:[e.number,"."]}),o("catalogo."+e.id+".name")||e.name,e.scientificName&&a.jsxs("span",{className:"scientific-name",children:["(",e.scientificName,")"]})]}),e.description&&a.jsx("p",{className:"category-description",children:o("catalogo."+e.id+".desc")||e.description})]}),a.jsx("div",{className:"subcategories",children:e.subcategories.map(r=>a.jsxs("article",{className:"subcategory-item",children:[a.jsxs("button",{className:"subcategory-trigger","aria-expanded":t===r.id,"aria-controls":`content-${r.id}`,onClick:()=>p(r.id),type:"button",children:[a.jsxs("span",{className:"subcategory-number",children:[r.number,".-"]}),a.jsx("span",{className:"subcategory-name",children:o("catalogo."+r.id+".name")||r.name}),a.jsx("svg",{className:"accordion-icon",width:"20",height:"20",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2","aria-hidden":"true",children:a.jsx("polyline",{points:"6 9 12 15 18 9"})})]}),a.jsx("div",{id:`content-${r.id}`,className:"subcategory-content",role:"region",hidden:t!==r.id,children:a.jsxs("div",{className:"subcategory-body",children:[r.description&&a.jsx("p",{className:"variety-desc",children:o("catalogo."+r.id+".desc")||r.description}),r.packing&&a.jsxs("p",{className:"variety-packing",children:[a.jsx("strong",{children:o("catalogo.packingLabel")||"Presentación / Empaque:"})," ",r.packing]}),r.varieties&&r.varieties.length>0&&a.jsxs("div",{className:"varieties-list",children:[a.jsx("p",{className:"varieties-heading",children:a.jsx("strong",{children:o("catalogo.varietiesLabel")||"Variedades y Fotos:"})}),r.varieties.map((i,n)=>a.jsxs("div",{className:"variety-item",children:[a.jsx("p",{className:"variety-name",children:o("catalogo."+r.id+".v."+n)||i.name}),i.images.length>0&&a.jsxs("div",{className:"variety-images",children:[i.images.map((c,h)=>a.jsx("figure",{className:`variety-image-item ${c.className||""}`,children:a.jsx("div",{className:"watermark-container",children:a.jsx("img",{src:g(c.src),alt:c.alt,loading:"lazy",onError:x=>v(x,c.src)})})},h)),i.video&&a.jsx("figure",{className:"variety-image-item enlarge-30",children:a.jsx("video",{src:i.video.src,poster:i.video.poster,controls:!0,preload:"metadata",className:"variety-video",playsInline:!0,children:a.jsx("track",{kind:"captions"})})})]})]},n))]}),(!r.varieties||r.varieties.length===0)&&r.images&&r.images.length>0&&a.jsx("div",{className:"gallery",children:r.images.map((i,n)=>a.jsx("figure",{className:`gallery-item ${i.className||""}`,children:a.jsx("div",{className:"watermark-container",children:a.jsx("img",{src:g(i.src),alt:i.alt,loading:"lazy"})})},n))})]})})]},r.id))})]},e.id)),a.jsx("style",{children:`
        .product-accordion {
          max-width: var(--container-max);
          margin: 0 auto;
        }
        .category-section {
          margin-bottom: var(--spacing-12);
          padding: var(--spacing-8);
          background: var(--color-bg-secondary);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-lg);
        }
        .category-header {
          margin-bottom: var(--spacing-8);
          padding-bottom: var(--spacing-6);
          border-bottom: 1px solid var(--color-border);
        }
        .category-name {
          display: flex;
          align-items: baseline;
          gap: var(--spacing-2);
          flex-wrap: wrap;
        }
        .category-number {
          color: var(--color-secondary);
          font-weight: 600;
        }
        .scientific-name {
          font-style: italic;
          font-weight: 400;
          color: var(--color-secondary);
          font-size: var(--font-size-xl);
          margin-left: var(--spacing-2);
        }
        .category-description {
          margin-top: var(--spacing-3);
          color: var(--color-text-secondary);
          line-height: 1.7;
        }
        .subcategory-item {
          border: 1px solid var(--color-border);
          border-radius: var(--radius-base);
          margin-bottom: calc(var(--spacing-4) + 3cm);
          overflow: hidden;
          background: var(--color-bg-primary);
        }
        .subcategory-trigger {
          width: 100%;
          display: flex;
          align-items: center;
          gap: var(--spacing-3);
          padding: var(--spacing-4) var(--spacing-5);
          background: linear-gradient(135deg, var(--color-bg-secondary), var(--color-bg-primary));
          border: 2px solid var(--color-primary);
          color: var(--color-text-primary);
          font-size: var(--font-size-lg);
          font-weight: 500;
          text-align: left;
          cursor: pointer;
          transition: background var(--transition-fast), box-shadow var(--transition-fast);
          border-radius: var(--radius-base);
        }
        .subcategory-trigger:hover {
          background: var(--color-primary);
          color: var(--color-white);
          box-shadow: 0 4px 16px rgba(26,75,122,0.3);
        }
        .subcategory-trigger:hover .subcategory-number {
          color: var(--color-secondary);
        }
        .subcategory-trigger .accordion-icon {
          color: var(--color-primary);
        }
        .subcategory-trigger:hover .accordion-icon {
          color: var(--color-white);
        }
        .subcategory-number {
          color: var(--color-secondary);
          font-weight: 600;
          flex-shrink: 0;
        }
        .subcategory-name {
          flex: 1;
        }
        .accordion-icon {
          flex-shrink: 0;
          color: var(--color-text-secondary);
          transition: transform var(--transition-fast);
        }
        .subcategory-trigger[aria-expanded="true"] .accordion-icon {
          transform: rotate(180deg);
        }
        .subcategory-content {
          overflow: hidden;
          max-height: 0;
          transition: max-height 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .subcategory-content[hidden="false"],
        .subcategory-content:not([hidden]) {
          max-height: 9999px;
        }
        .subcategory-body {
          padding: 0 var(--spacing-5) var(--spacing-5);
          border-top: 1px solid var(--color-border);
        }
        .variety-desc {
          margin-top: var(--spacing-4);
          color: var(--color-text-secondary);
          line-height: 1.7;
        }
        .variety-packing {
          margin-top: var(--spacing-2);
          font-size: var(--font-size-sm);
          color: var(--color-text-secondary);
        }
        .varieties-heading {
          margin-top: var(--spacing-5);
          margin-bottom: var(--spacing-3);
          color: var(--color-primary);
          font-size: var(--font-size-base);
        }
        .variety-item {
          margin-bottom: calc(var(--spacing-8) + 3cm);
          padding: var(--spacing-4);
          background: var(--color-bg-secondary);
          border-radius: var(--radius-base);
        }
        .variety-name {
          font-weight: 600;
          color: var(--color-text-primary);
          margin-bottom: var(--spacing-3);
        }
        .variety-images {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          gap: var(--spacing-6);
        }
        .variety-image-item {
          margin: 0;
        }
        .variety-image-item img {
          width: 100%;
          aspect-ratio: 4/3;
          object-fit: contain;
          border-radius: var(--radius-base);
          transition: transform var(--transition-base);
          max-height: 200px;
        }
        .variety-image-item.enlarge-30 {
          grid-column: span 1;
        }
        .variety-image-item.enlarge-30 img {
          max-height: 320px;
        }
        .variety-image-item.rotate-right img {
          transform: rotate(90deg);
          max-height: 480px;
          margin: var(--spacing-6) auto;
        }
        .variety-image-item.rotate-right:hover img {
          transform: rotate(90deg) scale(1.03);
        }
        .variety-image-item img:hover {
          transform: scale(1.03);
        }
        .variety-video {
          width: 100%;
          border-radius: var(--radius-base);
          max-height: 480px;
        }
        .gallery {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          gap: var(--spacing-6);
          margin-top: var(--spacing-4);
        }
        .gallery-item {
          margin: 0;
        }
        .gallery-item img {
          width: 100%;
          aspect-ratio: 4/3;
          object-fit: cover;
          border-radius: var(--radius-base);
        }
        .gallery-item.enlarge-30 {
          grid-column: span 1;
        }
        .gallery-item.enlarge-30 img {
          max-height: 320px;
        }
        .gallery-item.rotate-right img {
          transform: rotate(90deg);
          max-height: 480px;
        }
        .rotate-180 {
          transform: rotate(180deg);
        }
        .rotate-180 .watermark-container::after {
          bottom: auto;
          right: auto;
          top: 2%;
          left: 2%;
        }
        @media (max-width: 768px) {
          .category-section {
            padding: var(--spacing-5);
          }
          .subcategory-trigger {
            padding: var(--spacing-3) var(--spacing-4);
            font-size: var(--font-size-base);
          }
          .variety-images {
            grid-template-columns: repeat(2, 1fr);
          }
        }
      `})]})}export{f as ProductAccordion};
