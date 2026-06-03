/* =====================================================
   ui.js — UI helpers: toasts, modal, dom utils
   ===================================================== */

const UI = (() => {

  function $(sel, ctx=document) { return ctx.querySelector(sel); }
  function $$(sel, ctx=document) { return Array.from(ctx.querySelectorAll(sel)); }

  function escapeHtml(s) {
    return String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  }

  function fmtDate(ts) {
    if (!ts) return '—';
    const d = new Date(ts);
    return d.toLocaleDateString('es-ES', { day:'2-digit', month:'short', year:'numeric' });
  }

  function fmtNum(n, dec=2) {
    if (n == null || isNaN(n)) return '—';
    return Number(n).toFixed(dec);
  }

  function toast(msg, type = 'info', timeoutMs = 4500) {
    const wrap = $('#toastWrap');
    const t = document.createElement('div');
    t.className = `toast ${type}`;
    t.innerHTML = escapeHtml(msg);
    wrap.appendChild(t);
    setTimeout(() => t.remove(), timeoutMs);
  }

  function modal({ title, body, footer, onClose, size }) {
    const m = $('#modal');
    $('#modalTitle').textContent = title || '';
    $('#modalBody').innerHTML = '';
    $('#modalFooter').innerHTML = '';

    if (typeof body === 'string') $('#modalBody').innerHTML = body;
    else if (body instanceof Node) $('#modalBody').appendChild(body);

    if (footer) {
      if (typeof footer === 'string') $('#modalFooter').innerHTML = footer;
      else if (Array.isArray(footer)) {
        footer.forEach(btn => $('#modalFooter').appendChild(btn));
      } else if (footer instanceof Node) {
        $('#modalFooter').appendChild(footer);
      }
    } else {
      const close = document.createElement('button');
      close.className = 'btn';
      close.textContent = 'Cerrar';
      close.onclick = closeModal;
      $('#modalFooter').appendChild(close);
    }

    m.classList.remove('hidden');
    $('#modalClose').onclick = () => { closeModal(); onClose?.(); };
    $('.modal-bg', m).onclick = () => { closeModal(); onClose?.(); };
  }

  function closeModal() { $('#modal').classList.add('hidden'); }

  function confirm({ title, message, okLabel='Confirmar', danger=false }) {
    return new Promise(resolve => {
      const ok = document.createElement('button');
      ok.className = 'btn ' + (danger ? 'danger' : 'dark');
      ok.textContent = okLabel;
      ok.onclick = () => { closeModal(); resolve(true); };
      const cancel = document.createElement('button');
      cancel.className = 'btn'; cancel.textContent = 'Cancelar';
      cancel.onclick = () => { closeModal(); resolve(false); };
      modal({ title, body: `<p>${escapeHtml(message)}</p>`, footer: [cancel, ok] });
    });
  }

  function btn({ label, kind='', onClick }) {
    const b = document.createElement('button');
    b.className = `btn ${kind}`;
    b.textContent = label;
    if (onClick) b.onclick = onClick;
    return b;
  }

  return { $, $$, escapeHtml, fmtDate, fmtNum, toast, modal, closeModal, confirm, btn };
})();
