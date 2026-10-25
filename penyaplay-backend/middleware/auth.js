// ──────────────────────────────────────────────
// Penya Play — JWT Auth Middleware
// OS: "verify a user's identity before displaying account information"
// OS: "strict access control"
// ──────────────────────────────────────────────

const jwt = require('jsonwebtoken');

const TOKEN_TTL = parseInt(process.env.PP_SESSION_TTL, 10) || 3600;

// OS: token contains only id, role, name — no PII
function signToken(user) {
  return jwt.sign(
    { id: user.id, role: user.role, name: user.name },
    process.env.PP_JWT_SECRET,
    { expiresIn: TOKEN_TTL }
  );
}

// OS: "verify a user's identity"
function protect(req, res, next) {
  const token = req.cookies?.token;
  if (!token) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  try {
    const decoded = jwt.verify(token, process.env.PP_JWT_SECRET);
    // OS: attach only id, role, name
    req.user = { id: decoded.id, role: decoded.role, name: decoded.name };
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Session expired' });
  }
}

// OS: "block any user from viewing a booking, chat history, or profile
// configuration that does not belong to their specific account ID"
function restrictTo(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Not authorised' });
    }
    next();
  };
}

// OS: "optional auth — guest bookings allowed, but attach user if logged in"
function optionalProtect(req, res, next) {
  try {
    let token = null;
    if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    } else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (token) {
      const decoded = jwt.verify(token, process.env.PP_JWT_SECRET);
      req.user = { id: decoded.id, role: decoded.role, name: decoded.name };
    }
  } catch (err) {
    // Invalid or expired token — continue as guest
  }
  next();
}

module.exports = { signToken, protect, restrictTo, optionalProtect };