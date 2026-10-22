#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = path.resolve(__dirname, '..');
const NEWS_PATH = path.join(ROOT, 'data', 'noticias.json');
const STATE_PATH = path.join(ROOT, 'data', 'social-state.json');

const GRAPH_VERSION = process.env.GRAPH_VERSION || 'v23.0';
const GRAPH = `https://graph.facebook.com/${GRAPH_VERSION}`;
const PAGE_ID = process.env.PAGE_ID || '1208224315713852';
const IG_ID = process.env.IG_ID || '17841422750623274';
const SITE_URL = (process.env.SITE_URL || 'https://frompatagonia.github.io/patagonia-seafood/').replace(/\/?$/, '/');
const NEWS_IMAGE_URL = process.env.NEWS_IMAGE_URL || SITE_URL + 'og-default.jpg';

const args = new Set(process.argv.slice(2));
const modeArg = process.argv.find((a) => a.startsWith('--mode='));
const MODE = modeArg ? modeArg.split('=')[1] : args.has('--test') ? 'test' : args.has('--news') ? 'news' : args.has('--product') ? 'product' : 'auto';
const DRY_RUN = args.has('--dry-run');
const FORCE = args.has('--force');
const NO_FACEBOOK = args.has('--no-facebook');
const NO_INSTAGRAM = args.has('--no-instagram');

let activeToken = null;

const PRODUCTS = [
  {
    key: 'langostino',
    name: 'Langostino argentino',
    image: 'images/social/langostino.jpg',
    pdf: 'fichas/langostino.pdf',
    text: 'Langostino Pleoticus muelleri capturado en el Mar Argentino. Procesado a bordo y en tierra, con trazabilidad total y certificación internacional.'
  },
  {
    key: 'merluza',
    name: 'Merluza argentina',
    image: 'images/social/merluza.jpg',
    pdf: 'fichas/merluza.pdf',
    text: 'Merluza Merluccius hubbsi en filet y entera/HG, con procesamiento en plantas propias y estándares de calidad para los mercados más exigentes.'
  },
  {
    key: 'calamar',
    name: 'Calamar argentino',
    image: 'images/social/calamar.jpg',
    pdf: 'fichas/calamar.pdf',
    text: 'Calamar Illex argentinus con tecnología de pesca dirigida y procesamiento en planta, disponible en diferentes calibres.'
  },
  {
    key: 'variado',
    name: 'Variado costero',
    image: 'images/social/variado.jpg',
    pdf: 'fichas/besugo.pdf',
    text: 'Besugo, caballa, corvina, mero, pescadilla y pez palo. Especies del Mar Argentino seleccionadas para retail y gastronomía.'
  },
  {
    key: 'elaborados',
    name: 'Elaborados del mar',
    image: 'images/social/elaborados.jpg',
    pdf: 'catalogo/',
    text: 'Filets empanados y elaborados de pescado listos para retail, congelados y con el respaldo de nuestra planta de procesamiento.'
  }
];

function log(...parts) {
  console.log('[social]', ...parts);
}

function readJson(file, fallback) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch {
    return fallback;
  }
}

function loadState() {
  const raw = readJson(STATE_PATH, {});
  const state = {
    postedNews: raw.postedNews && typeof raw.postedNews === 'object' ? raw.postedNews : {},
    lastNewsPostDate: raw.lastNewsPostDate || null,
    lastProductPostDate: raw.lastProductPostDate || null,
    lastProductKey: raw.lastProductKey || null,
    updatedAt: raw.updatedAt || null
  };
  return state;
}

function saveState(state) {
  if (DRY_RUN) return;
  state.updatedAt = new Date().toISOString();
  fs.writeFileSync(STATE_PATH, JSON.stringify(state, null, 2) + '\n', 'utf8');
}

function getToken() {
  if (activeToken) return activeToken;
  const pageToken = process.env.META_PAGE_TOKEN;
  if (pageToken && pageToken.trim()) return pageToken.trim();
  const direct = process.env.META_TOKEN;
  if (direct && direct.trim()) return direct.trim();
  const file = process.env.META_TOKEN_FILE;
  if (file && fs.existsSync(file)) return fs.readFileSync(file, 'utf8').trim();
  throw new Error('Falta META_TOKEN o META_TOKEN_FILE. No se publicó nada.');
}

async function resolvePageToken() {
  if (activeToken) return activeToken;
  if (process.env.META_PAGE_TOKEN && process.env.META_PAGE_TOKEN.trim()) {
    activeToken = process.env.META_PAGE_TOKEN.trim();
    return activeToken;
  }
  const accounts = await graph('/me/accounts', { fields: 'id,name,access_token' });
  const page = (accounts.data || []).find((item) => String(item.id) === String(PAGE_ID));
  if (!page || !page.access_token) {
    throw new Error('No se encontró el token de la página. Verificá que el usuario sea administrador de From Patagonia Seafood.');
  }
  activeToken = page.access_token;
  log('Token de página resuelto para:', page.name);
  return activeToken;
}

