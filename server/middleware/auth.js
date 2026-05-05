const jwt = require('jsonwebtoken');
const User = require('../models/shared/User');
const { JWT_SECRET } = require('../config/env');

async function auth(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token mancante' });
  }

  const token = header.slice(7);
  let payload;
  try {
    payload = jwt.verify(token, JWT_SECRET);
  } catch {
    return res.status(401).json({ error: 'Token non valido o scaduto' });
  }

  const user = await User.findById(payload.id || payload._id || payload.sub || payload.userId).lean();
  if (!user) return res.status(401).json({ error: 'Utente non trovato' });

  req.user = user;
  next();
}

module.exports = auth;
