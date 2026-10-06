import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { ArrowLeft, ArrowRight, Check, ChevronDown, Heart, LogIn, LogOut, Moon, PackagePlus, Search, ShoppingBag, Sun, Trash2, UserRound, X } from 'lucide-react';
import './styles.css';

const initialProducts = [
  { id: 1, name: 'Arc Ceramic Vase', category: 'Home objects', price: 68, rating: 4.8, reviews: 128, stock: 18, image: 'https://images.unsplash.com/photo-1612196808214-b8e1d6145a8c?auto=format&fit=crop&w=900&q=80' },
  { id: 2, name: 'Linen Everyday Tote', category: 'Carry goods', price: 42, rating: 4.6, reviews: 84, stock: 24, image: 'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=900&q=80' },
  { id: 3, name: 'Form Stack Candle', category: 'Small luxuries', price: 28, rating: 4.9, reviews: 56, stock: 31, image: 'https://images.unsplash.com/photo-1602607203948-1a7c8b6a3e7f?auto=format&fit=crop&w=900&q=80' }
];
const categories = ['All categories', 'Home objects', 'Carry goods', 'Small luxuries'];
const INR_RATE = 83;
const formatINR = (value) => `₹${Math.round(Number(value || 0) * INR_RATE).toLocaleString('en-IN')}`;

async function readApiResponse(response) {
  const contentType = response.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    if (response.status === 404) {
      throw new Error('Shopel API route was not found. Restart the server from this checkout and verify that Vite proxies to the same API port.');
    }
    throw new Error(`Shopel API did not respond with JSON (HTTP ${response.status}). Start the API with "npm run dev" from the repository root and check the Vite proxy configuration.`);
  }
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Shopel API request failed.');
  return data;
}

function Stars({ value }) {
  return <span className="stars">{[1, 2, 3, 4, 5].map((star) => <span key={star} className={star <= Math.round(value) ? 'filled' : ''}>★</span>)}</span>;
}

