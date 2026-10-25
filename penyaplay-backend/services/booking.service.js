// ──────────────────────────────────────
// Penya Play — Booking Service (THE SPINE)
// OS: "the single source of truth for the booking workflow"
// ──────────────────────────────────────

const BookingModel = require('../models/booking.model');
const PerformerModel = require('../models/performer.model');
const MessageModel = require('../models/message.model');
const AuditModel = require('../models/audit.model');
const NotificationService = require('./notification.service');
const PaymentService = require('./payment.service');
const { STATUS_FLOW, STATUS_LABELS, CURRENCY_SYMBOLS } = require('../config/constants');
const { OperationalError } = require('../middleware/errorHandler');

// ──────────────────────────────────────
// CREATE BOOKING — the entry point of the whole platform
// OS: "Browse Talent → Booking Button™ → Structured Brief"
// ──────────────────────────────────────
async function createBooking(validatedData, ipAddress, userAgent) {
  // OS: "server resolves the performer from handle, client-supplied IDs never trusted"
  const performer = await PerformerModel.findApproved(validatedData.performerHandle);
  if (!performer) {
    throw new OperationalError('Performer not found', 404);
  }

  // OS: "24-hour duplicate-enquiry guard"
  const isDuplicate = await BookingModel.checkDuplicate(validatedData.promoterEmail, performer.id);
  if (isDuplicate) {
    throw new OperationalError('You recently sent a request to this performer. Please wait for a response.', 409);
  }

  // Get deposit percentage from performer's first active package
  const packages = await PerformerModel.getPackages(performer.id);
  const depositPct = packages.length > 0 ? packages[0].deposit_pct : 50;

  // OS: "integer minor units plus explicit ISO currency code"
  // OS: explicit field mapping — validator returns different names than DB columns
  const booking = await BookingModel.create({
    performerId: performer.id,
    performerName: performer.stage_name,
    performerHandle: performer.handle,
    promoterId: validatedData.promoterId,
    promoterName: validatedData.requesterName,
    promoterEmail: validatedData.promoterEmail,
    promoterPhone: validatedData.promoterPhone,
    status: 'new',
    eventDate: validatedData.eventDate,
    eventType: validatedData.eventType,
    budgetAmount: validatedData.budget,
    budgetCurrency: validatedData.budgetCurrency,
    duration: validatedData.duration,
    venue: validatedData.venue,
    city: validatedData.city,
    country: validatedData.country,
    requirements: validatedData.requirements,
    depositPct,
    source: validatedData.source,
  });

  // Insert into duplicate guard
  await BookingModel.insertEnquiryGuard(validatedData.promoterEmail, performer.id);

  // OS: "each booking opens one private chat" — system message
  const budgetFormatted = PaymentService.formatMoney(booking.budget_amount, booking.budget_currency);
  await MessageModel.create({
    bookingId: booking.id,
    senderName: 'System',
    type: 'system',
    content: 'Booking request received from ' + validatedData.requesterName +
      '. Event: ' + (validatedData.eventType || 'TBD') +
      ' on ' + validatedData.eventDate +
      '. Budget: ' + budgetFormatted +
      '. Duration: ' + (validatedData.duration || 'N/A') + '.',
  });

  // OS: "audit logs on sensitive actions"
  await AuditModel.log({
    actorId: validatedData.promoterId,
    actionType: 'booking_created',
    entityType: 'booking',
    entityId: booking.id,
    newState: {
      status: 'new',
      performerId: performer.id,
      budgetAmount: booking.budget_amount,
      budgetCurrency: booking.budget_currency,
      source: validatedData.source,
    },
    ipAddress,
    userAgent,
  });

  // OS: "in-app is live in Phase 1"
  await NotificationService.notify(
    performer.user_id,
    'New Booking Request',
    validatedData.requesterName + ' wants to book you for ' + (validatedData.eventType || 'an event') + '.',
    'booking',
    booking.id,
  );

  return {
    id: booking.id,
    status: booking.status,
    message: 'Booking request sent successfully.',
  };
}

