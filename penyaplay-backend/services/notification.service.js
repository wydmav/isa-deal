// ──────────────────────────────────────
// Penya Play — Notification Service
// OS: "one centralized notification service"
// OS: "email dispatches when a provider is configured"
// OS: "WhatsApp payloads are prepared but not sent"
// ──────────────────────────────────────

const NotificationModel = require('../models/notification.model');
const EMAIL_PROVIDER = process.env.PP_EMAIL_PROVIDER || 'none';

async function notify(userId, title, body, entityType, entityId) {
  // OS: "in-app is live in Phase 1"
  await NotificationModel.create({ userId, title, body, entityType, entityId });

  // OS: "email dispatches when a provider is configured"
  // When PP_EMAIL_PROVIDER=sendgrid (or similar), send here
  // For now: prepared but not sent
  if (EMAIL_PROVIDER !== 'none') {
    console.log('[NOTIFICATION-EMAIL] To user ' + userId + ': ' + title + ' — ' + body);
  }

  // OS: "WhatsApp payloads are prepared but not sent without a provider"
  // const whatsappPayload = { to: userPhone, template: 'booking_update', params: { title, body } };
  // if (WHATSAPP_PROVIDER !== 'none') { await sendWhatsApp(whatsappPayload); }
}

module.exports = { notify };