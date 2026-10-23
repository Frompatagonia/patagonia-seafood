import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const DATA_PATH = fileURLToPath(new URL('../data/precios-mercado.json', import.meta.url));
const WINDOW_DAYS = 60;
const USER_AGENT = 'FromPatagoniaSeafood/1.0 (+https://frompatagonia.github.io/patagonia-seafood/)';
const BROWSER_UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';

const ARGENTINA_DATE = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'America/Argentina/Buenos_Aires',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
}).format(new Date());

const ECB_URL = 'https://www.ecb.europa.eu/stats/eurofxref/eurofxref-daily.xml';
const MERCASA_URL = 'https://www.mercasa.es/precios-y-mercados-mayoristas/';
const RUNGIS_URL = 'https://rnm.franceagrimer.fr/prix?M0121%3AMARCHE';
const RUNGIS_API_URL = 'https://rnm.franceagrimer.fr/prix';

const OBSERVATORIO = {
  merluza_filete: {
    url: 'https://observatorioprecios.es/mercados-alimentos-pescado-congelado/merluza',
    sourceName: 'Mercasa vía Observatorio de Precios',
    note: 'Merluza congelada agregada. La fuente no informa filete interfoliado ni calibre 60-200 g.',
  },
  calamar_entero: {
    url: 'https://observatorioprecios.es/mercados-alimentos-pescado-congelado/calamar',
    sourceName: 'Mercasa vía Observatorio de Precios',
    note: 'Calamar congelado agregado. La fuente no confirma especie Illex ni gramaje.',
  },
  langostino_entero: {
    url: 'https://observatorioprecios.es/mercados-alimentos-pescado-congelado/langostino',
    sourceName: 'Mercasa vía Observatorio de Precios',
    note: 'Langostino congelado agregado. La fuente no confirma calibre L1 10/20.',
  },
};

const RUNGIS_SERIES = [
  {
    productId: 'merluza_filete',
    code: '2750121',
    label: 'Merlu (entero) 1-2 kg Import',
    note: 'Merluza entera fresca de 1-2 kg. No es filete interfoliado.',
  },
  {
    productId: 'calamar_entero',
    code: '4220121',
    label: 'Encornet frais (entier) moyen U.E.',
    note: 'Calamar entero fresco. La fuente no confirma especie Illex.',
  },
  {
    productId: 'langostino_entero',
    code: '57202548',
    label: 'Langoustine fraîche rangée 5-16 pièces/kg Import',
    note: 'Langoustine (Nephrops norvegicus), no langostino Pleoticus muelleri.',
  },
];

const PRODUCTS = [
  {
    id: 'merluza_filete',
    group: 'Merluza',
    species: 'Merluccius hubbsi',
    label: 'Filete sin piel, interfoliado, congelado 60-200 g',
    short: 'Filete 60-200 g',
    detail: 'Filete sin piel, interfoliado, congelado, calibre 60-200 g.',
  },
  {
    id: 'calamar_entero',
    group: 'Calamar',
    species: 'Illex argentinus',
    label: 'Calamar entero, sin gramaje',
    short: 'Calamar entero',
    detail: 'Calamar entero congelado, sin calibre comercial declarado.',
  },
  {
    id: 'langostino_entero',
    group: 'Langostino',
    species: 'Pleoticus muelleri',
    label: 'Langostino entero L1 10/20',
    short: 'Entero L1 10/20',
    detail: 'Langostino entero congelado, calibre L1 10/20.',
  },
  {
    id: 'langostino_cola',
    group: 'Langostino',
    species: 'Pleoticus muelleri',
    label: 'Langostino sin cabeza (colas C1 / tails), NO PUD',
    short: 'Sin cabeza C1 / tails',
    detail: 'Langostino sin cabeza congelado, colas C1 (HLSO/tails), con cáscara; no se acepta PUD como equivalente.',
  },
];

