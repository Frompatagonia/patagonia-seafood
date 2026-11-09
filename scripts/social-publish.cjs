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

// ---------------------------------------------------------------------------
// Frecuencias y ventanas horarias (hora argentina, UTC-3)
// ---------------------------------------------------------------------------
const ART_OFFSET_MS = -3 * 60 * 60 * 1000;
const GALLERY_INTERVAL_HOURS = Number(process.env.GALLERY_INTERVAL_HOURS || 12); // ~2 por día
const VIDEO_INTERVAL_HOURS = Number(process.env.VIDEO_INTERVAL_HOURS || 84); // ~2 por semana
const NEWS_MIN_INTERVAL_HOURS = Number(process.env.NEWS_MIN_INTERVAL_HOURS || 8);
const PRODUCT_INTERVAL_HOURS = Number(process.env.PRODUCT_INTERVAL_HOURS || 44);
const PORT_INTERVAL_HOURS = Number(process.env.PORT_INTERVAL_HOURS || 24); // 1 puerto por día
const RECIPE_INTERVAL_HOURS = Number(process.env.RECIPE_INTERVAL_HOURS || 168); // 1 receta por semana
const CHEF_INTERVAL_HOURS = Number(process.env.CHEF_INTERVAL_HOURS || 168); // 1 tip de chef por semana
const PRIORITY = ['gallery', 'video', 'news', 'product', 'port', 'chef'];

// Mensajes de marca: la historia real (400 familias) + los puertos, para que cada texto conecte y se comparta.
const BRAND_STORY = 'Detrás de cada producto hay 400 familias argentinas que viven del mar.';
const BRAND_PORTS = 'Flota propia, 2 plantas (Mar del Plata y Trelew) y 7 puertos patagónicos en operación.';
const BRAND_CTA = 'Si creés que el trabajo argentino merece llegar al mundo, compartí esta publicación.';
const HASHTAGS_BASE = '#FromPatagoniaSeafood #MarArgentino #PescaArgentina #MarDelPlata #Trelew #Patagonia #ProductoDelMar #IndustriaPesquera';

const args = new Set(process.argv.slice(2));
const modeArg = process.argv.find((a) => a.startsWith('--mode='));
const MODE = modeArg
  ? modeArg.split('=')[1]
  : args.has('--test')
    ? 'test'
    : args.has('--news')
      ? 'news'
      : args.has('--product')
        ? 'product'
        : args.has('--recipe')
          ? 'recipe'
          : args.has('--gallery')
            ? 'gallery'
            : args.has('--video')
              ? 'video'
              : args.has('--port')
                ? 'port'
                : args.has('--chef')
                  ? 'chef'
                  : 'auto';
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
    pdf: 'fichas/corvina.pdf',
    text: 'Corvina, abadejo, pez limón, chernia, besugo, caballa, mero, pescadilla y pez palo. Especies del Mar Argentino seleccionadas para retail y gastronomía.'
  },
  {
    key: 'elaborados',
    name: 'Elaborados del mar',
    image: 'images/social/elaborados.jpg',
    pdf: 'catalogo/',
    text: 'Filets empanados y elaborados de pescado listos para retail, congelados y con el respaldo de nuestra planta de procesamiento.'
  }
];

// Puertos: 1 publicación por día, rotando. Foto propia del lugar (uso libre, Wikimedia Commons).
const PORTS = [
  {
    key: 'mar-del-plata',
    name: 'Mar del Plata',
    image: 'images/puertos/mar-del-plata.jpg',
    text: `Mar del Plata no es solo nuestra base: es donde empieza todo.

Acá está nuestro puerto, nuestra planta y el equipo que trabaja el producto que después viaja al mundo. Una ciudad de más de 600.000 habitantes, la capital pesquera de la Argentina.`,
    hashtags: '#MarDelPlata #BuenosAires #Puerto #MarArgentino #PescaArgentina'
  },
  {
    key: 'san-antonio-oeste',
    name: 'San Antonio Oeste',
    image: 'images/puertos/san-antonio-oeste.jpg',
    text: `San Antonio Oeste: aguas profundas y uno de los caladeros más ricos del Atlántico Sur.

Un pueblo de más de 32.000 habitantes con un puerto que mueve langostino y merluza para el mundo. Al lado, Las Grutas: el balneario que todos conocen.`,
    hashtags: '#SanAntonioOeste #SanAntonioEste #LasGrutas #RioNegro #Langostino'
  },
  {
    key: 'punta-colorada',
    name: 'Punta Colorada',
    image: 'images/puertos/punta-colorada.jpg',
    text: `Punta Colorada es un puerto chico con historia grande. Está en Sierra Grande, Río Negro, junto a Playas Doradas: poca gente, mucho mar.

Es la misma caleta que mueve el producto de la zona. Un lugar que casi nadie conoce y que debería conocer el mundo.`,
    hashtags: '#PuntaColorada #PlayasDoradas #SierraGrande #RioNegro #Patagonia'
  },
  {
    key: 'puerto-madryn',
    name: 'Puerto Madryn',
    image: 'images/puertos/puerto-madryn.jpg',
    text: `Puerto Madryn es una de las puertas de entrada a la Patagonia. Más de 122.000 habitantes y un puerto que no para.

A pocos kilómetros está nuestra planta de Trelew, donde en temporada se procesa el langostino.`,
    hashtags: '#PuertoMadryn #Chubut #Trelew #Langostino #Patagonia'
  },
  {
    key: 'rawson',
    name: 'Rawson',
    image: 'images/puertos/rawson.jpg',
    text: `Rawson es la capital de Chubut y también vive del mar. Casi 46.000 habitantes y un puerto a minutos de la ciudad.

Puerto Rawson es uno de los puntos donde opera nuestra flota, junto a Playa Unión.`,
    hashtags: '#Rawson #Chubut #PuertoRawson #PlayaUnion #PescaArgentina'
  },
  {
    key: 'camarones',
    name: 'Bahía Camarones',
    image: 'images/puertos/camarones.jpg',
    text: `Bahía Camarones: un pueblo chico frente a un mar enorme. Casi 2.000 habitantes y el langostino en el centro de la vida de todos.

Es una de las zonas que más cuidamos, porque acá el mar es todo.`,
    hashtags: '#BahiaCamarones #Camarones #Chubut #Langostino #Patagonia'
  },
  {
    key: 'comodoro-rivadavia',
    name: 'Comodoro Rivadavia',
    image: 'images/puertos/comodoro-rivadavia.jpg',
    text: `Comodoro Rivadavia es uno de los grandes puertos del sur. Más de 240.000 habitantes y una ciudad que no para.

Petróleo y pesca: los dos motores. Y uno de los lugares donde opera nuestra flota.`,
    hashtags: '#ComodoroRivadavia #Chubut #Puerto #PescaArgentina #Patagonia'
  },
  {
    key: 'caleta-paula',
    name: 'Caleta Paula',
    image: 'images/puertos/caleta-paula.jpg',
    text: `Caleta Paula es el puerto de Caleta Olivia, el punto más al sur de nuestras operaciones.

Más de 67.000 habitantes, frío, viento y mar. El sur más duro y también el más generoso.`,
    hashtags: '#CaletaPaula #CaletaOlivia #SantaCruz #PescaArgentina #Patagonia'
  }
];

