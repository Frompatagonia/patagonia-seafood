const fs = require('fs');
const path = require('path');

const AR_TZ = 'America/Argentina/Buenos_Aires';
const FEEDS = [
  { url: 'https://www.pescare.com.ar/feed/', source: 'Pescare' },
  { url: 'https://revistapuerto.com.ar/feed/', source: 'Revista Puerto' },
  { url: 'https://revistapuerto.com.ar/feed/?paged=2', source: 'Revista Puerto' },
  { url: 'https://revistapuerto.com.ar/feed/?paged=3', source: 'Revista Puerto' },
  { url: 'https://www.revistaredes.com.ar/feed/', source: 'Revista Redes' },
  {
    url: 'https://news.google.com/rss/search?q=site%3Aseafoodsource.com&hl=en-US&gl=US&ceid=US%3Aen',
    source: 'SeafoodSource News'
  }
];

function decodeEntities(value) {
  return String(value || '')
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCharCode(parseInt(code, 16)))
    .replace(/&nbsp;/gi, ' ')
    .replace(/&quot;/gi, '"')
    .replace(/&apos;/gi, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&amp;/gi, '&');
}

function stripHtml(value) {
  return decodeEntities(String(value || '').replace(/<[^>]*>/g, ' '))
    .replace(/\s+/g, ' ')
    .trim();
}

function cleanTitle(value) {
  return stripHtml(value)
    .replace(/\s+-\s+SeafoodSource$/i, '')
    .replace(/\s+\|\s+SeafoodSource$/i, '')
    .trim();
}

function extractTag(item, tagName) {
  const match = item.match(new RegExp(`<${tagName}[^>]*>([\\s\\S]*?)</${tagName}>`, 'i'));
  if (!match) return '';
  const value = match[1].trim();
  const cdata = value.match(/^<!\[CDATA\[([\s\S]*?)\]\]>$/);
  return cdata ? cdata[1].trim() : value;
}

function dateOnly(value) {
  const date = value ? new Date(value) : new Date();
  if (Number.isNaN(date.getTime())) {
    return new Date().toLocaleDateString('en-CA', { timeZone: AR_TZ });
  }
  return date.toLocaleDateString('en-CA', { timeZone: AR_TZ });
}

async function fetchRSS(feed) {
  try {
    const res = await fetch(feed.url, {
      headers: {
        'User-Agent': 'FromPatagoniaNewsBot/1.0 (+https://frompatagonia.github.io/patagonia-seafood/)',
        Accept: 'application/rss+xml,application/xml,text/xml,text/html,*/*'
      },
      signal: AbortSignal.timeout(20000)
    });
    if (!res.ok) {
      console.warn(`Feed sin respuesta: ${feed.source} (${res.status}) ${feed.url}`);
      return null;
    }
    const xml = await res.text();
    const items = [];
    const itemRegex = /<item>([\s\S]*?)<\/item>/gi;
    let match;
    while ((match = itemRegex.exec(xml)) !== null) {
      const item = match[1];
      const title = cleanTitle(extractTag(item, 'title'));
      const link = decodeEntities(extractTag(item, 'link'));
      const desc = stripHtml(extractTag(item, 'description'));
      const pubDate = extractTag(item, 'pubDate');
      if (title && link) {
        items.push({
          fecha: dateOnly(pubDate),
          titulo: title,
          fuente: feed.source,
          url: link,
          resumen: desc || title
        });
      }
    }
    return items;
  } catch (error) {
    console.warn(`Feed con error: ${feed.source} ${feed.url} ${error.message}`);
    return null;
  }
}

async function scrapeIngresoBuques() {
  try {
    const res = await fetch('https://pescare.com.ar/ingreso-de-buques-a-puerto/', {
      headers: { 'User-Agent': 'FromPatagoniaNewsBot/1.0' },
      signal: AbortSignal.timeout(20000)
    });
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
      fecha: dateOnly(),
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
    const res = await fetch('https://pescare.com.ar/buques-operando/', {
      headers: { 'User-Agent': 'FromPatagoniaNewsBot/1.0' },
      signal: AbortSignal.timeout(20000)
    });
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
      fecha: dateOnly(),
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
    const res = await fetch('https://www.magyp.gob.ar/sitio/areas/pesca_maritima/monitoreo/', {
      headers: { 'User-Agent': 'FromPatagoniaNewsBot/1.0' },
      signal: AbortSignal.timeout(20000)
    });
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
      fecha: dateOnly(),
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
    const res = await fetch('https://www.magyp.gob.ar/sitio/areas/pesca_maritima/desembarques/', {
      headers: { 'User-Agent': 'FromPatagoniaNewsBot/1.0' },
      signal: AbortSignal.timeout(20000)
    });
    if (!res.ok) return null;
    const html = await res.text();
    const years = [];
    const yearRegex = /(20\d{2})[^<]*?(?:Por especie y flota|Por especie y puerto|Capturas)/gi;
    let m;
    while ((m = yearRegex.exec(html)) !== null) {
      if (!years.includes(m[1])) years.push(m[1]);
    }
    return {
      fecha: dateOnly(),
      titulo: 'Desembarques de Capturas Marítimas (' + years[0] + ')',
      fuente: 'MAGyP',
      url: 'https://www.magyp.gob.ar/sitio/areas/pesca_maritima/desembarques/',
      resumen: 'Estadísticas oficiales de desembarques por especie, flota y puerto. Datos disponibles: ' + years.join(', ') + '.'
    };
  } catch {
    return null;
  }
}

async function main() {
  let allItems = [];

  const feeds = await Promise.all(FEEDS.map(fetchRSS));
  for (const items of feeds) {
    if (items) allItems = allItems.concat(items);
  }

  const scraped = await Promise.all([scrapeIngresoBuques(), scrapeBuquesOperando(), scrapeMonitoreo(), scrapeDesembarques()]);
  for (const item of scraped) {
    if (item) allItems.push(item);
  }

  const filePath = path.join(__dirname, '..', 'data', 'noticias.json');
  let existing = [];
  try { existing = JSON.parse(fs.readFileSync(filePath, 'utf-8')); } catch {}

  const mergedMap = new Map();
  for (const item of existing) mergedMap.set(item.url || item.titulo, item);
  for (const item of allItems) mergedMap.set(item.url || item.titulo, item);
  const merged = [...mergedMap.values()].sort((a, b) => {
    const byDate = String(b.fecha).localeCompare(String(a.fecha));
    return byDate || String(a.fuente).localeCompare(String(b.fuente));
  });

  const balanced = [];
  const sourceCounts = {};
  for (const item of merged) {
    const source = item.fuente || 'Sector Pesquero';
    const count = sourceCounts[source] || 0;
    if (count < 40) {
      balanced.push(item);
      sourceCounts[source] = count + 1;
    }
  }

  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(balanced.slice(0, 160), null, 2));

  const counts = {};
  for (const item of balanced) counts[item.fuente] = (counts[item.fuente] || 0) + 1;
  console.log(`Noticias actualizadas: ${allItems.length} de feeds, ${merged.length} total -> ${filePath}`);
  console.log('Fuentes:', counts);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