const MARKETS = [
  {
    id: 'mercamadrid',
    name: 'Mercamadrid',
    city: 'Madrid',
    country: 'España',
    region: 'Europa',
    currency: 'EUR',
    source_name: 'Mercasa vía Observatorio de Precios',
    source_url: 'https://observatorioprecios.es/mercados-alimentos-pescado-congelado/merluza',
    source_status: 'Serie semanal',
    price_publication: 'Mayorista',
  },
  {
    id: 'mercabarna',
    name: 'Mercabarna',
    city: 'Barcelona',
    country: 'España',
    region: 'Europa',
    currency: 'EUR',
    source_name: 'Mercasa vía Observatorio de Precios',
    source_url: 'https://observatorioprecios.es/mercados-alimentos-pescado-congelado/merluza',
    source_status: 'Serie semanal',
    price_publication: 'Mayorista',
  },
  {
    id: 'mercasevilla',
    name: 'Mercasevilla',
    city: 'Sevilla',
    country: 'España',
    region: 'Europa',
    currency: 'EUR',
    source_name: 'Mercasa vía Observatorio de Precios',
    source_url: 'https://observatorioprecios.es/mercados-alimentos-pescado-congelado/merluza',
    source_status: 'Serie semanal',
    price_publication: 'Mayorista',
  },
  {
    id: 'rungis',
    name: 'Rungis',
    city: 'París',
    country: 'Francia',
    region: 'Europa',
    currency: 'EUR',
    source_name: 'FranceAgriMer · RNM · MIN de Rungis',
    source_url: RUNGIS_URL,
    source_status: 'Mercuriale diaria',
    price_publication: 'Mayorista',
  },
  {
    id: 'ceagesp',
    name: 'CEAGESP',
    city: 'São Paulo',
    country: 'Brasil',
    region: 'América del Sur',
    currency: 'BRL',
    source_name: 'CEAGESP · Cotaciones',
    source_url: 'https://ceagesp.gov.br/cotacoes/',
    source_status: 'Sin dato homólogo automatizado',
    price_publication: 'Mayorista',
  },
  {
    id: 'sogemi',
    name: 'SOGEMI',
    city: 'Milán',
    country: 'Italia',
    region: 'Europa',
    currency: 'EUR',
    source_name: 'SOGEMI · Bollettini prezzi',
    source_url: 'https://sogemispa.it/bollettini-report-prezzi/',
    source_status: 'Sin dato homólogo automatizado',
    price_publication: 'Mayorista',
  },
  {
    id: 'toyosu',
    name: 'Toyosu',
    city: 'Tokio',
    country: 'Japón',
    region: 'Asia',
    currency: 'JPY',
    source_name: 'Mercado Mayorista de Tokio · Toyosu',
    source_url: 'https://www.shijou.metro.tokyo.lg.jp/',
    source_status: 'Sin dato homólogo automatizado',
    price_publication: 'Subasta',
  },
  {
    id: 'jingshen',
    name: 'Jingshen / Tridge',
    city: 'Shanghái',
    country: 'China',
    region: 'Asia',
    currency: 'CNY',
    source_name: 'Tridge · referencia China',
    source_url: 'https://www.tridge.com/market-overview/frozen-argentine-shortfin-squid/CN',
    source_status: 'Sin dato homólogo automatizado',
    price_publication: 'Referencia',
  },
];

const normalize = (value) => String(value ?? '').replace(/\s+/g, ' ').trim();
const parseNumber = (value) => {
  const text = normalize(value).replace(/[^\d,.-]/g, '');
  if (!text) return null;
  const normalized = text.includes(',') && !text.includes('.') ? text.replace(',', '.') : text.replace(/,/g, '');
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
};

const isoFromDmy = (value) => {
  const match = normalize(value).match(/^(\d{1,2})\/(\d{1,2})\/(\d{2}|\d{4})$/);
  if (!match) return null;
  const year = match[3].length === 2 ? `20${match[3]}` : match[3];
  return `${year}-${match[2].padStart(2, '0')}-${match[1].padStart(2, '0')}`;
};

const isoFromDmyLong = (value) => {
  const match = normalize(value).match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  return match ? `${match[3]}-${match[2]}-${match[1]}` : null;
};

