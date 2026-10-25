// ──────────────────────────────────────────────
// Penya Play — Shared Validation Schemas
// OS: "validated with shared schemas on client AND server"
// ──────────────────────────────────────────────

const { CATEGORIES, ENQUIRY_SOURCES, CURRENCY_SYMBOLS } = require('../config/constants');
const { OperationalError } = require('./errorHandler');

function validateRegistration(data) {
const errors = [];

if (!data.name || data.name.trim().length < 2) {
    errors.push('Name must be at least 2 characters');
}
if (!data.email || !/^[^\s@]+@[^\s@]+.[^\s@]+$/.test(data.email)) {
errors.push('Valid email is required');
}
if (!data.password || data.password.length < 8) {
errors.push('Password must be at least 8 characters');
}
if (!['performer', 'promoter'].includes(data.role)) {
errors.push('Role must be performer or promoter');
}
if (data.role === 'performer') {
if (!data.stageName || data.stageName.trim().length < 2) {
errors.push('Stage name is required');
}
const validCats = (data.professions || []).filter(p => CATEGORIES.includes(p));
if (validCats.length === 0) {
errors.push('At least one valid profession is required');
}
}

if (errors.length > 0) throw new OperationalError(errors.join('. '), 400, { fields: errors });
return { ...data, professions: data.role === 'performer' ? (data.professions || []).filter(p => CATEGORIES.includes(p)) : undefined };
}

function validateBookingBrief(data) {
const errors = [];

// OS: honeypot — "if filled, silently succeed"
if (data._hp) return null;

if (!data.eventDate) errors.push('Event date is required');
if (!data.budget || isNaN(parseFloat(data.budget)) || parseFloat(data.budget) < 500) {
errors.push('Budget must be at least 500.00');
}
if (!data.budgetCurrency || !CURRENCY_SYMBOLS[data.budgetCurrency]) {
errors.push('Valid currency code is required');
}
if (!data.duration) errors.push('Performance duration is required');
if (!data.venue || data.venue.trim().length < 2) {
errors.push('Venue name is required');
}
if (!data.requesterName || data.requesterName.trim().length < 2) {
errors.push('Your name is required');
}
if (!data.promoterEmail || !/^[^\s@]+@[^\s@]+.[^\s@]+$/.test(data.promoterEmail)) {
errors.push('Valid email is required');
}
if (!data.termsAccepted) errors.push('You must accept the terms');

if (errors.length > 0) throw new OperationalError(errors.join('. '), 400, { fields: errors });

// OS: source attribution
const source = ENQUIRY_SOURCES.includes(data.source) ? data.source : 'booking_button';

return {
performerHandle: data.performerHandle,
promoterId: data.promoterId || null,
requesterName: data.requesterName.trim(),
promoterEmail: data.promoterEmail.trim().toLowerCase(),
promoterPhone: data.phone || null,
eventDate: data.eventDate,
eventType: data.eventType || null,
budget: Math.round(parseFloat(data.budget) * 100),
budgetCurrency: data.budgetCurrency,
duration: data.duration,
venue: data.venue.trim(),
city: data.city || null,
country: data.country || null,
requirements: data.requirements || null,
termsAccepted: true,
source,
};
}

function validateReview(data) {
const errors = [];
if (!data.rating || data.rating < 1 || data.rating > 5) {
errors.push('Rating must be between 1 and 5');
}
if (data.comment && data.comment.length > 2000) {
errors.push('Comment must be under 2000 characters');
}
if (errors.length > 0) throw new OperationalError(errors.join('. '), 400);
return { rating: data.rating, comment: data.comment || null };
}

module.exports = { validateRegistration, validateBookingBrief, validateReview };