/* =====================================================
   sync.js — Offline-first sync queue
   Persists operations done while offline and replays
   them when connectivity returns. Since this app does
   not have a real backend, the "remote" is simulated:
   when online, queued ops are marked as synced after a
   short artificial latency, mimicking a real server.
   ===================================================== */

const Sync = (() => {
  let _online = navigator.onLine;
  const _listeners = new Set();
  let _flushing = false;

  function isOnline() { return _online; }
  function on(fn) { _listeners.add(fn); return () => _listeners.delete(fn); }
  function _emit(evt, payload) { _listeners.forEach(fn => { try { fn(evt, payload); } catch(e){} }); }

  async function pendingCount() {
    const all = await DB.all('sync_queue');
    return all.filter(x => !x.synced).length;
  }

  /**
   * Enqueues an operation.
   * op = { entity: 'notas'|'materias'|..., action: 'create'|'update'|'delete', payload, refId? }
   */
  async function enqueue(op) {
    op.synced = false;
    op.attempts = 0;
    op.createdAt = Date.now();
    await DB.add('sync_queue', op);
    _emit('queued', op);
    if (_online) flush();
  }

  /** Simulates server roundtrip (200-700ms) */
  function _fakeServer(op) {
    return new Promise((resolve, reject) => {
      const latency = 200 + Math.random()*500;
      setTimeout(() => {
        // Tiny chance of transient error to demonstrate retry
        if (Math.random() < 0.04) reject(new Error('simulated_network'));
        else resolve({ ok: true, serverAt: Date.now(), op });
      }, latency);
    });
  }

  async function flush() {
    if (_flushing) return;
    if (!_online) return;
    _flushing = true;
    _emit('flush:start');

    try {
      const queue = (await DB.all('sync_queue')).filter(x => !x.synced);
      for (const item of queue) {
        try {
          await _fakeServer(item);
          item.synced = true;
          item.syncedAt = Date.now();
          await DB.put('sync_queue', item);
          _emit('flush:item', item);
        } catch (err) {
          item.attempts = (item.attempts || 0) + 1;
          item.lastError = String(err.message || err);
          await DB.put('sync_queue', item);
          _emit('flush:error', { item, err });
        }
      }
    } finally {
      _flushing = false;
      _emit('flush:end');
    }
  }

  // Cleanup synced items older than 24h to keep the store light
  async function purgeSynced(olderThanMs = 24*60*60*1000) {
    const all = await DB.all('sync_queue');
    const now = Date.now();
    for (const it of all) {
      if (it.synced && it.syncedAt && (now - it.syncedAt) > olderThanMs) {
        await DB.del('sync_queue', it.id);
      }
    }
  }

  function _setOnline(state) {
    if (state === _online) return;
    _online = state;
    _emit(state ? 'online' : 'offline');
    if (state) flush();
  }

  function init() {
    window.addEventListener('online',  () => _setOnline(true));
    window.addEventListener('offline', () => _setOnline(false));
    // Periodic flush in case of missed events
    setInterval(() => { if (_online) flush(); }, 30000);
    purgeSynced();
  }

  return { init, isOnline, on, enqueue, flush, pendingCount };
})();
