// One-off migration: assigns a unique 6-digit productId to any existing
// products that don't already have one (e.g. products created before this
// feature was added). Safe to run multiple times.
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Product from './models/Product.js';

dotenv.config();

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('✅ Connected to MongoDB');

  const missing = await Product.find({ productId: { $in: [null, undefined, ''] } });
  console.log(`Found ${missing.length} product(s) without a productId`);

  for (const product of missing) {
    // Triggers the pre('validate') hook on Product, which generates a unique 6-digit id
    product.productId = undefined;
    await product.save();
    console.log(`  ✓ ${product.name} → ${product.productId}`);
  }

  console.log('🎉 Done');
  await mongoose.disconnect();
}

run().catch(err => {
  console.error('❌ Backfill failed:', err);
  process.exit(1);
});