// ──────────────────────────────────────
// STATUS TRANSITION — the FSM engine
// OS: "no status transition outside the defined map"
// OS: "every transition logged with timestamp, actor_id, previous_status, new_status"
// ──────────────────────────────────────
async function transitionStatus(bookingId, newStatus, userId, ipAddress, userAgent) {
  // OS: FSM enforcement at service layer (double check — model also checks)
  const current = await BookingModel.findById(bookingId);
  if (!current) throw new OperationalError('Booking not found', 404);

  const allowed = STATUS_FLOW[current.status] || [];
  if (!allowed.includes(newStatus)) {
    throw new OperationalError(
      'Cannot transition from ' + STATUS_LABELS[current.status] + ' to ' + STATUS_LABELS[newStatus],
      409
    );
  }

  const updated = await BookingModel.transitionStatus(bookingId, newStatus);
  if (!updated) throw new OperationalError('Transition failed', 500);

  // Audit log
  await AuditModel.log({
    actorId: userId,
    actionType: 'status_' + newStatus,
    entityType: 'booking',
    entityId: bookingId,
    previousState: { status: current.status },
    newState: { status: newStatus },
    ipAddress,
    userAgent,
  });

  // Notify the OTHER party
  let notifyUserId;
  if (userId === current.promoter_id) {
    // Notify the performer — lookup their user_id from profile
    const performer = await PerformerModel.findById(current.performer_id);
    notifyUserId = performer ? performer.user_id : null;
  } else {
    // Notify the promoter
    notifyUserId = current.promoter_id;
  }
  if (notifyUserId) {
    await NotificationService.notify(
      notifyUserId,
      'Booking ' + STATUS_LABELS[newStatus],
      '"' + (current.eventType || 'Booking') + '" with ' + current.performer_name + ' is now ' + STATUS_LABELS[newStatus] + '.',
      'booking',
      bookingId,
    );
  }

  // If confirmed → add payment instructions to chat
  if (newStatus === 'confirmed') {
    const paymentInfo = PaymentService.getPaymentInstructions(updated);
    await MessageModel.create({
      bookingId,
      senderName: 'System',
      type: 'system',
      content: 'Booking confirmed! Agreed total: ' + paymentInfo.totalFormatted +
        '. Deposit (' + paymentInfo.depositPct + '%): ' + paymentInfo.depositFormatted +
        '. ' + paymentInfo.instructions,
    });
  }

  return updated;
}

// ──────────────────────────────────────
// SEND QUOTE — performer sends a quote amount
// ──────────────────────────────────────
async function sendQuote(bookingId, amount, currency, performerUserId, ipAddress, userAgent) {
  const current = await BookingModel.findById(bookingId);
  if (!current) throw new OperationalError('Booking not found', 404);

  // OS: "integer minor units"
  const amountMinor = Math.round(parseFloat(amount) * 100);
  if (isNaN(amountMinor) || amountMinor <= 0) {
    throw new OperationalError('Quote amount must be a positive number', 400);
  }

  if (!['new', 'viewed'].includes(current.status)) {
    throw new OperationalError(
      'Cannot send quote when status is ' + STATUS_LABELS[current.status], 409
    );
  }

  // Store quote on booking
  await BookingModel.setQuote(bookingId, amountMinor, currency);

  // Add to chat
  const formatted = PaymentService.formatMoney(amountMinor, currency);
  await MessageModel.create({
    bookingId,
    senderId: performerUserId,
    senderName: current.performer_name,
    type: 'quote',
    content: formatted + ' — quote for this booking request.',
  });

  // Transition to quote_sent
  const updated = await transitionStatus(bookingId, 'quote_sent', performerUserId, ipAddress, userAgent);

  return updated;
}

// ──────────────────────────────────────
// GET BOOKING DETAIL (with row-level security)
// ──────────────────────────────────────
async function getBookingDetail(bookingId, userId, role) {
  const booking = await BookingModel.findById(bookingId);
  if (!booking) throw new OperationalError('Booking not found', 404);

  // OS: "row-level security" — enforcement is server-side
  if (role !== 'admin') {
    if (userId !== booking.promoter_id && userId !== booking.performer_id) {
      // OS: "safe error messages that leak nothing" — return 404 not 403
      throw new OperationalError('Booking not found', 404);
    }
  }

  // Attach performer profile
  const performer = await PerformerModel.findById(booking.performer_id);

  // Attach messages (row-level checked in message model)
  const messages = userId
    ? await MessageModel.findByBooking(bookingId, userId, booking.performer_id)
    : [];

  // Attach reviews
  const reviews = await require('../models/review.model').findByBooking(bookingId);

  // Attach payment info if confirmed/paid
  const paymentInfo = PaymentService.getPaymentInstructions(booking);

  return { ...booking, performer, messages, reviews, paymentInfo };
}

module.exports = {
  createBooking,
  transitionStatus,
  sendQuote,
  getBookingDetail,
};