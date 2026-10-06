import { Router } from 'express';
import mongoose from 'mongoose';
import Product from '../models/Product.js';
import Review from '../models/Review.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
const legacyProductNames = {
  1: 'Arc Ceramic Vase',
  2: 'Linen Everyday Tote',
  3: 'Form Stack Candle'
};

async function findProduct(id) {
  if (mongoose.isValidObjectId(id)) return Product.findById(id);
  const name = legacyProductNames[String(id)];
  return name ? Product.findOne({ name }) : null;
}

async function loadReviews(product) {
  const stored = await Review.find({ product: product._id }).populate('user', 'name').sort({ createdAt: -1 });
  await product.populate('reviews.user', 'name');
  const embedded = product.reviews || [];
  const seen = new Set(stored.map((review) => `${review.user?._id || review.user}:${review.comment}`));
  return [...stored, ...embedded.filter((review) => !seen.has(`${review.user?._id || review.user}:${review.comment}`))];
}

router.get('/', async (_req, res, next) => {
  try {
    const products = await Product.find().select('-reviews').populate('seller', 'name studioName');
    res.json(products);
  } catch (error) {
    next(error);
  }
});

router.get('/mine', requireAuth, async (req, res, next) => {
  try {
    if (!req.user.isSeller) return res.status(403).json({ message: 'Create a seller studio first.' });
    res.json(await Product.find({ seller: req.user._id }).select('-reviews'));
  } catch (error) {
    next(error);
  }
});

router.post('/', requireAuth, async (req, res, next) => {
  try {
    if (!req.user.isSeller || !req.user.studioId) return res.status(403).json({ message: 'Create and verify a seller studio before publishing products.' });
    const { name, description, price, category, stock, image, images } = req.body;
    if (!name?.trim() || !description?.trim() || !category?.trim() || !Number.isFinite(Number(price))) {
      return res.status(400).json({ message: 'Name, description, category, and a valid price are required.' });
    }
    const product = await Product.create({
      seller: req.user._id,
      studioId: req.user.studioId,
      name: name.trim(),
      description: description.trim(),
      price: Number(price),
      category: category.trim(),
      stock: Math.max(0, Number(stock) || 0),
      images: Array.isArray(images) && images.length ? images.filter(Boolean) : (image?.trim() ? [image.trim()] : [])
    });

    res.status(201).json(product);
  } catch (error) {
    next(error);
  }
});

router.put('/:id', requireAuth, async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).json({ message: 'Product not found or not owned by your studio.' });
    const product = await Product.findOne({ _id: req.params.id, seller: req.user._id });
    if (!product) return res.status(404).json({ message: 'Product not found or not owned by your studio.' });
    const { name, description, price, category, stock, images, image } = req.body;
    Object.assign(product, {
      name: name?.trim() || product.name,
      description: description?.trim() || product.description,
      category: category?.trim() || product.category,
      price: Number.isFinite(Number(price)) ? Number(price) : product.price,
      stock: Number.isFinite(Number(stock)) ? Math.max(0, Number(stock)) : product.stock,
      images: Array.isArray(images) && images.length ? images.filter(Boolean) : (image?.trim() ? [image.trim()] : product.images)
    });
    await product.save();
    res.json(product);
  } catch (error) {
    next(error);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const product = await findProduct(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });
    const reviews = await loadReviews(product);
    res.json({ ...product.toObject(), reviews: reviews.length ? reviews : product.reviews });
  } catch (error) {
    next(error);
  }
});

router.get('/:id/reviews', async (req, res, next) => {
  try {
    const product = await findProduct(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.json(await loadReviews(product));
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', requireAuth, async (req, res, next) => {
  try {
    const product = await Product.findOne({ _id: req.params.id, seller: req.user._id });
    if (!product) return res.status(404).json({ message: 'Product not found or not owned by you.' });
    await product.deleteOne();
    res.json({ message: 'Product removed.' });
  } catch (error) {
    next(error);
  }
});

router.post('/:id/reviews', requireAuth, async (req, res, next) => {
  try {
    const { rating, title, comment } = req.body;
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Rating must be an integer between 1 and 5.' });
    }
    if (!comment?.trim()) return res.status(400).json({ message: 'Review comment is required.' });

    const product = await findProduct(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });
    if (await Review.exists({ product: product._id, user: req.user._id }) || product.reviews.some((review) => review.user.toString() === req.user._id.toString())) {
      return res.status(409).json({ message: 'You have already reviewed this product.' });
    }

    const review = await Review.create({ product: product._id, user: req.user._id, rating, title, comment });
    const reviews = await loadReviews(product);
    product.numReviews = reviews.length;
    product.rating = reviews.reduce((sum, item) => sum + item.rating, 0) / product.numReviews;
    await product.save();
    res.status(201).json({ review, product: { ...product.toObject(), reviews } });
  } catch (error) {
    next(error);
  }
});

export default router;