// Secretos de chef: 1 por semana. Tips de cocina para el pescado y el marisco.
const CHEF_TIPS = [
  {
    key: 'salmuera',
    title: 'El agua de mar casera',
    image: 'images/social/merluza.jpg',
    text: `En vez de tirarle sal gruesa por encima, sumergí el lomo 3 o 4 minutos en agua con 35 g de sal por litro (agua de mar casera).

Se sala parejo, la piel dora mejor y no se pega. Es el truco del chef Jordi Cruz (3 estrellas Michelin).`
  },
  {
    key: 'secar',
    title: 'Secá bien el pescado',
    image: 'images/social/merluza.jpg',
    text: `La humedad es la enemiga número uno del pescado a la plancha: si está húmedo, se cuece en vez de dorarse.

Pasalo por papel absorbente antes de cocinarlo. Un pescado seco se dora y se despega solo.`
  },
  {
    key: 'plancha-caliente',
    title: 'Plancha bien caliente',
    image: 'images/social/langostino.jpg',
    text: `Precalentá la plancha o sartén 2 o 3 minutos a fuego medio-alto y usá una película fina de aceite, no un charco.

Y el secreto: no lo toques los primeros 4 minutos. Cuando esté dorado, se despega solo.`
  },
  {
    key: 'langostino-punto',
    title: 'Langostinos en 3 minutos',
    image: 'images/social/langostino.jpg',
    text: `Los langostinos van siempre desde agua hirviendo. Cuando el agua vuelve a hervir, se apagan y se sacan.

Los grandes necesitan 3 o 4 minutos. Retiralos apenas cambian de color: el calor residual termina de cocinarlos.`
  },
  {
    key: 'sal-final',
    title: 'La sal que se siente',
    image: 'images/social/langostino.jpg',
    text: `El langostino es dulce por naturaleza: aunque el agua tenga mucha sal, no queda salado.

La sal que realmente se siente es la que se pone por encima, al final: sal gruesa y lista.`
  },
  {
    key: 'salteado',
    title: 'Salteados: 2 minutos y nada más',
    image: 'images/social/calamar.jpg',
    text: `Si los vas a saltear, poquísimo tiempo: 2 o 3 minutos.

La mejor base es un sofrito de ajo, cebolla, tomate, vino blanco y fumet. Ahí el marisco se luce.`
  },
  {
    key: 'regla-minutos',
    title: 'La regla de los 8 a 10 minutos',
    image: 'images/social/variado.jpg',
    text: `Regla de oro de la cocina: 8 a 10 minutos de cocción total por cada 2,5 cm de grosor del pescado.

Es una referencia: depende del tipo de pescado y de la potencia de tu fuego.`
  },
  {
    key: 'descongelar',
    title: 'Nunca descongeles al aire',
    image: 'images/social/elaborados.jpg',
    text: `Si el producto viene congelado, descongelalo en la heladera, nunca a temperatura ambiente.

Así el pescado no pierde agua ni sabor, y llega a la plancha en su mejor punto.`
  }
];

// Carpetas que alimentan la galería de fotos variadas (se excluyen logos, banderas,
// fondos decorativos y la carpeta "social", que se usa para los productos).
const GALLERY_FOLDERS = ['calamar', 'elaborados', 'flota', 'langostino', 'merluza', 'planta', 'variado-costero', 'certificaciones'];

