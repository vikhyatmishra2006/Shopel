import User from '../models/User.js';
import Product from '../models/Product.js';

const seedProducts = [
  { name: 'Arc Ceramic Vase', category: 'Home objects', price: 68, stock: 18, rating: 4.8, numReviews: 128, image: 'https://images.unsplash.com/photo-1612196808214-b8e1d6145a8c?auto=format&fit=crop&w=900&q=80' },
  { name: 'Linen Everyday Tote', category: 'Carry goods', price: 42, stock: 24, rating: 4.6, numReviews: 84, image: 'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=900&q=80' },
  { name: 'Form Stack Candle', category: 'Small luxuries', price: 28, stock: 31, rating: 4.9, numReviews: 56, image: 'https://images.unsplash.com/photo-1602607203948-1a7c8b6a3e7f?auto=format&fit=crop&w=900&q=80' }
];

export async function seedStore() {
  const email = (process.env.ADMIN_EMAIL || 'admin@shopel.local').trim().toLowerCase();
  let admin = await User.findOne({ email }).select('+password');
  if (!admin) {
    admin = await User.create({
      name: process.env.ADMIN_NAME || 'Shopel Admin',
      email,
      password: process.env.ADMIN_PASSWORD || 'Admin@12345',
      isAdmin: true,
      isSeller: true,
      studioId: 'ST-SHOPEL-ADMIN',
      studioName: 'Shopel Official'
    });
  } else if (!admin.isAdmin || !admin.isSeller || !admin.studioId) {
    admin.isAdmin = true;
    admin.isSeller = true;
    admin.studioId = admin.studioId || 'ST-SHOPEL-ADMIN';
    admin.studioName = admin.studioName || 'Shopel Official';
    await admin.save();
  }

  for (const seed of seedProducts) {
    await Product.updateOne(
      { name: seed.name, seller: admin._id },
      {
        $setOnInsert: {
          seller: admin._id,
          studioId: admin.studioId,
          name: seed.name,
          description: 'A considered Shopel essential made for everyday living.',
          price: seed.price,
          category: seed.category,
          stock: seed.stock,
          rating: seed.rating,
          numReviews: seed.numReviews,
          images: [seed.image]
        }
      },
      { upsert: true }
    );
  }
  console.log(`Admin account ready: ${email}`);
}
