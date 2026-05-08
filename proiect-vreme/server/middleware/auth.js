import jwt from 'jsonwebtoken';

const SECRET = process.env.JWT_SECRET || 'vreme-tw-secret-dev';

export function semneazaToken(payload) {
  return jwt.sign(payload, SECRET, { expiresIn: '7d' });
}

// Middleware — verifică JWT din header Authorization: Bearer <token>
// Fallback: acceptă și query param ?token=... (necesar pentru SSE — EventSource nu suportă headere custom)
export function verificaAuth(req, res, next) {
  const header = req.headers['authorization'];
  const token = (header?.startsWith('Bearer ') ? header.slice(7) : null)
                ?? req.query.token
                ?? null;

  if (!token) {
    return res.status(401).json({ eroare: 'Autentificare necesară.' });
  }
  try {
    const payload = jwt.verify(token, SECRET);
    req.userId = payload.id;
    req.userRole = payload.role;
    next();
  } catch {
    return res.status(401).json({ eroare: 'Token invalid sau expirat.' });
  }
}

// Middleware — verifică că utilizatorul are rolul 'admin'
export function verificaAdmin(req, res, next) {
  if (req.userRole !== 'admin') {
    return res.status(403).json({ eroare: 'Acces interzis. Necesită rol admin.' });
  }
  next();
}
