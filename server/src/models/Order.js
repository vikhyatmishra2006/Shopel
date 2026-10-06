import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  items: [{
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    name: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
    quantity: { type: Number, required: true, min: 1 }
  }],
  deliveryAddress: {
    fullName: { type: String, required: true, trim: true },
    line1: { type: String, required: true, trim: true },
    city: { type: String, required: true, trim: true },
    postalCode: { type: String, required: true, trim: true },
    country: { type: String, required: true, trim: true }
  },
  payment: {
    provider: { type: String, default: 'dummy' },
    method: { type: String, default: 'UPI (dummy)' },
    status: { type: String, enum: ['Pending', 'Paid'], default: 'Pending' },
    testReference: { type: String }
  },
  coupon: {
    code: { type: String, uppercase: true, trim: true },
    discountPercent: { type: Number, min: 0, max: 100, default: 0 },
    discountAmount: { type: Number, min: 0, default: 0 }
  },
  deliveryCharge: { type: Number, min: 0, default: 0 },
  total: { type: Number, required: true, min: 0 },
  estimatedDelivery: { type: Date, required: true },
  status: { type: String, enum: ['Processing', 'Shipped', 'Delivered', 'Cancelled'], default: 'Processing' }
}, { timestamps: true });

export default mongoose.model('Order', orderSchema);
