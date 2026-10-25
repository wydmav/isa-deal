
// ──────────────────────────────────────────────
// Penya Play — Performer Routes (Public + Protected)
// OS: "/book/:handle — canonical public route"
// OS: "the visitor is never redirected to a homepage before completing a booking"
// ──────────────────────────────────────────────

const router = require('express').Router();
const PerformerModel = require('../models/performer.model');
const ReviewModel = require('../models/review.model');
const { protect, restrictTo } = require('../middleware/auth');

// OS: "instant text search" + "dynamic category sorting"
router.get('/', async (req, res, next) => {
  try {
    const { q, category, limit, offset } = req.query;
    const performers = await PerformerModel.search({
      query: q || null,
      category: category || null,
      limit: parseInt(limit, 10) || 50,
      offset: parseInt(offset, 10) || 0,
    });
    res.json(performers);
  } catch (err) { next(err); }
});

// OS: "canonical public route — /book/:handle"
// OS: "unique profile links using the format isadeal.africa/b/[profile-name]"
router.get('/:handle', async (req, res, next) => {
  try {
    const performer = await PerformerModel.findApproved(req.params.handle);
    if (!performer) {
      return res.status(404).json({ error: 'Performer not found' });
    }

    const packages = await PerformerModel.getPackages(performer.id);
    const reputation = await ReviewModel.getAggregate(performer.id);

    // OS: "private pricing is never exposed publicly"
    // OS: "public pages show From [amount] or Request a quote"
    const safePackages = packages.map(pkg => ({
      id: pkg.id,
      title: pkg.title,
      description: pkg.description,
      duration: pkg.duration,
      priceVisibility: pkg.price_visibility,
      // Only show price if visibility is public or starting_from
      ...(pkg.priceVisibility === 'public' ? {
        price: pkg.base_price,
        currency: pkg.currency,
        formatted: formatPrice(pkg.base_price, pkg.currency, pkg.priceVisibility),
      } : pkg.priceVisibility === 'starting_from' ? {
        price: pkg.base_price,
        currency: pkg.currency,
        formatted: formatPrice(pkg.base_price, pkg.currency, pkg.price_visibility),
      } : {}),
      depositPct: pkg.deposit_pct,
    }));

    // OS: "area-level location only" — already stored that way
    res.json({
      handle: performer.handle,
      stageName: performer.stage_name,
      professions: performer.professions,
      area: performer.area,
      bio: performer.bio,
      profileImg: performer.profileImg,
      featuredVideo: performer.featuredVideo,
      verificationStatus: performer.verificationStatus,
      completionPct: performer.completion_pct,
      packages: safePackages,
      reputation: {
        totalReviews: parseInt(reputation.total_reviews, 10) || 0,
        averageRating: parseFloat(reputation.average_rating) || 0,
      },
    });
  } catch (err) { next(err); }
});

// Get reviews for a public performer page
router.get('/:handle/reviews', async (req, res, next) => {
  try {
    const performer = await PerformerModel.findApproved(req.params.handle);
    if (!performer) return res.status(404).json({ error: 'Performer not found' });
    const reviews = await ReviewModel.findByPerformer(performer.id);
    res.json(reviews);
  } catch (err) { next(err); }
});

// Get own performer profile (authenticated)
router.get('/me/profile', protect, restrictTo('performer'), async (req, res, next) => {
  try {
    const performer = await PerformerModel.findByUserId(req.user.id);
    if (!performer) return res.status(404).json({ error: 'Performer profile not found' });
    const packages = await PerformerModel.getPackages(performer.id);
    const reputation = await ReviewModel.getAggregate(performer.id);
    res.json({ ...performer, packages, reputation });
  } catch (err) { next(err); }
});

function formatPrice(amount, currency, visibility) {
  const sym = { LSL: 'M', ZAR: 'R', BWP: 'P', NAD: 'N$', SZL: 'E', MZN: 'MT', ZMW: 'ZK', USD: '$', EUR: '€', GBP: '£' }[currency] || currency + ' ';
  const formatted = sym + (amount / 100).toLocaleString('en-ZA', { minimumFractionDigits: 2 });
  return visibility === 'starting_from' ? `From ${formatted}` : formatted;
}

module.exports = router;