const GALLERY_CAPTIONS = {
  calamar: 'Antes de llegar a tu mesa, este calamar pasó por las manos de gente de la Patagonia. Calamar argentino (Illex argentinus): tubos, vainas y tentáculos, con procesamiento en planta y control de calidad.',
  langostino: 'El langostino patagónico que exportamos al mundo nace del trabajo de cientos de familias argentinas. Langostino Pleoticus muelleri, clasificado por calibre y listo para exportación.',
  merluza: 'La merluza es el pescado más elegido de la Argentina, y la nuestra viaja al mundo. Merluza Merluccius hubbsi en filet, entera y HG, con trazabilidad total.',
  'variado-costero': 'Corvina, besugo, pescadilla: el sabor real de la costa argentina. Especies del Mar Argentino seleccionadas para retail y gastronomía.',
  elaborados: 'Del mar a la góndola: así se prepara lo que comés. Filets empanados y elaborados listos para retail, congelados en nuestra propia planta.',
  planta: 'Acá se procesa lo que comemos y lo que exportamos. Planta de Mar del Plata (7.500 m²) y planta de Trelew, con tecnología de punta.',
  flota: 'Cada barco que sale de puerto lleva el trabajo de cientos de familias argentinas. Flota propia operando en el Mar Argentino.',
  certificaciones: 'Nos exigen los estándares más altos del mundo y los cumplimos. Certificaciones internacionales que respaldan cada embarque.'
};

// Ingredientes de TheMealDB asociados a nuestras especies (define la foto de producto que acompaña la receta)
const RECIPE_SOURCES = [
  { ingredient: 'prawns', product: 'langostino' },
  { ingredient: 'shrimp', product: 'langostino' },
  { ingredient: 'squid', product: 'calamar' },
  { ingredient: 'salmon', product: 'merluza' },
  { ingredient: 'cod', product: 'merluza' },
  { ingredient: 'fish fillet', product: 'merluza' },
  { ingredient: 'white fish', product: 'merluza' },
  { ingredient: 'monkfish', product: 'variado' },
  { ingredient: 'tuna', product: 'variado' },
  { ingredient: 'mussels', product: 'variado' }
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

function publicUrl(relPath) {
  return SITE_URL + String(relPath).split('/').map(encodeURIComponent).join('/');
}

function hash32(text) {
  return crypto.createHash('sha1').update(String(text)).digest().readUInt32BE(0);
}

function artNow() {
  return new Date(Date.now() + ART_OFFSET_MS);
}

function artDateKey() {
  return artNow().toISOString().slice(0, 10);
}

function artHour() {
  return artNow().getUTCHours();
}

function overdueHours(iso) {
  if (!iso) return Infinity;
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return Infinity;
  return (Date.now() - t) / (60 * 60 * 1000);
}

function overdueScore(iso, intervalHours) {
  return overdueHours(iso) / intervalHours;
}

// ---------------------------------------------------------------------------
// Estado (anti-repetición de todas las secciones)
// ---------------------------------------------------------------------------
function loadState() {
  const raw = readJson(STATE_PATH, {});
  return {
    postedNews: raw.postedNews && typeof raw.postedNews === 'object' ? raw.postedNews : {},
    lastNewsPostDate: raw.lastNewsPostDate || null,
    lastProductPostDate: raw.lastProductPostDate || null,
    lastProductKey: raw.lastProductKey || null,
    recipe: raw.recipe && typeof raw.recipe === 'object' ? raw.recipe : null,
    usedRecipes: Array.isArray(raw.usedRecipes) ? raw.usedRecipes : [],
    gallery:
      raw.gallery && typeof raw.gallery === 'object'
        ? { used: raw.gallery.used || {}, lastPostDate: raw.gallery.lastPostDate || null, lastPath: raw.gallery.lastPath || null }
        : { used: {}, lastPostDate: null, lastPath: null },
    videos:
      raw.videos && typeof raw.videos === 'object'
        ? { posted: raw.videos.posted || {}, lastPostDate: raw.videos.lastPostDate || null, lastPath: raw.videos.lastPath || null }
        : { posted: {}, lastPostDate: null, lastPath: null },
    ports:
      raw.ports && typeof raw.ports === 'object'
        ? { used: raw.ports.used || {}, lastPostDate: raw.ports.lastPostDate || null, lastKey: raw.ports.lastKey || null }
        : { used: {}, lastPostDate: null, lastKey: null },
    chef:
      raw.chef && typeof raw.chef === 'object'
        ? { used: raw.chef.used || {}, lastPostDate: raw.chef.lastPostDate || null, lastKey: raw.chef.lastKey || null }
        : { used: {}, lastPostDate: null, lastKey: null },
    updatedAt: raw.updatedAt || null
  };
}

function saveState(state) {
  if (DRY_RUN) return;
  state.updatedAt = new Date().toISOString();
  fs.writeFileSync(STATE_PATH, JSON.stringify(state, null, 2) + '\n', 'utf8');
}

// ---------------------------------------------------------------------------
// Meta Graph API
// ---------------------------------------------------------------------------
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

// ---------------------------------------------------------------------------
// Noticias
// ---------------------------------------------------------------------------
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
    `Fuente: ${item.fuente || 'From Patagonia Seafood'}`,
    '',
    'Seguimos el día a día de la industria que da trabajo a 400 familias argentinas.'
  ];
  if (forInstagram) {
    lines.push(`Más información: ${SITE_URL}informacion/`);
  }
  lines.push('', `${HASHTAGS_BASE} #PuertoMarDelPlata`);
  return lines.join('\n').slice(0, 2200);
}

