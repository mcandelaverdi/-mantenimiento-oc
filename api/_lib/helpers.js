const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'hotel-oc-secret-2024';

function setCors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

function getUser(req) {
  const auth = req.headers.authorization || '';
  if (!auth.startsWith('Bearer ')) return null;
  try {
    return jwt.verify(auth.slice(7), JWT_SECRET);
  } catch {
    return null;
  }
}

function withAuth(handler) {
  return async (req, res) => {
    setCors(res);
    if (req.method === 'OPTIONS') return res.status(200).end();
    const user = getUser(req);
    if (!user) return res.status(401).json({ error: 'No autorizado' });
    req.user = user;
    return handler(req, res);
  };
}

function withGerente(handler) {
  return async (req, res) => {
    setCors(res);
    if (req.method === 'OPTIONS') return res.status(200).end();
    const user = getUser(req);
    if (!user) return res.status(401).json({ error: 'No autorizado' });
    if (user.rol !== 'gerente') return res.status(403).json({ error: 'Solo para gerentes' });
    req.user = user;
    return handler(req, res);
  };
}

module.exports = { setCors, getUser, withAuth, withGerente, JWT_SECRET };
