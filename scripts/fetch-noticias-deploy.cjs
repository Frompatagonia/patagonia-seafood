const fs = require('fs');
const path = require('path');

const FEEDS = [
  'https://www.pescare.com.ar/feed/',
  'https://revistapuerto.com.ar/feed/'
];

async function fetchRSS(url) {
  try {
    const res = await fetch(url, { timeout: 10000 });
    if (!res.ok) return null;
    const xml = await res.text();
    const items = [];
    const itemRegex = /<item>([\s\S]*?)<\/item>/gi;
    let match;
    while ((match = itemRegex.exec(xml)) !== null) {
      const item = match[1];
      const title = (item.match(/<title[^>]*><!\[CDATA\[(.*?)\]\]><\/title>/) || item.match(/<title[^>]*>(.*?)<\/title>/))?.[1]?.trim();
      const link = (item.match(/<link[^>]*>(.*?)<\/link>/))?.[1]?.trim();
      const desc = (item.match(/<description[^>]*><!\[CDATA\[(.*?)\]\]><\/description>/) || item.match(/<description[^>]*>(.*?)<\/description>/))?.[1]?.replace(/<[^>]*>/g, '').trim();
      const pubDate = item.match(/<pubDate[^>]*>(.*?)<\/pubDate>/)?.[1]?.trim();
      const source = url.includes('pescare') ? 'Pescare' : url.includes('revistapuerto') ? 'Revista Puerto' : 'Sector Pesquero';
      if (title && link) {
        items.push({
          fecha: pubDate ? new Date(pubDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
          titulo: title,
          fuente: source,
          url: link,
          resumen: desc || title
        });
      }
    }
    return items;
  } catch {
    return null;
  }
}

async function scrapeIngresoBuques() {
  try {
    const res = await fetch('https://pescare.com.ar/ingreso-de-buques-a-puerto/', { timeout: 15000 });
    if (!res.ok) return null;
    const html = await res.text();
    const updateMatch = html.match(/ÚLTIMA ACTUALIZACIÓN:\s*([^<]+)/i);
    const rows = [];
    const tableMatch = html.match(/<table[\s\S]*?<\/table>/i);
    if (tableMatch) {
      const tdRegex = /<td[^>]*>([\s\S]*?)<\/td>/gi;
      const cells = [];
      let m;
      while ((m = tdRegex.exec(tableMatch[0])) !== null) {
        const c = m[1].replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim();
        if (c) cells.push(c);
      }
      for (let i = 0; i < cells.length - 1; i += 2) {
        if (cells[i].trim() && cells[i + 1] && /\d{2}:\d{2}/.test(cells[i + 1])) {
          rows.push(cells[i].trim() + ' - ' + cells[i + 1]);
        }
      }
    }
    return {
      fecha: new Date().toISOString().split('T')[0],
      titulo: 'Ingreso de Buques a Puerto de Mar del Plata',
      fuente: 'Pescare',
      url: 'https://pescare.com.ar/ingreso-de-buques-a-puerto/',
      resumen: rows.length > 0
        ? 'Buques programados: ' + rows.join(' | ') + '. ' + (updateMatch ? 'Actualización: ' + updateMatch[1].trim() : '')
        : 'Consulta los arribos diarios al puerto de Mar del Plata.'
    };
  } catch {
    return null;
  }
}

async function scrapeBuquesOperando() {
  try {
    const res = await fetch('https://pescare.com.ar/buques-operando/', { timeout: 15000 });
    if (!res.ok) return null;
    const html = await res.text();
    const zones = [];
    const zoneRegex = /(Zona\s+[^<]+)/gi;
    let match;
    while ((match = zoneRegex.exec(html)) !== null) {
      const z = match[1].replace(/^\d+\s*/, '').trim();
      if (z.length > 5 && !zones.includes(z)) zones.push(z);
    }
    return {
      fecha: new Date().toISOString().split('T')[0],
      titulo: 'Buques Operando en ZEE Argentina',
      fuente: 'Pescare',
      url: 'https://pescare.com.ar/buques-operando/',
      resumen: 'Mapa interactivo de buques reportando al sistema. Áreas: ' + (zones.length > 0 ? zones.join(' / ') : 'ZEE Argentina') + '.'
    };
  } catch {
    return null;
  }
}

async function scrapeMonitoreo() {
  try {
    const res = await fetch('https://www.magyp.gob.ar/sitio/areas/pesca_maritima/monitoreo/', { timeout: 15000 });
    if (!res.ok) return null;
    const html = await res.text();
    const zones = [];
    const zoneRegex = /(Zona\s+[^<]+)/gi;
    let m;
    while ((m = zoneRegex.exec(html)) !== null) {
      const z = m[1].replace(/^\d+\s*/, '').trim();
      if (z.length > 5 && !zones.includes(z)) zones.push(z);
    }
    return {
      fecha: new Date().toISOString().split('T')[0],
      titulo: 'Monitoreo Satelital de Buques Pesqueros',
      fuente: 'MAGyP',
      url: 'https://www.magyp.gob.ar/sitio/areas/pesca_maritima/monitoreo/',
      resumen: 'Monitoreo oficial de buques reportando al sistema. Áreas: ' + (zones.length > 0 ? zones.join(' / ') : 'ZEE Argentina') + '.'
    };
  } catch {
    return null;
  }
}

async function scrapeDesembarques() {
  try {
    const res = await fetch('https://www.magyp.gob.ar/sitio/areas/pesca_maritima/desembarques/', { timeout: 15000 });
    if (!res.ok) return null;
    const html = await res.text();
    const years = [];
    const yearRegex = /(20\d{2})[^<]*?(?:Por especie y flota|Por especie y puerto|Capturas)/gi;
    let m;
    while ((m = yearRegex.exec(html)) !== null) {
      if (!years.includes(m[1])) years.push(m[1]);
    }
    return {
      fecha: new Date().toISOString().split('T')[0],
      titulo: 'Desembarques de Capturas Marítimas (' + years[0] + ')',
      fuente: 'MAGyP',
      url: 'https://www.magyp.gob.ar/sitio/areas/pesca_maritima/desembarques/',
      resumen: 'Estadísticas oficiales de desembarques por especie, flota y puerto. Datos disponibles: ' + years.join(', ') + '.'
    };
  } catch {
    return null;
  }
}

function runFetch(url) {
  return fetchRSS(url);
}

async function main() {
  let allItems = [];

  const [pescare, revistapuerto] = await Promise.all(FEEDS.map(runFetch));
  if (pescare) allItems = allItems.concat(pescare);
  if (revistapuerto) allItems = allItems.concat(revistapuerto);

  const scraped = await Promise.all([scrapeIngresoBuques(), scrapeBuquesOperando(), scrapeMonitoreo(), scrapeDesembarques()]);
  for (const item of scraped) {
    if (item) allItems.push(item);
  }

  allItems.sort((a, b) => b.fecha.localeCompare(a.fecha));

  const filePath = path.join(__dirname, '..', 'data', 'noticias.json');
  let existing = [];
  try { existing = JSON.parse(fs.readFileSync(filePath, 'utf-8')); } catch {}

  const mergedMap = new Map();
  for (const item of existing) mergedMap.set(item.url + '|' + item.titulo, item);
  for (const item of allItems) mergedMap.set(item.url + '|' + item.titulo, item);
  const merged = [...mergedMap.values()].sort((a, b) => b.fecha.localeCompare(a.fecha));

  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(merged.slice(0, 60), null, 2));
  console.log(`Noticias actualizadas: ${allItems.length} de feeds, ${merged.length} total -> ${filePath}`);
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});