function productCaption(product) {
  return [
    `Detrás de cada ${product.name.toLowerCase()} hay 400 familias argentinas que viven del mar.`,
    '',
    product.text,
    '',
    BRAND_PORTS,
    BRAND_CTA,
    '',
    `Ficha técnica: ${SITE_URL}${product.pdf}`,
    `Catálogo completo: ${SITE_URL}catalogo/`,
    '',
    `${HASHTAGS_BASE} #Seafood`
  ].join('\n').slice(0, 2200);
}

// ---------------------------------------------------------------------------
// Publicación
// ---------------------------------------------------------------------------
async function waitForContainer(containerId, attempts = 40, delayMs = 3000) {
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    const status = await graph(`/${containerId}`, { fields: 'status_code' });
    if (status.status_code === 'FINISHED') return;
    if (status.status_code === 'ERROR') throw new Error(`Instagram container ${containerId} terminó con error`);
    await sleep(delayMs);
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

async function publishFacebookPhoto(message, imageUrl) {
  if (NO_FACEBOOK) return null;
  const result = await graph(`/${PAGE_ID}/photos`, { url: imageUrl, message, published: 'true' }, 'POST');
  return result.post_id || result.id;
}

async function publishFacebookVideo(description, videoUrl) {
  if (NO_FACEBOOK) return null;
  const result = await graph(`/${PAGE_ID}/videos`, { file_url: videoUrl, description }, 'POST');
  return result.id;
}

async function publishInstagram(imageUrl, caption) {
  if (NO_INSTAGRAM) return null;
  try {
    await assertPublicImage(imageUrl);
  } catch (error) {
    if (imageUrl === NEWS_IMAGE_URL) throw error;
    log('La imagen no es pública. Usando imagen de marca.');
    imageUrl = NEWS_IMAGE_URL;
    await assertPublicImage(imageUrl);
  }
  const container = await graph(`/${IG_ID}/media`, { image_url: imageUrl, caption }, 'POST');
  await waitForContainer(container.id);
  const published = await graph(`/${IG_ID}/media_publish`, { creation_id: container.id }, 'POST');
  return published.id;
}

async function publishInstagramCarousel(imageUrls, caption) {
  if (NO_INSTAGRAM) return null;
  const usable = [];
  for (const url of imageUrls) {
    try {
      await assertPublicImage(url);
      usable.push(url);
    } catch (error) {
      log('Imagen descartada del carrusel:', error.message);
    }
  }
  if (!usable.length) throw new Error('No hay imágenes públicas para el carrusel');
  if (usable.length === 1) return publishInstagram(usable[0], caption);

  const children = [];
  for (const url of usable) {
    const item = await graph(`/${IG_ID}/media`, { image_url: url, is_carousel_item: 'true' }, 'POST');
    await waitForContainer(item.id);
    children.push(item.id);
  }
  const container = await graph(`/${IG_ID}/media`, { media_type: 'CAROUSEL', children: children.join(','), caption }, 'POST');
  await waitForContainer(container.id);
  const published = await graph(`/${IG_ID}/media_publish`, { creation_id: container.id }, 'POST');
  return published.id;
}

async function publishInstagramReel(videoUrl, caption) {
  if (NO_INSTAGRAM) return null;
  const container = await graph(`/${IG_ID}/media`, { media_type: 'REELS', video_url: videoUrl, caption, share_to_feed: 'true' }, 'POST');
  await waitForContainer(container.id, 90, 5000);
  const published = await graph(`/${IG_ID}/media_publish`, { creation_id: container.id }, 'POST');
  return published.id;
}

// ---------------------------------------------------------------------------
// Sección: noticias / productos
// ---------------------------------------------------------------------------
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
    const id = await publishInstagram(NEWS_IMAGE_URL, newsCaption(item, true));
    entry.instagram = { id, at: new Date().toISOString() };
    state.postedNews[key] = entry;
    state.lastNewsPostDate = entry.instagram.at;
    saveState(state);
    log('Instagram OK:', id);
  } else {
    log('Instagram ya publicado:', entry.instagram.id);
  }
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

function newsDue(state) {
  if (FORCE) return true;
  return overdueHours(state.lastNewsPostDate) >= NEWS_MIN_INTERVAL_HOURS;
}

function productDue(state) {
  if (FORCE) return true;
  return overdueHours(state.lastProductPostDate) >= PRODUCT_INTERVAL_HOURS;
}

function selectProduct(state) {
  const lastIndex = PRODUCTS.findIndex((p) => p.key === state.lastProductKey);
  if (lastIndex >= 0) return PRODUCTS[(lastIndex + 1) % PRODUCTS.length];
  return PRODUCTS[Math.floor(Date.now() / 86400000) % PRODUCTS.length];
}

// ---------------------------------------------------------------------------
// Sección: puertos (1 por día, rotando los 8)
// ---------------------------------------------------------------------------
function dedupeHashtags(...groups) {
  const seen = new Set();
  const out = [];
  for (const group of groups) {
    for (const tag of String(group).split(/\s+/)) {
      if (!tag) continue;
      const key = tag.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(tag);
    }
  }
  return out.join(' ');
}

