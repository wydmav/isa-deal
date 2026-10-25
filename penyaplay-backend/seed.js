// ──────────────────────────────────────────────
// Penya Play — Seed Script
// OS: "seed and demo data never contains real personal,
//      banking, or client information"
// ──────────────────────────────────────────────

require('dotenv').config();
const bcrypt = require('bcryptjs');
const { pool } = require('./config/db');

const SEED = async () => {
  console.log('Seeding Penya Play Booking OS...\n');

  // ── Admin ──
  const adminPass = await bcrypt.hash('admin123', 12);
  const adminRes = await pool.query(
    `INSERT INTO users (email, password_hash, role, name)
     VALUES ($1,$2,$3,$4)
     ON CONFLICT (email) DO NOTHING
     RETURNING id`,
    ['admin@penyaplay.com', adminPass, 'admin', 'System Admin']
  );
  console.log('  ✓ Admin: admin@penyaplay.com / admin123');

  // ── Performer 1: Mpho Sebina (approved) ──
  const perf1Pass = await bcrypt.hash('performer123', 12);
  const perf1User = await pool.query(
    `INSERT INTO users (email, password_hash, role, name, area_city)
     VALUES ($1,$2,$3,$4,$5)
     ON CONFLICT (email) DO NOTHING
     RETURNING id`,
    ['mpho@penyaplay.com', perf1Pass, 'performer', 'Mpho Sebina', 'Maseru']
  );
  const perf1Id = perf1User.rows[0]?.id;

  if (perf1Id) {
    await pool.query(
      `INSERT INTO performers (user_id, handle, stage_name, professions, area, area_city, profile_img, bio, verification_status, completion_pct)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'Afro-Pop and R&B vocalist known for soulful delivery across Southern Africa.','approved',85)
       ON CONFLICT (handle) DO NOTHING`,
      [perf1Id, 'mpho-sebina', 'Mpho Sebina', ['{singer}', '{musician}'], 'Maseru — CBD area', 'Maseru', 'https://picsum.photos/seed/mpho-pp-os/400/500']
    );
    await pool.query(
      `INSERT INTO packages (performer_id, title, description, duration, base_price, currency, price_visibility, deposit_pct, sort_order) VALUES
       ($1,'Standard Set','45-minute live performance with backing tracks',45,1500000,'LSL','starting_from',50,1),
       ($1,'Full Show','90-minute live performance with full band',90,3500000,'LSL','request_quote',50,2)`,
      [perf1Id]
    );
    console.log('  ✓ Performer: mpho@penyaplay.com / performer123 (Mpho Sebina)');
  }

  // ── Performer 2: DJ Nale (approved) ──
  const perf2Pass = await bcrypt.hash('performer123', 12);
  const perf2User = await pool.query(
    `INSERT INTO users (email, password_hash, role, name, area_city)
     VALUES ($1,$2,$3,$4,$5)
     ON CONFLICT (email) DO NOTHING
     RETURNING id`,
    ['djnale@penyaplay.com', perf2Pass, 'performer', 'DJ Nale', 'Johannesburg']
  );
  const perf2Id = perf2User.rows[0]?.id;

  if (perf2Id) {
    await pool.query(
      `INSERT INTO performers (user_id, handle, stage_name, professions, area, area_city, profile_img, bio, verification_status, completion_pct)
       VALUES ($1,$2,$3,$4,$5,$6,$7,'Deep house and Amapiano specialist with international experience.','approved',92)
       ON CONFLICT (handle) DO NOTHING`,
      [perf2Id, 'dj-nale', 'DJ Nale', ['{DJ}'], 'Johannesburg — Sandton area', 'Johannesburg', 'https://picsum.photos/seed/djnale-pp-os/400/500']
    );
    await pool.query(
      `INSERT INTO packages (performer_id, title, description, duration, base_price, currency, price_visibility, deposit_pct, sort_order) VALUES
       ($1,'Club Set','2-hour DJ set',120,8000000,'ZAR','public',50,1)`,
      [perf2Id]
    );
    console.log('  ✓ Performer: djnale@penyaplay.com / performer123 (DJ Nale)');
  }

  // ── Performer 3: Thabo Comedy (pending review) ──
  const perf3Pass = await bcrypt.hash('performer123', 12);
  const perf3User = await pool.query(
    `INSERT INTO users (email, password_hash, role, name, area_city)
     VALUES ($1,$2,$3,$4,$5)
     ON CONFLICT (email) DO NOTHING
     RETURNING id`,
    ['thabo@penyaplay.com', perf3Pass, 'performer', 'Thabo Comedy', 'Pretoria']
  );
  const perf3Id = perf3User.rows[0]?.id;

  if (perf3Id) {
    await pool.query(
      `INSERT INTO performers (user_id, handle, stage_name, professions, area, area_city, profile_img, bio, verification_status, completion_pct)
       VALUES ($1,$2,$3,$4,$5,$6,$7,'Stand-up comedian blending Southern African humour with sharp social commentary.','pending_review',60)
       ON CONFLICT (handle) DO NOTHING`,
      [perf3Id, 'thabo-comedy', 'Thabo Comedy', ['{comedian}'], 'Pretoria — Hatfield area', 'Pretoria', 'https://picsum.photos/seed/thabo-pp-os/400/500']
    );
    console.log('  ✓ Performer: thabo@penyaplay.com / performer123 (Thabo Comedy — PENDING REVIEW)');
  }

  // ── Promoter 1 ──
  const promo1Pass = await bcrypt.hash('promoter123', 12);
  await pool.query(
    `INSERT INTO users (email, password_hash, role, name, area_city)
     VALUES ($1,$2,$3,$4,$5)
     ON CONFLICT (email) DO NOTHING`,
    ['lunar@events.com', promo1Pass, 'promoter', 'Lunar Events', 'Johannesburg']
  );
  console.log('  ✓ Promoter: lunar@events.com / promoter123');

  // ── Promoter 2 ──
  const promo2Pass = await bcrypt.hash('promoter123', 12);
  await pool.query(
    `INSERT INTO users (email, password_hash, role, name, area_city)
     VALUES ($1,$2,$3,$4,$5)
     ON CONFLICT (email) DO NOTHING`,
    ['penya@bookings.com', promo2Pass, 'promoter', 'Penya Bookings', 'Maseru']
  );
  console.log('  ✓ Promoter: penya@bookings.com / promoter123');

  // ── Test promoter (for curl tests) ──
  const testPass = await bcrypt.hash('testpass123', 12);
  await pool.query(
    `INSERT INTO users (email, password_hash, role, name, area_city)
     VALUES ($1,$2,$3,$4,$5)
     ON CONFLICT (email) DO NOTHING`,
    ['test@events.com', testPass, 'promoter', 'Test Promoter', 'Maseru']
  );
  console.log('  ✓ Test: test@events.com / testpass123');

  console.log('\nSeed complete. Run: npm run dev\n');
};

SEED().then(() => process.exit(0)).catch(err => {
  console.error('Seed error:', err.message);
  process.exit(1);
});