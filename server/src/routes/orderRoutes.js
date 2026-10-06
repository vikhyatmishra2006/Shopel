import { Router } from 'express';
import Order from '../models/Order.js';
import Product from '../models/Product.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const router = Router();

router.post('/coupon', (req, res) => {
  const code = req.body?.code?.trim().toUpperCase();
  const match = fs.readFileSync(path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'data', 'coupons.txt'), 'utf8')
    .split(/\r?\n/).map((line) => line.trim().split('|')).find(([couponCode]) => couponCode?.toUpperCase() === code);
  if (!match) return res.status(400).json({ message: 'That coupon code is invalid or expired.' });
  res.json({ code, discountPercent: Number(match[1]) });
});

router.post('/', requireAuth, async (req, res, next) => {
  try {
    const { items, deliveryAddress, coupon } = req.body;
    const requiredAddress = ['fullName', 'line1', 'city', 'postalCode', 'country'];
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'Your cart is empty.' });
    }
    if (!deliveryAddress || requiredAddress.some((field) => !deliveryAddress[field]?.trim())) {
      return res.status(400).json({ message: 'Complete delivery details are required.' });
    }

    const normalizedItems = await Promise.all(items.map(async (item) => {
      const itemId = String(item.id ?? '');
      const productId = /^[a-f\d]{24}$/i.test(itemId) ? itemId : null;
      const product = productId
        ? await Product.findById(productId).select('_id name price')
        : await Product.findOne({ name: item.name }).select('_id name price');
      return {
        product: product?._id,
        name: product?.name || String(item.name || '').trim(),
        price: Number.isFinite(Number(item.price)) ? Number(item.price) : Number(product?.price || 0),
        quantity: Number(item.quantity)
      };
    }));
    if (normalizedItems.some((item) => !item.name || item.quantity < 1 || !Number.isFinite(item.price))) {
      return res.status(400).json({ message: 'Each order item must have a valid product, price, and quantity.' });
    }
    const subtotal = normalizedItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const discountPercent = Number(coupon?.discountPercent) || 0;
    const discountAmount = Math.round(subtotal * discountPercent) / 100;
    const deliveryCharge = 0;
    const estimatedDelivery = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000);
    const order = await Order.create({
      user: req.user._id,
      items: normalizedItems,
      deliveryAddress,
      deliveryCharge,
      total: subtotal - discountAmount + deliveryCharge,
      estimatedDelivery,
      coupon: coupon?.code ? { code: coupon.code, discountPercent, discountAmount } : undefined,
      payment: { provider: 'dummy', status: 'Pending' }
    });
    res.status(201).json({ orderId: order._id, status: order.payment.status, total: order.total, deliveryCharge, estimatedDelivery });
  } catch (error) {
    next(error);
  }
});

router.post('/:id/pay-dummy', requireAuth, async (req, res, next) => {
  try {
    const order = await Order.findOne({ _id: req.params.id, user: req.user._id });
    if (!order) return res.status(404).json({ message: 'Order not found.' });
    if (order.payment.status === 'Paid') return res.json({ orderId: order._id, status: 'Paid' });
    order.payment.status = 'Paid';
    order.status = 'Processing';
    order.payment.method = req.body?.paymentMethod || order.payment.method;
    order.payment.testReference = `DUMMY-${Date.now()}`;
    await order.save();
    res.json({ orderId: order._id, status: 'Paid', orderStatus: order.status, estimatedDelivery: order.estimatedDelivery, paymentMethod: order.payment.method, testReference: order.payment.testReference });
  } catch (error) {
    next(error);
  }
});

router.get('/mine', requireAuth, async (req, res, next) => {
  try {
    const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    next(error);
  }
});

router.get('/admin', requireAuth, requireAdmin, async (_req, res, next) => {
  try {
    const orders = await Order.find().populate('user', 'name email').sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    next(error);
  }
});

router.patch('/:id/status', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const allowed = ['Processing', 'Shipped', 'Delivered', 'Cancelled'];
    if (!allowed.includes(req.body?.status)) return res.status(400).json({ message: 'Invalid order status.' });
    const order = await Order.findByIdAndUpdate(req.params.id, { status: req.body.status }, { new: true }).populate('user', 'name email');
    if (!order) return res.status(404).json({ message: 'Order not found.' });
    res.json(order);
  } catch (error) {
    next(error);
  }
});

export default router;
