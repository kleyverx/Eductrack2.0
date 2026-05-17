/* =========================================================================
   app.js — orchestrator + router for EduTrack Insight v2.0
   ------------------------------------------------------------------------
   Responsibilities:
     · Boot DB, seed demo data, init Sync
     · Wire login / register tabs and forms
     · Build sidebar navigation from role
     · Route to page renderers (Pages.*) and update header
     · Manage connection status pill, sync badge & manual sync button
     · Restore session on reload
   ========================================================================= */

(() => {
  'use strict';

  // ------------------------------------------------------------------ state
  const state = {
    user:        null,
    currentPage: null,
  };

  // ----------------------------------------------------------- nav per role
  const NAV = {
    estudiante: [
      { id:'dashboard', label:'Dashboard',  icon:'◐', title:'Dashboard',           sub:'Tu panorama académico' },
      { id:'notas',     label:'Mis notas',  icon:'≡', title:'Mis notas',           sub:'Detalle por materia y evaluación' },
      { id:'simulador', label:'Simulador',  icon:'⊕', title:'Simulador de notas',  sub:'Proyecta escenarios “qué pasaría si…”' },
      { id:'riesgo',    label:'Riesgo',     icon:'⚠', title:'Índice de riesgo',    sub:'Detección temprana basada en señales' },
      { id:'feedback',  label:'Feedback',   icon:'✎', title:'Feedback docente',    sub:'Comentarios recibidos y tiempos de corrección' },
      { id:'alertas',   label:'Alertas',    icon:'◇', title:'Alertas inteligentes', sub:'Notificaciones contextuales' },
      { id:'exportar',  label:'Exportar',   icon:'↧', title:'Exportar datos',      sub:'CSV y reporte imprimible' },
    ],
    docente: [
      { id:'dashboard',   label:'Dashboard',     icon:'◐', title:'Dashboard docente',  sub:'Vista global de tus materias' },
      { id:'gestion',     label:'Gestión notas', icon:'✎', title:'Gestión académica',  sub:'Materias, evaluaciones y calificaciones' },
      { id:'estudiantes', label:'Estudiantes',   icon:'☷', title:'Estudiantes',        sub:'Promedio, riesgo y tendencia' },
      { id:'feedback',    label:'Feedback',      icon:'✦', title:'Observabilidad de feedback', sub:'Tiempos de corrección y comentarios' },
      { id:'alertas',     label:'Alertas',       icon:'◇', title:'Alertas',            sub:'Estudiantes con señales críticas' },
      { id:'exportar',    label:'Exportar',      icon:'↧', title:'Exportar datos',     sub:'CSV y reportes imprimibles' },
    ],
    admin: [
      { id:'dashboard',   label:'Dashboard',     icon:'◐', title:'Dashboard administrador', sub:'Visión institucional' },
      { id:'gestion',     label:'Gestión notas', icon:'✎', title:'Gestión académica',       sub:'Materias, evaluaciones y calificaciones' },
      { id:'estudiantes', label:'Estudiantes',   icon:'☷', title:'Estudiantes',             sub:'Promedio, riesgo y tendencia' },
      { id:'feedback',    label:'Feedback',      icon:'✦', title:'Observabilidad de feedback', sub:'Tiempos de corrección y comentarios' },
      { id:'alertas',     label:'Alertas',       icon:'◇', title:'Alertas',                 sub:'Toda la institución' },
      { id:'usuarios',    label:'Usuarios',      icon:'⚙', title:'Gestión de usuarios',     sub:'Altas, roles y permisos' },
      { id:'exportar',    label:'Exportar',      icon:'↧', title:'Exportar datos',          sub:'CSV y reportes imprimibles' },
    ],
  };

  // dispatch table — id → renderer name on Pages
  const ROUTES = {
    estudiante: {
      dashboard: 'dashboardEstudiante',
      notas:     'notasEstudiante',
      simulador: 'simulador',
      riesgo:    'riesgoEstudiante',
      feedback:  'feedbackEstudiante',
      alertas:   'paginaAlertas',
      exportar:  'paginaExportar',
    },
    docente: {
      dashboard:   'dashboardDocente',
      gestion:     'gestionNotas',
      estudiantes: 'listaEstudiantes',
      feedback:    'feedbackDocente',
      alertas:     'paginaAlertas',
      exportar:    'paginaExportar',
    },
    admin: {
      dashboard:   'dashboardDocente',
      gestion:     'gestionNotas',
      estudiantes: 'listaEstudiantes',
      feedback:    'feedbackDocente',
      alertas:     'paginaAlertas',
      usuarios:    'gestionUsuarios',
      exportar:    'paginaExportar',
    },
  };

  // ------------------------------------------------------------------ utils
  const $  = (sel, root=document) => root.querySelector(sel);
  const $$ = (sel, root=document) => Array.from(root.querySelectorAll(sel));

  // ============================================================== BOOT ===
  async function boot() {
    setBrandStatus('booting', 'Abriendo base de datos…');

    try {
      await DB.open();
    } catch (err) {
      console.error('DB open failed', err);
      setBrandStatus('error', 'Error de almacenamiento');
      return;
    }

    setBrandStatus('booting', 'Sembrando datos demo…');
    try { await Seed.run(); } catch (err) { console.warn('seed warn', err); }

    Sync.init();
    Sync.on((evt) => {
      if (evt === 'online' || evt === 'offline') updateConnStatus();
      if (evt === 'queued' || evt === 'flush:item' || evt === 'flush:end' || evt === 'flush:error') {
        updateSyncBadge();
      }
    });

    wireAuthScreen();
    wireAppShell();

    // try to restore session
    const restored = await Auth.restore();
    if (restored) {
      enterApp(restored);
    } else {
      showLogin();
    }

    setBrandStatus('ok', Sync.isOnline() ? 'Listo · online' : 'Listo · offline');
    updateConnStatus();
    updateSyncBadge();

    // periodic badge refresh (in case enqueues happen via flows we didn't observe)
    setInterval(updateSyncBadge, 4000);
  }

  // ============================================================== LOGIN ==
  function wireAuthScreen() {
    // tabs
    $$('.login-tabs .tab').forEach(btn => {
      btn.addEventListener('click', () => {
        const which = btn.dataset.tab;
        $$('.login-tabs .tab').forEach(b => b.classList.toggle('active', b === btn));
        $('#loginForm').classList.toggle('active', which === 'login');
        $('#registerForm').classList.toggle('active', which === 'register');
        $('#loginError').textContent = '';
        $('#regError').textContent = '';
      });
    });

    // login submit
    $('#loginForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const u = $('#loginUser').value.trim();
      const p = $('#loginPass').value;
      const err = $('#loginError');
      err.textContent = '';
      try {
        const user = await Auth.login(u, p);
        enterApp(user);
      } catch (ex) {
        err.textContent = ex.message || 'No se pudo iniciar sesión';
      }
    });

    // register submit
    $('#registerForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = $('#regName').value.trim();
      const user = $('#regUser').value.trim();
      const pass = $('#regPass').value;
      const role = $('#regRole').value;
      const err  = $('#regError');
      err.textContent = '';
      try {
        await Auth.register({ name, username: user, password: pass, role });
        const logged = await Auth.login(user, pass);
        enterApp(logged);
      } catch (ex) {
        err.textContent = ex.message || 'No se pudo crear la cuenta';
      }
    });
  }

  function setBrandStatus(kind, text) {
    const dot = $('#brandDot');
    const lbl = $('#brandStatus');
    if (lbl) lbl.textContent = text;
    if (dot) {
      dot.classList.remove('ok','error','booting');
      dot.classList.add(kind);
    }
  }

  // ============================================================== SHELL ==
  function wireAppShell() {
    $('#btnLogout').addEventListener('click', async () => {
      await Auth.logout();
      state.user = null;
      state.currentPage = null;
      showLogin();
    });

    $('#btnSync').addEventListener('click', async () => {
      if (!Sync.isOnline()) {
        UI.toast('Estás offline · los cambios se sincronizarán al reconectar', 'warn');
        return;
      }
      const before = await Sync.pendingCount();
      if (before === 0) {
        UI.toast('Nada que sincronizar', 'info');
        return;
      }
      UI.toast(`Sincronizando ${before} cambio${before>1?'s':''}…`, 'info');
      try {
        await Sync.flush();
        UI.toast('Sincronización completa', 'ok');
      } catch (ex) {
        UI.toast('Error en sincronización · reintentaremos', 'error');
      }
      updateSyncBadge();
    });

    // close modal on bg / X
    $('#modalClose').addEventListener('click', () => UI.closeModal());
    $('.modal-bg').addEventListener('click', () => UI.closeModal());
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') UI.closeModal();
    });
  }

  // ============================================================== APP ====
  function enterApp(user) {
    state.user = user;
    $('#loginScreen').classList.add('hidden');
    $('#appScreen').classList.remove('hidden');

    // user card
    $('#userName').textContent = user.name;
    $('#userRole').textContent = roleLabel(user.role);
    $('#userAvatar').textContent = (user.name || user.username || '?').trim().charAt(0).toUpperCase();

    buildSidebar(user.role);
    navigate('dashboard');
    updateConnStatus();
    updateSyncBadge();
  }

  function showLogin() {
    $('#appScreen').classList.add('hidden');
    $('#loginScreen').classList.remove('hidden');
    $('#loginUser').value = '';
    $('#loginPass').value = '';
    $('#loginError').textContent = '';
    setBrandStatus('ok', Sync.isOnline() ? 'Listo · online' : 'Listo · offline');
  }

  function roleLabel(r) {
    return r === 'estudiante' ? 'Estudiante'
         : r === 'docente'    ? 'Docente'
         : r === 'admin'      ? 'Administrador'
         : r;
  }

  // ============================================================ SIDEBAR ==
  function buildSidebar(role) {
    const items = NAV[role] || [];
    const nav = $('#sidebarNav');
    nav.innerHTML = '';
    items.forEach(item => {
      const a = document.createElement('button');
      a.className = 'nav-item';
      a.dataset.page = item.id;
      a.innerHTML = `
        <span class="icon">${item.icon}</span>
        <span>${item.label}</span>
      `;
      a.addEventListener('click', () => navigate(item.id));
      nav.appendChild(a);
    });
  }

  // ============================================================== NAV ====
  async function navigate(pageId) {
    const role = state.user?.role;
    if (!role) return;
    const items = NAV[role] || [];
    const meta = items.find(x => x.id === pageId) || items[0];
    if (!meta) return;

    state.currentPage = meta.id;

    // sidebar active state
    $$('#sidebarNav .nav-item').forEach(el => {
      el.classList.toggle('active', el.dataset.page === meta.id);
    });

    // header
    $('#pageTitle').textContent    = meta.title;
    $('#pageSubtitle').textContent = meta.sub;

    // route → renderer
    const fnName = (ROUTES[role] || {})[meta.id];
    const container = $('#pageContainer');
    container.innerHTML = `
      <div class="page-loading">
        <div class="spinner"></div>
        <p>Cargando…</p>
      </div>`;

    const fn = fnName && Pages[fnName];
    if (!fn) {
      container.innerHTML = `
        <div class="empty-state">
          <h3>Sección no disponible</h3>
          <p>La vista “${meta.label}” aún no está habilitada para tu rol.</p>
        </div>`;
      return;
    }

    try {
      await fn(container, state.user, { navigate });
    } catch (err) {
      console.error('page render error', err);
      container.innerHTML = `
        <div class="empty-state error">
          <h3>Error al cargar la página</h3>
          <p>${(err && err.message) || 'Error desconocido'}</p>
        </div>`;
    }
  }

  // ===================================================== CONN + SYNC UI ==
  function updateConnStatus() {
    const el = $('#connStatus');
    if (!el) return;
    const online = Sync.isOnline();
    el.classList.toggle('offline', !online);
    el.classList.toggle('online',   online);
    const lbl = el.querySelector('.lbl');
    if (lbl) lbl.textContent = online ? 'Online' : 'Offline';
  }

  async function updateSyncBadge() {
    const badge = $('#syncBadge');
    if (!badge) return;
    let n = 0;
    try { n = await Sync.pendingCount(); } catch { n = 0; }
    badge.textContent = String(n);
    badge.classList.toggle('zero', n === 0);
  }

  // expose a tiny app object for cross-module use (e.g. nav from buttons inside pages)
  window.App = {
    navigate,
    currentUser: () => state.user,
    refresh: () => navigate(state.currentPage || 'dashboard'),
    refreshSyncBadge: updateSyncBadge,
  };

  // ----------------------------------------------------- DOMContentLoaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
