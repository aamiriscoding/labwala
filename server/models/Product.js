import mongoose from 'mongoose';

// Generates a random 6-digit numeric string, e.g. "042817"
function generateShortId() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

// ─── PUBLIC PRODUCT INFO (visible to all) ─────────────────────
const productSchema = new mongoose.Schema({
  // Short, human/API-friendly 6-digit ID (separate from Mongo's long _id).
  // Use this in the API instead of the long default ObjectId, e.g. GET /api/products/042817
  productId: { type: String, unique: true, index: true },
  name: { type: String, required: true, trim: true },
  description: { type: String, required: true },
  category: {
    type: String, required: true,
    enum: ['Microcontrollers','Sensors','Modules','Components','Power','Display','Communication','Tools','Kits','Other']
  },
  sellingPrice: { type: Number, required: true, min: 0 },
  // Market comparison price (shown with strikethrough on hover, only if set)
  marketPrice: { type: Number, default: null },
  totalSold: { type: Number, default: 0 },
  images: { type: [String], default: [] },
  adminNotes: { type: String, default: '' },
  tags: { type: [String], default: [] },
  isActive: { type: Boolean, default: true },
  isPinned: { type: Boolean, default: false },
  // Out-of-stock display override: null | 'available_on_order' | 'restocking_soon' | custom string
  outOfStockLabel: { type: String, default: null },
}, { timestamps: true });

productSchema.index({ name: 'text', description: 'text', tags: 'text', category: 'text' });

// Auto-assign a unique 6-digit productId before the first save.
productSchema.pre('validate', async function (next) {
  if (this.productId) return next();
  const Model = this.constructor;
  let candidate;
  let exists = true;
  // Extremely unlikely to loop more than once or twice (900,000 possible codes)
  for (let attempts = 0; attempts < 20 && exists; attempts++) {
    candidate = generateShortId();
    exists = await Model.exists({ productId: candidate });
  }
  if (exists) return next(new Error('Could not generate a unique product ID, please try again'));
  this.productId = candidate;
  next();
});

export default mongoose.model('Product', productSchema);
