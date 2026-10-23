const root = document.getElementById('informe-precios-frompatagonia');

if (root) {
  const state = {
    data: null,
    productId: 'all',
  };

  const app = document.getElementById('ip-app');
  const coverageNodes = document.querySelectorAll('[data-ip-coverage]');
  const updatedNodes = document.querySelectorAll('[data-ip-updated]');
  const checkedNodes = document.querySelectorAll('[data-ip-checked]');

  const escapeHtml = (value) =>
    String(value ?? '').replace(/[&<>"']/g, (char) => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;',
    }[char]));

  const formatMoney = (value, currency) => {
    const number = Number(value);
    if (!Number.isFinite(number)) return '';
    try {
      return new Intl.NumberFormat('es-AR', {
        style: 'currency',
        currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(number);
    } catch {
      return `${currency} ${number.toFixed(2)}`;
    }
  };

  const formatDate = (value) => {
    if (!value) return '';
    const date = new Date(`${value}T12:00:00Z`);
    if (Number.isNaN(date.getTime())) return escapeHtml(value);
    return new Intl.DateTimeFormat('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      timeZone: 'UTC',
    }).format(date);
  };

  const formatRange = (side) => {
    if (!side) return '';
    const currency = side.currency || 'EUR';
    const avg = formatMoney(side.avg, currency);
    const min = formatMoney(side.min, currency);
    const max = formatMoney(side.max, currency);
    return { avg, min, max };
  };

  const getProduct = (id) => state.data.products.find((product) => product.id === id);
  const getMarket = (id) => state.data.markets.find((market) => market.id === id);
  const matchLabel = (match) => match === 'exact' ? 'Exacta' : match === 'equivalent' ? 'Equivalente' : 'Referencia';
  const domain = (url) => {
    try {
      return new URL(url).hostname.replace(/^www\./, '');
    } catch {
      return 'Fuente';
    }
  };

  const renderProductCell = (product, quote) => `
    <div class="ip-product-cell">
      <strong>${escapeHtml(product?.label || quote.product_id)}</strong>
      <span>${escapeHtml(product?.species || '')}</span>
      <span class="ip-match ip-match--${escapeHtml(quote.match || 'reference')}">${escapeHtml(matchLabel(quote.match))}</span>
    </div>`;

  const renderMarketCell = (market) => `
    <div class="ip-market-cell">
      <strong>${escapeHtml(market?.name || '')}</strong>
      <span>${escapeHtml(market?.city || '')}</span>
    </div>`;

  const renderWholesale = (quote) => {
    if (!quote.wholesale) return '<span class="ip-empty">Sin dato</span>';
    const range = formatRange(quote.wholesale);
    return `
      <div class="ip-value">
        <strong>${escapeHtml(range.avg)}</strong>
        <span>${escapeHtml(quote.currency)} / kg</span>
        <small>${escapeHtml(range.min)} - ${escapeHtml(range.max)} · ${escapeHtml(quote.samples)} datos</small>
      </div>`;
  };

  const renderUsd = (side) => {
    if (!side?.usd) return '<span class="ip-empty">Sin tipo ECB</span>';
    return `
      <div class="ip-value ip-value--usd">
        <strong>${escapeHtml(formatMoney(side.usd.avg, 'USD'))}</strong>
        <span>USD / kg</span>
      </div>`;
  };

  const renderRetail = (quote) => {
    if (!quote.retail) {
      return `
        <div class="ip-empty-block">
          <strong>Sin dato homólogo</strong>
          <small>No se usa un sustituto</small>
        </div>`;
    }
    const range = formatRange(quote.retail);
    return `
      <div class="ip-value">
        <strong>${escapeHtml(range.avg)}</strong>
        <span>${escapeHtml(quote.retail.currency)} / kg</span>
      </div>`;
  };

  const renderRow = (quote) => {
    const product = getProduct(quote.product_id);
    const market = getMarket(quote.market_id);
    return `
      <tr>
        <td data-label="País">
          <div class="ip-country-cell">
            <strong>${escapeHtml(market?.country || '')}</strong>
            <span>${escapeHtml(market?.region || '')}</span>
          </div>
        </td>
        <td data-label="Producto">${renderProductCell(product, quote)}</td>
        <td data-label="Plaza">${renderMarketCell(market)}</td>
        <td data-label="Mayorista origen">${renderWholesale(quote)}</td>
        <td data-label="Mayorista USD">${renderUsd(quote.wholesale)}</td>
        <td data-label="Minorista origen">${renderRetail(quote)}</td>
        <td data-label="Minorista USD">${quote.retail ? renderUsd(quote.retail) : '<span class="ip-empty">Sin dato</span>'}</td>
        <td data-label="Fuente">
          <div class="ip-source-cell">
            <a href="${escapeHtml(quote.source_url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(domain(quote.source_url))}</a>
            <span>${escapeHtml(quote.source_name)}</span>
            ${quote.stale ? '<span class="ip-stale">Último disponible</span>' : ''}
          </div>
        </td>
        <td data-label="Fecha">
          <div class="ip-date-cell">
            <strong>${escapeHtml(formatDate(quote.date))}</strong>
            <span>${escapeHtml(quote.period_start ? `Ventana desde ${formatDate(quote.period_start)}` : '')}</span>
          </div>
        </td>
      </tr>`;
  };

  const renderFilters = () => `
    <div class="ip-filters" role="tablist" aria-label="Filtrar por producto">
      <button type="button" class="ip-filter${state.productId === 'all' ? ' is-active' : ''}" data-ip-product="all" role="tab" aria-selected="${state.productId === 'all'}">Todos</button>
      ${state.data.products.map((product) => `
        <button type="button" class="ip-filter${state.productId === product.id ? ' is-active' : ''}" data-ip-product="${escapeHtml(product.id)}" role="tab" aria-selected="${state.productId === product.id}">${escapeHtml(product.short)}</button>`).join('')}
    </div>`;

  const renderStats = () => {
    const summary = state.data.summary || {};
    return `
      <div class="ip-stats">
        <article>
          <span>Referencias publicadas</span>
          <strong>${escapeHtml(summary.quotes || 0)}</strong>
          <small>${escapeHtml(summary.markets_with_data || 0)} plazas con dato</small>
        </article>
        <article>
          <span>Ventana de cálculo</span>
          <strong>${escapeHtml(state.data.window_days || 60)} días</strong>
          <small>Promedio simple por plaza</small>
        </article>
        <article>
          <span>Tipo de cambio</span>
          <strong>${escapeHtml(formatDate(state.data.exchange?.date))}</strong>
          <small>BCE · 1 EUR = ${escapeHtml(Number(state.data.exchange?.rates?.USD || 0).toFixed(4))} USD</small>
        </article>
        <article>
          <span>Minorista homólogo</span>
          <strong>${escapeHtml(summary.retail_quotes || 0)}</strong>
          <small>Sin sustitutos de especie</small>
        </article>
      </div>`;
  };

  const renderTable = () => {
    const quotes = state.data.quotes.filter((quote) => state.productId === 'all' || quote.product_id === state.productId);
    if (!quotes.length) {
      return `
        <div class="ip-empty-state">
          <strong>No hay una referencia automatizada para este filtro.</strong>
          <p>No se completa con PUD, HGT, otro calibre ni otra especie. La plaza queda sin dato hasta que publique una presentación comparable.</p>
        </div>`;
    }
    return `
      <div class="ip-table-wrap">
        <table class="ip-table">
          <thead>
            <tr>
              <th scope="col">País</th>
              <th scope="col">Producto</th>
              <th scope="col">Plaza</th>
              <th scope="col">Mayorista origen</th>
              <th scope="col">Mayorista USD</th>
              <th scope="col">Minorista origen</th>
              <th scope="col">Minorista USD</th>
              <th scope="col">Fuente</th>
              <th scope="col">Fecha</th>
            </tr>
          </thead>
          <tbody>${quotes.map(renderRow).join('')}</tbody>
        </table>
      </div>
      <p class="ip-table-note">${escapeHtml(state.data.coverage_note)}</p>`;
  };

  const renderCoverage = () => `
    <section class="ip-coverage" aria-labelledby="ip-coverage-title">
      <div class="ip-section-head">
        <div>
          <span class="ip-kicker">Trazabilidad</span>
          <h3 id="ip-coverage-title">Cobertura por plaza</h3>
        </div>
        <p>${escapeHtml(state.data.summary?.sources_ok || 0)} de ${escapeHtml(state.data.summary?.sources_total || 0)} fuentes respondieron en la última verificación.</p>
      </div>
      <div class="ip-market-grid">
        ${state.data.markets.map((market) => {
          const count = state.data.quotes.filter((quote) => quote.market_id === market.id).length;
          const check = (state.data.source_checks || []).find((item) => item.market_id === market.id);
          return `
            <article class="ip-market-card${count ? ' is-active' : ''}">
              <div class="ip-market-card-top">
                <strong>${escapeHtml(market.name)}</strong>
                <span class="ip-market-status ${check?.ok ? 'is-ok' : 'is-off'}">${check?.ok ? 'Fuente activa' : 'Sin respuesta'}</span>
              </div>
              <p>${escapeHtml(market.city)}, ${escapeHtml(market.country)}</p>
              <p class="ip-market-coverage">${count ? `${count} referencia${count === 1 ? '' : 's'} publicada${count === 1 ? '' : 's'}` : 'Sin dato automatizado'}</p>
              <a href="${escapeHtml(market.source_url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(market.source_name)}</a>
            </article>`;
        }).join('')}
      </div>
    </section>`;

  const renderMethod = () => `
    <details class="ip-method">
      <summary>Metodología, límites y conversión</summary>
      <div class="ip-method-body">
        <ul>
          ${(state.data.methodology || []).map((item) => `<li>${escapeHtml(item)}</li>`).join('')}
        </ul>
        <div class="ip-notices">
          ${(state.data.notices || []).map((item) => `<p>${escapeHtml(item)}</p>`).join('')}
        </div>
        <p class="ip-method-source">Tipo de cambio: <a href="${escapeHtml(state.data.exchange?.source_url || '')}" target="_blank" rel="noopener noreferrer">${escapeHtml(state.data.exchange?.source || 'BCE')}</a> · ${escapeHtml(formatDate(state.data.exchange?.date))}. Monedas disponibles: EUR, USD, BRL, JPY y CNY.</p>
      </div>
    </details>`;

  const render = () => {
    app.innerHTML = `
      <div class="ip-toolbar">
        ${renderFilters()}
        <div class="ip-toolbar-actions">
          <span class="ip-toolbar-count">${escapeHtml(state.data.quotes.length)} filas trazables</span>
          <button type="button" class="ip-button ip-button--ghost" data-ip-print>Imprimir / PDF</button>
        </div>
      </div>
      ${renderStats()}
      ${renderTable()}
      ${renderCoverage()}
      ${renderMethod()}`;
  };

  const setMeta = () => {
    coverageNodes.forEach((node) => {
      node.textContent = `${state.data.summary?.quotes || 0} referencias en ${state.data.summary?.markets_with_data || 0} plazas`;
    });
    updatedNodes.forEach((node) => {
      node.textContent = formatDate(state.data.last_checked || state.data.updated_at);
    });
    checkedNodes.forEach((node) => {
      node.textContent = formatDate(state.data.last_checked);
    });
  };

  app.addEventListener('click', (event) => {
    const filter = event.target.closest('[data-ip-product]');
    if (filter) {
      state.productId = filter.dataset.ipProduct;
      render();
      return;
    }
    if (event.target.closest('[data-ip-print]')) {
      window.print();
    }
  });

  const fail = (message) => {
    app.innerHTML = `
      <div class="ip-error">
        <strong>No se pudo cargar el informe.</strong>
        <p>${escapeHtml(message)}</p>
      </div>`;
  };

  const dataUrl = new URL('../data/precios-mercado.json', window.location.href);

  fetch(dataUrl, { cache: 'no-store' })
    .then((response) => {
      if (!response.ok) throw new Error(`HTTP ${response.status} al leer ${dataUrl.pathname}`);
      return response.json();
    })
    .then((data) => {
      if (!data.markets?.length || !data.products?.length) {
        throw new Error('El JSON no contiene plazas o productos.');
      }
      state.data = data;
      setMeta();
      render();
    })
    .catch((error) => {
      fail(error.message || 'Error desconocido.');
    });
}