function AuthPage({ onClose, onAuthenticated }) {
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const submit = async (event) => {
    event.preventDefault(); setError('');
    try {
      const response = await fetch(`/api/auth/${mode}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify(form) });
      const data = await readApiResponse(response);
      onAuthenticated(data.user); onClose();
    } catch (requestError) { setError(requestError.message || 'Unable to authenticate.'); }
  };
  return <div className="auth-page">{onClose && <button className="auth-close" onClick={onClose}><X size={20} /></button>}<div className="auth-panel"><div className="auth-brand"><a className="logo" href="#top">shop<span>el</span><i>.</i></a></div><div className="auth-copy"><p className="eyebrow">{mode === 'login' ? 'Welcome back' : 'Join the community'}</p><h1>{mode === 'login' ? <>Good things<br /><em>await.</em></> : <>Make room for<br /><em>more.</em></>}</h1><p>Sign in to save favorites, manage your shop, and make every purchase personal.</p></div><form className="auth-form" onSubmit={submit}>{mode === 'register' && <label>Full name<input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></label>}<label>Email address<input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></label><label>Password<input required minLength="8" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></label>{error && <p className="auth-error">{error}</p>}<button className="button dark-button auth-submit">{mode === 'login' ? 'Sign in' : 'Create account'} <ArrowRight size={16} /></button></form><p className="auth-switch">{mode === 'login' ? 'New to Shopel?' : 'Already have an account?'} <button onClick={() => setMode(mode === 'login' ? 'register' : 'login')}>{mode === 'login' ? 'Create an account' : 'Sign in'}</button></p></div><div className="auth-image"><img src={initialProducts[0].image} alt="Shopel object" /></div></div>;
}

function ProductCard({ product, onAdd, onSave, onOpen, saved }) {
  return <article className="product-card" onClick={() => onOpen?.(product)}><div className="product-image"><img src={product.image} alt={product.name} /><button className={`heart ${saved ? 'saved' : ''}`} onClick={(event) => { event.stopPropagation(); onSave?.(product); }} aria-label={saved ? 'Remove from favorites' : 'Save item'}><Heart size={17} fill={saved ? 'currentColor' : 'none'} /></button></div><div className="product-meta"><div><p className="category">{product.category}</p><h3>{product.name}</h3>{product.studioId && <span className="seller-badge">Verified seller · {product.studioName || product.studioId}</span>}</div><strong>{formatINR(product.price)}</strong></div><div className="product-rating"><Stars value={product.rating} /> <span>{product.rating} · {product.numReviews ?? (Array.isArray(product.reviews) ? product.reviews.length : product.reviews || 0)} reviews</span></div><button className="add-button" onClick={(event) => { event.stopPropagation(); onAdd(product); }}>Add to bag <ArrowRight size={14} /></button></article>;
}

function BrowsePage({ products, onAdd, onSave, onOpen, saved, onBack }) {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState(categories[0]);
  const catalogMaxPrice = Math.max(150, ...products.map((product) => Number(product.price) || 0));
  const [maxPrice, setMaxPrice] = useState(catalogMaxPrice);
  const [sort, setSort] = useState('Featured');
  useEffect(() => { setMaxPrice(catalogMaxPrice); }, [catalogMaxPrice]);
  const filtered = useMemo(() => products.filter((product) => (category === categories[0] || product.category === category) && product.price <= maxPrice && product.name.toLowerCase().includes(query.toLowerCase())).sort((a, b) => sort === 'Price: low to high' ? a.price - b.price : sort === 'Price: high to low' ? b.price - a.price : b.rating - a.rating), [products, query, category, maxPrice, sort]);
  return <main className="browse-page"><div className="browse-heading"><button className="back-link" onClick={onBack}><ArrowLeft size={15} /> Back to home</button><p className="eyebrow">The complete edit</p><h1>Find your <em>good thing.</em></h1><p>Search and filter our considered collection.</p></div><div className="browse-toolbar"><label className="search-field"><Search size={17} /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search products..." /></label><select value={category} onChange={(e) => setCategory(e.target.value)}>{categories.map((item) => <option key={item}>{item}</option>)}</select><select value={sort} onChange={(e) => setSort(e.target.value)}><option>Featured</option><option>Price: low to high</option><option>Price: high to low</option></select></div><div className="browse-content"><aside className="filter-panel"><div><b>Filter products</b><span>{filtered.length} results</span></div><label>Maximum price <strong>{formatINR(maxPrice)}</strong><input type="range" min="20" max={catalogMaxPrice} value={maxPrice} onChange={(e) => setMaxPrice(Number(e.target.value))} /></label><button onClick={() => { setQuery(''); setCategory(categories[0]); setMaxPrice(catalogMaxPrice); }}>Clear filters</button></aside><div className="product-grid browse-grid">{filtered.length ? filtered.map((product) => <ProductCard key={product.id} product={product} onAdd={onAdd} onSave={onSave} onOpen={onOpen} saved={saved.includes(product.id)} />) : <p className="empty-state">No products match these filters.</p>}</div></div></main>;
}

function FavoritesPage({ products, onAdd, onSave, onOpen, saved, onBack }) {
  const favorites = products.filter((product) => saved.includes(product.id));
  return <main className="browse-page"><button className="back-link" onClick={onBack}><ArrowLeft size={15} /> Back to shop</button><div className="page-heading"><p className="eyebrow">Saved for later</p><h1>Your <em>favorites.</em></h1></div>{favorites.length ? <div className="product-grid browse-grid">{favorites.map((product) => <ProductCard key={product.id} product={product} onAdd={onAdd} onSave={onSave} onOpen={onOpen} saved />)}</div> : <div className="empty-cart"><Heart size={30} /><h2>No favorites yet.</h2><p>Tap the heart on anything you want to remember.</p></div>}</main>;
}

function ProductDetail({ product, user, onAdd, onBuy, onBack, onReview }) {
  const [rating, setRating] = useState(5); const [comment, setComment] = useState(''); const [error, setError] = useState(''); const [message, setMessage] = useState('');
  const submit = async (event) => { event.preventDefault(); setError(''); try { await onReview(product.id, { rating, comment }); setComment(''); setMessage('Your review was added.'); } catch (requestError) { setError(requestError.message); } };
  return <main className="detail-page"><button className="back-link" onClick={onBack}><ArrowLeft size={15} /> Back to shop</button><div className="detail-layout"><img className="detail-image" src={product.image} alt={product.name} /><div className="detail-copy"><p className="eyebrow">{product.category}</p><h1>{product.name}</h1>{product.studioId && <span className="seller-badge">Verified seller · {product.studioName || product.studioId}</span>}<div className="product-rating"><Stars value={product.rating} /> <span>{product.rating} · {product.numReviews ?? (Array.isArray(product.reviews) ? product.reviews.length : product.reviews || 0)} reviews</span></div><strong className="detail-price">{formatINR(product.price)}</strong><p className="detail-description">{product.description || 'A considered piece made for everyday living.'}</p><div className="detail-actions"><button className="button dark-button" onClick={() => onBuy(product)}>Buy now <ArrowRight size={16} /></button><button className="button outline-button" onClick={() => onAdd(product)}>Add to bag</button></div></div></div><section className="detail-reviews"><div><p className="eyebrow">Community notes</p><h2>Reviews from <em>real buyers.</em></h2></div>{product.reviews?.length ? product.reviews.map((review) => <article className="review" key={review._id}><div className="review-avatar">{review.user?.name?.[0] || 'S'}</div><div><b>{review.user?.name || 'Shopel buyer'}</b><div><Stars value={review.rating} /></div><p>{review.comment}</p></div></article>) : <p className="muted">No reviews yet.</p>}{user ? <form className="review-form" onSubmit={submit}><h3>Share your experience</h3><label>Rating<select value={rating} onChange={(event) => setRating(Number(event.target.value))}><option value="5">5 - Excellent</option><option value="4">4 - Great</option><option value="3">3 - Good</option><option value="2">2 - Fair</option><option value="1">1 - Poor</option></select></label><textarea required value={comment} onChange={(event) => setComment(event.target.value)} placeholder="What did you think?" />{error && <p className="auth-error">{error}</p>}{message && <p className="form-notice">{message}</p>}<button className="button dark-button">Submit review</button></form> : <p className="muted">Sign in to share your review.</p>}</section></main>;
}

function CartPage({ cart, updateQuantity, removeFromCart, onBack, onCheckout }) {
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  return <main className="cart-page"><button className="back-link" onClick={onBack}><ArrowLeft size={15} /> Continue shopping</button><div className="page-heading"><p className="eyebrow">Your selection</p><h1>Shopping <em>bag.</em></h1></div>{cart.length ? <div className="cart-layout"><div>{cart.map((item) => <article className="cart-item" key={item.id}><img src={item.image} alt={item.name} /><div><p className="category">{item.category}</p><h3>{item.name}</h3><strong>{formatINR(item.price)}</strong></div><div className="quantity"><button onClick={() => updateQuantity(item.id, item.quantity - 1)}>-</button><span>{item.quantity}</span><button onClick={() => updateQuantity(item.id, item.quantity + 1)}>+</button></div><button className="remove-button" onClick={() => removeFromCart(item.id)} aria-label="Remove item"><Trash2 size={16} /></button></article>)}</div><aside className="summary-card"><p className="eyebrow">Order summary</p><div><span>Subtotal</span><strong>{formatINR(subtotal)}</strong></div><div><span>Shipping</span><span>Complimentary</span></div><hr /><div className="total"><span>Total</span><strong>{formatINR(subtotal)}</strong></div><button className="button dark-button" onClick={onCheckout}>Proceed to checkout <ArrowRight size={16} /></button><small><Check size={13} /> Secure dummy payment. No real charge.</small></aside></div> : <div className="empty-cart"><ShoppingBag size={30} /><h2>Your bag is waiting.</h2><p>Add something considered to get started.</p></div>}</main>;
}

function ProfilePage({ user, onSave, onBack }) {
  const [form, setForm] = useState({ name: user.name, email: user.email, address: { fullName: user.address?.fullName || user.name, line1: user.address?.line1 || '', city: user.address?.city || '', postalCode: user.address?.postalCode || '', country: user.address?.country || 'India' } }); const [error, setError] = useState(''); const [message, setMessage] = useState('');
  const submit = async (event) => { event.preventDefault(); setError(''); try { await onSave(form); setMessage('Profile updated.'); } catch (requestError) { setError(requestError.message); } };
  const updateAddress = (field, value) => setForm({ ...form, address: { ...form.address, [field]: value } });
  return <main className="profile-page"><button className="back-link" onClick={onBack}><ArrowLeft size={15} /> Back to shop</button><div className="page-heading"><p className="eyebrow">Your account</p><h1>Edit your <em>profile.</em></h1></div><form className="profile-form" onSubmit={submit}><label>Name<input required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /></label><label>Email<input required type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} /></label><p className="eyebrow profile-section-label">Delivery address</p><label>Full name<input required value={form.address.fullName} onChange={(event) => updateAddress('fullName', event.target.value)} /></label><label>Address<input required value={form.address.line1} onChange={(event) => updateAddress('line1', event.target.value)} /></label><div className="form-row"><label>City<input required value={form.address.city} onChange={(event) => updateAddress('city', event.target.value)} /></label><label>Postal code<input required value={form.address.postalCode} onChange={(event) => updateAddress('postalCode', event.target.value)} /></label></div><label>Country<select value={form.address.country} onChange={(event) => updateAddress('country', event.target.value)}><option>India</option><option>United States</option><option>United Kingdom</option></select></label>{error && <p className="auth-error">{error}</p>}{message && <p className="form-notice">{message}</p>}<button className="button dark-button">Save profile <Check size={16} /></button></form></main>;
}

function OrdersPage({ onBack }) {
  const [orders, setOrders] = useState([]); const [error, setError] = useState('');
  useEffect(() => { fetch('/api/orders/mine', { credentials: 'include' }).then(readApiResponse).then(setOrders).catch((requestError) => setError(requestError.message)); }, []);
  return <main className="orders-page"><button className="back-link" onClick={onBack}><ArrowLeft size={15} /> Back to shop</button><div className="page-heading"><p className="eyebrow">Your account</p><h1>Order <em>history.</em></h1></div>{error && <p className="auth-error">{error}</p>}{orders.length ? orders.map((order) => <article className="order-card" key={order._id}><div className="order-card-head"><div><p className="eyebrow">Order placed {new Date(order.createdAt).toLocaleDateString()}</p><strong>#{order._id.slice(-8).toUpperCase()}</strong></div><span className={`order-status ${order.status.toLowerCase()}`}>{order.status}</span></div><div className="order-items">{order.items.map((item, index) => <div key={`${order._id}-${index}`}><span>{item.name} × {item.quantity}</span><strong>{formatINR(item.price * item.quantity)}</strong></div>)}</div><div className="order-card-foot"><span>Delivering to {order.deliveryAddress.city}, {order.deliveryAddress.country}</span><strong>Total {formatINR(order.total)}</strong><span>Arrives by {new Date(order.estimatedDelivery).toLocaleDateString()}</span></div></article>) : <div className="empty-cart"><ShoppingBag size={30} /><h2>No purchases yet.</h2><p>Your completed orders will appear here.</p></div>}</main>;
}

function AdminPage({ onBack }) {
  const [orders, setOrders] = useState([]);
  const [error, setError] = useState('');
  useEffect(() => { fetch('/api/orders/admin', { credentials: 'include' }).then(readApiResponse).then(setOrders).catch((requestError) => setError(requestError.message)); }, []);
  const updateStatus = async (id, status) => {
    try {
      const order = await readApiResponse(await fetch(`/api/orders/${id}/status`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify({ status }) }));
      setOrders((items) => items.map((item) => item._id === order._id ? order : item));
    } catch (requestError) { setError(requestError.message); }
  };
  return <main className="orders-page"><button className="back-link" onClick={onBack}><ArrowLeft size={15} /> Back to shop</button><div className="page-heading"><p className="eyebrow">Administrator</p><h1>Manage <em>orders.</em></h1><p>Delivery status changes are saved directly to the database.</p></div>{error && <p className="auth-error">{error}</p>}{orders.map((order) => <article className="order-card" key={order._id}><div className="order-card-head"><div><p className="eyebrow">Customer: {order.user?.name || 'Unknown'} · {order.user?.email}</p><strong>#{order._id.slice(-8).toUpperCase()}</strong></div><select value={order.status} onChange={(event) => updateStatus(order._id, event.target.value)}><option>Processing</option><option>Shipped</option><option>Delivered</option><option>Cancelled</option></select></div><div className="order-items">{order.items.map((item, index) => <div key={`${order._id}-${index}`}><span>{item.name} × {item.quantity}</span><strong>{formatINR(item.price * item.quantity)}</strong></div>)}</div><div className="order-card-foot"><span>{order.deliveryAddress.line1}, {order.deliveryAddress.city}</span><strong>Total {formatINR(order.total)}</strong><span>Arrives by {new Date(order.estimatedDelivery).toLocaleDateString()}</span></div></article>)}</main>;
}

function SellerPage({ products, user, onAddProduct, onUpdateProduct, onRemoveProduct, onBack, onSellerRegistered, onUpdateStudio, onDeleteStudio }) {
  const [form, setForm] = useState({ name: '', description: '', category: categories[1], price: '', stock: '', image: '', images: [] });
  const [editing, setEditing] = useState(null);
  const [sellerForm, setSellerForm] = useState({ studioName: '' });
  const [studioEditing, setStudioEditing] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [localPreview, setLocalPreview] = useState('');
  const [mine, setMine] = useState([]);
  useEffect(() => { if (user?.isSeller) fetch('/api/products/mine', { credentials: 'include' }).then(readApiResponse).then((items) => setMine(items.map((product) => ({ ...product, id: product._id, image: product.images?.[0] || '' })))).catch((requestError) => setError(requestError.message)); }, [user?.isSeller]);
  const submit = async (event) => { event.preventDefault(); setError(''); try { const product = editing ? await onUpdateProduct(editing.id, form) : await onAddProduct(form); if (product) { const normalized = { ...product, id: product._id, image: product.images?.[0] || '' }; setMine((items) => editing ? items.map((item) => item.id === normalized.id ? normalized : item) : [...items, normalized]); setForm({ name: '', description: '', category: categories[1], price: '', stock: '', image: '', images: [] }); setEditing(null); setLocalPreview(''); setMessage(editing ? 'Product updated in the database.' : 'Product added to your studio.'); } } catch (requestError) { setError(requestError.message || 'Unable to save this product.'); } };
  const registerSeller = async (event) => { event.preventDefault(); setError(''); try { const response = await fetch('/api/auth/seller/studio', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify(sellerForm) }); const data = await readApiResponse(response); onSellerRegistered(data.user); setMessage(`Studio verified. Your studio ID is ${data.user.studioId}.`); } catch (requestError) { setError(requestError.message); } };
  const deleteStudio = async () => { if (!window.confirm('Delete this studio and all of its products? This cannot be undone.')) return; setError(''); try { await onDeleteStudio(); } catch (requestError) { setError(requestError.message); } };
  const chooseImage = (event) => { const file = event.target.files?.[0]; if (!file) return; const reader = new FileReader(); reader.onload = () => { setLocalPreview(reader.result); setForm({ ...form, image: reader.result }); }; reader.readAsDataURL(file); };
  const edit = (product) => { setEditing(product); setForm({ ...product, price: (Number(product.price || 0) * INR_RATE).toFixed(2), image: product.image || product.images?.[0] || '', images: product.images || [] }); setMessage('Editing listing.'); };
  if (!user?.isSeller) return <main className="seller-page"><button className="back-link" onClick={onBack}><ArrowLeft size={15} /> Back to shop</button><div className="page-heading"><p className="eyebrow">Seller studio</p><h1>Create your <em>studio.</em></h1><p>Verify this signed-in account and get a unique studio ID to publish and manage products.</p></div><form className="seller-form studio-register" onSubmit={registerSeller}><h2><PackagePlus size={20} /> Studio account</h2><p className="muted">Signed in as {user.email}</p><label>Studio name<input required value={sellerForm.studioName} onChange={(e) => setSellerForm({ ...sellerForm, studioName: e.target.value })} placeholder="e.g. North House Ceramics" /></label>{error && <p className="auth-error">{error}</p>}<button className="button dark-button">Create verified studio <ArrowRight size={16} /></button></form></main>;
  return <main className="seller-page"><button className="back-link" onClick={onBack}><ArrowLeft size={15} /> Back to shop</button><div className="page-heading"><p className="eyebrow">Seller studio · {user.studioId}</p><h1>Build your <em>collection.</em></h1><p>Verified studio account. Every change is saved to your database.</p></div><div className="studio-details"><div><p className="eyebrow">Verified studio</p><strong>{user.studioName || 'Your studio'}</strong><span>Studio ID: {user.studioId}</span></div><div className="studio-detail-actions">{studioEditing ? <form onSubmit={async (event) => { event.preventDefault(); try { const updated = await onUpdateStudio(sellerForm.studioName); onSellerRegistered(updated); setStudioEditing(false); setMessage('Studio details updated in the database.'); } catch (requestError) { setError(requestError.message); } }}><input required value={sellerForm.studioName} onChange={(e) => setSellerForm({ studioName: e.target.value })} /><button className="back-link">Save details</button></form> : <button className="back-link" onClick={() => { setSellerForm({ studioName: user.studioName || '' }); setStudioEditing(true); }}>Update studio details</button>}<button className="delete-studio" onClick={deleteStudio}>Delete studio</button></div></div><div className="seller-layout"><form className="seller-form" onSubmit={submit}><h2><PackagePlus size={20} /> {editing ? 'Update product' : 'Add a product'}</h2><label>Product name<input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></label><label>Description<textarea required value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></label><div className="form-row"><label>Category<select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>{categories.slice(1).map((item) => <option key={item}>{item}</option>)}</select></label><label>Price (INR)<input required type="number" min="0" step=".01" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} /></label><label>Stock<input required type="number" min="0" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} /></label></div><label>Product image URL<input value={form.image.startsWith('data:') ? '' : form.image} onChange={(e) => setForm({ ...form, image: e.target.value })} placeholder="https://..." /></label><label>Or choose an image file<input type="file" accept="image/*" onChange={chooseImage} /></label>{(localPreview || form.image) && <img className="studio-preview" src={localPreview || form.image} alt="Product preview" />}<div className="studio-actions"><button className="button dark-button">{editing ? 'Save product changes' : 'Publish product'} <ArrowRight size={16} /></button>{editing && <button type="button" className="back-link" onClick={() => { setEditing(null); setMessage(''); }}>Cancel update</button>}</div>{message && <p className="form-notice">{message}</p>}{error && <p className="auth-error">{error}</p>}</form>  <div className="seller-list"><div className="list-heading"><h2>Your listings</h2><span>{mine.length} · {user.studioId}</span></div>{mine.map((product) => <div className="listing" key={product.id}><img src={product.image || product.images?.[0]} alt={product.name} /><div><b>{product.name}</b><span>{formatINR(product.price)} · {product.stock} in stock</span></div><button onClick={() => edit(product)} aria-label={`Edit ${product.name}`}><PackagePlus size={15} /></button><button onClick={() => onRemoveProduct(product.id)} aria-label={`Remove ${product.name}`}><Trash2 size={16} /></button></div>)}</div></div></main>;
}

function Checkout({ total, items, user, onClose, onRequireAuth, onComplete }) {
  const [step, setStep] = useState('address');
  const [address, setAddress] = useState({ fullName: user?.address?.fullName || user?.name || '', line1: user?.address?.line1 || '', city: user?.address?.city || '', postalCode: user?.address?.postalCode || '', country: user?.address?.country || 'India' });
  const [orderId, setOrderId] = useState('');
  const [savedOrder, setSavedOrder] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('UPI (dummy)');
  const [error, setError] = useState(''); const [couponCode, setCouponCode] = useState(''); const [coupon, setCoupon] = useState(null); const [couponMessage, setCouponMessage] = useState('');
  const discount = coupon ? total * coupon.discountPercent / 100 : 0; const payable = total - discount;
  const update = (field, value) => setAddress({ ...address, [field]: value });
  const beginPayment = async (event) => {
    event.preventDefault();
    if (!user) { onRequireAuth(); return; }
    setError('');
    try {
      const response = await fetch('/api/orders', { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify({ items, deliveryAddress: address, coupon }) });
      const data = await readApiResponse(response);
      setOrderId(data.orderId);
      setSavedOrder(data);
      setStep('gateway');
    } catch (requestError) {
      setError(requestError.message || 'Unable to save delivery details.');
    }
  };
  const pay = async () => {
    setStep('processing');
    try {
      const response = await fetch(`/api/orders/${orderId}/pay-dummy`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify({ paymentMethod }) });
      if (!response.ok) throw new Error('Payment could not be completed.');
      setTimeout(() => { setStep('success'); }, 1300);
    } catch (requestError) { setError(requestError.message); setStep('gateway'); }
  };
  const applyCoupon = async () => { setCouponMessage(''); try { const data = await readApiResponse(await fetch('/api/orders/coupon', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ code: couponCode }) })); setCoupon(data); setCouponMessage(`${data.discountPercent}% discount applied.`); } catch (requestError) { setCoupon(null); setCouponMessage(requestError.message); } };
  return <div className="checkout-overlay"><div className="checkout-modal"><button className="auth-close" onClick={onClose}><X size={18} /></button>{step === 'success' ? <div className="checkout-success"><div className="success-ring"><Check size={35} /></div><p className="eyebrow">Payment successful · Order placed</p><h2>Thank you for your order.</h2><div className="success-order-details"><p><strong>Products</strong></p>{items.map((item) => <p key={item.id}>{item.name} × {item.quantity} <span>{formatINR(item.price * item.quantity)}</span></p>)}<p><strong>Delivery charges</strong><span>{savedOrder?.deliveryCharge ? formatINR(savedOrder.deliveryCharge) : 'Complimentary'}</span></p><p><strong>Total paid</strong><span>{formatINR(savedOrder?.total ?? payable)}</span></p></div><p>Your order will arrive at <strong>{address.line1}, {address.city}, {address.country}</strong> by <strong>{new Date(savedOrder?.estimatedDelivery || Date.now() + 5 * 24 * 60 * 60 * 1000).toLocaleDateString()}</strong>.</p><p className="coupon-summary">{coupon ? `Coupon ${coupon.code} applied: ${coupon.discountPercent}% off` : 'No coupon applied'}</p><p className="muted">Payment method: {paymentMethod}. Your order is saved in Order history.</p><button className="button dark-button" onClick={() => { onComplete(); onClose(); }}>Return to shop</button></div> :  step === 'processing' ? <div className="gateway-processing"><div className="spinner" /><p className="eyebrow">Shopel test gateway</p><h2>Confirming your payment...</h2><p>Securing your order and preparing delivery.</p></div> : step === 'gateway' ? <div className="gateway"><div className="gateway-logo">shop<span>el</span><i>.</i></div><p className="eyebrow">Choose a dummy payment method</p><h2>Pay <em>{formatINR(payable)}</em></h2><label className="payment-method">Payment method<select value={paymentMethod} onChange={(event) => setPaymentMethod(event.target.value)}><option>UPI (dummy)</option><option>Card (dummy)</option><option>Net banking (dummy)</option><option>Cash on delivery (dummy)</option></select></label><p className="coupon-summary">{coupon ? `Coupon ${coupon.code} applied: ${coupon.discountPercent}% off` : 'No coupon applied'}</p>{error && <p className="auth-error">{error}</p>}<button className="button dark-button" onClick={pay}>Pay now (dummy) <ArrowRight size={16} /></button></div> : <form className="delivery-form" onSubmit={beginPayment}><p className="eyebrow">Delivery details</p><h2>Where should we <em>send it?</em></h2><p className="muted">Your signed-in account is used to save this order.</p><label>Full name<input required value={address.fullName} onChange={(e) => update('fullName', e.target.value)} /></label><label>Address<input required value={address.line1} onChange={(e) => update('line1', e.target.value)} placeholder="Street and house number" /></label><div className="form-row"><label>City<input required value={address.city} onChange={(e) => update('city', e.target.value)} /></label><label>Postal code<input required value={address.postalCode} onChange={(e) => update('postalCode', e.target.value)} /></label></div><label>Country<select value={address.country} onChange={(e) => update('country', e.target.value)}><option>India</option><option>United States</option><option>United Kingdom</option></select></label><div className="coupon-row"><input value={couponCode} onChange={(e) => setCouponCode(e.target.value)} placeholder="Coupon code" /><button type="button" className="back-link" onClick={applyCoupon}>Apply</button></div>{couponMessage && <p className={coupon ? 'form-notice' : 'auth-error'}>{couponMessage}</p>}{error && <p className="auth-error">{error}</p>}<button className="button dark-button" type="submit">Continue to test payment <ArrowRight size={16} /></button></form>}</div></div>;
}

function App() {
  const [dark, setDark] = useState(false); const [view, setView] = useState('browse'); const [showAuth, setShowAuth] = useState(false); const [checkout, setCheckout] = useState(false); const [checkoutItems, setCheckoutItems] = useState([]); const [checkoutIsCart, setCheckoutIsCart] = useState(false); const [user, setUser] = useState(null); const [authChecked, setAuthChecked] = useState(false); const [products, setProducts] = useState(initialProducts); const [cart, setCart] = useState([]); const [saved, setSaved] = useState([]); const [selectedProduct, setSelectedProduct] = useState(null);
  useEffect(() => {
    fetch('/api/auth/me', { credentials: 'include' })
      .then((r) => r.ok ? r.json() : null)
      .then((data) => { if (data?.user) setUser(data.user); })
      .catch(() => {})
      .finally(() => setAuthChecked(true));
  }, []);
  const normalizeProduct = (product) => {
    const reviews = Array.isArray(product.reviews) ? product.reviews : [];
    return {
      ...product,
      id: product._id || product.id,
      image: product.images?.[0] || product.image || initialProducts.find((item) => item.name === product.name)?.image || initialProducts[0].image,
      studioName: product.seller?.studioName || product.studioName,
      reviews,
      numReviews: product.numReviews ?? reviews.length
    };
  };
  const refreshProducts = async () => {
    const items = await readApiResponse(await fetch('/api/products'));
    const persisted = items.map(normalizeProduct);
    setProducts(persisted);
  };
  useEffect(() => { refreshProducts().catch(() => {}); }, []);
  const addToCart = (product) => setCart((items) => { const current = items.find((item) => item.id === product.id); return current ? items.map((item) => item.id === product.id ? { ...item, quantity: Math.min(item.quantity + 1, product.stock) } : item) : [...items, { ...product, quantity: 1 }]; });
  const toggleFavorite = (product) => setSaved((items) => items.includes(product.id) ? items.filter((id) => id !== product.id) : [...items, product.id]);
  const buyNow = (product) => { setCheckoutItems([{ ...product, quantity: 1 }]); setCheckoutIsCart(false); setCheckout(true); };
  const openProduct = async (product) => {
    try {
      const detail = await readApiResponse(await fetch(`/api/products/${product.id}`));
      const reviews = Array.isArray(detail.reviews) ? detail.reviews : [];
      setSelectedProduct({ ...product, ...detail, id: detail._id, image: detail.images?.[0] || product.image, reviews, numReviews: detail.numReviews ?? reviews.length });
    } catch { setSelectedProduct(product); }
    setView('product');
  };
  const submitReview = async (id, review) => {
    await readApiResponse(await fetch(`/api/products/${id}/reviews`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify(review) }));
    const data = await readApiResponse(await fetch(`/api/products/${id}`));
    const reviews = Array.isArray(data.reviews) ? data.reviews : [];
    const updated = { ...selectedProduct, ...data, id: data._id, image: data.images?.[0] || selectedProduct.image, reviews, numReviews: data.numReviews ?? reviews.length };
    setSelectedProduct(updated);
    setProducts((items) => items.map((item) => item.id === id ? { ...item, ...updated } : item));
  };
  const updateQuantity = (id, quantity) => setCart((items) => quantity < 1 ? items.filter((item) => item.id !== id) : items.map((item) => item.id === id ? { ...item, quantity } : item));
  const toStoredProduct = (form) => ({ ...form, price: Number(form.price) / INR_RATE });
  const addProduct = async (form) => { if (!user?.isSeller) { setShowAuth(true); return null; } const response = await fetch('/api/products', { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify(toStoredProduct(form)) }); const product = await readApiResponse(response); await refreshProducts(); return product; };
  const updateProduct = async (id, form) => { const response = await fetch(`/api/products/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify(toStoredProduct(form)) }); const product = await readApiResponse(response); setProducts((items) => items.map((item) => item.id === id ? { ...product, id: product._id, image: product.images?.[0] || initialProducts[0].image } : item)); return product; };
  const updateStudio = async (studioName) => { const response = await fetch('/api/auth/seller/studio', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify({ studioName }) }); const data = await readApiResponse(response); return data.user; };
  const saveProfile = async (form) => { const data = await readApiResponse(await fetch('/api/auth/profile', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify(form) })); setUser(data.user); return data.user; };
  const deleteStudio = async () => { const studioId = user?.studioId; const response = await fetch('/api/auth/seller/studio', { method: 'DELETE', credentials: 'include' }); await readApiResponse(response); setUser((current) => ({ ...current, isSeller: false, studioId: undefined, studioName: undefined })); setProducts((items) => items.filter((item) => item.studioId !== studioId)); setView('browse'); };
  const removeProduct = async (id) => { const response = await fetch(`/api/products/${id}`, { method: 'DELETE', credentials: 'include' }); await readApiResponse(response); await refreshProducts(); };
  const signOut = async () => { await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' }); setUser(null); };
  if (!authChecked) return <div className="auth-loading"><div className="spinner" /><p>Preparing your Shopel experience...</p></div>;
  if (!user && !showAuth) return <AuthPage onClose={null} onAuthenticated={(authenticatedUser) => { setUser(authenticatedUser); setView('browse'); }} />;
  if (showAuth) return <AuthPage onClose={() => setShowAuth(false)} onAuthenticated={setUser} />;
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0); const cartTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const shellProps = { dark, setDark, user, setShowAuth, signOut, cartCount, favoriteCount: saved.length, setView, checkout, checkoutItems, checkoutIsCart, setCheckout, setCart };
  if (view === 'browse') return <Shell {...shellProps}><BrowsePage products={products} onAdd={addToCart} onSave={toggleFavorite} onOpen={openProduct} saved={saved} onBack={() => setView('home')} /></Shell>;
  if (view === 'favorites') return <Shell {...shellProps}><FavoritesPage products={products} saved={saved} onAdd={addToCart} onSave={toggleFavorite} onOpen={openProduct} onBack={() => setView('browse')} /></Shell>;
  if (view === 'product') return <Shell {...shellProps}><ProductDetail product={selectedProduct} user={user} onAdd={addToCart} onBuy={buyNow} onReview={submitReview} onBack={() => setView('browse')} /></Shell>;
  if (view === 'profile') return <Shell {...shellProps}><ProfilePage user={user} onSave={saveProfile} onBack={() => setView('browse')} /></Shell>;
  if (view === 'orders') return <Shell {...shellProps}><OrdersPage onBack={() => setView('browse')} /></Shell>;
  if (view === 'admin' && user.isAdmin) return <Shell {...shellProps}><AdminPage onBack={() => setView('browse')} /></Shell>;
  if (view === 'cart') return <Shell {...shellProps}><CartPage cart={cart} updateQuantity={updateQuantity} removeFromCart={(id) => updateQuantity(id, 0)} onBack={() => setView('browse')} onCheckout={() => { if (!user) { setShowAuth(true); return; } setCheckoutItems(cart); setCheckoutIsCart(true); setCheckout(true); }} /></Shell>;
  if (view === 'seller') return <Shell {...shellProps}><SellerPage products={products} user={user} onAddProduct={addProduct} onUpdateProduct={updateProduct} onRemoveProduct={removeProduct} onSellerRegistered={setUser} onUpdateStudio={updateStudio} onDeleteStudio={deleteStudio} onBack={() => setView('home')} /></Shell>;
  return <Shell {...shellProps}><main id="top"><section className="hero"><div><p className="eyebrow">Objects with intention</p><h1>Make room for<br /><em>good things.</em></h1><p className="hero-copy">Thoughtfully designed goods for the spaces, rituals, and people that make life yours.</p><button className="button dark-button" onClick={() => setView('browse')}>Explore the collection <ArrowRight size={16} /></button></div><div className="hero-image"><img src={products[0].image} alt="Arc ceramic vase" /></div></section><section id="shop" className="collection section"><div className="section-heading"><div><p className="eyebrow">The edit</p><h2>Made for living.</h2></div><button className="text-link" onClick={() => setView('browse')}>Browse all <ArrowRight size={15} /></button></div><div className="product-grid">{products.slice(0, 3).map((product) => <ProductCard key={product.id} product={product} onAdd={addToCart} onSave={toggleFavorite} onOpen={openProduct} saved={saved.includes(product.id)} />)}</div></section><section className="feature section"><div className="feature-image"><img src="https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1400&q=80" alt="Warm living room" /></div><div className="feature-copy"><p className="eyebrow">The Shopel standard</p><h2>Less, but<br /><em>better.</em></h2><p>Every piece is considered for its material, its makers, and the small joy it brings to an ordinary day.</p></div></section>  </main></Shell>;
}

