import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const DATA_PATH = fileURLToPath(new URL('../data/precios-mercado.json', import.meta.url));
const ARGENTINA_DATE = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'America/Argentina/Buenos_Aires',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
}).format(new Date());

const USER_AGENT = 'FromPatagoniaSeafood/1.0 (+https://frompatagonia.github.io/patagonia-seafood/)';
const BROWSER_UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';

const MERCASA_URL = 'https://www.mercasa.es/precios-y-mercados-mayoristas/';
const RUNGIS_URL = 'https://rnm.franceagrimer.fr/prix?M0121%3AMARCHE';

const MERCASA_BENCHMARKS = [
  { id: 'mercamadrid-merluza', productId: '729', column: 0 },
  { id: 'mercabarna-merluza', productId: '729', column: 1 },
  { id: 'mercavalencia-merluza', productId: '729', column: 4 },
  { id: 'mercamadrid-calamar', productId: '771', column: 0 },
  { id: 'mercabarna-calamar', productId: '771', column: 1 },
  { id: 'mercavalencia-calamar', productId: '771', column: 4 },
  { id: 'mercamadrid-langostino', productId: '777', column: 0 },
  { id: 'mercabarna-langostino', productId: '777', column: 1 },
];

const RUNGIS_BENCHMARKS = [
  { id: 'rungis-merlu-1-2', label: 'MERLU (entier) 1-2kg France' },
  { id: 'rungis-merlu-2-3', label: 'MERLU (entier) 2-3kg France' },
  { id: 'rungis-langoustine', label: 'LANGOUSTINE fraîche rangée 5-16 pièces/kg Import' },
  { id: 'rungis-encornet', label: 'ENCORNET frais (entier) moyen U.E.' },
];

const parseMercasaNumber = (value) => {
  if (typeof value !== 'string' || !value.trim()) return null;
  const parsed = Number(value.trim().replace(',', '.'));
  return Number.isFinite(parsed) ? parsed : null;
};

const parseDotNumber = (value) => {
  if (typeof value !== 'string' || !value.trim()) return null;
  const parsed = Number(value.trim());
  return Number.isFinite(parsed) ? parsed : null;
};

const isoFromMercasaDate = (value) => {
  const match = String(value || '').match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  return match ? `${match[3]}-${match[2]}-${match[1]}` : null;
};

const isoFromRungisDate = (value) => {
  const match = String(value || '').match(/^(\d{2})-(\d{2})-(\d{4})$/);
  return match ? `${match[3]}-${match[2]}-${match[1]}` : null;
};

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

async function fetchText(url, timeout = 25000) {
  const response = await fetch(url, {
    headers: { 'user-agent': USER_AGENT, accept: 'text/html,application/xhtml+xml' },
    redirect: 'follow',
    signal: AbortSignal.timeout(timeout),
  });
  const body = await response.text();
  if (!response.ok) throw new Error(`HTTP ${response.status} en ${url}`);
  return { body, finalUrl: response.url, status: response.status };
}

async function fetchMercasa(timeout = 25000) {
  const body = new URLSearchParams();
  body.append('year-my', String(new Date().getUTCFullYear()));
  for (const config of MERCASA_BENCHMARKS) body.append('products[]', config.productId);
  body.append('change-products-grafica', 'Filtrar');

  const response = await fetch(MERCASA_URL, {
    method: 'POST',
    headers: {
      'user-agent': USER_AGENT,
      accept: 'text/html,application/xhtml+xml',
      'content-type': 'application/x-www-form-urlencoded',
    },
    body,
    redirect: 'follow',
    signal: AbortSignal.timeout(timeout),
  });
  const html = await response.text();
  if (!response.ok) throw new Error(`HTTP ${response.status} en ${MERCASA_URL}`);
  return { body: html, finalUrl: response.url, status: response.status };
}

