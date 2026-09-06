import mongoose from 'mongoose';

const saleItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  productName: {
    type: String,
    required: true // Snapshot of name at time of sale
  },
  quantity: {
    type: Number,
    required: true,
    validate: {
      validator: Number.isInteger,
      message: 'Quantity must be an integer'
    }
  },
  sellingPrice: {
    type: Number,
    required: true // Snapshot of price at time of sale
  },
  costPrice: {
    type: Number,
    required: true // Snapshot of cost at time of sale
  },
  subtotal: {
    type: Number,
    required: true // quantity * sellingPrice
  },
  profit: {
    type: Number,
    required: true // quantity * (sellingPrice - costPrice)
  }
});

const saleRecordSchema = new mongoose.Schema({
  items: [saleItemSchema],
  totalAmount: {
    type: Number,
    required: true
  },
  totalProfit: {
    type: Number,
    required: true
  },
  totalCost: {
    type: Number,
    required: true
  },
  soldBy: {
    type: String,
    default: 'seller'
  },
  note: {
    type: String,
    default: ''
  },
  amountPaid: {
    type: Number,
    default: null  // null = same as totalAmount (not recorded separately)
  },
  paymentDiff: {
    type: Number,
    default: 0    // amountPaid - totalAmount; positive = overpaid, negative = discount
  }
}, {
  timestamps: true
});

export default mongoose.model('SaleRecord', saleRecordSchema);
