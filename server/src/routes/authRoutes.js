import { Router } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Product from '../models/Product.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

function createToken(userId) {
  if (!process.env.JWT_SECRET) throw new Error('JWT_SECRET is not configured.');
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '7d' });
}

function sendAuthResponse(res, user, status = 200) {
  res.cookie('shopel_token', createToken(user._id.toString()), {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 7 * 24 * 60 * 60 * 1000
  });
  res.status(status).json({ user: { id: user._id, name: user.name, email: user.email, isAdmin: user.isAdmin, isSeller: user.isSeller, studioId: user.studioId, studioName: user.studioName, address: user.address } });
}

router.post('/register', async (req, res, next) => {
  try {
    if (!process.env.JWT_SECRET) return res.status(503).json({ message: 'Authentication is not configured. Set JWT_SECRET in server/.env.' });
    const { name, email, password } = req.body;
    if (!name?.trim() || !email?.trim() || !password) return res.status(400).json({ message: 'Name, email, and password are required.' });
    if (password.length < 8) return res.status(400).json({ message: 'Password must be at least 8 characters.' });
    const normalizedEmail = email.trim().toLowerCase();
    if (await User.exists({ email: normalizedEmail })) return res.status(409).json({ message: 'An account with that email already exists.' });
    const user = await User.create({ name: name.trim(), email: normalizedEmail, password });
    sendAuthResponse(res, user, 201);
  } catch (error) {
    next(error);
  }
});

router.post('/seller/register', async (req, res, next) => {
  try {
    if (!process.env.JWT_SECRET) return res.status(503).json({ message: 'Authentication is not configured. Set JWT_SECRET in server/.env.' });
    const { name, email, password, studioName } = req.body;
    if (!name?.trim() || !email?.trim() || !password || !studioName?.trim()) {
      return res.status(400).json({ message: 'Name, studio name, email, and password are required.' });
    }
    if (password.length < 8) return res.status(400).json({ message: 'Password must be at least 8 characters.' });
    const normalizedEmail = email.trim().toLowerCase();
    if (await User.exists({ email: normalizedEmail })) return res.status(409).json({ message: 'An account with that email already exists.' });
    const studioId = `ST-${studioName.replace(/[^a-z0-9]/gi, '').slice(0, 8).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const user = await User.create({ name: name.trim(), email: normalizedEmail, password, isSeller: true, studioId, studioName: studioName.trim() });
    sendAuthResponse(res, user, 201);
  } catch (error) {
    next(error);
  }
});

router.put('/seller/studio', requireAuth, async (req, res, next) => {
  try {
    const { studioName } = req.body;
    if (!studioName?.trim()) return res.status(400).json({ message: 'Studio name is required.' });
    if (req.user.isSeller) {
      req.user.studioName = studioName.trim();
      await req.user.save();
      sendAuthResponse(res, req.user);
      return;
    }
    const base = studioName.replace(/[^a-z0-9]/gi, '').slice(0, 8).toUpperCase() || 'SHOP';
    let studioId = '';
    for (let attempt = 0; attempt < 5; attempt += 1) {
      const candidate = `ST-${base}-${Math.floor(1000 + Math.random() * 9000)}`;
      if (!(await User.exists({ studioId: candidate }))) { studioId = candidate; break; }
    }
    if (!studioId) return res.status(503).json({ message: 'Unable to allocate a unique studio ID. Please try again.' });
    req.user.isSeller = true;
    req.user.studioId = studioId;
    req.user.studioName = studioName.trim();
    await req.user.save();
    sendAuthResponse(res, req.user);
  } catch (error) {
    next(error);
  }
});

router.delete('/seller/studio', requireAuth, async (req, res, next) => {
  try {
    if (!req.user.isSeller) return res.status(400).json({ message: 'This account does not have a seller studio.' });
    await Product.deleteMany({ seller: req.user._id });
    req.user.isSeller = false;
    req.user.studioId = undefined;
    req.user.studioName = undefined;
    await req.user.save();
    res.json({ message: 'Seller studio and its products were deleted.', user: { id: req.user._id, name: req.user.name, email: req.user.email, isAdmin: req.user.isAdmin, isSeller: false } });
  } catch (error) {
    next(error);
  }
});

router.post('/login', async (req, res, next) => {
  try {
    if (!process.env.JWT_SECRET) return res.status(503).json({ message: 'Authentication is not configured. Set JWT_SECRET in server/.env.' });
    const { email, password } = req.body;
    const user = await User.findOne({ email: email?.trim().toLowerCase() }).select('+password');
    if (!user || !(await user.comparePassword(password || ''))) return res.status(401).json({ message: 'Email or password is incorrect.' });
    sendAuthResponse(res, user);
  } catch (error) {
    next(error);
  }
});

router.get('/me', requireAuth, (req, res) => {
  res.json({ user: req.user });
});

router.put('/profile', requireAuth, async (req, res, next) => {
  try {
    const { name, email, address } = req.body;
    if (!name?.trim() || !email?.trim()) return res.status(400).json({ message: 'Name and email are required.' });
    const normalizedEmail = email.trim().toLowerCase();
    const existing = await User.findOne({ email: normalizedEmail, _id: { $ne: req.user._id } });
    if (existing) return res.status(409).json({ message: 'That email is already in use.' });
    req.user.name = name.trim();
    req.user.email = normalizedEmail;
    if (address) req.user.address = address;
    await req.user.save();
    res.json({ user: { id: req.user._id, name: req.user.name, email: req.user.email, isAdmin: req.user.isAdmin, isSeller: req.user.isSeller, studioId: req.user.studioId, studioName: req.user.studioName, address: req.user.address } });
  } catch (error) {
    next(error);
  }
});

router.post('/logout', (_req, res) => {
  res.clearCookie('shopel_token');
  res.json({ message: 'Signed out successfully.' });
});

export default router;