function portCaption(port, forInstagram = false) {
  const lines = [port.text, '', BRAND_STORY, BRAND_PORTS, BRAND_CTA];
  if (forInstagram) lines.push(`Catálogo: ${SITE_URL}catalogo/`);
  lines.push('', dedupeHashtags(HASHTAGS_BASE, port.hashtags));
  return lines.join('\n').slice(0, 2200);
}

function selectPort(state) {
  const used = state.ports.used || {};
  const fresh = PORTS.filter((p) => !used[p.key]);
  if (fresh.length) return fresh[0];
  return PORTS.slice().sort((a, b) => String(used[a.key] || '').localeCompare(String(used[b.key] || '')))[0];
}

async function publishPort(state, port) {
  const url = publicUrl(port.image);
  const caption = portCaption(port);

  if (DRY_RUN) {
    log('DRY RUN puerto:', port.name);
    log(url);
    log(caption);
    return;
  }

  await resolvePageToken();

  if (!NO_FACEBOOK) {
    log('Publicando puerto en Facebook:', port.name);
    const id = await publishFacebookPhoto(caption, url);
    log('Facebook OK:', id);
  }
  if (!NO_INSTAGRAM) {
    log('Publicando puerto en Instagram:', port.name);
    const id = await publishInstagram(url, portCaption(port, true));
    log('Instagram OK:', id);
  }

  state.ports.used[port.key] = new Date().toISOString();
  state.ports.lastPostDate = new Date().toISOString();
  state.ports.lastKey = port.key;
  saveState(state);
}

function portDue(state) {
  if (FORCE) return true;
  return overdueHours(state.ports.lastPostDate) >= PORT_INTERVAL_HOURS;
}

// ---------------------------------------------------------------------------
// Sección: secretos de chef (1 por semana)
// ---------------------------------------------------------------------------
function chefCaption(tip, forInstagram = false) {
  const lines = [
    `Tip de chef: ${tip.title}`,
    '',
    tip.text,
    '',
    BRAND_STORY,
    BRAND_CTA
  ];
  if (forInstagram) lines.push(`Recetas y catálogo: ${SITE_URL}catalogo/`);
  lines.push('', `${HASHTAGS_BASE} #CocinaDelMar #TipDeChef`);
  return lines.join('\n').slice(0, 2200);
}

function selectChefTip(state) {
  const used = state.chef.used || {};
  const fresh = CHEF_TIPS.filter((t) => !used[t.key]);
  if (fresh.length) return fresh[0];
  return CHEF_TIPS.slice().sort((a, b) => String(used[a.key] || '').localeCompare(String(used[b.key] || '')))[0];
}

async function publishChefTip(state, tip) {
  const url = publicUrl(tip.image);
  const caption = chefCaption(tip);

  if (DRY_RUN) {
    log('DRY RUN tip de chef:', tip.title);
    log(url);
    log(caption);
    return;
  }

  await resolvePageToken();

  if (!NO_FACEBOOK) {
    log('Publicando tip de chef en Facebook:', tip.title);
    const id = await publishFacebookPhoto(caption, url);
    log('Facebook OK:', id);
  }
  if (!NO_INSTAGRAM) {
    log('Publicando tip de chef en Instagram:', tip.title);
    const id = await publishInstagram(url, chefCaption(tip, true));
    log('Instagram OK:', id);
  }

  state.chef.used[tip.key] = new Date().toISOString();
  state.chef.lastPostDate = new Date().toISOString();
  state.chef.lastKey = tip.key;
  saveState(state);
}

function chefDue(state) {
  if (FORCE) return true;
  return overdueHours(state.chef.lastPostDate) >= CHEF_INTERVAL_HOURS;
}

// ---------------------------------------------------------------------------
// Sección: galería de fotos (regla: si hay .png y .webp del mismo nombre, usa .webp)
// ---------------------------------------------------------------------------
function walkDir(dir, onFile) {
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walkDir(full, onFile);
    else if (entry.isFile()) onFile(full);
  }
}

function collectGalleryImages() {
  const allowed = ['.webp', '.jpg', '.jpeg', '.png', '.gif'];
  const found = [];
  for (const folder of GALLERY_FOLDERS) {
    const base = path.join(ROOT, 'images', folder);
    if (!fs.existsSync(base)) continue;
    walkDir(base, (full) => {
      if (allowed.includes(path.extname(full).toLowerCase())) found.push(full);
    });
  }

  // Regla .webp: agrupa por carpeta + nombre base y prefiere .webp sobre .png/.jpg
  const byDir = {};
  for (const full of found) {
    const dir = path.dirname(full);
    const stem = path.basename(full, path.extname(full)).toLowerCase();
    byDir[dir] = byDir[dir] || {};
    byDir[dir][stem] = byDir[dir][stem] || [];
    byDir[dir][stem].push(full);
  }

  const result = [];
  for (const dir of Object.keys(byDir)) {
    for (const stem of Object.keys(byDir[dir])) {
      const group = byDir[dir][stem];
      const webp = group.find((f) => f.toLowerCase().endsWith('.webp'));
      const chosen = webp || group[0];
      result.push(path.relative(ROOT, chosen).split(path.sep).join('/'));
    }
  }
  return result.sort();
}

