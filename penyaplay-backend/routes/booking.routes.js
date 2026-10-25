// ──────────────────────────────────────────────
// Penya Play — Booking Routes
// OS: "the spine" of the entire platform
// ──────────────────────────────────────────────

const router = require('express').Router();
const BookingService = require('../services/booking.service');
const BookingModel = require('../models/booking.model');
const PaymentService = require('../services/payment.service');
const { protect, restrictTo, optionalProtect } = require('../middleware/auth');
const { validateBookingBrief } = require('../middleware/validate');
const { OperationalError } = require('../middleware/errorHandler');

// OS: "Booking Button™ → Structured Brief"
// Can be called without auth (guest booking) or with auth (logged-in promoter)
router.post('/', optionalProtect, async (req, res, next) => {
  try {
    const validated = validateBookingBrief(req.body);
    // OS: "if filled, silently succeed" (honeypot)
    if (validated === null) {
      return res.json({ id: 'honeypot', status: 'new', message: 'Request submitted.' });
    }

    const result = await BookingService.createBooking(
      { ...validated, promoterId: req.user?.id || null },
      req.ip,
      req.headers['user-agent']
    );

    res.status(201).json(result);
  } catch (err) { next(err); }
});

// OS: "row-level security" — only own bookings
router.get('/', protect, async (req, res, next) => {
  try {
    const { status, limit, offset } = req.query;
    let bookings;

    if (req.user.role === 'performer') {
      bookings = await BookingModel.findByPerformer(req.user.id, { status, limit, offset });
    } else {
      bookings = await BookingModel.findByPromoter(req.user.id, { status, limit, offset });
    }

    res.json(bookings);
  } catch (err) { next(err); }
});

// OS: booking detail with row-level check
router.get('/:id', protect, async (req, res, next) => {
  try {
    const detail = await BookingService.getBookingDetail(req.params.id, req.user.id, req.user.role);
    res.json(detail);
  } catch (err) { next(err); }
});

// OS: FSM status transition
router.patch('/:id/status', protect, async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!status) throw new OperationalError('Status is required', 400);

    const updated = await BookingService.transitionStatus(
      req.params.id, status, req.user.id, req.ip, req.headers['user-agent']
    );
    res.json(updated);
  } catch (err) { next(err); }
});

// OS: "promoter must manually click Mark as Paid Offline"
router.post('/:id/mark-paid', protect, async (req, res, next) => {
  try {
    // Only promoter who owns the booking, or admin
    const current = await BookingModel.findById(req.params.id);
    if (!current) throw new OperationalError('Booking not found', 404);

    if (req.user.role !== 'admin' && current.promoter_id !== req.user.id) {
      throw new OperationalError('Booking not found', 404);
    }

    const updated = await PaymentService.markPaidOffline(
      req.params.id, req.user.id, req.ip, req.headers['user-agent']
    );
    if (!updated) throw new OperationalError('Cannot mark as paid. Booking must be confirmed.', 409);

    res.json(updated);
  } catch (err) { next(err); }
});

// OS: performer sends quote
router.post('/:id/quote', protect, restrictTo('performer'), async (req, res, next) => {
  try {
    const { amount, currency } = req.body;
    if (!amount) throw new OperationalError('Quote amount is required', 400);

    const updated = await BookingService.sendQuote(
      req.params.id, amount, currency || 'LSL', req.user.id, req.ip, req.headers['user-agent']
    );
    res.json(updated);
  } catch (err) { next(err); }
});

module.exports = router;