const subtractDays = (iso, days) => {
  const date = new Date(`${iso}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() - days);
  return date.toISOString().slice(0, 10);
};

const round = (value) => (Number.isFinite(value) ? Math.round(value * 100) / 100 : null);

const summarize = (values) => {
  const clean = values.map(Number).filter(Number.isFinite);
  if (!clean.length) return null;
  const avg = clean.reduce((sum, value) => sum + value, 0) / clean.length;
  return {
    avg: round(avg),
    min: round(Math.min(...clean)),
    max: round(Math.max(...clean)),
    samples: clean.length,
  };
};

async function fetchText(url, { method = 'GET', body = null, timeout = 30000, accept = 'text/html,application/xhtml+xml' } = {}) {
  let lastError = null;
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      const response = await fetch(url, {
        method,
        body,
        headers: {
          'user-agent': USER_AGENT,
          accept,
          'accept-language': 'es-ES,es;q=0.9,en;q=0.7',
          ...(body ? { 'content-type': 'application/x-www-form-urlencoded' } : {}),
        },
        redirect: 'follow',
        signal: AbortSignal.timeout(timeout),
      });
      const text = await response.text();
      if (!response.ok) throw new Error(`HTTP ${response.status} en ${url}`);
      return { text, finalUrl: response.url, status: response.status };
    } catch (error) {
      lastError = error;
      if (attempt < 3) await new Promise((resolve) => setTimeout(resolve, attempt * 1200));
    }
  }
  throw lastError;
}

async function fetchEcb() {
  const { text, finalUrl } = await fetchText(ECB_URL, { accept: 'application/xml,text/xml' });
  const date = text.match(/time=['"](\d{4}-\d{2}-\d{2})['"]/)?.[1] || null;
  const rates = { EUR: 1 };
  for (const match of text.matchAll(/currency=['"]([A-Z]{3})['"]\s+rate=['"]([\d.]+)['"]/g)) {
    rates[match[1]] = Number(match[2]);
  }
  if (!date || !rates.USD) throw new Error('ECB sin fecha o sin tipo USD.');
  return { date, source: 'Banco Central Europeo', source_url: finalUrl, base: 'EUR', rates };
}

function parseObservatorio(html) {
  const tableMatch = html.match(/<table[^>]*class="[^"]*anio-precios[^"]*"[\s\S]*?<\/table>/i);
  if (!tableMatch) throw new Error('Observatorio sin tabla anual.');
  const table = tableMatch[0];
  const headers = [...table.matchAll(/<th[^>]*>([\s\S]*?)<\/th>/gi)]
    .map((match) => normalize(match[1].replace(/<[^>]+>/g, '')))
    .filter(Boolean);
  const rows = [];
  for (const match of table.matchAll(/<td>(\d{2}\/\d{2}\/\d{4})<\/td>((?:<td>[\s\S]*?<\/td>)*)/gi)) {
    const iso = isoFromDmyLong(match[1]);
    if (!iso) continue;
    const cells = [...match[2].matchAll(/<td>([\s\S]*?)<\/td>/gi)].map((cell) => normalize(cell[1].replace(/<[^>]+>/g, '')));
    rows.push({ date: iso, cells });
  }
  if (!rows.length) throw new Error('Observatorio sin filas de precios.');
  rows.sort((a, b) => b.date.localeCompare(a.date));
  const latest = rows[0].date;
  const start = subtractDays(latest, WINDOW_DAYS);
  const windowRows = rows.filter((row) => row.date >= start && row.date <= latest);
  return { headers, rows: windowRows, latest, start };
}

function parseRungis(html) {
  const rows = [];
  for (const match of html.matchAll(/<td class="tdcotr">\s*(\d{2}\/\d{2}\/\d{2})\s*<\/td>\s*<td class="tdcotr">\s*([\d.,]+)\s*<\/td>\s*<td class="tdcotr">\s*([\d.,]+)\s*<\/td>\s*<td class="tdcotr">\s*([\d.,]+)\s*<\/td>/gi)) {
    const date = isoFromDmy(match[1]);
    const avg = parseNumber(match[2]);
    const min = parseNumber(match[3]);
    const max = parseNumber(match[4]);
    if (date && Number.isFinite(avg)) rows.push({ date, avg, min, max });
  }
  if (!rows.length) throw new Error('Rungis sin filas de cotizaciones.');
  rows.sort((a, b) => b.date.localeCompare(a.date));
  const latest = rows[0].date;
  const start = subtractDays(latest, WINDOW_DAYS);
  return { rows: rows.filter((row) => row.date >= start && row.date <= latest), latest, start };
}

function buildQuote({ marketId, productId, data, sourceName, sourceUrl, match, note, sourceId, periodStart, samples }) {
  return {
    id: `${marketId}-${productId}`,
    market_id: marketId,
    product_id: productId,
    match,
    source_id: sourceId,
    source_name: sourceName,
    source_url: sourceUrl,
    source_type: 'auto',
    checked_at: ARGENTINA_DATE,
    date: data.latestDate,
    period_start: periodStart,
    period_end: data.latestDate,
    samples,
    currency: 'EUR',
    unit: 'kg',
    wholesale: {
      avg: data.avg,
      min: data.min,
      max: data.max,
      currency: 'EUR',
      unit: 'kg',
      note,
    },
    retail: null,
  };
}

async function collectSpanish(previousQuotes) {
  const quotes = [];
  const errors = [];
  for (const product of PRODUCTS.filter((item) => OBSERVATORIO[item.id])) {
    const config = OBSERVATORIO[product.id];
    try {
      const { text, finalUrl } = await fetchText(config.url);
      const parsed = parseObservatorio(text);
      for (const market of MARKETS.filter((item) => ['mercamadrid', 'mercabarna', 'mercasevilla'].includes(item.id))) {
        const column = parsed.headers.indexOf(market.name);
        if (column <= 0) continue;
        const values = [];
        let latestDate = null;
        for (const row of parsed.rows) {
          const value = parseNumber(row.cells[column - 1]);
          if (value === null) continue;
          values.push(value);
          if (!latestDate || row.date > latestDate) latestDate = row.date;
        }
        const summary = summarize(values);
        if (!summary || !latestDate) continue;
        quotes.push(buildQuote({
          marketId: market.id,
          productId: product.id,
          data: { ...summary, latestDate },
          sourceName: config.sourceName,
          sourceUrl: finalUrl || config.url,
          match: 'reference',
          note: config.note,
          sourceId: `observatorio-${product.id}`,
          periodStart: parsed.start,
          samples: summary.samples,
        }));
      }
    } catch (error) {
      errors.push(`Observatorio ${product.id}: ${error.message}`);
      for (const old of previousQuotes.filter((quote) => quote.product_id === product.id && ['mercamadrid', 'mercabarna', 'mercasevilla'].includes(quote.market_id))) {
        quotes.push({ ...old, stale: true });
      }
    }
  }
  return { quotes, errors };
}

async function collectRungis(previousQuotes) {
  const quotes = [];
  const errors = [];
  for (const series of RUNGIS_SERIES) {
    try {
      const body = new URLSearchParams({ LIBCOD: series.code, LAST: '' });
      const { text } = await fetchText(RUNGIS_API_URL, { method: 'POST', body });
      const parsed = parseRungis(text);
      const summary = summarize(parsed.rows.map((row) => row.avg));
      if (!summary) throw new Error('Sin promedio.');
      const latestDate = parsed.rows[0].date;
      quotes.push(buildQuote({
        marketId: 'rungis',
        productId: series.productId,
        data: {
          ...summary,
          latestDate,
          min: Math.min(...parsed.rows.map((row) => row.min)),
          max: Math.max(...parsed.rows.map((row) => row.max)),
        },
        sourceName: 'FranceAgriMer · RNM · MIN de Rungis',
        sourceUrl: RUNGIS_URL,
        match: 'reference',
        note: series.note,
        sourceId: 'rungis',
        periodStart: parsed.start,
        samples: summary.samples,
      }));
    } catch (error) {
      errors.push(`Rungis ${series.productId}: ${error.message}`);
      const old = previousQuotes.find((quote) => quote.market_id === 'rungis' && quote.product_id === series.productId);
      if (old) quotes.push({ ...old, stale: true });
    }
  }
  return { quotes, errors };
}

async function checkSource(market) {
  const started = Date.now();
  try {
    const response = await fetch(market.source_url, {
      headers: { 'user-agent': BROWSER_UA, accept: '*/*' },
      redirect: 'follow',
      signal: AbortSignal.timeout(20000),
    });
    await response.arrayBuffer();
    return {
      market_id: market.id,
      checked_at: ARGENTINA_DATE,
      status: response.status,
      ok: response.ok,
      final_url: response.url,
      elapsed_ms: Date.now() - started,
      error: null,
    };
  } catch (error) {
    return {
      market_id: market.id,
      checked_at: ARGENTINA_DATE,
      status: null,
      ok: false,
      final_url: market.source_url,
      elapsed_ms: Date.now() - started,
      error: error.message,
    };
  }
}

function addUsd(quote, rates) {
  const convert = (value, currency) => {
    if (value === null || value === undefined || !rates[currency] || !rates.USD) return null;
    return round((Number(value) * rates.USD) / rates[currency]);
  };
  for (const side of ['wholesale', 'retail']) {
    if (!quote[side]) continue;
    quote[side].usd = {
      avg: convert(quote[side].avg, quote[side].currency || quote.currency),
      min: convert(quote[side].min, quote[side].currency || quote.currency),
      max: convert(quote[side].max, quote[side].currency || quote.currency),
    };
  }
  return quote;
}

async function main() {
  const dryRun = !process.argv.includes('--update');
  let previous = null;
  try {
    previous = JSON.parse(await readFile(DATA_PATH, 'utf8'));
  } catch {}
  const previousQuotes = Array.isArray(previous?.quotes) ? previous.quotes : [];

  const errors = [];
  let exchange = previous?.exchange || null;
  try {
    exchange = await fetchEcb();
  } catch (error) {
    errors.push(`ECB: ${error.message}`);
  }
  if (!exchange) throw new Error('Sin tipos de cambio ECB ni datos previos.');

  const spain = await collectSpanish(previousQuotes);
  const rungis = await collectRungis(previousQuotes);
  const sourceChecks = await Promise.all(MARKETS.map(checkSource));
  errors.push(...spain.errors, ...rungis.errors);

  const quotes = [...spain.quotes, ...rungis.quotes];
  const keys = new Set(quotes.map((quote) => `${quote.market_id}|${quote.product_id}`));
  for (const old of previousQuotes) {
    const key = `${old.market_id}|${old.product_id}`;
    if (!keys.has(key) && old.wholesale) quotes.push({ ...old, stale: true });
  }
  quotes.forEach((quote) => addUsd(quote, exchange.rates));
  quotes.sort((a, b) => {
    const productOrder = PRODUCTS.findIndex((product) => product.id === a.product_id) - PRODUCTS.findIndex((product) => product.id === b.product_id);
    if (productOrder) return productOrder;
    const marketOrder = MARKETS.findIndex((market) => market.id === a.market_id) - MARKETS.findIndex((market) => market.id === b.market_id);
    return marketOrder;
  });

  const data = {
    schema_version: 2,
    updated_at: new Date().toISOString(),
    last_checked: ARGENTINA_DATE,
    window_days: WINDOW_DAYS,
    title: 'Informe Global de Precios',
    subtitle: 'Merluza Hubbsi, langostino Pleoticus muelleri y calamar Illex. Referencias mayoristas trazables y conversión ECB; sin mezclar presentaciones no homologadas.',
    coverage_note: 'Las filas son referencias de mercado de la especie. No se presentan como cotización exacta si la fuente no publica la presentación comercial completa. No se usan sustitutos para completar la tabla.',
    methodology: [
      'Promedio simple de las cotizaciones publicadas en los últimos 60 días para cada plaza y producto.',
      'La fecha de la fila es la última cotización disponible dentro de esa ventana.',
      'Conversión a USD con el tipo de cambio de referencia del BCE; no se aplican márgenes, fletes ni impuestos.',
      'El minorista sólo se publica cuando existe una presentación homóloga. Si no existe, queda sin dato.',
      'El minorista en origen no se publica porque no hay una fuente pública homóloga; no se estima ni se completa con retail de otro país o de otra presentación.',
      'Las referencias de especie no se suman a una cobertura de presentaciones exactas.',
    ],
    legend: {
      wholesale: 'Mayorista en moneda de origen y USD',
      retail: 'Minorista homólogo, cuando existe',
      match: 'Referencia de especie',
    },
    products: PRODUCTS,
    markets: MARKETS,
    exchange: {
      date: exchange.date,
      source: exchange.source,
      source_url: exchange.source_url,
      base: exchange.base,
      rates: {
        USD: exchange.rates.USD,
        BRL: exchange.rates.BRL || null,
        JPY: exchange.rates.JPY || null,
        CNY: exchange.rates.CNY || null,
      },
    },
    quotes,
    source_checks: sourceChecks,
    summary: {
      quotes: quotes.length,
      markets_with_data: new Set(quotes.map((quote) => quote.market_id)).size,
      products_with_data: new Set(quotes.map((quote) => quote.product_id)).size,
      retail_quotes: quotes.filter((quote) => quote.retail).length,
      exact_quotes: quotes.filter((quote) => quote.match === 'exact').length,
      reference_quotes: quotes.filter((quote) => quote.match === 'reference').length,
      stale_quotes: quotes.filter((quote) => quote.stale).length,
      sources_ok: sourceChecks.filter((item) => item.ok).length,
      sources_total: sourceChecks.length,
    },
    notices: [
      'Mercasevilla no publica langostino congelado en la serie consultada.',
      'Ninguna fuente consultada publica langostino sin cabeza (colas C1 / tails) homólogo; no se usa PUD como equivalente.',
      'Rungis publica langoustine (Nephrops), no langostino Pleoticus muelleri; se muestra como referencia y se identifica en la nota.',
      'No se publican precios minoristas sin presentación homóloga.',
    ],
  };

  console.log(JSON.stringify({
    mode: dryRun ? 'dry-run' : 'update',
    last_checked: data.last_checked,
    window_days: data.window_days,
    quotes: data.summary.quotes,
    markets_with_data: data.summary.markets_with_data,
    products_with_data: data.summary.products_with_data,
    retail_quotes: data.summary.retail_quotes,
    exact_quotes: data.summary.exact_quotes,
    stale_quotes: data.summary.stale_quotes,
    sources_ok: `${data.summary.sources_ok}/${data.summary.sources_total}`,
    ecb: data.exchange.date,
    errors,
  }, null, 2));

  if (!dryRun) {
    await writeFile(DATA_PATH, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
