// ──────────────────────────────────────────────
// Penya Play — Review Routes
// OS: "only after Completed. Exactly one review per side"
// OS: "reviews are permanent"
// ──────────────────────────────────────────────

const router = require('express').Router();
const ReviewModel = require('../models/review.model');
const BookingModel = require('../models/booking.model');
const PerformerModel = require('../models/performer.model');
const AuditModel = require('../models/audit.model');
const NotificationService = require('../services/notification.service');
const { protect } = require('../middleware/auth');
const { validateReview } = require('../middleware/validate');
const { OperationalError } = require('../middleware/errorHandler');

// Submit a review
router.post('/:bookingId', protect, async (req, res, next) => {
  try {
    const data = validateReview(req.body);
    const booking = await BookingModel.findById(req.params.bookingId);

    if (!booking) throw new OperationalError('Booking not found', 404);

    // OS: "display the review form only after a booking status is marked as Completed"
    if (booking.status !== 'completed') {
      throw new OperationalError('Reviews can only be submitted for completed bookings', 409);
    }

    // OS: "exactly one review per side"
    const existing = await ReviewModel.findByBooking(booking.id);
    if (existing.find(r => r.reviewer_id === req.user.id)) {
      throw new OperationalError('You have already reviewed this booking', 409);
    }

    // Only promoter or performer can review
    if (req.user.id !== booking.promoter_id && req.user.id !== booking.performer_id) {
      throw new OperationalError('Booking not found', 404);
    }

    const review = await ReviewModel.create({
      bookingId: booking.id,
      reviewerId: req.user.id,
      reviewerName: req.user.name,
      subjectId: booking.performer_id,
      subjectName: booking.performer_name,
      rating: data.rating,
      comment: data.comment,
    });

    await AuditModel.log({
      actorId: req.user.id, actionType: 'review_submitted',
      entityType: 'review', entityId: review.id,
      newState: { rating: data.rating, bookingId: booking.id },
      ipAddress: req.ip, userAgent: req.headers['user-agent'],
    });

    // Notify the other party
    let notifyId;
    if (req.user.id === booking.promoter_id) {
      // Notify performer — need to lookup their user_id
      const performer = await PerformerModel.findById(booking.performer_id);
      notifyId = performer ? performer.user_id : null;
    } else {
      // Notify promoter
      notifyId = booking.promoter_id;
    }
    if (notifyId) {
      await NotificationService.notify(
        notifyId,
        'New Review',
        `${req.user.name} left a ${data.rating}-star review.`,
        'review', review.id
      );
    }

    res.status(201).json(review);
  } catch (err) { next(err); }
});

module.exports = router;