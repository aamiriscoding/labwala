import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

import authRoutes from './routes/auth.js';
import productRoutes from './routes/products.js';
import sellRoutes from './routes/sell.js';
import adminRoutes from './routes/admin.js';
import qnaRoutes from './routes/qna.js';

dotenv.config();

// Fail fast if critical secrets are missing — prevents accidentally running
// with an insecure default JWT secret in production.
const REQUIRED_ENV = ['MONGODB_URI', 'JWT_SECRET', 'ADMIN_USERNAME', 'ADMIN_PASSWORD', 'SELLER_USERNAME', 'SELLER_PASSWORD'];
const missingEnv = REQUIRED_ENV.filter(k => !process.env[k]);
if (missingEnv.length) {
  console.error(`❌ Missing required environment variables: ${missingEnv.join(', ')}`);
  if (process.env.NODE_ENV === 'production') process.exit(1);
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Vercel/other proxies sit in front of the app — needed for correct client IPs
// (used by the rate limiter below) and secure cookies if added later.
app.set('trust proxy', 1);

app.use(helmet());

// Supports one or more comma-separated origins, e.g.
// CLIENT_URL=https://labwala.vercel.app,https://www.labwala.com
const allowedOrigins = (process.env.CLIENT_URL || 'http://localhost:5173')
  .split(',').map(o => o.trim()).filter(Boolean);
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// General API rate limit — blunt protection against abuse/scraping.
app.use('/api', rateLimit({ windowMs: 15 * 60 * 1000, max: 300, standardHeaders: true, legacyHeaders: false }));
// Tighter limit on login specifically, to slow down credential brute-forcing.
const loginLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 10, standardHeaders: true, legacyHeaders: false, message: { message: 'Too many login attempts, please try again later.' } });
app.use('/api/auth/login', loginLimiter);

// ─── DB connection, cached across invocations for serverless platforms ───
let isConnected = false;
async function connectDB() {
  if (isConnected && mongoose.connection.readyState === 1) return;
  await mongoose.connect(process.env.MONGODB_URI);
  isConnected = true;
  console.log('✅ MongoDB connected');
}

if (process.env.VERCEL) {
  // On Vercel, connect lazily on first request instead of blocking startup,
  // and never call app.listen — Vercel's Node runtime handles the server.
  // IMPORTANT: this must be registered BEFORE the routes below, otherwise
  // requests reach Mongoose before a connection exists and every query
  // times out with "buffering timed out".
  app.use(async (req, res, next) => {
    try { await connectDB(); next(); }
    catch (err) { console.error('❌ MongoDB connection failed:', err.message); res.status(503).json({ message: 'Database unavailable' }); }
  });
}

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/sell', sellRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/qna', qnaRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: `LabWala API is running 🔬` });
});

if (!process.env.VERCEL) {
  const PORT = process.env.PORT || 5000;
  connectDB()
    .then(() => {
      app.listen(PORT, () => console.log(`🚀 LabWala server running on port ${PORT}`));
    })
    .catch((err) => {
      console.error('❌ MongoDB connection failed:', err.message);
      process.exit(1);
    });
}

export default app;