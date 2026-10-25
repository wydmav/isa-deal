// ──────────────────────────────────────────────
// Penya Play — Centralised Error Handler
// OS: "safe, non-sensitive error messages"
// ──────────────────────────────────────────────

class OperationalError extends Error {
constructor(message, statusCode = 400, details = null) {
super(message);
this.statusCode = statusCode;
this.details = details;
this.isOperational = true;
}
}

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
// Log full error for debugging (never send to client)
if (!err.isOperational) {
console.error('[ERROR]', err);
}

const statusCode = err.statusCode || 500;
const response = {
error: statusCode === 500 ? 'Internal server error' : err.message,
};

// OS: "safe error messages that leak nothing"
// Only include details in development
if (err.isOperational && err.details && process.env.NODE_ENV === 'development') {
response.details = err.details;
}

res.status(statusCode).json(response);
}

module.exports = { errorHandler, OperationalError };