function parseMercasa(html) {
  const start = html.indexOf('var data = ');
  if (start === -1) throw new Error('No se encontró el bloque de datos de Mercasa.');
  const arrayStart = html.indexOf('[', start);
  const arrayEnd = html.indexOf('];', arrayStart);
  if (arrayStart === -1 || arrayEnd === -1) throw new Error('No se pudo delimitar el JSON de Mercasa.');

  const rows = JSON.parse(html.slice(arrayStart, arrayEnd + 1));
  const maxDate = html.match(/var max_date = "([^"]+)"/)?.[1] || null;
  const series = new Map(rows.map((row) => [String(row.id_wordpress), row]));

  const update = (config) => {
    const row = series.get(config.productId);
    if (!row || !Array.isArray(row.fechas) || !row.fechas.length) return null;
    const latest = row.fechas[row.fechas.length - 1];
    const value = parseMercasaNumber(latest.precios?.[config.column]);
    if (value === null) return null;
    return {
      avg: value,
      min: null,
      max: null,
      date: isoFromMercasaDate(latest.fecha) || isoFromMercasaDate(maxDate),
    };
  };

  return { update, maxDate: isoFromMercasaDate(maxDate) };
}

function parseRungis(html) {
  const dateMatch = html.match(/march(?:&eacute;|é)\s*du\s*(?:&nbsp;|\s)*(\d{2}-\d{2}-\d{4})/i);
  const date = isoFromRungisDate(dateMatch?.[1]);

  const find = (label) => {
    const re = new RegExp(
      `${escapeRegex(label)}\\s*</a></td>\\s*<td class="tdcotr"><strong>\\s*([\\d.,]+)</strong></td>\\s*<td class="tdcotc">[^<]*</td>\\s*<td class="tdcotr minmax">\\s*([\\d.,]+)</td>\\s*<td class="tdcotr minmax">\\s*([\\d.,]+)</td>`,
      'i',
    );
    const match = html.match(re);
    if (!match) return null;
    const avg = parseDotNumber(match[1]);
    const min = parseDotNumber(match[2]);
    const max = parseDotNumber(match[3]);
    if (avg === null) return null;
    return { avg, min, max, date };
  };

  return { find, date };
}

async function checkSource(market) {
  const started = Date.now();
  try {
    const response = await fetch(market.source_url, {
      method: 'GET',
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

async function main() {
  const dryRun = !process.argv.includes('--update');
  const data = JSON.parse(await readFile(DATA_PATH, 'utf8'));
  const benchmarkById = new Map((data.benchmarks || []).map((item) => [item.id, item]));
  const report = { mercasa: 0, rungis: 0, sources: 0, errors: [] };

  const sourceChecksPromise = Promise.all(data.markets.map(checkSource));

  try {
    const { body } = await fetchMercasa();
    const mercasa = parseMercasa(body);
    for (const config of MERCASA_BENCHMARKS) {
      const benchmark = benchmarkById.get(config.id);
      if (!benchmark) continue;
      const value = mercasa.update(config);
      if (!value) {
        report.errors.push(`Mercasa sin valor para ${config.id}`);
        continue;
      }
      Object.assign(benchmark, value);
      report.mercasa += 1;
    }
  } catch (error) {
    report.errors.push(`Mercasa: ${error.message}`);
  }

  try {
    const { body } = await fetchText(RUNGIS_URL);
    const rungis = parseRungis(body);
    for (const config of RUNGIS_BENCHMARKS) {
      const benchmark = benchmarkById.get(config.id);
      if (!benchmark) continue;
      const value = rungis.find(config.label);
      if (!value) {
        report.errors.push(`Rungis sin valor para ${config.id}`);
        continue;
      }
      Object.assign(benchmark, value);
      report.rungis += 1;
    }
    if (rungis.date) {
      const market = data.markets.find((item) => item.id === 'rungis');
      if (market) market.source_date = rungis.date;
    }
  } catch (error) {
    report.errors.push(`Rungis: ${error.message}`);
  }

  const sourceChecks = await sourceChecksPromise;
  data.source_checks = sourceChecks;
  report.sources = sourceChecks.filter((item) => item.ok).length;
  data.last_checked = ARGENTINA_DATE;
  data.updated_at = new Date().toISOString();

  console.log(JSON.stringify({
    mode: dryRun ? 'dry-run' : 'update',
    last_checked: data.last_checked,
    benchmarks_updated: { mercasa: report.mercasa, rungis: report.rungis },
    sources_ok: `${report.sources}/${data.markets.length}`,
    sources_failed: sourceChecks.filter((item) => !item.ok).map((item) => item.market_id),
    errors: report.errors,
  }, null, 2));

  if (!dryRun) {
    await writeFile(DATA_PATH, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