function selectGalleryImage(state) {
  const all = collectGalleryImages();
  if (!all.length) return null;
  const used = state.gallery.used || {};
  const unused = all.filter((p) => !used[p]);
  if (unused.length) return unused[hash32(`${artDateKey()}|${unused.length}`) % unused.length];
  // Ya se usaron todas: rota por la menos reciente
  return all.slice().sort((a, b) => String(used[a] || '').localeCompare(String(used[b] || '')))[0];
}

function galleryCaption(relPath, forInstagram = false) {
  const folder = relPath.split('/')[1] || '';
  const body = GALLERY_CAPTIONS[folder] || 'Nuestro trabajo en el Mar Argentino, con trazabilidad y calidad de exportación.';
  const lines = [body, '', BRAND_STORY, BRAND_PORTS, '', BRAND_CTA];
  if (forInstagram) lines.push(`Catálogo: ${SITE_URL}catalogo/`);
  lines.push('', HASHTAGS_BASE);
  return lines.join('\n').slice(0, 2200);
}

async function publishGalleryItem(state, relPath) {
  const url = publicUrl(relPath);
  const caption = galleryCaption(relPath);

  if (DRY_RUN) {
    log('DRY RUN galería:', relPath);
    log(url);
    log(caption);
    return;
  }

  await resolvePageToken();

  if (!NO_FACEBOOK) {
    log('Publicando foto en Facebook:', relPath);
    const id = await publishFacebookPhoto(caption, url);
    log('Facebook OK:', id);
  }
  if (!NO_INSTAGRAM) {
    log('Publicando foto en Instagram:', relPath);
    const id = await publishInstagram(url, galleryCaption(relPath, true));
    log('Instagram OK:', id);
  }

  state.gallery.used[relPath] = new Date().toISOString();
  state.gallery.lastPostDate = new Date().toISOString();
  state.gallery.lastPath = relPath;
  saveState(state);
}

function galleryDue(state) {
  if (FORCE) return true;
  return overdueHours(state.gallery.lastPostDate) >= GALLERY_INTERVAL_HOURS;
}

// ---------------------------------------------------------------------------
// Sección: videos (2 por semana, alternando + ventana para videos nuevos)
// ---------------------------------------------------------------------------
function listVideos() {
  const dir = path.join(ROOT, 'videos');
  let files;
  try {
    files = fs.readdirSync(dir);
  } catch {
    return [];
  }
  return files
    .filter((f) => /\.(mp4|mov|webm)$/i.test(f))
    .sort()
    .map((f) => `videos/${f}`);
}

function selectVideo(state) {
  const all = listVideos();
  if (!all.length) return null;
  const posted = state.videos.posted || {};
  // Prioriza videos nuevos (nunca publicados): así los que subís vos entran enseguida
  const fresh = all.filter((v) => !posted[v]);
  if (fresh.length) return fresh[0];
  return all.slice().sort((a, b) => String(posted[a] || '').localeCompare(String(posted[b] || '')))[0];
}

function videoCaption(relPath, forInstagram = false) {
  const name = path.basename(relPath).replace(/\.[a-z0-9]+$/i, '').replace(/[_]+/g, ' ').trim();
  const lines = [
    `Esto no lo hace una máquina: lo hacen personas. ${name}.`,
    '',
    BRAND_STORY,
    'Desde el Mar Argentino hasta tu mesa, con trazabilidad, cadena de frío y calidad de exportación.',
    '',
    BRAND_PORTS,
    BRAND_CTA
  ];
  if (forInstagram) lines.push(`Catálogo: ${SITE_URL}catalogo/`);
  lines.push('', `${HASHTAGS_BASE} #CadenaDeFrio`);
  return lines.join('\n').slice(0, 2200);
}

async function publishVideoItem(state, relPath) {
  const url = publicUrl(relPath);
  const caption = videoCaption(relPath);

  if (DRY_RUN) {
    log('DRY RUN video:', relPath);
    log(url);
    log(caption);
    return;
  }

  await resolvePageToken();

  if (!NO_FACEBOOK) {
    try {
      log('Publicando video en Facebook:', relPath);
      const id = await publishFacebookVideo(caption, url);
      log('Facebook video OK:', id);
    } catch (error) {
      log('Facebook video falló:', error.message);
    }
  }
  if (!NO_INSTAGRAM) {
    try {
      log('Publicando reel en Instagram:', relPath);
      const id = await publishInstagramReel(url, videoCaption(relPath, true));
      log('Instagram reel OK:', id);
    } catch (error) {
      log('Instagram reel falló:', error.message);
    }
  }

  state.videos.posted[relPath] = new Date().toISOString();
  state.videos.lastPostDate = new Date().toISOString();
  state.videos.lastPath = relPath;
  saveState(state);
}

function videoDue(state) {
  if (FORCE) return true;
  return overdueHours(state.videos.lastPostDate) >= VIDEO_INTERVAL_HOURS;
}

// ---------------------------------------------------------------------------
// Sección: recetas (1 nueva por día, publicada 3 veces el mismo día)
// ---------------------------------------------------------------------------
async function fetchJson(url) {
  const response = await fetch(url, { headers: { accept: 'application/json' } });
  if (!response.ok) throw new Error(`HTTP ${response.status} ${url}`);
  return response.json();
}

function chunkText(text, max = 1800) {
  const parts = String(text).split(/(?<=[.!?])\s+/);
  const chunks = [];
  let current = '';
  for (const part of parts) {
    if ((current + ' ' + part).trim().length > max) {
      if (current.trim()) chunks.push(current.trim());
      current = part;
    } else {
      current = (current + ' ' + part).trim();
    }
  }
  if (current.trim()) chunks.push(current.trim());
  return chunks;
}