async function graph(pathname, params = {}, method = 'GET') {
  const url = new URL(GRAPH + pathname);
  const body = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null) body.set(key, String(value));
  }
  body.set('access_token', getToken());

  let response;
  if (method === 'GET') {
    for (const [key, value] of body) url.searchParams.set(key, value);
    response = await fetch(url);
  } else {
    response = await fetch(url, { method, body });
  }

  const text = await response.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    json = { raw: text };
  }
  if (!response.ok || json.error) {
    const error = json.error || {};
    const detail = error.message || json.raw || text;
    throw new Error(`Graph ${method} ${pathname} HTTP ${response.status}: ${detail}`);
  }
  return json;
}

async function assertPublicImage(url) {
  const response = await fetch(url, { method: 'HEAD' });
  if (!response.ok) throw new Error(`La imagen no es pública (${response.status}): ${url}`);
  const type = response.headers.get('content-type') || '';
  if (!type.startsWith('image/')) throw new Error(`La URL no devuelve una imagen (${type}): ${url}`);
  return true;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function loadNews() {
  const data = readJson(NEWS_PATH, []);
  if (!Array.isArray(data)) return [];
  return data
    .filter((item) => item && item.titulo && item.fecha)
    .sort((a, b) => String(b.fecha).localeCompare(String(a.fecha)));
}

function newsKey(item) {
  if (item.url) return item.url;
  return crypto.createHash('sha1').update(`${item.titulo}|${item.fecha}`).digest('hex');
}

function isFresh(item, days = 30) {
  const date = new Date(`${item.fecha}T12:00:00Z`);
  if (Number.isNaN(date.getTime())) return false;
  return Date.now() - date.getTime() <= days * 24 * 60 * 60 * 1000;
}

function selectNews(state, { ignoreState = false, ignoreAge = false } = {}) {
  for (const item of loadNews()) {
    const key = newsKey(item);
    const entry = state.postedNews[key];
    if (!ignoreState && entry && entry.facebook && entry.instagram) continue;
    if (!ignoreAge && !isFresh(item)) continue;
    return item;
  }
  return null;
}

function newsCaption(item, forInstagram = false) {
  const lines = [
    item.titulo,
    '',
    item.resumen || '',
    '',
    `Fuente: ${item.fuente || 'From Patagonia Seafood'}`
  ];
  if (forInstagram) {
    lines.push(`Más información: ${SITE_URL}informacion/`);
  }
  lines.push('', '#FromPatagoniaSeafood #PescaArgentina #MarArgentino #PuertoMarDelPlata');
  return lines.join('\n').slice(0, 2200);
}

function productCaption(product) {
  return [
    product.name,
    '',
    product.text,
    '',
    `Ficha técnica: ${SITE_URL}${product.pdf}`,
    `Catálogo completo: ${SITE_URL}catalogo/`,
    '',
    '#FromPatagoniaSeafood #ProductoDelMar #PescaArgentina #MarArgentino'
  ].join('\n').slice(0, 2200);
}

async function waitForContainer(containerId) {
  for (let attempt = 0; attempt < 40; attempt += 1) {
    const status = await graph(`/${containerId}`, { fields: 'status_code' });
    if (status.status_code === 'FINISHED') return;
    if (status.status_code === 'ERROR') throw new Error(`Instagram container ${containerId} terminó con error`);
    await sleep(3000);
  }
  throw new Error(`Timeout esperando el contenedor de Instagram ${containerId}`);
}

async function publishFacebook(message, link) {
  if (NO_FACEBOOK) return null;
  try {
    const result = await graph(`/${PAGE_ID}/feed`, { message, link }, 'POST');
    return result.id;
  } catch (error) {
    if (link && /link/i.test(error.message)) {
      log('Facebook rechazó el link, reintentando sin link');
      const result = await graph(`/${PAGE_ID}/feed`, { message }, 'POST');
      return result.id;
    }
    throw error;
  }
}

async function publishInstagram(imageUrl, caption) {
  if (NO_INSTAGRAM) return null;
  try {
    await assertPublicImage(imageUrl);
  } catch (error) {
    if (imageUrl === NEWS_IMAGE_URL) throw error;
    log('La imagen del producto todavía no es pública. Usando imagen de marca.');
    imageUrl = NEWS_IMAGE_URL;
    await assertPublicImage(imageUrl);
  }
  const container = await graph(`/${IG_ID}/media`, { image_url: imageUrl, caption }, 'POST');
  await waitForContainer(container.id);
  const published = await graph(`/${IG_ID}/media_publish`, { creation_id: container.id }, 'POST');
  return published.id;
}

async function publishNews(item, state) {
  const key = newsKey(item);
  const entry = state.postedNews[key] || {
    title: item.titulo,
    date: item.fecha,
    url: item.url || null
  };
  const caption = newsCaption(item, false);

  if (DRY_RUN) {
    log('DRY RUN noticia:', item.titulo);
    log(caption);
    log('Imagen Instagram:', NEWS_IMAGE_URL);
    return;
  }

  await resolvePageToken();

  if (!entry.facebook) {
    log('Publicando en Facebook:', item.titulo);
    const id = await publishFacebook(caption, item.url || SITE_URL + 'informacion/');
    entry.facebook = { id, at: new Date().toISOString() };
    state.postedNews[key] = entry;
    state.lastNewsPostDate = entry.facebook.at;
    saveState(state);
    log('Facebook OK:', id);
  } else {
    log('Facebook ya publicado:', entry.facebook.id);
  }

  if (!entry.instagram) {
    log('Publicando en Instagram:', item.titulo);
    try {
      const id = await publishInstagram(NEWS_IMAGE_URL, newsCaption(item, true));
      entry.instagram = { id, at: new Date().toISOString() };
      state.postedNews[key] = entry;
      state.lastNewsPostDate = entry.instagram.at;
      saveState(state);
      log('Instagram OK:', id);
    } catch (error) {
      log('Instagram falló:', error.message);
      throw error;
    }
  } else {
    log('Instagram ya publicado:', entry.instagram.id);
  }
}

function newsDue(state) {
  if (FORCE) return true;
  if (!state.lastNewsPostDate) return true;
  const last = new Date(state.lastNewsPostDate).getTime();
  if (Number.isNaN(last)) return true;
  const minimumHours = Number(process.env.NEWS_MIN_INTERVAL_HOURS || 8);
  return Date.now() - last >= minimumHours * 60 * 60 * 1000;
}

function productDue(state) {
  if (FORCE) return true;
  if (!state.lastProductPostDate) return true;
  const last = new Date(state.lastProductPostDate).getTime();
  if (Number.isNaN(last)) return true;
  return Date.now() - last >= 44 * 60 * 60 * 1000;
}

function selectProduct(state) {
  const lastIndex = PRODUCTS.findIndex((p) => p.key === state.lastProductKey);
  if (lastIndex >= 0) return PRODUCTS[(lastIndex + 1) % PRODUCTS.length];
  return PRODUCTS[Math.floor(Date.now() / 86400000) % PRODUCTS.length];
}

async function publishProduct(product, state) {
  const imageUrl = SITE_URL + product.image;
  const caption = productCaption(product);

  if (DRY_RUN) {
    log('DRY RUN producto:', product.name);
    log(caption);
    log('Imagen:', imageUrl);
    return;
  }

  await resolvePageToken();

  if (!NO_FACEBOOK) {
    log('Publicando producto en Facebook:', product.name);
    const id = await publishFacebook(caption, SITE_URL + 'catalogo/');
    log('Facebook OK:', id);
  }

  if (!NO_INSTAGRAM) {
    log('Publicando producto en Instagram:', product.name);
    const id = await publishInstagram(imageUrl, caption);
    log('Instagram OK:', id);
  }

  state.lastProductPostDate = new Date().toISOString();
  state.lastProductKey = product.key;
  saveState(state);
}

async function main() {
  const state = loadState();
  const news = loadNews();
  log(`Modo: ${MODE}${DRY_RUN ? ' (dry run)' : ''}. Noticias: ${news.length}.`);

  if (MODE === 'test') {
    const latest = news[0];
    if (!latest) throw new Error('No hay noticias en data/noticias.json');
    const key = newsKey(latest);
    const entry = state.postedNews[key];
    if (!FORCE && entry && entry.facebook && entry.instagram) {
      log('La última noticia ya está publicada en Facebook e Instagram. Usá --force para repetir.');
      return;
    }
    await publishNews(latest, state);
    return;
  }

  if (MODE === 'news') {
    if (!newsDue(state)) {
      log('Noticias en pausa para no saturar. Próximo envío cuando pase el intervalo mínimo.');
      return;
    }
    const item = selectNews(state, { ignoreState: FORCE });
    if (!item) {
      log('No hay noticias nuevas para publicar.');
      return;
    }
    await publishNews(item, state);
    return;
  }

  if (MODE === 'product') {
    if (!productDue(state)) {
      log('Todavía no corresponde publicar producto (intervalo de 44 h).');
      return;
    }
    await publishProduct(selectProduct(state), state);
    return;
  }

  if (productDue(state)) {
    await publishProduct(selectProduct(state), state);
    return;
  }

  if (!newsDue(state)) {
    log('Sin producto pendiente y noticias en pausa para no saturar.');
    return;
  }

  const item = selectNews(state);
  if (!item) {
    log('No hay noticias nuevas ni producto pendiente.');
    return;
  }
  await publishNews(item, state);
}

main().catch((error) => {
  console.error('[social] ERROR:', error.message);
  process.exitCode = 1;
});
