/* =====================================================
   charts.js — Self-contained SVG charts (no libs)
   - Line chart
   - Bar chart
   - Donut/Gauge
   ===================================================== */

const Charts = (() => {

  const COLORS = {
    line: '#d94c2a', area: 'rgba(217,76,42,.15)',
    grid: 'rgba(20,16,8,.08)',
    text: '#2a2724',
    axis: 'rgba(20,16,8,.3)',
    bar: '#1f5d4f',
    barAlt: '#c9a227',
    danger: '#b3271a',
    ok: '#2f7a51',
    warn: '#c98a13'
  };

  function _box(svg, w, h) {
    svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
    svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
    svg.setAttribute('xmlns','http://www.w3.org/2000/svg');
  }

  function el(tag, attrs={}, parent=null) {
    const e = document.createElementNS('http://www.w3.org/2000/svg', tag);
    Object.entries(attrs).forEach(([k,v]) => e.setAttribute(k,v));
    if (parent) parent.appendChild(e);
    return e;
  }

  /**
   * Line chart.
   * data: [{ x: number|date, y: number, label: string }]
   * opts: { yMin, yMax, areaFill, refLine }
   */
  function line(container, data, opts = {}) {
    container.innerHTML = '';
    if (!data || data.length === 0) {
      container.innerHTML = `<div class="empty"><div class="icon">∅</div><h4>Sin datos</h4><p>No hay registros suficientes</p></div>`;
      return;
    }

    const W = 700, H = 240, P = { l: 36, r: 16, t: 16, b: 32 };
    const svg = el('svg', { width: '100%', height: '100%' });
    _box(svg, W, H);
    container.appendChild(svg);

    const yMin = opts.yMin ?? 0;
    const yMax = opts.yMax ?? 10;
    const xs = data.map((_,i) => P.l + i*(W - P.l - P.r) / Math.max(1, data.length-1));
    const ys = data.map(p => P.t + (yMax - p.y)*(H - P.t - P.b)/(yMax - yMin));

    // Grid lines
    for (let i = 0; i <= 5; i++) {
      const yVal = yMin + (yMax-yMin)*(i/5);
      const y = P.t + (H - P.t - P.b) * (1 - i/5);
      el('line',{ x1:P.l, x2:W-P.r, y1:y, y2:y, stroke:COLORS.grid, 'stroke-dasharray':'3 3'},svg);
      el('text',{ x:P.l-6, y:y+3, 'text-anchor':'end','font-size':10,'font-family':'JetBrains Mono', fill:COLORS.text},svg)
        .textContent = yVal.toFixed(1);
    }

    // Reference line (approval threshold)
    if (opts.refLine != null) {
      const ry = P.t + (yMax - opts.refLine)*(H - P.t - P.b)/(yMax - yMin);
      el('line',{ x1:P.l, x2:W-P.r, y1:ry, y2:ry, stroke:COLORS.danger, 'stroke-dasharray':'4 4', 'stroke-width':1, opacity:.5},svg);
      el('text',{ x:W-P.r, y:ry-4, 'text-anchor':'end','font-size':10,'font-family':'JetBrains Mono', fill:COLORS.danger}, svg)
        .textContent = `aprobación ${opts.refLine}`;
    }

    // Area
    if (opts.areaFill !== false) {
      const path = `M ${xs[0]} ${H-P.b} ` +
        xs.map((x,i) => `L ${x} ${ys[i]}`).join(' ') +
        ` L ${xs[xs.length-1]} ${H-P.b} Z`;
      el('path',{ d:path, fill:COLORS.area, stroke:'none' },svg);
    }

    // Line
    const linePath = xs.map((x,i) => (i===0?'M':'L')+` ${x} ${ys[i]}`).join(' ');
    el('path',{ d:linePath, fill:'none', stroke:COLORS.line, 'stroke-width':2, 'stroke-linejoin':'round','stroke-linecap':'round' }, svg);

    // Points
    xs.forEach((x,i) => {
      const c = el('circle',{ cx:x, cy:ys[i], r:4, fill:'#fffdf8', stroke:COLORS.line, 'stroke-width':2 }, svg);
      const title = el('title', {}, c);
      title.textContent = `${data[i].label || ''}: ${data[i].y.toFixed(1)}`;
    });

    // X labels (sparse)
    const step = Math.ceil(data.length / 6);
    data.forEach((p, i) => {
      if (i % step !== 0 && i !== data.length-1) return;
      el('text',{ x:xs[i], y:H-12, 'text-anchor':'middle','font-size':9,'font-family':'JetBrains Mono', fill:COLORS.text }, svg)
        .textContent = p.label?.slice(0,8) || '';
    });
  }

  /**
   * Horizontal bar comparison.
   * data: [{ label, value, color? }]
   */
  function bars(container, data, opts = {}) {
    container.innerHTML = '';
    if (!data || data.length === 0) {
      container.innerHTML = `<div class="empty"><div class="icon">∅</div><h4>Sin datos</h4></div>`;
      return;
    }
    const max = opts.max ?? Math.max(...data.map(d => d.value), 10);
    const wrap = document.createElement('div');
    wrap.style.cssText = 'display:flex;flex-direction:column;gap:10px;padding:6px 4px;';
    data.forEach(d => {
      const row = document.createElement('div');
      const pct = Math.max(0, Math.min(100, (d.value/max)*100));
      const color = d.color || COLORS.bar;
      const status = opts.refLine != null ? (d.value < opts.refLine ? 'danger' : 'ok') : '';
      row.innerHTML = `
        <div style="display:flex;justify-content:space-between;font-size:13px;margin-bottom:4px;">
          <span style="font-weight:500;">${escapeHtml(d.label)}</span>
          <span style="font-family:JetBrains Mono;font-weight:600; color:${status==='danger'?'var(--danger)':'var(--ink)'}">${d.value.toFixed(2)}</span>
        </div>
        <div class="bar-line"><span class="${status}" style="width:${pct}%;background:${status?'':color};"></span></div>
      `;
      wrap.appendChild(row);
    });
    container.appendChild(wrap);
  }

  /**
   * Vertical bars (column chart). Useful for scenario comparison.
   * data: [{ label, value, color? }]
   */
  function columns(container, data, opts={}) {
    container.innerHTML = '';
    if (!data || !data.length) return;
    const W = 700, H = 240, P = { l: 36, r: 16, t: 16, b: 36 };
    const svg = el('svg',{ width:'100%', height:'100%' }); _box(svg,W,H);
    container.appendChild(svg);

    const max = opts.max ?? Math.max(...data.map(d=>d.value), 10);
    const min = 0;
    const bw = (W - P.l - P.r) / data.length;

    // Grid
    for (let i=0;i<=5;i++) {
      const v = max*(i/5);
      const y = P.t + (H - P.t - P.b)*(1-i/5);
      el('line',{x1:P.l,x2:W-P.r,y1:y,y2:y,stroke:COLORS.grid,'stroke-dasharray':'3 3'},svg);
      el('text',{x:P.l-6,y:y+3,'text-anchor':'end','font-size':10,'font-family':'JetBrains Mono',fill:COLORS.text},svg).textContent=v.toFixed(1);
    }

    if (opts.refLine != null) {
      const ry = P.t + (max - opts.refLine)*(H - P.t - P.b)/(max - min);
      el('line',{x1:P.l,x2:W-P.r,y1:ry,y2:ry,stroke:COLORS.danger,'stroke-dasharray':'4 4',opacity:.5},svg);
    }

    data.forEach((d, i) => {
      const x = P.l + i*bw + bw*0.15;
      const w = bw*0.7;
      const h = (d.value - min)/(max - min) * (H - P.t - P.b);
      const y = H - P.b - h;
      const c = d.color || (i % 2 === 0 ? COLORS.bar : COLORS.barAlt);
      el('rect',{x,y,width:w,height:h,fill:c,rx:3},svg);
      el('text',{x:x+w/2,y:y-6,'text-anchor':'middle','font-size':11,'font-family':'JetBrains Mono','font-weight':700,fill:COLORS.text},svg).textContent=d.value.toFixed(2);
      el('text',{x:x+w/2,y:H-12,'text-anchor':'middle','font-size':10,'font-family':'JetBrains Mono',fill:COLORS.text},svg).textContent=d.label.slice(0,12);
    });
  }

  /**
   * Donut/gauge for risk score 0..100.
   */
  function gauge(container, value, opts = {}) {
    container.innerHTML = '';
    const max = opts.max ?? 100;
    const pct = Math.max(0, Math.min(1, value/max));
    const r = 56, c = 2*Math.PI*r;
    const dash = c * pct;
    const color = opts.color || (value >= 60 ? COLORS.danger : value >= 30 ? COLORS.warn : COLORS.ok);

    const html = `
      <div class="risk-circle">
        <svg viewBox="0 0 140 140">
          <circle cx="70" cy="70" r="${r}" fill="none" stroke="rgba(20,16,8,.08)" stroke-width="14"/>
          <circle cx="70" cy="70" r="${r}" fill="none" stroke="${color}" stroke-width="14"
                  stroke-dasharray="${dash} ${c}" stroke-linecap="round"/>
        </svg>
        <div class="num" style="color:${color}">${value}</div>
      </div>`;
    container.innerHTML = html;
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  }

  return { line, bars, columns, gauge, COLORS };
})();