function Shell({ children, dark, setDark, user, setShowAuth, signOut, cartCount, favoriteCount, setView, checkout, checkoutItems, checkoutIsCart, setCheckout, setCart }) {
  const [menuOpen, setMenuOpen] = useState(false);
  return <div className={dark ? 'app dark' : 'app'}><header className="header"><button className="logo logo-button" onClick={() => setView('home')}>shop<span>el</span><i>.</i></button><nav className="nav"><button onClick={() => setView('browse')}>Shop</button><button onClick={() => setView('seller')}>Seller studio</button><button onClick={() => setView('orders')}>Orders</button>{user?.isAdmin && <button onClick={() => setView('admin')}>Admin panel</button>}</nav><div className="header-actions"><button className="icon-button" onClick={() => setView('favorites')} aria-label="Favorites"><Heart size={19} fill={favoriteCount ? 'currentColor' : 'none'} /><b className="nav-count">{favoriteCount}</b></button><button className="icon-button" onClick={() => setView('browse')} aria-label="Search"><Search size={19} /></button><button className="icon-button" onClick={() => setDark(!dark)}>{dark ? <Sun size={19} /> : <Moon size={19} />}</button>{user ? <div className="profile-menu"><button className="account-button" onClick={() => setMenuOpen(!menuOpen)}><UserRound size={17} /><span>Hello, {user.name.split(' ')[0]}</span><ChevronDown size={14} /></button>{menuOpen && <div className="profile-dropdown"><button onClick={() => { setView('profile'); setMenuOpen(false); }}>Edit profile</button><button onClick={() => { setView('orders'); setMenuOpen(false); }}>Order history</button><button onClick={() => { signOut(); setMenuOpen(false); }}>Sign out <LogOut size={14} /></button></div>}</div> : <button className="account-button" onClick={() => setShowAuth(true)}><LogIn size={17} /><span>Sign in</span></button>}<button className="bag" onClick={() => setView('cart')}><ShoppingBag size={19} /><b>{cartCount}</b></button></div></header>{children}<footer><button className="logo logo-button" onClick={() => setView('home')}>shop<span>el</span><i>.</i></button><p>Considered goods for everyday living.</p><small>Dummy payments only · © 2025 Shopel</small></footer>{checkout && <Checkout total={checkoutItems.reduce((sum, item) => sum + item.price * item.quantity, 0)} items={checkoutItems} user={user} onClose={() => setCheckout(false)} onRequireAuth={() => setShowAuth(true)} onComplete={() => { if (checkoutIsCart) setCart([]); setCheckout(false); }} />}</div>;
}

createRoot(document.getElementById('root')).render(<App />);
