/* =====================================================
   auth.js — User authentication & session management
   ===================================================== */

const Auth = (() => {
  const SESSION_KEY = 'edutrack_session';
  let _current = null;

  async function login(username, password) {
    const all = await DB.where('usuarios', 'username', username);
    const user = all[0];
    if (!user) throw new Error('Usuario no encontrado');
    if (user.password !== Seed.hash(password)) throw new Error('Contraseña incorrecta');
    _current = user;
    sessionStorage.setItem(SESSION_KEY, JSON.stringify({ id: user.id, ts: Date.now() }));
    return user;
  }

  async function register({ username, password, name, role }) {
    const exists = (await DB.where('usuarios', 'username', username))[0];
    if (exists) throw new Error('El usuario ya existe');
    if (!['estudiante','docente'].includes(role)) throw new Error('Rol no permitido');
    const id = await DB.add('usuarios', {
      username, password: Seed.hash(password),
      name, role, email: `${username}@edu.local`
    });
    Sync.enqueue({ entity: 'usuarios', action: 'create', refId: id, payload: { username, name, role }});
    return id;
  }

  function logout() {
    _current = null;
    sessionStorage.removeItem(SESSION_KEY);
  }

  async function restore() {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    try {
      const { id } = JSON.parse(raw);
      const u = await DB.get('usuarios', id);
      if (u) { _current = u; return u; }
    } catch {}
    return null;
  }

  function current() { return _current; }

  return { login, register, logout, restore, current };
})();
