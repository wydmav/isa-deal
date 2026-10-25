// ──────────────────────────────────────────────
// Penya Play — Payment Service
// OS: "no payment gateways, no escrow, no wallet"
// OS: "all payment surfaces respect PAYMENTS_ENABLED=false"
// OS: "nothing renders that looks like a live payout"
// ──────────────────────────────────────────────

const BookingModel = require('../models/booking.model');
const AuditModel = require('../models/audit.model');
const { PAYMENTS_ENABLED, CURRENCY_SYMBOLS } = require('../config/constants');

function formatMoney(amount, currency) {
const sym = CURRENCY_SYMBOLS[currency] || currency + ' ';
return sym + (amount / 100).toLocaleString('en-ZA', { minimumFractionDigits: 2 });
}

// OS: "on Confirmed, display the agreed total and offline payment instructions"
function getPaymentInstructions(booking) {
if (!['confirmed', 'paid'].includes(booking.status)) return null;

const depositAmount = Math.round(booking.budget_amount * booking.deposit_pct / 100);
const instructions = (process.env.PP_PAYMENT_INSTRUCTIONS || '')
.replace('{deposit_pct}', booking.deposit_pct + '%')
.replace('{deposit_amount}', formatMoney(depositAmount, booking.budget_currency))
.replace('{total}', formatMoney(booking.budget_amount, booking.budget_currency));

return {
total: booking.budget_amount,
currency: booking.budget_currency,
totalFormatted: formatMoney(booking.budget_amount, booking.budget_currency),
depositPct: booking.deposit_pct,
depositAmount,
depositFormatted: formatMoney(depositAmount, booking.budget_currency),
balanceAmount: booking.budget_amount - depositAmount,
balanceFormatted: formatMoney(booking.budget_amount - depositAmount, booking.budget_currency),
instructions,
paymentsEnabled: PAYMENTS_ENABLED,
};
}

// OS: "promoter must manually click Mark as Paid Offline"
async function markPaidOffline(bookingId, userId, ipAddress, userAgent) {
const previous = await BookingModel.findById(bookingId);
if (!previous) return null;

const updated = await BookingModel.markPaidOffline(bookingId, userId);
if (!updated) return null;

await AuditModel.log({
actorId: userId, actionType: 'marked_paid_offline',
entityType: 'booking', entityId: bookingId,
previousState: { status: previous.status },
newState: { status: 'paid' },
ipAddress, userAgent,
});

return updated;
}

module.exports = { getPaymentInstructions, markPaidOffline, formatMoney };