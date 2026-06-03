/* =====================================================
   db.js — IndexedDB wrapper for EduTrack Insight
   Stores: usuarios, materias, evaluaciones, notas,
           feedback, alertas, sync_queue, meta
   ===================================================== */

const DB = (() => {
  const DB_NAME = 'edutrack_insight';
  const DB_VERSION = 1;

  const STORES = [
    { name: 'usuarios',     keyPath: 'id', autoInc: true,  indexes: [['username','username',{unique:true}], ['role','role']] },
    { name: 'materias',     keyPath: 'id', autoInc: true,  indexes: [['docenteId','docenteId']] },
    { name: 'evaluaciones', keyPath: 'id', autoInc: true,  indexes: [['materiaId','materiaId']] },
    { name: 'notas',        keyPath: 'id', autoInc: true,  indexes: [['evaluacionId','evaluacionId'], ['estudianteId','estudianteId']] },
    { name: 'feedback',     keyPath: 'id', autoInc: true,  indexes: [['evaluacionId','evaluacionId'], ['docenteId','docenteId']] },
    { name: 'alertas',      keyPath: 'id', autoInc: true,  indexes: [['estudianteId','estudianteId'], ['createdAt','createdAt']] },
    { name: 'sync_queue',   keyPath: 'id', autoInc: true,  indexes: [['createdAt','createdAt']] },
    { name: 'meta',         keyPath: 'key', autoInc: false }
  ];

  let _db = null;

  function open() {
    if (_db) return Promise.resolve(_db);
    return new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, DB_VERSION);

      req.onupgradeneeded = (e) => {
        const db = e.target.result;
        STORES.forEach(s => {
          if (!db.objectStoreNames.contains(s.name)) {
            const store = db.createObjectStore(s.name, { keyPath: s.keyPath, autoIncrement: s.autoInc });
            (s.indexes || []).forEach(([name, kp, opts]) => store.createIndex(name, kp, opts || {}));
          }
        });
      };

      req.onsuccess = () => { _db = req.result; resolve(_db); };
      req.onerror = () => reject(req.error);
    });
  }

  function tx(storeName, mode = 'readonly') {
    return open().then(db => {
      const t = db.transaction(storeName, mode);
      return t.objectStore(storeName);
    });
  }

  function _wrap(req) {
    return new Promise((resolve, reject) => {
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  /* ----- CRUD ----- */
  async function add(store, item) {
    const s = await tx(store, 'readwrite');
    item.createdAt = item.createdAt || Date.now();
    item.updatedAt = Date.now();
    const id = await _wrap(s.add(item));
    return id;
  }

  async function put(store, item) {
    const s = await tx(store, 'readwrite');
    item.updatedAt = Date.now();
    return _wrap(s.put(item));
  }

  async function get(store, id) {
    const s = await tx(store);
    return _wrap(s.get(id));
  }

  async function del(store, id) {
    const s = await tx(store, 'readwrite');
    return _wrap(s.delete(id));
  }

  async function all(store) {
    const s = await tx(store);
    return _wrap(s.getAll());
  }

  async function where(store, indexName, value) {
    const s = await tx(store);
    if (s.indexNames.contains(indexName)) {
      const idx = s.index(indexName);
      return _wrap(idx.getAll(value));
    }
    const list = await _wrap(s.getAll());
    return list.filter(x => x[indexName] === value);
  }

  async function clear(store) {
    const s = await tx(store, 'readwrite');
    return _wrap(s.clear());
  }

  /* ---- Meta helpers ---- */
  async function getMeta(key, def = null) {
    const r = await get('meta', key);
    return r ? r.value : def;
  }
  async function setMeta(key, value) {
    return put('meta', { key, value });
  }

  /* ---- Reset (for debugging) ---- */
  async function nuke() {
    if (_db) _db.close();
    _db = null;
    return new Promise((resolve, reject) => {
      const req = indexedDB.deleteDatabase(DB_NAME);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  return { open, add, put, get, del, all, where, clear, getMeta, setMeta, nuke };
})();
