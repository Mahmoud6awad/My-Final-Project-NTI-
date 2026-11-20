import Settings from '../models/Settings.js';

const defaults = () => ({
  storeName: process.env.STORE_NAME || 'Nova Store',
  storePhone: process.env.STORE_PHONE || '+201000000000',
  deliveryFee: Number(process.env.DEFAULT_DELIVERY_FEE || 0),
  deliveryTime: process.env.DELIVERY_TIME || 'Confirmed by phone',
  deliveryAreas: process.env.DELIVERY_AREAS || 'Contact us to confirm delivery availability',
  lowStockThreshold: Number(process.env.LOW_STOCK_THRESHOLD || 5)
});

export async function getPublicSettings(_req, res) {
  const settings = await Settings.findOne().lean();
  res.json({ settings: settings || defaults() });
}

export async function getSettings(_req, res) {
  const settings = await Settings.findOne().lean();
  res.json({ settings: settings || defaults() });
}

export async function updateSettings(req, res) {
  const values = req.body ?? {};
  const settings = await Settings.findOneAndUpdate({}, {
    storeName: String(values.storeName || '').trim(),
    storePhone: String(values.storePhone || '').trim(),
    deliveryFee: Number(values.deliveryFee),
    deliveryTime: String(values.deliveryTime || '').trim(),
    deliveryAreas: String(values.deliveryAreas || '').trim(),
    lowStockThreshold: Number(values.lowStockThreshold)
  }, { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true });
  res.json({ settings });
}
