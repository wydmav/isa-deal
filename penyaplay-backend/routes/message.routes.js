
// ──────────────────────────────────────────────
// Penya Play — Message Routes
// OS: "isolated event chat boxes"
// OS: "accessible only to the specific promoter and performer"
// ──────────────────────────────────────────────

const router = require('express').Router();
const MessageModel = require('../models/message.model');
const BookingModel = require('../models/booking.model');
const AuditModel = require('../models/audit.model');
const { protect } = require('../middleware/auth');
const { OperationalError } = require('../middleware/errorHandler');

// OS: row-level — only participants
router.get('/:bookingId', protect, async (req, res, next) => {
  try {
    const booking = await BookingModel.findById(req.params.bookingId);
    if (!booking) throw new OperationalError('Booking not found', 404);

    const messages = await MessageModel.findByBooking(
      req.params.bookingId, req.user.id, booking.performer_id
    );
    res.json(messages);
  } catch (err) { next(err); }
});

router.post('/:bookingId', protect, async (req, res, next) => {
  try {
    const { content } = req.body;
    if (!content || !content.trim()) throw new OperationalError('Message cannot be empty', 400);
    if (content.length > 5000) throw new OperationalError('Message too long (max 5000 chars)', 400);

    // Verify participant
    const booking = await BookingModel.findById(req.params.bookingId);
    if (!booking) throw new OperationalError('Booking not found', 404);
    if (req.user.id !== booking.promoter_id && req.user.id !== booking.performer_id) {
      throw new OperationalError('Booking not found', 404);
    }

    // OS: bookings in terminal states don't accept new messages
    if (['completed', 'declined', 'expired'].includes(booking.status)) {
      throw new OperationalError('This booking is no longer active', 409);
    }

    const message = await MessageModel.create({
      bookingId: req.params.bookingId,
      senderId: req.user.id,
      senderName: req.user.name,
      type: 'text',
      content: content.trim(),
    });

    await AuditModel.log({
      actorId: req.user.id, actionType: 'message_sent',
      entityType: 'booking', entityId: req.params.bookingId,
      newState: { messageId: message.id },
      ipAddress: req.ip, userAgent: req.headers['user-agent'],
    });

    res.status(201).json(message);
  } catch (err) { next(err); }
});

// Mark messages as read
router.post('/:bookingId/read', protect, async (req, res, next) => {
  try {
    const booking = await BookingModel.findById(req.params.bookingId);
    if (!booking) return res.status(404).json({ error: 'Booking not found' });
    await MessageModel.markRead(req.params.bookingId, req.user.id);
    res.json({ message: 'Marked as read' });
  } catch (err) { next(err); }
});

module.exports = router;