async function translateEs(text) {
  const clean = String(text || '').replace(/\s+/g, ' ').trim();
  if (!clean) return '';
  const out = [];
  for (const chunk of chunkText(clean)) {
    let done = false;
    try {
      const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=es&dt=t&q=${encodeURIComponent(chunk)}`;
      const data = await fetchJson(url);
      if (Array.isArray(data) && Array.isArray(data[0])) {
        const translated = data[0].map((part) => (Array.isArray(part) ? part[0] : '')).join('').trim();
        if (translated) {
          out.push(translated);
          done = true;
        }
      }
    } catch {
      /* continúa con el fallback */
    }
    if (done) continue;
    try {
      const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(chunk)}&langpair=en|es`;
      const data = await fetchJson(url);
      const translated = data && data.responseData && data.responseData.translatedText;
      if (translated && !/MYMEMORY WARNING/i.test(translated)) {
        out.push(translated);
        continue;
      }
    } catch {
      /* continúa con el original */
    }
    out.push(chunk);
  }
  return out.join(' ');
}

async function buildDailyRecipe(dayKey, state) {
  const pool = [];
  const seen = new Set();
  for (const source of RECIPE_SOURCES) {
    try {
      const data = await fetchJson(`https://www.themealdb.com/api/json/v1/1/filter.php?i=${encodeURIComponent(source.ingredient)}`);
      for (const meal of data.meals || []) {
        if (seen.has(meal.idMeal)) continue;
        seen.add(meal.idMeal);
        pool.push({ id: meal.idMeal, thumb: meal.strMealThumb, product: source.product });
      }
    } catch {
      /* ignora el ingrediente que falle */
    }
  }
  if (!pool.length) throw new Error('TheMealDB no devolvió recetas');

  const used = new Set(state.usedRecipes || []);
  let candidates = pool.filter((m) => !used.has(m.id));
  if (!candidates.length) candidates = pool;

  const pick = candidates[hash32(dayKey) % candidates.length];
  const detail = await fetchJson(`https://www.themealdb.com/api/json/v1/1/lookup.php?i=${pick.id}`);
  const meal = detail.meals && detail.meals[0];
  if (!meal) throw new Error('La receta no tiene detalle');

  const ingredients = [];
  for (let i = 1; i <= 20; i += 1) {
    const ing = String(meal[`strIngredient${i}`] || '').trim();
    const measure = String(meal[`strMeasure${i}`] || '').trim();
    if (ing) ingredients.push(`${measure ? measure + ' ' : ''}${ing}`.trim());
  }

  const steps = String(meal.strInstructions || '')
    .replace(/\r/g, '')
    .split(/\n+/)
    .map((line) => line.replace(/^[\s▢•\-\*\d.)]+/, '').trim())
    .filter((line) => line.length > 2)
    .slice(0, 15);

  const ingredientsEs = [];
  for (const ing of ingredients) ingredientsEs.push(await translateEs(ing));
  const stepsEs = [];
  for (const step of steps) stepsEs.push(await translateEs(step));

  const product = PRODUCTS.find((p) => p.key === pick.product) || PRODUCTS[0];

  return {
    dayKey,
    mealId: meal.idMeal,
    titleEs: await translateEs(meal.strMeal),
    titleOriginal: meal.strMeal,
    area: meal.strArea || '',
    category: meal.strCategory || '',
    imageUrl: meal.strMealThumb || pick.thumb,
    productKey: product.key,
    productName: product.name,
    productImage: product.image,
    ingredients: ingredientsEs,
    steps: stepsEs,
    postsToday: 0,
    postedSlots: [],
    lastPostDate: null
  };
}

function recipeCaption(recipe, forInstagram = false) {
  const lines = [
    `${recipe.titleEs}: la receta de hoy, con ${recipe.productName.toLowerCase()} del Mar Argentino.`,
    '',
    'INGREDIENTES'
  ];
  for (const ing of recipe.ingredients) lines.push(`- ${ing}`);
  lines.push('', 'PREPARACIÓN');
  recipe.steps.forEach((step, i) => lines.push(`${i + 1}. ${step}`));
  lines.push(
    '',
    'Detrás de cada producto hay 400 familias argentinas que viven del mar. Guardá esta receta y compartila con quien cocine en tu casa.'
  );
  if (forInstagram) lines.push(`Fichas técnicas y catálogo: ${SITE_URL}catalogo/`);
  lines.push('', `#RecetaDePescado #CocinaDelMar #RecetaFacil #ComidaSana ${HASHTAGS_BASE}`);
  return lines.join('\n').slice(0, 2200);
}

async function ensureDailyRecipe(state) {
  const dayKey = artDateKey();
  if (!state.recipe || state.recipe.dayKey !== dayKey) {
    log('Armando la receta del día...');
    state.recipe = await buildDailyRecipe(dayKey, state);
    log('Receta elegida:', state.recipe.titleEs);
  }
  return state.recipe;
}

