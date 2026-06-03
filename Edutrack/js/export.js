/* =====================================================
   export.js — CSV exporter (and lightweight printable
   HTML "PDF" using window.print as a portable solution).
   ===================================================== */

const Exporter = (() => {

  function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click();
    setTimeout(() => { URL.revokeObjectURL(url); a.remove(); }, 200);
  }

  function toCSV(rows) {
    if (!rows || !rows.length) return '';
    const headers = Object.keys(rows[0]);
    const escape = (v) => {
      if (v == null) return '';
      const s = String(v).replace(/"/g, '""');
      return /[",\n;]/.test(s) ? `"${s}"` : s;
    };
    const lines = [headers.join(',')];
    for (const r of rows) lines.push(headers.map(h => escape(r[h])).join(','));
    return lines.join('\n');
  }

  function exportCSV(rows, filename) {
    const csv = toCSV(rows);
    downloadBlob(new Blob([csv], { type: 'text/csv;charset=utf-8' }), filename);
  }

  /** Builds an HTML report and triggers print dialog (user can "Save as PDF"). */
  function printReport(title, htmlBody) {
    const win = window.open('', '_blank', 'width=900,height=900');
    if (!win) { alert('Permite ventanas emergentes para exportar a PDF'); return; }
    win.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>${title}</title>
      <style>
        body{font-family: 'Inter Tight', system-ui, sans-serif; padding: 32px; color:#0e0d0c;}
        h1{font-family: 'Fraunces', Georgia, serif; font-weight:600; font-size:28px; margin:0 0 4px;}
        h2{font-family: 'Fraunces', Georgia, serif; font-weight:600; font-size:20px; margin:24px 0 8px;}
        .meta{color:#666;font-size:12px;margin-bottom:24px;font-family:monospace;}
        table{width:100%; border-collapse:collapse; font-size:13px; margin: 8px 0;}
        th,td{ text-align:left; padding:8px 10px; border-bottom:1px solid #ddd; }
        th{ background:#f4efe5; font-size:11px; text-transform:uppercase; letter-spacing:.08em;}
        .kpi{display:inline-block; padding:8px 14px; margin-right:8px; border:1px solid #ddd; border-radius:8px;}
        .kpi b{display:block; font-family:'Fraunces', serif; font-size:24px;}
        .kpi span{font-size:11px; color:#666; text-transform:uppercase; letter-spacing:.1em;}
        .badge{padding:2px 8px;border-radius:8px;font-size:11px;font-family:monospace;}
        .bajo{background:#dff5e6;color:#1f5d3b;}
        .medio{background:#fbe8c4;color:#7a4d04;}
        .alto{background:#f5d6d2;color:#7a1b13;}
        @media print { .no-print { display: none; } }
      </style></head><body>
      <div class="no-print" style="text-align:right;margin-bottom:12px;">
        <button onclick="window.print()" style="padding:8px 16px;cursor:pointer;background:#0e0d0c;color:#f6f1e8;border:none;border-radius:6px;">Imprimir / Guardar PDF</button>
      </div>
      <h1>${title}</h1>
      <div class="meta">EduTrack Insight · ${new Date().toLocaleString()}</div>
      ${htmlBody}
      </body></html>`);
    win.document.close();
  }

  return { exportCSV, toCSV, printReport };
})();
