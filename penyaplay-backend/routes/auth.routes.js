
// ──────────────────────────────────────────────
// Penya Play — Auth Routes
// OS: "explicit registration paths" for performer and promoter
// OS: "admin verification hold" on new performer profiles
// ──────────────────────────────────────────────

const router = require('express').Router();
const bcrypt = require('bcryptjs');
const UserModel = require('../models/user.model');
const PerformerModel = require('../models/performer.model');
const AuditModel = require('../models/audit.model');
const { signToken, protect } = require('../middleware/auth');
const { validateRegistration } = require('../middleware/validate');
const { OperationalError } = require('../middleware/errorHandler');

// OS: "three separate paths during registration"
router.post('/register', async (req, res, next) => {
  try {
    const data = validateRegistration(req.body);

    // Check email uniqueness
    const existing = await UserModel.findByEmail(data.email);
    if (existing) throw new OperationalError('An account with this email already exists', 409);

    // Create user
    const user = await UserModel.create({
      email: data.email,
      password: data.password,
      role: data.role,
      name: data.name,
      areaCity: data.areaCity,
    });

    // OS: "performer profile set to pending review, hidden from public search"
    if (data.role === 'performer') {
      const handle = data.handle || data.stageName.toLowerCase()
        .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

      // Check handle uniqueness
      const existingPerformer = await PerformerModel.findByHandle(handle);
      if (existingPerformer) throw new OperationalError('This handle is already taken', 409);

      const area = `${data.areaCity || 'Unknown'} area`;

      await PerformerModel.create({
        userId: user.id,
        handle,
        stageName: data.stageName,
        professions: data.professions,
        area,
        areaCity: data.areaCity,
      });
    }

    await AuditModel.log({
      actorId: user.id,
      actionType: 'user_registered',
      entityType: 'user',
      entityId: user.id,
      newState: { role: data.role },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    // Issue token
    const token = signToken(user);
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: parseInt(process.env.PP_SESSION_TTL, 10) || 3600,
      path: '/',
    });

    res.status(201).json({
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
      message: data.role === 'performer'
        ? 'Account created. Your profile is pending review and hidden from public search until approved by an administrator.'
        : 'Account created successfully.',
    });
  } catch (err) { next(err); }
});

// OS: "JWT-Based Login with HttpOnly Cookies"
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) throw new OperationalError('Email and password are required', 400);

    const user = await UserModel.findByEmail(email);
    if (!user) throw new OperationalError('Invalid credentials', 401);

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) throw new OperationalError('Invalid credentials', 401);

    const token = signToken(user);
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: parseInt(process.env.PP_SESSION_TTL, 10) || 3600,
      path: '/',
    });

    res.json({
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
    });
  } catch (err) { next(err); }
});

router.post('/logout', (req, res) => {
  res.clearCookie('token', { path: '/' });
  res.json({ message: 'Signed out' });
});

// Get current user
router.get('/me', protect, async (req, res, next) => {
  try {
    const user = await UserModel.findById(req.user.id);
    if (!user) throw new OperationalError('User not found', 404);

    let performer = null;
    if (user.role === 'performer') {
      performer = await PerformerModel.findByUserId(user.id);
    }

    res.json({ ...user, performer });
  } catch (err) { next(err); }
});

module.exports = router;