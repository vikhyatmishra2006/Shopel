import 'dotenv/config';
import cors from 'cors';
import express from 'express';
import mongoose from 'mongoose';
import cookieParser from 'cookie-parser';
import authRoutes from './routes/authRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import productRoutes from './routes/productRoutes.js';
import { seedStore } from './data/seedStore.js';

const app = express();
const port = process.env.PORT || 5000;
let databaseStatus = 'not configured';

app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173', credentials: true }));
app.use(express.json());
app.use(cookieParser());
mongoose.connection.on('disconnected', () => {
  databaseStatus = 'unavailable';
});
mongoose.connection.on('error', (error) => {
  databaseStatus = 'unavailable';
  console.error('MongoDB connection error:', error.message);
});
app.get('/api/health', (_req, res) => {
  const connected = mongoose.connection.readyState === 1;
  res.status(connected ? 200 : 503).json({
    status: connected ? 'ok' : 'degraded',
    service: 'shopel-api',
    database: databaseStatus
  });
});
app.use('/api/products', (_req, res, next) => {
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({
      message: 'MongoDB is unavailable. Start MongoDB or set a reachable MONGO_URI.'
    });
  }
  next();
}, productRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/orders', (_req, res, next) => {
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({ message: 'MongoDB is unavailable. Start MongoDB to place an order.' });
  }
  next();
}, orderRoutes);
app.use('/api', (req, res) => {
  res.status(404).json({ message: `API route not found: ${req.method} ${req.originalUrl}` });
});
app.use((error, _req, res, _next) => {
  console.error(error);
  res.status(error.status || 500).json({ message: error.message || 'Unexpected server error' });
});

async function start() {
  const server = app.listen(port, () => console.log(`Shopel API listening on port ${port}`));
  server.on('error', (error) => {
    if (error.code === 'EADDRINUSE') {
      console.error(`Port ${port} is already in use. Stop the existing Shopel API process or set a different PORT in server/.env.`);
      return;
    }
    console.error('Unable to start Shopel API:', error);
  });

  if (!process.env.MONGO_URI) {
    databaseStatus = 'not configured';
    console.warn('MONGO_URI is not set. Database-backed routes are unavailable.');
    return;
  }

  try {
    databaseStatus = 'connecting';
    await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 5000 });
    databaseStatus = 'connected';
    console.log('Connected to MongoDB');
    await seedStore();
  } catch (error) {
    databaseStatus = 'unavailable';
    console.error('MongoDB connection unavailable. The API is running without database access:', error.message);
  }
}

start();
