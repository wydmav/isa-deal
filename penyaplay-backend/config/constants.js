
// ──────────────────────────────────────────────
// Penya Play — Single Source of Truth
// OS: "this document wins" — these constants ARE the rules
// ──────────────────────────────────────────────

// OS: Universal categories
const CATEGORIES = [
  'musician', 'singer', 'rapper', 'DJ', 'band', 'instrumentalist',
  'MC', 'event host', 'comedian', 'speaker', 'influencer',
  'content creator', 'actor', 'voice artist', 'dancer', 'dance crew',
  'choir', 'poet', 'traditional performer', 'photographer',
  'videographer', 'producer', 'model', 'other'
];

// OS: Status flow — "the spine"
// new → viewed → quote_sent → confirmed → declined → expired → cancelled
// confirmed → paid → completed
const STATUS_FLOW = {
  new:        ['viewed', 'quote_sent', 'declined', 'expired', 'cancelled'],
  viewed:     ['quote_sent', 'declined', 'expired', 'cancelled'],
  quote_sent: ['confirmed', 'declined', 'cancelled'],
  confirmed:  ['paid', 'cancelled'],
  paid:       ['completed', 'cancelled'],
  completed:  [],
  declined:   [],
  expired:    [],
  cancelled:  [],
};

const STATUS_LABELS = {
  new: 'New',
  viewed: 'Viewed',
  quote_sent: 'Quote Sent',
  confirmed: 'Confirmed',
  paid: 'Paid Offline',
  completed: 'Completed',
  declined: 'Declined',
  expired: 'Expired',
  cancelled: 'Cancelled',
};

// OS: "integer minor units plus explicit ISO currency code"
const CURRENCY_SYMBOLS = {
  LSL: 'M', ZAR: 'R', BWP: 'P', NAD: 'N$',
  SZL: 'E', MZN: 'MT', ZMW: 'ZK',
  USD: '$', EUR: '€', GBP: '£',
};

// OS: "LSL and ZAR are treated as a fixed 1:1 peg"
const FX_PEG = { LSL: 'ZAR', ZAR: 'LSL' };

// OS: enquiry source attribution
const ENQUIRY_SOURCES = [
  'booking_button', 'promoter_search', 'verified_gig',
  'marketplace', 'penya_discovery', 'ai_outreach',
  'repeat_booking', 'manual_admin',
];

// OS: "manual payment log — Phase 1 MVP scope"
const PAYMENTS_ENABLED = process.env.PP_PAYMENTS_ENABLED === 'true';

module.exports = {
  CATEGORIES,
  STATUS_FLOW,
  STATUS_LABELS,
  CURRENCY_SYMBOLS,
  FX_PEG,
  ENQUIRY_SOURCES,
  PAYMENTS_ENABLED,
};