async function publishRecipe(state) {
  const recipe = await ensureDailyRecipe(state);
  const dishUrl = recipe.imageUrl;
  const productPath = recipe.productImage;
  const productUrl = publicUrl(productPath);

  if (DRY_RUN) {
    log('DRY RUN receta:', recipe.titleEs);
    log('Foto del plato:', dishUrl);
    log('Foto de producto:', productUrl);
    log(recipeCaption(recipe, true));
    return;
  }

  await resolvePageToken();

  if (!NO_FACEBOOK) {
    log('Publicando receta en Facebook:', recipe.titleEs);
    const id = await publishFacebookPhoto(recipeCaption(recipe, false), dishUrl);
    log('Facebook OK:', id);
  }
  if (!NO_INSTAGRAM) {
    log('Publicando receta en Instagram (carrusel):', recipe.titleEs);
    const id = await publishInstagramCarousel([dishUrl, productUrl], recipeCaption(recipe, true));
    log('Instagram OK:', id);
  }

  recipe.lastPostDate = new Date().toISOString();
  state.recipe = recipe;
  state.usedRecipes = Array.from(new Set([...(state.usedRecipes || []), recipe.mealId])).slice(-60);
  saveState(state);
}

function recipeDue(state) {
  if (FORCE) return true;
  const last = state.recipe ? state.recipe.lastPostDate : null;
  return overdueHours(last) >= RECIPE_INTERVAL_HOURS;
}

// ---------------------------------------------------------------------------
// Orquestador
// ---------------------------------------------------------------------------
async function main() {
  const state = loadState();
  log(`Modo: ${MODE}${DRY_RUN ? ' (dry run)' : ''}. Fecha ART: ${artDateKey()} ${String(artHour()).padStart(2, '0')}:00.`);

  if (MODE === 'test') {
    const news = loadNews();
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
      log('Noticias en pausa para no saturar.');
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
      log(`Todavía no corresponde publicar producto (intervalo de ${PRODUCT_INTERVAL_HOURS} h).`);
      return;
    }
    await publishProduct(selectProduct(state), state);
    return;
  }

  if (MODE === 'recipe') {
    await publishRecipe(state);
    return;
  }

  if (MODE === 'gallery') {
    const relPath = selectGalleryImage(state);
    if (!relPath) {
      log('No hay fotos para publicar.');
      return;
    }
    await publishGalleryItem(state, relPath);
    return;
  }

  if (MODE === 'video') {
    const relPath = selectVideo(state);
    if (!relPath) {
      log('No hay videos para publicar.');
      return;
    }
    await publishVideoItem(state, relPath);
    return;
  }

  if (MODE === 'port') {
    if (!portDue(state)) {
      log(`Todavía no corresponde publicar puerto (intervalo de ${PORT_INTERVAL_HOURS} h).`);
      return;
    }
    await publishPort(state, selectPort(state));
    return;
  }

  if (MODE === 'chef') {
    if (!chefDue(state)) {
      log(`Todavía no corresponde publicar tip de chef (intervalo de ${CHEF_INTERVAL_HOURS} h).`);
      return;
    }
    await publishChefTip(state, selectChefTip(state));
    return;
  }

  // ---- Modo automático: 1 publicación por corrida (escalonado hora por hora) ----
  if (recipeDue(state)) {
    await publishRecipe(state);
    return;
  }

  const candidates = [];
  if (galleryDue(state)) candidates.push({ type: 'gallery', score: overdueScore(state.gallery.lastPostDate, GALLERY_INTERVAL_HOURS) });
  if (videoDue(state)) candidates.push({ type: 'video', score: overdueScore(state.videos.lastPostDate, VIDEO_INTERVAL_HOURS) });
  if (newsDue(state)) candidates.push({ type: 'news', score: overdueScore(state.lastNewsPostDate, NEWS_MIN_INTERVAL_HOURS) });
  if (productDue(state)) candidates.push({ type: 'product', score: overdueScore(state.lastProductPostDate, PRODUCT_INTERVAL_HOURS) });
  if (portDue(state)) candidates.push({ type: 'port', score: overdueScore(state.ports.lastPostDate, PORT_INTERVAL_HOURS) });
  if (chefDue(state)) candidates.push({ type: 'chef', score: overdueScore(state.chef.lastPostDate, CHEF_INTERVAL_HOURS) });

  if (!candidates.length) {
    log('Nada pendiente por ahora.');
    return;
  }

  candidates.sort((a, b) => b.score - a.score || PRIORITY.indexOf(a.type) - PRIORITY.indexOf(b.type));
  const chosen = candidates[0].type;
  log('Publicando (lo más atrasado):', chosen);

  if (chosen === 'gallery') {
    const relPath = selectGalleryImage(state);
    if (!relPath) {
      log('No hay fotos para publicar.');
      return;
    }
    await publishGalleryItem(state, relPath);
    return;
  }

  if (chosen === 'video') {
    const relPath = selectVideo(state);
    if (!relPath) {
      log('No hay videos para publicar.');
      return;
    }
    await publishVideoItem(state, relPath);
    return;
  }

  if (chosen === 'product') {
    await publishProduct(selectProduct(state), state);
    return;
  }

  if (chosen === 'port') {
    await publishPort(state, selectPort(state));
    return;
  }

  if (chosen === 'chef') {
    await publishChefTip(state, selectChefTip(state));
    return;
  }

  const item = selectNews(state, { ignoreState: FORCE });
  if (!item) {
    log('No hay noticias nuevas para publicar.');
    return;
  }
  await publishNews(item, state);
}

main().catch((error) => {
  console.error('[social] ERROR:', error.message);
  process.exitCode = 1;
});
