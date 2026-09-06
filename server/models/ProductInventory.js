import mongoose from 'mongoose';

// ─── PRIVATE INVENTORY DATA (hidden from public API) ──────────
// Normalized separately from Product so costPrice & stock
// are never exposed to unauthenticated routes.
const productInventorySchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
    unique: true
  },
  costPrice: { type: Number, required: true, min: 0, default: 0 },
  stock: { type: Number, required: true, min: 0, default: 0 },
}, { timestamps: true });

export default mongoose.model('ProductInventory', productInventorySchema);
