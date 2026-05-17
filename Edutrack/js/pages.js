/* =====================================================
   pages.js — Page renderers
   Each page is async render(container, ctx).
   The router lives in app.js
   ===================================================== */

const Pages = (() => {
  const $ = UI.$, $$ = UI.$$;

  const APPROVE = 6.0;
  const SCALE = 10;

  /* ====================== ESTUDIANTE: DASHBOARD ====================== */
  async function dashboardEstudiante(c) {
    const u = Auth.current();
    const overall = await Analytics.overallAverage(u.id);
    const risk = await Risk.computeStudent(u.id);
    const series = await Analytics.timeSeries(u.id);
    const slope = Analytics.trendSlope(series);
    const critical = await Analytics.criticalSubjects(u.id);
    await Alerts.generateForStudent(u.id);
    const alerts = await Alerts.listForStudent(u.id);

    const trendLabel = slope > 0.05 ? '↑ Mejorando' : slope < -0.05 ? '↓ Bajando' : '→ Estable';
    const trendKind  = slope > 0.05 ? 'up' : slope < -0.05 ? 'down' : 'flat';

    c.innerHTML = `
      <div class="grid grid-4">
        <div class="card">
          <div class="card-title">Promedio general</div>
          <div class="card-value">${UI.fmtNum(overall.avg)}</div>
          <div class="card-foot">
            <span class="kpi-tag ${trendKind}">${trendLabel}</span>
            sobre ${SCALE.toFixed(0)}
          </div>
        </div>

        <div class="card">
          <div class="card-title">Índice de riesgo</div>
          <div class="card-value" style="color:${risk.level==='alto'?'var(--danger)':risk.level==='medio'?'var(--warn)':'var(--ok)'}">${risk.score}</div>
          <div class="card-foot">
            <span class="badge ${risk.level} dot">${Risk.levelLabel(risk.level)}</span>
          </div>
        </div>

        <div class="card">
          <div class="card-title">Materias cursando</div>
          <div class="card-value">${overall.breakdown.length}</div>
          <div class="card-foot">${critical.length} crítica${critical.length===1?'':'s'}</div>
        </div>

        <div class="card dark">
          <div class="card-title">Alertas activas</div>
          <div class="card-value">${alerts.length}</div>
          <div class="card-foot">
            ${alerts.filter(a=>a.severity==='high').length} alta ·
            ${alerts.filter(a=>a.severity==='medium').length} media
          </div>
        </div>
      </div>

      <div class="grid grid-2" style="margin-top:18px;">
        <div class="card chart-card">
          <div class="chart-head">
            <h3>Evolución de notas</h3>
            <span class="kpi-tag ${trendKind}">${trendLabel}</span>
          </div>
          <div class="chart-canvas tall" id="chartLine"></div>
        </div>

        <div class="card chart-card">
          <div class="chart-head">
            <h3>Rendimiento por materia</h3>
          </div>
          <div id="chartBars"></div>
        </div>
      </div>

      <div class="grid grid-2" style="margin-top:18px;">
        <div class="card">
          <div class="section-head" style="margin-top:0;">
            <h2 style="font-size:18px;">Alertas</h2>
          </div>
          <div id="alertsList"></div>
        </div>

        <div class="card">
          <div class="section-head" style="margin-top:0;">
            <h2 style="font-size:18px;">Acciones recomendadas</h2>
          </div>
          <div id="recommendList"></div>
        </div>
      </div>
    `;

    // Charts
    Charts.line($('#chartLine'), series.map(p => ({
      x: p.fecha, y: p.valor,
      label: new Date(p.fecha).toLocaleDateString('es-ES', { day:'2-digit', month:'short' })
    })), { yMin: 0, yMax: SCALE, refLine: APPROVE });

    Charts.bars($('#chartBars'),
      overall.breakdown.filter(b => b.avg != null).map(b => ({
        label: b.materia.nombre,
        value: b.avg,
        color: b.avg < APPROVE ? '#b3271a' : (b.avg >= 8 ? '#1f5d4f' : '#c9a227')
      })),
      { max: SCALE, refLine: APPROVE }
    );

    // Alerts
    const alertsHtml = alerts.length === 0
      ? `<div class="empty"><div class="icon">✓</div><h4>Todo en orden</h4><p>No hay alertas activas</p></div>`
      : alerts.slice(0, 6).map(a => `
        <div class="alert-item ${a.severity}">
          <div class="alert-icon">${a.severity==='high'?'!':a.severity==='medium'?'⚠':'ⓘ'}</div>
          <div class="alert-body">
            <strong>${UI.escapeHtml(a.title)}</strong>
            <div style="font-size:13px; color:var(--ink-soft);">${UI.escapeHtml(a.message)}</div>
            <small>${UI.fmtDate(a.createdAt)}</small>
          </div>
        </div>
      `).join('');
    $('#alertsList').innerHTML = alertsHtml;

    // Recommendations
    const recs = buildRecommendations(risk, critical, slope);
    $('#recommendList').innerHTML = recs.map(r => `
      <div class="alert-item low" style="border-left-color:var(--accent-2);">
        <div class="alert-icon">→</div>
        <div class="alert-body">
          <strong>${UI.escapeHtml(r.title)}</strong>
          <div style="font-size:13px; color:var(--ink-soft);">${UI.escapeHtml(r.text)}</div>
        </div>
      </div>
    `).join('');
  }

  function buildRecommendations(risk, critical, slope) {
    const out = [];
    if (risk.level === 'alto') out.push({ title: 'Solicitar tutoría urgente', text: 'Tu índice de riesgo está alto. Coordina con tu docente lo antes posible.' });
    if (slope < -0.1) out.push({ title: 'Revisar últimas evaluaciones', text: 'La tendencia es descendente. Identifica qué cambió y refuerza esos temas.' });
    if (critical.length > 0) out.push({ title: `Priorizar ${critical[0].materia.nombre}`, text: `Tu peor materia. Usa el simulador para saber qué nota necesitas.` });
    if (risk.level === 'bajo' && slope >= 0) out.push({ title: 'Mantén el ritmo', text: 'Tu rendimiento es estable. Busca elevar materias en zona media.' });
    if (out.length === 0) out.push({ title: 'Explora el simulador', text: 'Proyecta diferentes escenarios para optimizar tu plan.' });
    return out;
  }

  /* ====================== ESTUDIANTE: NOTAS ====================== */
  async function notasEstudiante(c) {
    const u = Auth.current();
    const overall = await Analytics.overallAverage(u.id);

    let html = `<div class="grid">`;
    for (const b of overall.breakdown) {
      const mat = b.materia;
      const status = b.avg == null ? 'flat' : (b.avg < APPROVE ? 'down' : (b.avg >= 8 ? 'up' : 'flat'));
      html += `
        <div class="card">
          <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:14px;">
            <div>
              <div class="eyebrow">${UI.escapeHtml(mat.codigo)}</div>
              <h3 style="font-family:var(--font-display); font-weight:600; margin:0 0 4px; font-size:22px;">${UI.escapeHtml(mat.nombre)}</h3>
              <div style="font-size:13px; color:var(--ink-soft);">Aprobación: ${mat.notaAprobacion} / ${mat.escala}</div>
            </div>
            <div style="text-align:right;">
              <div style="font-family:var(--font-display); font-weight:600; font-size:38px; line-height:1; color:${b.avg==null?'var(--ink-soft)':(b.avg<APPROVE?'var(--danger)':'var(--ok)')};">${UI.fmtNum(b.avg)}</div>
              <div style="font-family:var(--font-mono); font-size:11px; color:var(--ink-soft); margin-top:2px;">PROMEDIO</div>
            </div>
          </div>
          <div style="margin-top:16px;">
            ${b.items.length === 0 ? '<div class="empty"><p>Sin evaluaciones</p></div>' : `
              <table class="tbl" style="border:none; background:transparent;">
                <thead><tr><th>Evaluación</th><th>Tipo</th><th>Peso</th><th>Nota</th></tr></thead>
                <tbody>
                ${b.items.map(it => `
                  <tr>
                    <td>${UI.escapeHtml(it.evaluacion.nombre)}</td>
                    <td><span class="badge role">${UI.escapeHtml(it.evaluacion.tipo || 'Examen')}</span></td>
                    <td style="font-family:var(--font-mono);">${(it.evaluacion.peso*100).toFixed(0)}%</td>
                    <td style="font-family:var(--font-mono); font-weight:700; color:${it.nota?(it.nota.valor<APPROVE?'var(--danger)':'var(--ok)'):'var(--ink-soft)'};">
                      ${it.nota ? UI.fmtNum(it.nota.valor) : 'pend.'}
                    </td>
                  </tr>
                `).join('')}
                </tbody>
              </table>
            `}
          </div>
        </div>
      `;
    }
    html += `</div>`;
    c.innerHTML = html;
  }

  /* ====================== ESTUDIANTE: SIMULADOR ====================== */
  async function simulador(c) {
    const u = Auth.current();
    const materias = await DB.all('materias');

    c.innerHTML = `
      <div class="card">
        <div class="section-head" style="margin-top:0;">
          <h2>Simulador de notas</h2>
        </div>
        <p style="color:var(--ink-soft); margin: 0 0 16px;">Proyecta tu nota final con escenarios hipotéticos o calcula la nota mínima que necesitas para aprobar.</p>

        <div class="form-grid-2">
          <div class="form-row">
            <label>Materia</label>
            <select id="simMateria">
              ${materias.map(m => `<option value="${m.id}">${UI.escapeHtml(m.nombre)}</option>`).join('')}
            </select>
          </div>
          <div class="form-row">
            <label>Nota objetivo</label>
            <input type="number" id="simTarget" min="0" max="10" step="0.1" value="6.0" />
          </div>
        </div>

        <div id="simEvalsContainer"></div>

        <div style="display:flex; gap:10px; margin-top:14px; flex-wrap:wrap;">
          <button class="btn dark" id="btnProject">Proyectar escenario</button>
          <button class="btn" id="btnNeed">¿Cuánto necesito?</button>
          <button class="btn" id="btnReset">Reiniciar</button>
        </div>

        <div id="simOutput"></div>
      </div>
    `;

    const matSel = $('#simMateria');
    matSel.onchange = () => loadEvals(parseInt(matSel.value));
    await loadEvals(parseInt(matSel.value));

    async function loadEvals(materiaId) {
      const evals = await DB.where('evaluaciones', 'materiaId', materiaId);
      const notas = await DB.where('notas', 'estudianteId', u.id);
      const noteMap = new Map(notas.map(n => [n.evaluacionId, n]));
      const cont = $('#simEvalsContainer');
      cont.innerHTML = `
        <table class="tbl" style="margin-top:8px;">
          <thead><tr>
            <th>Evaluación</th><th>Peso</th><th>Nota actual</th><th>Hipotética</th>
          </tr></thead>
          <tbody>
            ${evals.map(e => {
              const n = noteMap.get(e.id);
              return `<tr>
                <td>${UI.escapeHtml(e.nombre)}</td>
                <td style="font-family:var(--font-mono);">${(e.peso*100).toFixed(0)}%</td>
                <td style="font-family:var(--font-mono);">${n ? UI.fmtNum(n.valor) : '—'}</td>
                <td><input class="sim-input" data-eval="${e.id}" type="number" min="0" max="10" step="0.1" placeholder="${n?'':'?'}" style="padding:6px 8px; width:90px; border:1px solid var(--line-soft); border-radius:6px; font-family:var(--font-mono);" /></td>
              </tr>`;
            }).join('')}
          </tbody>
        </table>
      `;
    }

    function readOverrides() {
      const map = {};
      $$('.sim-input').forEach(inp => {
        if (inp.value !== '') map[parseInt(inp.dataset.eval)] = parseFloat(inp.value);
      });
      return map;
    }

    $('#btnProject').onclick = async () => {
      const matId = parseInt(matSel.value);
      const overrides = readOverrides();
      const r = await Simulation.project(u.id, matId, overrides);
      const target = parseFloat($('#simTarget').value) || APPROVE;
      let kind = 'fail';
      if (r.proyectado >= target) kind = 'ok';
      else if (r.proyectado >= target - 1) kind = 'warn';
      $('#simOutput').innerHTML = `
        <div class="sim-result ${kind}">
          <h4>Nota proyectada</h4>
          <div class="big">${UI.fmtNum(r.proyectado)}</div>
          <div class="label">Cobertura ${(r.totalWeight*100).toFixed(0)}% del total · objetivo ${target}</div>
        </div>
      `;
    };

    $('#btnNeed').onclick = async () => {
      const matId = parseInt(matSel.value);
      const target = parseFloat($('#simTarget').value) || APPROVE;
      const r = await Simulation.minimumNeeded(u.id, matId, target);
      let kind, msg;
      if (r.floorAlready) {
        kind = 'ok';
        msg = `Ya cumples el objetivo. No requieres más esfuerzo.`;
      } else if (r.ceilingExceeded) {
        kind = 'fail';
        msg = `Imposible alcanzar ${target}. Necesitarías ${UI.fmtNum(r.notaNecesaria)} (>10).`;
      } else if (r.notaNecesaria == null) {
        kind = 'warn';
        msg = r.message || 'Sin evaluaciones pendientes';
      } else {
        kind = r.notaNecesaria <= 5 ? 'ok' : (r.notaNecesaria <= 8 ? 'warn' : 'fail');
        msg = `Promedio mínimo en evaluaciones pendientes`;
      }
      const valStr = r.notaNecesaria != null && r.possible ? UI.fmtNum(r.notaNecesaria) : '—';
      $('#simOutput').innerHTML = `
        <div class="sim-result ${kind}">
          <h4>Nota mínima necesaria</h4>
          <div class="big">${valStr}</div>
          <div class="label">${UI.escapeHtml(msg)}</div>
        </div>
        ${r.remaining && r.remaining.length ? `<div style="margin-top:14px;font-size:13px;color:var(--ink-soft);">Pendientes: ${r.remaining.map(e=>UI.escapeHtml(e.nombre)).join(' · ')}</div>` : ''}
      `;
    };

    $('#btnReset').onclick = () => {
      $$('.sim-input').forEach(i => i.value = '');
      $('#simOutput').innerHTML = '';
    };
  }

  /* ====================== ESTUDIANTE: RIESGO ====================== */
  async function riesgoEstudiante(c) {
    const u = Auth.current();
    const r = await Risk.computeStudent(u.id);
    c.innerHTML = `
      <div class="grid grid-2">
        <div class="card" style="display:flex; flex-direction:column; align-items:center; padding:24px;">
          <div class="card-title" style="text-align:center;">Tu índice de riesgo</div>
          <div id="riskGauge"></div>
          <div style="margin-top:8px; text-align:center;">
            <span class="badge ${r.level} dot" style="font-size:13px; padding:6px 14px;">${Risk.levelLabel(r.level)}</span>
          </div>
        </div>
        <div class="card">
          <div class="card-title">Componentes del riesgo</div>
          <div class="stat-list" style="margin-top:8px;">
            <div class="stat-row"><span class="key">Distancia bajo aprobación</span><span class="val">${r.components.distancia} / 40</span></div>
            <div class="stat-row"><span class="key">Tendencia descendente</span><span class="val">${r.components.tendencia} / 25</span></div>
            <div class="stat-row"><span class="key">Rendimiento reciente</span><span class="val">${r.components.reciente} / 20</span></div>
            <div class="stat-row"><span class="key">Materias críticas</span><span class="val">${r.components.criticas} / 15</span></div>
          </div>
        </div>
      </div>

      <div class="grid grid-2" style="margin-top:18px;">
        <div class="card">
          <div class="card-title">Estadísticas clave</div>
          <div class="stat-list">
            <div class="stat-row"><span class="key">Promedio general</span><span class="val">${UI.fmtNum(r.stats.promedio)}</span></div>
            <div class="stat-row"><span class="key">Pendiente de tendencia</span><span class="val">${r.stats.slope > 0 ? '+' : ''}${UI.fmtNum(r.stats.slope, 3)}</span></div>
            <div class="stat-row"><span class="key">Materias críticas</span><span class="val">${r.stats.materiasCriticas}</span></div>
            <div class="stat-row"><span class="key">Notas recientes reprobadas</span><span class="val">${r.stats.recientesReprobados}</span></div>
          </div>
        </div>
        <div class="card">
          <div class="card-title">Materias críticas</div>
          ${r.criticalSubjects.length === 0
            ? `<div class="empty" style="padding:32px 12px;"><div class="icon">✓</div><h4>Ninguna</h4><p>Todas tus materias están sobre el mínimo</p></div>`
            : r.criticalSubjects.map(c => `
              <div class="subject-row">
                <div>
                  <div class="name">${UI.escapeHtml(c.materia.nombre)}</div>
                  <div class="meta">${UI.escapeHtml(c.materia.codigo)}</div>
                </div>
                <div class="score fail">${UI.fmtNum(c.avg)}</div>
              </div>
            `).join('')
          }
        </div>
      </div>
    `;
    Charts.gauge($('#riskGauge'), r.score);
  }

  /* ====================== ESTUDIANTE: FEEDBACK ====================== */
  async function feedbackEstudiante(c) {
    const u = Auth.current();
    const comments = await Feedback.commentsForStudent(u.id);
    const evals = await Feedback.evaluationsTurnaround();
    // filter to evaluations for which this student has a grade
    const myNotas = await DB.where('notas', 'estudianteId', u.id);
    const myEvIds = new Set(myNotas.map(n => n.evaluacionId));
    const myEvals = evals.filter(e => myEvIds.has(e.ev.id));

    c.innerHTML = `
      <div class="grid grid-2">
        <div class="card">
          <div class="section-head" style="margin-top:0;"><h2 style="font-size:18px;">Comentarios docentes</h2></div>
          ${comments.length === 0 ?
            `<div class="empty"><div class="icon">…</div><p>Aún no hay comentarios</p></div>` :
            comments.map(f => `
              <div class="alert-item ${f.tipo === 'alerta' ? 'high' : f.tipo === 'mejora' ? 'medium' : 'low'}" style="border-left-color:${f.tipo==='alerta'?'var(--danger)':f.tipo==='mejora'?'var(--warn)':'var(--ok)'};">
                <div class="alert-icon">${f.tipo==='alerta'?'!':f.tipo==='mejora'?'↗':'★'}</div>
                <div class="alert-body">
                  <strong>${UI.escapeHtml(f.materia?.nombre || '—')} · ${UI.escapeHtml(f.evaluacion?.nombre || '—')}</strong>
                  <div style="font-size:13px;">${UI.escapeHtml(f.texto)}</div>
                  <small>${UI.fmtDate(f.createdAt)} · ${UI.escapeHtml(f.docente?.name || '—')}</small>
                </div>
              </div>
            `).join('')
          }
        </div>

        <div class="card">
          <div class="section-head" style="margin-top:0;"><h2 style="font-size:18px;">Tiempo de retroalimentación</h2></div>
          <div class="table-wrap">
            <table class="tbl">
              <thead><tr><th>Evaluación</th><th>Materia</th><th>Entregada</th><th>Corrección</th><th>Días</th></tr></thead>
              <tbody>
                ${myEvals.length === 0 ? `<tr><td colspan="5"><div class="empty"><p>Sin datos</p></div></td></tr>` :
                  myEvals.map(e => `
                    <tr>
                      <td>${UI.escapeHtml(e.ev.nombre)}</td>
                      <td>${UI.escapeHtml(e.materia?.nombre || '—')}</td>
                      <td>${UI.fmtDate(e.ev.fechaEntrega)}</td>
                      <td>${e.ev.fechaCorreccion ? UI.fmtDate(e.ev.fechaCorreccion) : '<span style="color:var(--warn)">pendiente</span>'}</td>
                      <td style="font-family:var(--font-mono); font-weight:700; color:${e.tatDays==null?'var(--warn)':e.tatDays>7?'var(--danger)':'var(--ok)'};">
                        ${e.tatDays==null ? '—' : Math.round(e.tatDays)+'d'}
                      </td>
                    </tr>
                  `).join('')
                }
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;
  }

  /* ====================== DOCENTE: DASHBOARD ====================== */
  async function dashboardDocente(c) {
    const u = Auth.current();
    const myMats = await DB.where('materias', 'docenteId', u.id);
    const myMatIds = new Set(myMats.map(m => m.id));
    const tat = await Feedback.turnaroundByDocente(u.id);
    const ranking = await Risk.rankStudents();

    let totalNotas = 0; let allNotas = [];
    for (const m of myMats) {
      const evals = await DB.where('evaluaciones', 'materiaId', m.id);
      for (const e of evals) {
        const ns = await DB.where('notas', 'evaluacionId', e.id);
        totalNotas += ns.length;
        allNotas.push(...ns);
      }
    }
    const meanGrade = allNotas.length ? allNotas.reduce((s,n)=>s+n.valor,0)/allNotas.length : null;

    c.innerHTML = `
      <div class="grid grid-4">
        <div class="card">
          <div class="card-title">Mis materias</div>
          <div class="card-value">${myMats.length}</div>
          <div class="card-foot">${myMats.map(m=>UI.escapeHtml(m.codigo)).join(' · ')||'—'}</div>
        </div>
        <div class="card">
          <div class="card-title">Notas registradas</div>
          <div class="card-value">${totalNotas}</div>
          <div class="card-foot">Promedio ${UI.fmtNum(meanGrade)}</div>
        </div>
        <div class="card">
          <div class="card-title">Tiempo medio feedback</div>
          <div class="card-value small">${tat.avgDays==null?'—':Math.round(tat.avgDays)+' d'}</div>
          <div class="card-foot">${tat.pending} pendiente${tat.pending===1?'':'s'}</div>
        </div>
        <div class="card dark">
          <div class="card-title">% a tiempo</div>
          <div class="card-value">${tat.onTimeRate==null?'—':Math.round(tat.onTimeRate*100)+'%'}</div>
          <div class="card-foot">≤ 7 días tras entrega</div>
        </div>
      </div>

      <div class="grid grid-2" style="margin-top:18px;">
        <div class="card">
          <div class="section-head" style="margin-top:0;"><h2 style="font-size:18px;">Promedio por materia</h2></div>
          <div id="dochart"></div>
        </div>
        <div class="card">
          <div class="section-head" style="margin-top:0;"><h2 style="font-size:18px;">Estudiantes en riesgo (top 5)</h2></div>
          <div class="table-wrap" style="border:none;">
            <table class="tbl">
              <thead><tr><th>Estudiante</th><th>Promedio</th><th>Riesgo</th></tr></thead>
              <tbody>
                ${ranking.slice(0,5).map(r => `
                  <tr>
                    <td>${UI.escapeHtml(r.user.name)}</td>
                    <td style="font-family:var(--font-mono); font-weight:700;">${UI.fmtNum(r.stats.promedio)}</td>
                    <td><span class="badge ${r.level} dot">${Risk.levelLabel(r.level)} (${r.score})</span></td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;

    // Bar chart of subject means
    const dat = [];
    for (const m of myMats) {
      const s = await Analytics.subjectStats(m.id);
      dat.push({ label: m.nombre, value: s.mean || 0 });
    }
    Charts.bars($('#dochart'), dat, { max: SCALE, refLine: APPROVE });
  }

  /* ====================== DOCENTE: NOTAS (gestión) ====================== */
  async function gestionNotas(c) {
    const u = Auth.current();
    const isAdmin = u.role === 'admin';
    const myMats = isAdmin ? await DB.all('materias') : await DB.where('materias', 'docenteId', u.id);

    c.innerHTML = `
      <div class="card">
        <div class="section-head" style="margin-top:0;">
          <h2>Gestión de notas</h2>
          <div class="actions">
            <button class="btn dark" id="btnAddEval">+ Evaluación</button>
            <button class="btn" id="btnAddMat">+ Materia</button>
          </div>
        </div>
        <div class="form-row" style="max-width:340px;">
          <label>Materia</label>
          <select id="gnMat">${myMats.map(m=>`<option value="${m.id}">${UI.escapeHtml(m.nombre)}</option>`).join('')}</select>
        </div>
        <div id="gnEvalArea"></div>
      </div>
    `;

    if (myMats.length === 0) {
      $('#gnEvalArea').innerHTML = `<div class="empty"><div class="icon">∅</div><h4>Sin materias</h4><p>Crea una materia para empezar</p></div>`;
    } else {
      $('#gnMat').onchange = () => loadEvalArea(parseInt($('#gnMat').value));
      await loadEvalArea(parseInt($('#gnMat').value));
    }

    $('#btnAddMat').onclick = () => modalMateria(u, async () => {
      await Pages.gestionNotas(c);
    });
    $('#btnAddEval').onclick = () => {
      if (myMats.length === 0) return UI.toast('Crea primero una materia', 'warn');
      const matId = parseInt($('#gnMat').value);
      modalEvaluacion(matId, async () => loadEvalArea(matId));
    };

    async function loadEvalArea(matId) {
      const evals = await DB.where('evaluaciones', 'materiaId', matId);
      const students = (await DB.all('usuarios')).filter(x => x.role === 'estudiante');
      if (evals.length === 0) {
        $('#gnEvalArea').innerHTML = `<div class="empty"><div class="icon">∅</div><h4>Sin evaluaciones</h4><p>Crea una evaluación para registrar notas</p></div>`;
        return;
      }
      // build matrix table: estudiante x evaluacion
      const allNotas = await DB.all('notas');
      const byKey = new Map(allNotas.map(n => [`${n.estudianteId}_${n.evaluacionId}`, n]));
      let html = `<div class="table-wrap" style="margin-top:14px;"><table class="tbl"><thead><tr><th>Estudiante</th>`;
      evals.forEach(e => html += `<th>${UI.escapeHtml(e.nombre)}<br><small style="font-family:var(--font-mono);font-weight:400;color:var(--ink-soft);">${(e.peso*100).toFixed(0)}%</small></th>`);
      html += `<th>Acciones</th></tr></thead><tbody>`;
      for (const s of students) {
        html += `<tr><td><strong>${UI.escapeHtml(s.name)}</strong><br><small style="color:var(--ink-soft);">@${UI.escapeHtml(s.username)}</small></td>`;
        for (const e of evals) {
          const n = byKey.get(`${s.id}_${e.id}`);
          html += `<td>
            <input type="number" min="0" max="10" step="0.1" value="${n ? n.valor : ''}"
                   data-est="${s.id}" data-eval="${e.id}" placeholder="—"
                   class="grade-cell"
                   style="width:70px;padding:6px 8px;border:1px solid var(--line-soft);border-radius:6px;font-family:var(--font-mono);font-weight:700;">
          </td>`;
        }
        html += `<td><button class="btn small" data-est="${s.id}" data-action="report">Reporte</button></td>`;
        html += `</tr>`;
      }
      html += `</tbody></table></div>
        <div style="display:flex; gap:10px; margin-top:14px;">
          <button class="btn dark" id="btnSaveGrades">Guardar cambios</button>
          <button class="btn" id="btnMarkCorrected">Marcar evaluación como corregida</button>
        </div>`;
      $('#gnEvalArea').innerHTML = html;

      $('#btnSaveGrades').onclick = async () => {
        let saved = 0;
        const inputs = $$('.grade-cell');
        for (const inp of inputs) {
          const estId = parseInt(inp.dataset.est);
          const evId  = parseInt(inp.dataset.eval);
          const val   = inp.value === '' ? null : parseFloat(inp.value);
          const existing = byKey.get(`${estId}_${evId}`);
          if (val == null) {
            if (existing) { await DB.del('notas', existing.id); saved++; }
          } else {
            if (existing) {
              if (Math.abs(existing.valor - val) > 0.001) {
                existing.valor = val;
                await DB.put('notas', existing);
                Sync.enqueue({ entity:'notas', action:'update', refId: existing.id, payload: { valor: val }});
                saved++;
              }
            } else {
              const id = await DB.add('notas', { estudianteId: estId, evaluacionId: evId, valor: val, observacion: '' });
              Sync.enqueue({ entity:'notas', action:'create', refId: id, payload: { estudianteId: estId, evaluacionId: evId, valor: val }});
              saved++;
            }
          }
        }
        UI.toast(`${saved} cambio(s) guardado(s)`, 'ok');
        await Alerts.regenerateAll();
        loadEvalArea(matId);
      };

      $('#btnMarkCorrected').onclick = async () => {
        const nombres = evals.map(e => `<option value="${e.id}">${UI.escapeHtml(e.nombre)}</option>`).join('');
        const body = document.createElement('div');
        body.innerHTML = `
          <div class="form-row">
            <label>Evaluación</label>
            <select id="mcEv">${nombres}</select>
          </div>
          <div class="form-row">
            <label>Fecha de corrección</label>
            <input type="date" id="mcDate" value="${new Date().toISOString().slice(0,10)}">
          </div>`;
        const ok = UI.btn({ label: 'Confirmar', kind: 'dark', onClick: async () => {
          const evId = parseInt($('#mcEv').value);
          const dateStr = $('#mcDate').value;
          const ev = await DB.get('evaluaciones', evId);
          ev.fechaCorreccion = new Date(dateStr).getTime();
          await DB.put('evaluaciones', ev);
          Sync.enqueue({ entity:'evaluaciones', action:'update', refId: ev.id, payload: { fechaCorreccion: ev.fechaCorreccion }});
          UI.closeModal(); UI.toast('Marcada como corregida', 'ok');
          loadEvalArea(matId);
        }});
        const cancel = UI.btn({ label: 'Cancelar', onClick: () => UI.closeModal() });
        UI.modal({ title: 'Marcar como corregida', body, footer: [cancel, ok] });
      };

      // Per-student report
      $$('button[data-action="report"]').forEach(b => b.onclick = async () => {
        const sid = parseInt(b.dataset.est);
        await showStudentReport(sid);
      });
    }
  }

  async function showStudentReport(sid) {
    const stu = await DB.get('usuarios', sid);
    const overall = await Analytics.overallAverage(sid);
    const risk = await Risk.computeStudent(sid);
    const body = document.createElement('div');
    body.innerHTML = `
      <div style="margin-bottom:14px;">
        <strong style="font-size:18px;">${UI.escapeHtml(stu.name)}</strong>
        <div style="color:var(--ink-soft); font-size:13px;">@${UI.escapeHtml(stu.username)}</div>
      </div>
      <div class="grid grid-2">
        <div class="card tight"><div class="card-title">Promedio</div><div class="card-value small">${UI.fmtNum(overall.avg)}</div></div>
        <div class="card tight"><div class="card-title">Riesgo</div><div class="card-value small" style="color:${risk.level==='alto'?'var(--danger)':risk.level==='medio'?'var(--warn)':'var(--ok)'}">${risk.score}</div></div>
      </div>
      <h4 style="font-family:var(--font-display); margin: 16px 0 8px;">Por materia</h4>
      ${overall.breakdown.map(b => `
        <div class="subject-row">
          <div>
            <div class="name">${UI.escapeHtml(b.materia.nombre)}</div>
            <div class="meta">${b.items.filter(i=>i.nota).length}/${b.items.length} evaluaciones</div>
          </div>
          <div class="score ${b.avg==null?'':b.avg<APPROVE?'fail':'ok'}">${UI.fmtNum(b.avg)}</div>
        </div>
      `).join('')}
    `;
    UI.modal({ title: 'Reporte académico', body });
  }

  function modalMateria(u, onDone) {
    const body = document.createElement('div');
    body.innerHTML = `
      <div class="form-row"><label>Nombre</label><input type="text" id="mfNombre" required></div>
      <div class="form-grid-2">
        <div class="form-row"><label>Código</label><input type="text" id="mfCodigo" required></div>
        <div class="form-row"><label>Aprobación</label><input type="number" id="mfAprob" min="0" max="10" step="0.1" value="6.0"></div>
      </div>`;
    const save = UI.btn({ label: 'Crear', kind: 'dark', onClick: async () => {
      const nombre = $('#mfNombre').value.trim();
      const codigo = $('#mfCodigo').value.trim();
      const aprob = parseFloat($('#mfAprob').value);
      if (!nombre || !codigo) return UI.toast('Faltan datos','err');
      const id = await DB.add('materias', { nombre, codigo, docenteId: u.id, notaAprobacion: aprob, escala: 10 });
      Sync.enqueue({ entity:'materias', action:'create', refId:id, payload:{ nombre, codigo }});
      UI.closeModal(); UI.toast('Materia creada','ok');
      onDone?.();
    }});
    const cancel = UI.btn({ label:'Cancelar', onClick: UI.closeModal });
    UI.modal({ title: 'Nueva materia', body, footer: [cancel, save] });
  }

  function modalEvaluacion(matId, onDone) {
    const body = document.createElement('div');
    body.innerHTML = `
      <div class="form-row"><label>Nombre</label><input type="text" id="efNombre" required placeholder="Examen Parcial 1"></div>
      <div class="form-grid-2">
        <div class="form-row">
          <label>Tipo</label>
          <select id="efTipo">
            <option>Examen</option><option>Trabajo</option>
            <option>Proyecto</option><option>Laboratorio</option>
            <option>Ensayo</option><option>Quiz</option>
          </select>
        </div>
        <div class="form-row">
          <label>Peso (0–1)</label>
          <input type="number" id="efPeso" min="0.05" max="1" step="0.05" value="0.25">
        </div>
      </div>
      <div class="form-row">
        <label>Fecha de entrega</label>
        <input type="date" id="efFecha" value="${new Date().toISOString().slice(0,10)}">
      </div>`;
    const save = UI.btn({ label:'Crear', kind:'dark', onClick: async () => {
      const nombre = $('#efNombre').value.trim();
      const tipo = $('#efTipo').value;
      const peso = parseFloat($('#efPeso').value);
      const fecha = new Date($('#efFecha').value).getTime();
      if (!nombre || isNaN(peso)) return UI.toast('Faltan datos','err');
      const id = await DB.add('evaluaciones', { materiaId: matId, nombre, tipo, peso, fechaEntrega: fecha, fechaCorreccion: null });
      Sync.enqueue({ entity:'evaluaciones', action:'create', refId:id, payload:{ nombre }});
      UI.closeModal(); UI.toast('Evaluación creada','ok');
      onDone?.();
    }});
    const cancel = UI.btn({ label:'Cancelar', onClick: UI.closeModal });
    UI.modal({ title: 'Nueva evaluación', body, footer: [cancel, save] });
  }

  /* ====================== DOCENTE: ESTUDIANTES ====================== */
  async function listaEstudiantes(c) {
    const ranking = await Risk.rankStudents();
    c.innerHTML = `
      <div class="card">
        <div class="section-head" style="margin-top:0;">
          <h2>Estudiantes</h2>
          <div class="actions">
            <button class="btn" id="btnExpAll">Exportar CSV</button>
          </div>
        </div>
        <div class="table-wrap" style="border:none;">
          <table class="tbl">
            <thead><tr>
              <th>Nombre</th><th>Promedio</th><th>Tendencia</th>
              <th>Materias críticas</th><th>Riesgo</th><th></th>
            </tr></thead>
            <tbody>
              ${ranking.map(r => `
                <tr>
                  <td><strong>${UI.escapeHtml(r.user.name)}</strong><br><small style="color:var(--ink-soft);">@${UI.escapeHtml(r.user.username)}</small></td>
                  <td style="font-family:var(--font-mono); font-weight:700;">${UI.fmtNum(r.stats.promedio)}</td>
                  <td>${r.stats.slope > 0.05 ? '<span class="kpi-tag up">↑</span>' : r.stats.slope < -0.05 ? '<span class="kpi-tag down">↓</span>' : '<span class="kpi-tag flat">→</span>'}</td>
                  <td>${r.stats.materiasCriticas}</td>
                  <td><span class="badge ${r.level} dot">${Risk.levelLabel(r.level)} (${r.score})</span></td>
                  <td><button class="btn small" data-id="${r.user.id}">Ver</button></td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
    $$('button[data-id]').forEach(b => b.onclick = () => showStudentReport(parseInt(b.dataset.id)));
    $('#btnExpAll').onclick = () => {
      const rows = ranking.map(r => ({
        nombre: r.user.name, usuario: r.user.username,
        promedio: r.stats.promedio?.toFixed(2) || '',
        riesgo: r.score, nivel: Risk.levelLabel(r.level),
        materias_criticas: r.stats.materiasCriticas
      }));
      Exporter.exportCSV(rows, `estudiantes_${Date.now()}.csv`);
      UI.toast('CSV descargado','ok');
    };
  }

  /* ====================== DOCENTE: FEEDBACK ====================== */
  async function feedbackDocente(c) {
    const u = Auth.current();
    const isAdmin = u.role === 'admin';
    const docId = isAdmin ? null : u.id;
    const tat = isAdmin ? null : await Feedback.turnaroundByDocente(u.id);
    const evals = await Feedback.evaluationsTurnaround(docId);
    const ranking = await Feedback.rankDocentes();

    c.innerHTML = `
      ${tat ? `<div class="grid grid-4">
        <div class="card"><div class="card-title">Promedio</div><div class="card-value small">${tat.avgDays==null?'—':Math.round(tat.avgDays)+' d'}</div><div class="card-foot">tiempo de corrección</div></div>
        <div class="card"><div class="card-title">% a tiempo</div><div class="card-value small">${tat.onTimeRate==null?'—':Math.round(tat.onTimeRate*100)+'%'}</div><div class="card-foot">en ≤ 7 días</div></div>
        <div class="card"><div class="card-title">Corregidas</div><div class="card-value small">${tat.count}</div><div class="card-foot">de ${tat.total}</div></div>
        <div class="card dark"><div class="card-title">Pendientes</div><div class="card-value small">${tat.pending}</div><div class="card-foot">por corregir</div></div>
      </div>` : ''}

      ${isAdmin ? `<div class="card" style="margin-top:18px;">
        <div class="section-head" style="margin-top:0;"><h2 style="font-size:18px;">Ranking de docentes</h2></div>
        <div class="table-wrap" style="border:none;">
          <table class="tbl">
            <thead><tr><th>Docente</th><th>Promedio (días)</th><th>% a tiempo</th><th>Corregidas</th><th>Pendientes</th></tr></thead>
            <tbody>
              ${ranking.map(d => `
                <tr>
                  <td><strong>${UI.escapeHtml(d.user.name)}</strong></td>
                  <td style="font-family:var(--font-mono);font-weight:700;">${d.avgDays==null?'—':Math.round(d.avgDays)}</td>
                  <td>${d.onTimeRate==null?'—':Math.round(d.onTimeRate*100)+'%'}</td>
                  <td>${d.count}</td>
                  <td>${d.pending}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>` : ''}

      <div class="card" style="margin-top:18px;">
        <div class="section-head" style="margin-top:0;"><h2 style="font-size:18px;">Detalle por evaluación</h2></div>
        <div class="table-wrap" style="border:none;">
          <table class="tbl">
            <thead><tr><th>Evaluación</th><th>Materia</th><th>Entregada</th><th>Corregida</th><th>Días</th></tr></thead>
            <tbody>
              ${evals.map(e => `
                <tr>
                  <td>${UI.escapeHtml(e.ev.nombre)}</td>
                  <td>${UI.escapeHtml(e.materia?.nombre || '—')}</td>
                  <td>${UI.fmtDate(e.ev.fechaEntrega)}</td>
                  <td>${e.ev.fechaCorreccion ? UI.fmtDate(e.ev.fechaCorreccion) : '<span style="color:var(--warn)">pendiente</span>'}</td>
                  <td style="font-family:var(--font-mono);font-weight:700;color:${e.tatDays==null?'var(--warn)':e.tatDays>7?'var(--danger)':'var(--ok)'};">${e.tatDays==null?'—':Math.round(e.tatDays)+'d'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

  /* ====================== ALERTAS (todos) ====================== */
  async function paginaAlertas(c) {
    const u = Auth.current();
    if (u.role === 'estudiante') {
      const alerts = await Alerts.listForStudent(u.id);
      c.innerHTML = `
        <div class="card">
          <div class="section-head" style="margin-top:0;">
            <h2>Alertas inteligentes</h2>
            <div class="actions"><button class="btn" id="btnRegen">Regenerar</button></div>
          </div>
          ${alerts.length === 0 ? `<div class="empty"><div class="icon">✓</div><h4>No hay alertas</h4><p>Todo en orden</p></div>` :
            alerts.map(a => `
              <div class="alert-item ${a.severity}">
                <div class="alert-icon">${a.severity==='high'?'!':a.severity==='medium'?'⚠':'ⓘ'}</div>
                <div class="alert-body">
                  <strong>${UI.escapeHtml(a.title)}</strong>
                  <div style="font-size:13px; color:var(--ink-soft);">${UI.escapeHtml(a.message)}</div>
                  <small>${UI.fmtDate(a.createdAt)}</small>
                </div>
              </div>
            `).join('')
          }
        </div>
      `;
      $('#btnRegen').onclick = async () => {
        await Alerts.generateForStudent(u.id);
        UI.toast('Alertas regeneradas', 'ok');
        paginaAlertas(c);
      };
    } else {
      // docente/admin: alertas de todos los estudiantes
      const students = (await DB.all('usuarios')).filter(x=>x.role==='estudiante');
      let html = `<div class="card"><div class="section-head" style="margin-top:0;">
        <h2>Alertas globales</h2>
        <div class="actions"><button class="btn" id="btnRegen">Regenerar todas</button></div>
      </div>`;
      for (const s of students) {
        const alerts = await Alerts.listForStudent(s.id);
        if (alerts.length === 0) continue;
        html += `<div style="margin-top:18px;"><h3 style="font-family:var(--font-display); font-weight:600; margin:0 0 8px; font-size:16px;">${UI.escapeHtml(s.name)}</h3>`;
        html += alerts.map(a => `
          <div class="alert-item ${a.severity}">
            <div class="alert-icon">${a.severity==='high'?'!':a.severity==='medium'?'⚠':'ⓘ'}</div>
            <div class="alert-body">
              <strong>${UI.escapeHtml(a.title)}</strong>
              <div style="font-size:13px;">${UI.escapeHtml(a.message)}</div>
            </div>
          </div>`).join('');
        html += `</div>`;
      }
      html += `</div>`;
      c.innerHTML = html;
      $('#btnRegen').onclick = async () => {
        await Alerts.regenerateAll();
        UI.toast('Alertas regeneradas', 'ok');
        paginaAlertas(c);
      };
    }
  }

  /* ====================== EXPORTACIÓN ====================== */
  async function paginaExportar(c) {
    const u = Auth.current();
    c.innerHTML = `
      <div class="card">
        <div class="section-head" style="margin-top:0;"><h2>Exportar reportes</h2></div>
        <p style="color:var(--ink-soft);">Descarga datos académicos en formato CSV o genera un reporte imprimible (PDF).</p>
        <div class="grid grid-2" style="margin-top:14px;">
          <div class="card" style="background:var(--paper-2);">
            <h4 style="font-family:var(--font-display); font-weight:600; margin:0 0 6px;">Mis notas (CSV)</h4>
            <p style="font-size:13px; color:var(--ink-soft); margin-bottom:14px;">Exporta tu historial completo de notas.</p>
            <button class="btn dark" id="btnCSV">Descargar CSV</button>
          </div>
          <div class="card" style="background:var(--paper-2);">
            <h4 style="font-family:var(--font-display); font-weight:600; margin:0 0 6px;">Reporte imprimible</h4>
            <p style="font-size:13px; color:var(--ink-soft); margin-bottom:14px;">Genera un reporte académico que puedes imprimir o guardar como PDF.</p>
            <button class="btn dark" id="btnPDF">Generar reporte</button>
          </div>
          ${(u.role==='docente'||u.role==='admin') ? `
            <div class="card" style="background:var(--paper-2);">
              <h4 style="font-family:var(--font-display); font-weight:600; margin:0 0 6px;">Estudiantes (CSV)</h4>
              <p style="font-size:13px; color:var(--ink-soft); margin-bottom:14px;">Listado con promedios y riesgos.</p>
              <button class="btn" id="btnEstCSV">Descargar</button>
            </div>
            <div class="card" style="background:var(--paper-2);">
              <h4 style="font-family:var(--font-display); font-weight:600; margin:0 0 6px;">Métricas de feedback (CSV)</h4>
              <p style="font-size:13px; color:var(--ink-soft); margin-bottom:14px;">Tiempos de corrección por evaluación.</p>
              <button class="btn" id="btnFbCSV">Descargar</button>
            </div>
          ` : ''}
        </div>
      </div>
    `;

    $('#btnCSV').onclick = async () => {
      let rows = [];
      if (u.role === 'estudiante') {
        const overall = await Analytics.overallAverage(u.id);
        for (const b of overall.breakdown) {
          for (const it of b.items) {
            rows.push({
              materia: b.materia.nombre,
              evaluacion: it.evaluacion.nombre,
              tipo: it.evaluacion.tipo || '',
              peso: it.evaluacion.peso,
              fecha: new Date(it.evaluacion.fechaEntrega).toLocaleDateString('es-ES'),
              nota: it.nota?.valor ?? ''
            });
          }
        }
      } else {
        const allNotas = await DB.all('notas');
        const evMap = new Map((await DB.all('evaluaciones')).map(e=>[e.id,e]));
        const matMap = new Map((await DB.all('materias')).map(m=>[m.id,m]));
        const usrMap = new Map((await DB.all('usuarios')).map(x=>[x.id,x]));
        rows = allNotas.map(n => {
          const ev = evMap.get(n.evaluacionId);
          const mat = ev ? matMap.get(ev.materiaId) : null;
          return {
            estudiante: usrMap.get(n.estudianteId)?.name || '',
            materia: mat?.nombre || '',
            evaluacion: ev?.nombre || '',
            peso: ev?.peso || '',
            nota: n.valor,
            fecha: ev ? new Date(ev.fechaEntrega).toLocaleDateString('es-ES') : ''
          };
        });
      }
      Exporter.exportCSV(rows, `notas_${Date.now()}.csv`);
      UI.toast('CSV descargado','ok');
    };

    $('#btnPDF').onclick = async () => {
      let html = '';
      if (u.role === 'estudiante') {
        const overall = await Analytics.overallAverage(u.id);
        const risk = await Risk.computeStudent(u.id);
        html += `
          <div>
            <span class="kpi"><b>${UI.fmtNum(overall.avg)}</b><span>Promedio</span></span>
            <span class="kpi"><b>${risk.score}</b><span>Riesgo (${Risk.levelLabel(risk.level)})</span></span>
            <span class="kpi"><b>${overall.breakdown.length}</b><span>Materias</span></span>
          </div>`;
        for (const b of overall.breakdown) {
          html += `<h2>${UI.escapeHtml(b.materia.nombre)} <small style="font-size:14px;color:#666;">(${UI.escapeHtml(b.materia.codigo)})</small> — ${UI.fmtNum(b.avg)}</h2>`;
          html += `<table><thead><tr><th>Evaluación</th><th>Tipo</th><th>Peso</th><th>Nota</th></tr></thead><tbody>`;
          for (const it of b.items) {
            html += `<tr><td>${UI.escapeHtml(it.evaluacion.nombre)}</td><td>${UI.escapeHtml(it.evaluacion.tipo||'—')}</td><td>${(it.evaluacion.peso*100).toFixed(0)}%</td><td><b>${it.nota?UI.fmtNum(it.nota.valor):'—'}</b></td></tr>`;
          }
          html += `</tbody></table>`;
        }
        Exporter.printReport(`Reporte académico — ${u.name}`, html);
      } else {
        // docente: listado de estudiantes
        const ranking = await Risk.rankStudents();
        html += `<table><thead><tr><th>Estudiante</th><th>Promedio</th><th>Riesgo</th><th>Críticas</th></tr></thead><tbody>`;
        for (const r of ranking) {
          html += `<tr><td>${UI.escapeHtml(r.user.name)}</td><td><b>${UI.fmtNum(r.stats.promedio)}</b></td><td><span class="badge ${r.level}">${Risk.levelLabel(r.level)} (${r.score})</span></td><td>${r.stats.materiasCriticas}</td></tr>`;
        }
        html += `</tbody></table>`;
        Exporter.printReport(`Reporte de estudiantes — ${u.name}`, html);
      }
    };

    if ($('#btnEstCSV')) {
      $('#btnEstCSV').onclick = async () => {
        const r = await Risk.rankStudents();
        Exporter.exportCSV(r.map(x => ({
          nombre: x.user.name, usuario: x.user.username,
          promedio: x.stats.promedio?.toFixed(2)||'', riesgo: x.score,
          nivel: Risk.levelLabel(x.level), materias_criticas: x.stats.materiasCriticas
        })), `estudiantes_${Date.now()}.csv`);
        UI.toast('Descargado','ok');
      };
    }
    if ($('#btnFbCSV')) {
      $('#btnFbCSV').onclick = async () => {
        const ev = await Feedback.evaluationsTurnaround(u.role==='admin'?null:u.id);
        Exporter.exportCSV(ev.map(e => ({
          evaluacion: e.ev.nombre,
          materia: e.materia?.nombre || '',
          entregada: new Date(e.ev.fechaEntrega).toLocaleDateString('es-ES'),
          corregida: e.ev.fechaCorreccion ? new Date(e.ev.fechaCorreccion).toLocaleDateString('es-ES') : '',
          dias_correccion: e.tatDays==null ? '' : Math.round(e.tatDays)
        })), `feedback_${Date.now()}.csv`);
        UI.toast('Descargado','ok');
      };
    }
  }

  /* ====================== ADMIN: USUARIOS ====================== */
  async function gestionUsuarios(c) {
    const all = await DB.all('usuarios');
    c.innerHTML = `
      <div class="card">
        <div class="section-head" style="margin-top:0;">
          <h2>Usuarios</h2>
          <div class="actions"><button class="btn dark" id="btnAddUsr">+ Crear usuario</button></div>
        </div>
        <div class="table-wrap" style="border:none;">
          <table class="tbl">
            <thead><tr><th>Nombre</th><th>Usuario</th><th>Rol</th><th>Email</th><th></th></tr></thead>
            <tbody>
              ${all.map(u => `
                <tr>
                  <td><strong>${UI.escapeHtml(u.name)}</strong></td>
                  <td style="font-family:var(--font-mono);">${UI.escapeHtml(u.username)}</td>
                  <td><span class="badge role">${UI.escapeHtml(u.role)}</span></td>
                  <td>${UI.escapeHtml(u.email||'')}</td>
                  <td>${u.role!=='admin' ? `<button class="btn small danger" data-del="${u.id}">Eliminar</button>` : ''}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
    $('#btnAddUsr').onclick = () => {
      const body = document.createElement('div');
      body.innerHTML = `
        <div class="form-row"><label>Nombre completo</label><input type="text" id="uName"></div>
        <div class="form-grid-2">
          <div class="form-row"><label>Usuario</label><input type="text" id="uUser"></div>
          <div class="form-row"><label>Contraseña</label><input type="password" id="uPass"></div>
        </div>
        <div class="form-row"><label>Rol</label><select id="uRole"><option value="estudiante">Estudiante</option><option value="docente">Docente</option></select></div>
      `;
      const save = UI.btn({ label:'Crear', kind:'dark', onClick: async () => {
        try {
          await Auth.register({
            username: $('#uUser').value.trim(),
            password: $('#uPass').value,
            name: $('#uName').value.trim(),
            role: $('#uRole').value
          });
          UI.closeModal(); UI.toast('Usuario creado','ok');
          gestionUsuarios(c);
        } catch (e) { UI.toast(e.message, 'err'); }
      }});
      const cancel = UI.btn({ label:'Cancelar', onClick: UI.closeModal });
      UI.modal({ title:'Nuevo usuario', body, footer:[cancel, save]});
    };
    $$('button[data-del]').forEach(b => b.onclick = async () => {
      const ok = await UI.confirm({ title:'Eliminar usuario', message:'Esta acción no se puede deshacer.', okLabel:'Eliminar', danger:true });
      if (ok) {
        await DB.del('usuarios', parseInt(b.dataset.del));
        Sync.enqueue({ entity:'usuarios', action:'delete', refId: parseInt(b.dataset.del), payload: {} });
        UI.toast('Usuario eliminado','ok');
        gestionUsuarios(c);
      }
    });
  }

  return {
    dashboardEstudiante, notasEstudiante, simulador, riesgoEstudiante, feedbackEstudiante,
    dashboardDocente, gestionNotas, listaEstudiantes, feedbackDocente,
    paginaAlertas, paginaExportar, gestionUsuarios
  };
})();
