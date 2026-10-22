const root = document.getElementById('informe-precios-frompatagonia');

if (root) {
  const state = {
    data: null,
    marketId: null,
    group: 'Merluza',
    focus: null,
  };

  const app = document.getElementById('ip-app');
  const benchmarksHost = document.getElementById('ip-benchmarks-host');
  const sourcesHost = document.getElementById('ip-sources-host');
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

  const money = (value, currency) => {
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
      return `${escapeHtml(currency)} ${number.toFixed(2)}`;
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

  const sideHasValue = (side) =>
    Boolean(side) && [side.min, side.max, side.avg].some((value) => Number.isFinite(Number(value)) && value !== null);

  const findQuote = (marketId, productId) =>
    (state.data.quotes || []).find(
      (quote) => quote.market_id === marketId && quote.product_id === productId,
    ) || null;

  const findBenchmarks = (marketId) =>
    (state.data.benchmarks || []).filter((item) => item.market_id === marketId);

  const getMarket = (marketId) =>
    state.data.markets.find((market) => market.id === marketId) || state.data.markets[0];

  const getProducts = () =>
    state.data.products.filter(
      (product) => state.group === 'Todos' || product.group === state.group,
    );

  const coverage = () => {
    const total = state.data.markets.length * state.data.products.length * 2;
    const filled = (state.data.quotes || []).reduce((sum, quote) => {
      return sum + (sideHasValue(quote.wholesale) ? 1 : 0) + (sideHasValue(quote.retail) ? 1 : 0);
    }, 0);
    return { total, filled, percent: total ? Math.round((filled / total) * 100) : 0 };
  };

  const renderPriceSide = (side, kind) => {
    if (!sideHasValue(side)) {
      return `
        <div class="ip-price">
          <span class="ip-missing">DATO NO DISPONIBLE HOY</span>
          <small>Sin presentación homóloga publicada</small>
        </div>`;
    }

    const currency = side.currency || getMarket(state.marketId).currency;
    const min = side.min;
    const max = side.max;
    const avg = side.avg;
    let main = '';
    let secondary = '';

    if (min !== null && min !== undefined && max !== null && max !== undefined) {
      main = `${money(min, currency)} – ${money(max, currency)}`;
      secondary = avg !== null && avg !== undefined
        ? `Prom. ${money(avg, currency)}`
        : 'Rango publicado';
    } else if (avg !== null && avg !== undefined) {
      main = `Prom. ${money(avg, currency)}`;
      secondary = side.note || 'Precio promedio publicado';
    } else if (min !== null && min !== undefined) {
      main = `Mín. ${money(min, currency)}`;
      secondary = side.note || 'Precio mínimo publicado';
    } else {
      main = `Máx. ${money(max, currency)}`;
      secondary = side.note || 'Precio máximo publicado';
    }

    const matchLabel = side.match === 'exact'
      ? 'Presentación exacta'
      : side.match === 'equivalent'
        ? 'Equivalente comercial'
        : '';

    return `
      <div class="ip-price">
        <strong>${main}</strong>
        <small>${escapeHtml(secondary)}${matchLabel ? ` · ${escapeHtml(matchLabel)}` : ''}</small>
      </div>`;
  };

  const renderProduct = (product) => {
    const quote = findQuote(state.marketId, product.id);
    const wholesale = quote ? quote.wholesale : null;
    const retail = quote ? quote.retail : null;

    return `
      <article class="ip-product">
        <div class="ip-product-head">
          <div>
            <h4 class="ip-product-name">${escapeHtml(product.label)}</h4>
            <p class="ip-product-detail">${escapeHtml(product.species)} · ${escapeHtml(product.detail)}</p>
          </div>
          <span class="ip-product-group">${escapeHtml(product.group)}</span>
        </div>
        <div class="ip-rows">
          <div class="ip-row ip-row--wholesale">
            <span class="ip-row-label">MAYORISTA NACIONALIZADO <span class="ip-match">sin IVA</span></span>
            ${renderPriceSide(wholesale, 'wholesale')}
          </div>
          <div class="ip-row ip-row--retail">
            <span class="ip-row-label">MINORISTA <span class="ip-match">sin IVA</span></span>
            ${renderPriceSide(retail, 'retail')}
          </div>
        </div>
      </article>`;
  };

  const renderMarketTabs = () => `
    <div class="ip-markets" role="tablist" aria-label="Seleccionar plaza mayorista">
      ${state.data.markets.map((market) => `
        <button
          type="button"
          class="ip-market"
          role="tab"
          data-ip-market="${escapeHtml(market.id)}"
          aria-selected="${market.id === state.marketId}"
          aria-controls="ip-panel"
          tabindex="${market.id === state.marketId ? '0' : '-1'}"
        >
          <span class="ip-market-name">${escapeHtml(market.name)}</span>
          <span class="ip-market-city">${escapeHtml(market.city)}, ${escapeHtml(market.country)}</span>
        </button>`).join('')}
    </div>`;

  const renderGroupTabs = () => {
    const groups = ['Merluza', 'Langostino', 'Calamar', 'Todos'];
    return `
      <div class="ip-tabs" role="tablist" aria-label="Filtrar por especie">
        ${groups.map((group) => `
          <button
            type="button"
            class="ip-tab"
            role="tab"
            data-ip-group="${group}"
            aria-selected="${state.group === group}"
            tabindex="${state.group === group ? '0' : '-1'}"
          >${group === 'Todos' ? 'Todas las presentaciones' : group}</button>`).join('')}
      </div>`;
  };

  const renderPanel = () => {
    const market = getMarket(state.marketId);
    const products = getProducts();
    const marketCoverage = products.reduce((sum, product) => {
      const quote = findQuote(market.id, product.id);
      if (!quote) return sum;
      return sum
        + (sideHasValue(quote.wholesale) ? 1 : 0)
        + (sideHasValue(quote.retail) ? 1 : 0);
    }, 0);
    const expected = products.length * 2;
    const sourceDate = market.source_date ? `Datos al ${formatDate(market.source_date)}` : 'Fecha de datos no publicada';
    const benchmarkCount = findBenchmarks(market.id).length;

    return `
      <section class="ip-panel" id="ip-panel" role="tabpanel" aria-label="${escapeHtml(market.name)}">
        <div class="ip-panel-head">
          <div>
            <h3 class="ip-panel-title">${escapeHtml(market.name)} <small>${escapeHtml(market.city)}, ${escapeHtml(market.country)}</small></h3>
            <p class="ip-source-line">
              <span class="ip-pill ${market.source_status.includes('diaria') ? 'ip-pill--live' : ''}">${escapeHtml(market.source_status)}</span>
              <span>${escapeHtml(sourceDate)}</span>
              <span>Moneda ${escapeHtml(market.currency)}</span>
              <a href="${escapeHtml(market.source_url)}" target="_blank" rel="noopener noreferrer">Abrir fuente oficial</a>
            </p>
          </div>
          <div class="ip-panel-actions">
            <button type="button" class="ip-button ip-button--ghost" data-ip-print>Imprimir / PDF</button>
            <a class="ip-button" href="#ip-fuentes">Ver fuentes</a>
          </div>
        </div>
        <div class="ip-table-head" aria-hidden="true">
          <span>Presentación comercial</span>
          <span>Precio por kg</span>
        </div>
        <div>
          ${products.map(renderProduct).join('')}
        </div>
        <div class="ip-panel-foot">
          <p>${escapeHtml(state.data.coverage_note)}</p>
          <span class="ip-coverage">${marketCoverage} de ${expected} filas con dato en esta vista</span>
        </div>
      </section>
      ${benchmarkCount ? `<p class="ip-context-note">Esta plaza tiene ${benchmarkCount} referencia(s) oficial(es) de contexto en el bloque inferior. No se computan como cotización homóloga.</p>` : ''}`;
  };

  const render = () => {
    app.innerHTML = `
      <div class="ip-toolbar">
        ${renderGroupTabs()}
        <p class="ip-toolbar-note">Seleccioná una plaza y una especie. Cada presentación muestra la fila mayorista nacionalizada y la fila minorista.</p>
      </div>
      ${renderMarketTabs()}
      ${renderPanel()}`;

    if (state.focus) {
      const selector = state.focus.startsWith('market:')
        ? `[data-ip-market="${state.focus.slice(7)}"]`
        : `[data-ip-group="${state.focus.slice(6)}"]`;
      const target = app.querySelector(selector);
      if (target) target.focus();
      state.focus = null;
    }
  };

  const renderBenchmarks = () => {
    const items = state.data.benchmarks || [];
    benchmarksHost.innerHTML = `
      <div class="ip-section-title">
        <h3>Referencias oficiales de contexto</h3>
        <p>Sirven para leer el nivel del mercado. No son cotizaciones de la presentación exacta.</p>
      </div>
      <details class="ip-benchmarks" open>
        <summary>Ver ${items.length} referencias publicadas por fuentes oficiales</summary>
        <div class="ip-benchmark-grid">
          ${items.map((item) => {
            const market = getMarket(item.market_id);
            const avg = item.avg !== null && item.avg !== undefined
              ? `${money(item.avg, item.currency)} <span class="ip-unit">/ ${escapeHtml(item.unit || 'kg')}</span>`
              : 'Sin promedio';
            const range = item.min !== null && item.max !== null && item.min !== undefined && item.max !== undefined
              ? `Min ${money(item.min, item.currency)} · Max ${money(item.max, item.currency)}`
              : 'Categoría agregada';
            return `
              <article class="ip-benchmark">
                <div class="ip-benchmark-top">
                  <span class="ip-benchmark-market">${escapeHtml(market.name)}</span>
                  <span class="ip-benchmark-species">${escapeHtml(item.species)}</span>
                </div>
                <p class="ip-benchmark-value">${avg}</p>
                <p class="ip-benchmark-desc">${escapeHtml(item.description)}</p>
                <div class="ip-benchmark-meta">
                  <span>${escapeHtml(formatDate(item.date))}</span>
                  <span>${escapeHtml(range)}</span>
                  <a href="${escapeHtml(item.source_url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(item.source_name)}</a>
                </div>
              </article>`;
          }).join('')}
        </div>
      </details>`;
  };

  const renderSources = () => {
    sourcesHost.innerHTML = `
      <div class="ip-section-title" id="ip-fuentes">
        <h3>Fuentes y cobertura</h3>
        <p>Ocho plazas, una regla común: publicación exacta o dato no disponible.</p>
      </div>
      <div class="ip-sources">
        ${state.data.markets.map((market) => `
          <article class="ip-source">
            <p class="ip-source-name">${escapeHtml(market.name)}</p>
            <p class="ip-source-meta">${escapeHtml(market.city)}, ${escapeHtml(market.country)} · ${escapeHtml(market.price_publication)}${market.source_date ? ` · ${escapeHtml(formatDate(market.source_date))}` : ''}</p>
            <a href="${escapeHtml(market.source_url)}" target="_blank" rel="noopener noreferrer">Abrir fuente oficial</a>
          </article>`).join('')}
      </div>`;
  };

  const setMeta = () => {
    const statistics = coverage();
    coverageNodes.forEach((node) => {
      node.textContent = `${statistics.filled} de ${statistics.total} precios homologados (${statistics.percent}%)`;
    });
    updatedNodes.forEach((node) => {
      node.textContent = formatDate(state.data.last_checked || state.data.updated_at);
    });
    checkedNodes.forEach((node) => {
      node.textContent = formatDate(state.data.last_checked);
    });
  };

  app.addEventListener('click', (event) => {
    const marketButton = event.target.closest('[data-ip-market]');
    if (marketButton) {
      state.marketId = marketButton.dataset.ipMarket;
      state.focus = `market:${state.marketId}`;
      render();
      return;
    }

    const groupButton = event.target.closest('[data-ip-group]');
    if (groupButton) {
      state.group = groupButton.dataset.ipGroup;
      state.focus = `group:${state.group}`;
      render();
      return;
    }

    if (event.target.closest('[data-ip-print]')) {
      window.print();
    }
  });

  app.addEventListener('keydown', (event) => {
    if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) return;
    const current = event.target.closest('[role="tab"]');
    if (!current) return;
    const tabs = [...current.parentElement.querySelectorAll('[role="tab"]')];
    const currentIndex = tabs.indexOf(current);
    if (currentIndex === -1) return;
    const direction = event.key === 'ArrowRight' || event.key === 'ArrowDown' ? 1 : -1;
    const nextIndex = (currentIndex + direction + tabs.length) % tabs.length;
    event.preventDefault();
    tabs[nextIndex].focus();
    tabs[nextIndex].click();
  });

  const fail = (message) => {
    app.innerHTML = `
      <div class="ip-error">
        <strong>No se pudo cargar el informe.</strong>
        ${escapeHtml(message)}
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
        throw new Error('El JSON no contiene plazas o presentaciones.');
      }
      state.data = data;
      state.marketId = data.markets[0].id;
      setMeta();
      render();
      renderBenchmarks();
      renderSources();
    })
    .catch((error) => {
      fail(error.message || 'Error desconocido.');
    });
}
