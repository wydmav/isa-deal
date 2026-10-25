
// ──────────────────────────────────────────────
// Penya Play — Admin Routes
// OS: "admin verification hold"
// OS: "suspension, profile transfer, protected names"
// ──────────────────────────────────────────────

const router = require('express').Router();
const PerformerModel = require('../models/performer.model');
const BookingModel = require('../models/booking.model');
const AuditModel = require('../models/audit.model');
const { protect, restrictTo } = require('../middleware/auth');
const { OperationalError } = require('../middleware/errorHandler');

// OS: "verification queue"
router.get('/performers/pending', protect, restrictTo('admin'), async (req, res, next) => {
  try {
    const pending = await PerformerModel.findPending();
    res.json(pending);
  } catch (err) { next(err); }
});

// Approve or reject performer
router.patch('/performers/:id/status', protect, restrictTo('admin'), async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!['approved', 'rejected', 'suspended'].includes(status)) {
      throw new OperationalError('Invalid status', 400);
    }

    const performer = await PerformerModel.findById(req.params.id);
    if (!performer) throw new OperationalError('Performer not found', 404);

    const previous = performer.verification_status;
    const updated = await PerformerModel.updateStatus(req.params.id, status);

    await AuditModel.log({
      actorId: req.user.id,
      actionType: `performer_${status}`,
      entityType: 'performer',
      entityId: req.params.id,
      previousState: { verification_status: previous },
      newState: { verification_status: status },
      ipAddress: req.ip, userAgent: req.headers['user-agent'],
    });

    res.json(updated);
  } catch (err) { next(err); }
});

// OS: "all bookings" — admin sees everything
router.get('/bookings', protect, restrictTo('admin'), async (req, res, next) => {
  try {
    const { status, limit, offset } = req.query;
    const bookings = await BookingModel.findAll({ status, limit, offset });
    res.json(bookings);
  } catch (err) { next(err); }
});

// Admin can force any status transition (for disputes)
router.patch('/bookings/:id/status', protect, restrictTo('admin'), async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!status) throw new OperationalError('Status is required', 400);

    const current = await BookingModel.findById(req.params.id);
    if (!current) throw new OperationalError('Booking not found', 404);

    const updated = await BookingModel.transitionStatus(req.params.id, status);

    await AuditModel.log({
      actorId: req.user.id, actionType: `admin_status_${status}`,
      entityType: 'booking', entityId: req.params.id,
      previousState: { status: current.status }, newState: { status },
      ipAddress: req.ip, userAgent: req.headers['user-agent'],
    });

    res.json(updated);
  } catch (err) { next(err); }
});

module.exports = router;