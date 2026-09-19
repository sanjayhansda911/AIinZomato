import express from 'express';
import http from 'http';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { GoogleGenAI } from '@google/genai';
import { LOCALITIES, RESTAURANTS, COUPONS } from './src/data/hyderabadData';
import { Order, CartItem, AIParsedQuery, AIMatchedDish, AISearchResponse, FoodieFriendDish, FoodieFriendResponse } from './src/types';

// Auto-load .env in Node 20.12+ if present
if (typeof (process as any).loadEnvFile === 'function') {
  try {
    (process as any).loadEnvFile();
  } catch {
    // Environment variables might be injected by host (e.g. Vercel)
  }
}

const app = express();
const server = http.createServer(app);
const PORT = Number(process.env.PORT) || 3000;
const isProduction = process.env.NODE_ENV === 'production';
const rootDir = typeof __dirname !== 'undefined' ? __dirname : process.cwd();

app.use(cors());
app.use(express.json());

// In-memory active cart and orders database
let currentCart: { items: CartItem[]; localityId: string; appliedCoupon: string | null } = {
  items: [],
  localityId: 'jubilee-hills',
  appliedCoupon: 'HYD50',
};

const ordersDatabase: Map<string, Order> = new Map();

// Helper to recalculate distance & ETA based on customer locality
function getAdjustedRestaurant(restaurant: any, targetLocalityId?: string) {
  if (!targetLocalityId) return restaurant;
  const targetLoc = LOCALITIES.find(l => l.id === targetLocalityId) || LOCALITIES[0];
  const originLoc = LOCALITIES.find(l => l.id === restaurant.localityId) || LOCALITIES[0];
  
  // Distance delta estimation
  const isSameLocality = restaurant.localityId === targetLocalityId;
  const distanceKm = isSameLocality 
    ? Math.max(0.8, Number((restaurant.distanceKm * 0.4).toFixed(1)))
    : Number((Math.abs(targetLoc.distanceKm - originLoc.distanceKm) + 2.5).toFixed(1));

  const deliveryTimeMinutes = isSameLocality 
    ? Math.max(18, Math.round(restaurant.deliveryTimeMinutes * 0.7))
    : Math.min(55, Math.round(restaurant.deliveryTimeMinutes + distanceKm * 2.2));

  return {
    ...restaurant,
    distanceKm,
    deliveryTimeMinutes,
  };
}

// ================= API ROUTES =================
const apiRouter = express.Router();

// 1. Localities endpoint
apiRouter.get('/localities', (req, res) => {
  res.json({
    success: true,
    data: LOCALITIES,
    defaultLocalityId: 'jubilee-hills',
  });
});

// 2. Restaurants list with comprehensive filtering
apiRouter.get('/restaurants', (req, res) => {
  const { tab = 'delivery', locality, search, vegOnly, minRating, cuisine } = req.query;

  let list = RESTAURANTS.filter(r => {
    // Tab filter: delivery, dining, nightlife
    if (tab && !r.tabTypes.includes(tab as any)) {
      return false;
    }
    // Pure Veg filter
    if (vegOnly === 'true' && !r.isPureVeg) {
      return false;
    }
    // Rating filter
    if (minRating && r.rating < Number(minRating)) {
      return false;
    }
    // Cuisine filter
    if (cuisine && !r.cuisines.some(c => c.toLowerCase() === String(cuisine).toLowerCase())) {
      return false;
    }
    // Search query filter
    if (search) {
      const q = String(search).toLowerCase();
      const matchName = r.name.toLowerCase().includes(q);
      const matchCuisine = r.cuisines.some(c => c.toLowerCase().includes(q));
      const matchLocality = r.localityName.toLowerCase().includes(q);
      const matchMenu = r.menuCategories.some(mc =>
        mc.items.some(it => it.name.toLowerCase().includes(q) || it.description.toLowerCase().includes(q))
      );
      if (!matchName && !matchCuisine && !matchLocality && !matchMenu) {
        return false;
      }
    }
    return true;
  });

  // Apply distance/ETA adjustment according to target locality
  const targetLocId = (locality as string) || 'jubilee-hills';
  const adjustedList = list.map(r => getAdjustedRestaurant(r, targetLocId));

  res.json({
    success: true,
    count: adjustedList.length,
    locality: LOCALITIES.find(l => l.id === targetLocId) || LOCALITIES[0],
    data: adjustedList,
  });
});

// 3. Single restaurant by ID
apiRouter.get('/restaurants/:id', (req, res) => {
  const { id } = req.params;
  const { locality } = req.query;
  const restaurant = RESTAURANTS.find(r => r.id === id);

  if (!restaurant) {
    return res.status(404).json({ success: false, message: 'Restaurant not found in Hyderabad' });
  }

  const adjusted = getAdjustedRestaurant(restaurant, locality as string);
  res.json({
    success: true,
    data: adjusted,
  });
});

// 4. Coupons endpoint
apiRouter.get('/coupons', (req, res) => {
  res.json({
    success: true,
    data: COUPONS,
  });
});

// 5. Cart endpoints
apiRouter.get('/cart', (req, res) => {
  const currentLocality = LOCALITIES.find(l => l.id === currentCart.localityId) || LOCALITIES[0];
  const subtotal = currentCart.items.reduce((sum, ci) => sum + ci.item.price * ci.quantity, 0);

  let discount = 0;
  if (currentCart.appliedCoupon) {
    const coupon = COUPONS.find(c => c.code === currentCart.appliedCoupon);
    if (coupon && subtotal >= coupon.minOrder) {
      discount = Math.min(coupon.maxDiscount, Math.round((subtotal * coupon.discountPercent) / 100));
    }
  }

  const deliveryFee = currentCart.appliedCoupon === 'ZOMATOGOLD' || subtotal === 0 ? 0 : currentLocality.deliveryFee;
  const platformFee = subtotal > 0 ? 5 : 0;
  const taxes = subtotal > 0 ? Math.round(subtotal * 0.05) : 0; // 5% GST
  const grandTotal = Math.max(0, subtotal + deliveryFee + platformFee + taxes - discount);

  res.json({
    success: true,
    data: {
      items: currentCart.items,
      locality: currentLocality,
      appliedCoupon: currentCart.appliedCoupon,
      subtotal,
      deliveryFee,
      platformFee,
      taxes,
      discount,
      grandTotal,
      itemCount: currentCart.items.reduce((sum, it) => sum + it.quantity, 0),
    },
  });
});

apiRouter.post('/cart/update', (req, res) => {
  const { items, localityId, appliedCoupon } = req.body;
  if (Array.isArray(items)) {
    currentCart.items = items;
  }
  if (localityId) {
    currentCart.localityId = localityId;
  }
  if (appliedCoupon !== undefined) {
    currentCart.appliedCoupon = appliedCoupon;
  }

  const currentLocality = LOCALITIES.find(l => l.id === currentCart.localityId) || LOCALITIES[0];
  const subtotal = currentCart.items.reduce((sum, ci) => sum + ci.item.price * ci.quantity, 0);

  let discount = 0;
  if (currentCart.appliedCoupon) {
    const coupon = COUPONS.find(c => c.code === currentCart.appliedCoupon);
    if (coupon && subtotal >= coupon.minOrder) {
      discount = Math.min(coupon.maxDiscount, Math.round((subtotal * coupon.discountPercent) / 100));
    }
  }

  const deliveryFee = currentCart.appliedCoupon === 'ZOMATOGOLD' || subtotal === 0 ? 0 : currentLocality.deliveryFee;
  const platformFee = subtotal > 0 ? 5 : 0;
  const taxes = subtotal > 0 ? Math.round(subtotal * 0.05) : 0;
  const grandTotal = Math.max(0, subtotal + deliveryFee + platformFee + taxes - discount);

  res.json({
    success: true,
    data: {
      items: currentCart.items,
      locality: currentLocality,
      appliedCoupon: currentCart.appliedCoupon,
      subtotal,
      deliveryFee,
      platformFee,
      taxes,
      discount,
      grandTotal,
      itemCount: currentCart.items.reduce((sum, it) => sum + it.quantity, 0),
    },
  });
});

// 6. Orders endpoints (creation & live simulated tracking)
apiRouter.post('/orders', (req, res) => {
  const { items, localityId, addressNote, appliedCoupon } = req.body;
  const targetLocality = LOCALITIES.find(l => l.id === localityId) || LOCALITIES[0];
  const orderItems: CartItem[] = items || currentCart.items;

  if (!orderItems || orderItems.length === 0) {
    return res.status(400).json({ success: false, message: 'Cart is empty. Add Hyderabadi treats first!' });
  }

  const firstRestaurant = RESTAURANTS.find(r => r.id === orderItems[0].restaurantId) || RESTAURANTS[0];
  const subtotal = orderItems.reduce((sum, it) => sum + it.item.price * it.quantity, 0);

  let discount = 0;
  if (appliedCoupon) {
    const coupon = COUPONS.find(c => c.code === appliedCoupon);
    if (coupon && subtotal >= coupon.minOrder) {
      discount = Math.min(coupon.maxDiscount, Math.round((subtotal * coupon.discountPercent) / 100));
    }
  }

  const deliveryFee = appliedCoupon === 'ZOMATOGOLD' ? 0 : targetLocality.deliveryFee;
  const platformFee = 5;
  const taxes = Math.round(subtotal * 0.05);
  const total = subtotal + deliveryFee + platformFee + taxes - discount;

  const orderId = `ORD-${Date.now().toString().slice(-6)}`;
  const restaurantCoords = firstRestaurant.coordinates || { lat: 17.4087, lng: 78.4982 };
  const deliveryCoords = targetLocality.coordinates || { lat: 17.4319, lng: 78.4073 };

  const newOrder: Order = {
    id: orderId,
    orderNumber: `#HYD-${Math.floor(100000 + Math.random() * 900000)}`,
    createdAt: new Date().toISOString(),
    restaurantId: firstRestaurant.id,
    restaurantName: firstRestaurant.name,
    items: orderItems,
    subtotal,
    deliveryFee,
    discount,
    taxes,
    platformFee,
    total,
    status: 'placed',
    statusText: 'Order Placed & Confirmed by Restaurant',
    deliveryAddress: addressNote ? `${targetLocality.address} (${addressNote})` : targetLocality.address,
    localityName: targetLocality.name,
    estimatedDeliveryTime: `${targetLocality.estimatedDeliveryMinutes} mins`,
    restaurantCoordinates: restaurantCoords,
    deliveryCoordinates: deliveryCoords,
    deliveryPartner: {
      name: 'Ramesh K',
      phone: '+91 98480 22338',
      rating: 4.9,
      photo: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80',
    },
  };

  ordersDatabase.set(orderId, newOrder);

  // Clear current cart after successful order
  currentCart.items = [];

  res.json({
    success: true,
    data: newOrder,
  });
});

apiRouter.get('/orders/:id', (req, res) => {
  const { id } = req.params;
  const order = ordersDatabase.get(id);

  if (!order) {
    return res.status(404).json({ success: false, message: 'Order not found' });
  }

  // 5-milestone progression based on elapsed time (in seconds)
  // Order Placed -> Preparing in Kitchen -> Delivery Partner Assigned -> Out for Delivery -> Arrived
  const elapsedSeconds = Math.floor((Date.now() - new Date(order.createdAt).getTime()) / 1000);
  if (elapsedSeconds > 45) {
    order.status = 'arrived';
    order.statusText = 'Delivery partner has arrived at your doorstep! Enjoy your Hyderabadi meal 🍛';
  } else if (elapsedSeconds > 30) {
    order.status = 'out_for_delivery';
    order.statusText = `${order.deliveryPartner.name} is out for delivery with your order`;
  } else if (elapsedSeconds > 18) {
    order.status = 'valet_assigned';
    order.statusText = `Delivery partner ${order.deliveryPartner.name} assigned and reached restaurant`;
  } else if (elapsedSeconds > 8) {
    order.status = 'preparing';
    order.statusText = `${order.restaurantName} is preparing your fresh meal`;
  } else {
    order.status = 'placed';
    order.statusText = 'Order Placed & Confirmed by Restaurant';
  }

  res.json({
    success: true,
    data: order,
    elapsedSeconds,
  });
});

// ================= AI NATURAL LANGUAGE SEARCH =================

function localNlpParse(query: string): AIParsedQuery {
  const q = query.toLowerCase();

  // 1. Max price extraction (e.g. "under 250", "under 120", "250 rupees", "below ₹350")
  let maxPrice: number | null = null;
  const priceMatch = q.match(/(?:under|below|less than|within|max|around|under\s*rs\.?|under\s*₹)\s*(\d+)/i)
    || q.match(/(\d+)\s*(?:rs|rupees|inr|bucks)/i);
  if (priceMatch) {
    maxPrice = parseInt(priceMatch[1], 10);
  }

  // 2. Dietary preference
  let dietary: 'veg' | 'non-veg' | null = null;
  if (q.includes('non-veg') || q.includes('nonveg') || q.includes('chicken') || q.includes('mutton') || q.includes('keema') || q.includes('haleem') || q.includes('meat') || q.includes('gosht') || q.includes('boti')) {
    dietary = 'non-veg';
  } else if (q.includes('pure veg') || q.includes('veg only') || q.includes('vegetarian') || q.includes('pure-veg') || q.includes('veg')) {
    dietary = 'veg';
  }

  // 3. Cuisines & Dish keywords
  const cuisines: string[] = [];
  const dishKeywords: string[] = [];
  const suggestedTags: string[] = [];

  // BIRYANI DETECTION (Handles Indian phonetic variants: biryani, biriyani, biriyan, briyani, biriani, dum biryani)
  const isBiryani = /biry?a[nm]i?|briyani|pulao/i.test(q);
  if (isBiryani) {
    cuisines.push('Biryani', 'Mughlai');
    if (q.includes('mutton') || q.includes('gosht') || q.includes('lamb')) {
      dishKeywords.push('mutton biryani');
      suggestedTags.push('Mutton Biryani');
    }
    if (q.includes('chicken') || q.includes('murgh')) {
      dishKeywords.push('chicken biryani', 'chicken');
      suggestedTags.push('Chicken Biryani');
    }
    if (q.includes('egg')) {
      dishKeywords.push('egg biryani');
      suggestedTags.push('Egg Biryani');
    }
    if (q.includes('veg') && !q.includes('non')) {
      dishKeywords.push('veg biryani');
      suggestedTags.push('Veg Biryani');
    }
    if (q.includes('65')) {
      dishKeywords.push('chicken 65 biryani');
    }
    dishKeywords.push('biryani');
    suggestedTags.push('Dum Biryani', 'Hyderabadi Special');
  }

  // CHAI & BAKERY (Only check if user did NOT ask for biryani)
  if (!isBiryani && (q.includes('chai') || q.includes('tea') || q.includes('bun maska') || q.includes('irani') || q.includes('osmania') || q.includes('biscuit') || q.includes('samosa') || q.includes('tie biscuit'))) {
    cuisines.push('Irani Chai', 'Bakery');
    if (q.includes('chai') || q.includes('tea') || q.includes('irani')) dishKeywords.push('irani chai', 'chai');
    if (q.includes('osmania')) dishKeywords.push('osmania biscuits');
    if (q.includes('bun maska') || q.includes('maska')) dishKeywords.push('bun maska with amul butter');
    if (q.includes('samosa') || q.includes('keema')) dishKeywords.push('keema samosas');
    if (q.includes('tie')) dishKeywords.push('tie biscuits');
    suggestedTags.push('Chai Time', 'Hyderabad Heritage');
  }

  if (q.includes('dosa') || q.includes('idli') || q.includes('pesarattu') || q.includes('south indian') || q.includes('babai') || q.includes('chutney')) {
    cuisines.push('South Indian');
    if (q.includes('dosa') || q.includes('sponge')) dishKeywords.push('ghee sponge dosa', 'dosa');
    if (q.includes('idli')) dishKeywords.push('guntur steamed button idlis');
    if (q.includes('pesarattu')) dishKeywords.push('mla pesarattu');
    suggestedTags.push('South Indian', '7 Chutneys');
  }

  if (q.includes('haleem') || q.includes('marag') || q.includes('tala hua') || q.includes('gosht') || q.includes('kebab') || q.includes('boti')) {
    cuisines.push('Mughlai', 'Haleem');
    if (q.includes('haleem')) dishKeywords.push('gi-tagged hyderabadi mutton haleem');
    if (q.includes('marag')) dishKeywords.push('mutton marag');
    if (q.includes('tala hua') || q.includes('gosht')) dishKeywords.push('tala hua gosht');
    if (q.includes('kebab') || q.includes('boti')) dishKeywords.push('mutton boti kebab');
    suggestedTags.push('Nizami Royal', 'Slow Cooked');
  }

  if (q.includes('tiramisu') || q.includes('tart') || q.includes('macaron') || q.includes('dessert') || q.includes('sweet') || q.includes('chocolate') || q.includes('meetha') || q.includes('qubani') || q.includes('double ka meetha') || q.includes('patisserie') || q.includes('cake') || q.includes('fruit biscuit')) {
    cuisines.push('Desserts', 'Bakery', 'French Patisserie');
    if (q.includes('tiramisu')) dishKeywords.push('signature tiramisu');
    if (q.includes('tart') || q.includes('chocolate')) dishKeywords.push('belgian chocolate tart');
    if (q.includes('macaron')) dishKeywords.push('macarons');
    if (q.includes('double ka meetha')) dishKeywords.push('double ka meetha');
    if (q.includes('qubani')) dishKeywords.push('qubani ka meetha');
    if (q.includes('fruit biscuit') || q.includes('karachi')) dishKeywords.push('fruit biscuits');
    suggestedTags.push('Sweet Cravings', 'Haute Patisserie');
  }

  if (q.includes('light') || q.includes('bites') || q.includes('snack')) {
    suggestedTags.push('Light Bites');
  }

  if (maxPrice) {
    suggestedTags.unshift(`Under ₹${maxPrice}`);
  }

  // 4. Mood or context
  let moodOrContext = 'Casual dining / craving';
  if (q.includes('light') || q.includes('snack')) moodOrContext = 'Light snacking & quick refreshment';
  else if (q.includes('dinner') || q.includes('lunch') || q.includes('meal')) moodOrContext = 'Satisfying hearty meal';
  else if (q.includes('morning') || q.includes('breakfast')) moodOrContext = 'Authentic morning breakfast';
  else if (q.includes('late night') || q.includes('midnight')) moodOrContext = 'Midnight hunger fix';
  else if (q.includes('sweet') || q.includes('dessert')) moodOrContext = 'Sweet dessert celebration';

  // 5. Intent summary
  const intent = `Looking for ${dishKeywords.length ? dishKeywords.join(', ') : 'Hyderabad specialties'} ${dietary ? `(${dietary})` : ''} ${maxPrice ? `under ₹${maxPrice}` : ''}`.trim();

  // 6. Friendly AI explanation
  let aiExplanation = 'Curated top-rated dishes in Hyderabad based on your request.';
  if (dishKeywords.length && maxPrice) {
    aiExplanation = `Found authentic ${dishKeywords.join(' and ')} from iconic spots like Cafe Niloufer, Nimrah, or Chutneys within ₹${maxPrice}.`;
  } else if (maxPrice) {
    aiExplanation = `Curated delicious authentic bites and meals under your budget of ₹${maxPrice}.`;
  } else if (dishKeywords.length) {
    aiExplanation = `Recommended authentic ${dishKeywords.join(' and ')} from legendary Hyderabad kitchens.`;
  }

  return {
    intent,
    maxPrice,
    cuisines: Array.from(new Set(cuisines)),
    dishKeywords: Array.from(new Set(dishKeywords)),
    dietary,
    moodOrContext,
    aiExplanation,
    suggestedTags: Array.from(new Set(suggestedTags)).slice(0, 4),
  };
}

// POST /ai/search endpoint
apiRouter.post('/ai/search', async (req, res) => {
  const { query, localityId = 'jubilee-hills' } = req.body;

  if (!query || typeof query !== 'string' || query.trim().length === 0) {
    return res.status(400).json({ success: false, message: 'Search query is required' });
  }

  let aiParsed: AIParsedQuery;
  let source: 'gemini-3.8-flash' | 'local-nlp-fallback' = 'local-nlp-fallback';

  const apiKey = process.env.GEMINI_API_KEY;

  if (apiKey) {
    try {
      const ai = new GoogleGenAI({ apiKey });
      const prompt = `You are an expert food & cuisine AI assistant for Zomato in Hyderabad, India.
Analyze the user's natural language food query and extract parameters in JSON format.
The user might ask in English or Indian English (e.g. "Want something light under 250 rupees", "Hot Irani chai with Osmania biscuits under 120", "authentic spicy mutton dum biryani for dinner").
Handle phonetic variations and typos common in India (e.g. "biriyan", "biriyani", "briyani" -> "biryani"; "rooti" -> "roti"; "kabab" -> "kebab").

Extract the following:
- "intent": string summary
- "maxPrice": number or null (e.g. 250)
- "cuisines": array of matched cuisines (e.g. ["Biryani", "Hyderabadi"])
- "dishKeywords": array of food items (e.g. ["chicken biryani", "biryani"]). If user specifically asked for Biryani, ONLY biryani keywords must be specified! Never add unrelated appetizers like samosas or curries.
- "coreFoodType": string or null (e.g. "biryani", "chai", "dosa", "haleem", "samosa", "kebab", "pizza")
- "dietary": "veg" | "non-veg" | null
- "moodOrContext": string
- "aiExplanation": clear explanation sentence
- "suggestedTags": badges like ["Under ₹250", "Chicken Biryani"]

User Query: "${query}"`;

      let responseText: string | null = null;

      // Try gemini-3.8-flash first as requested, fallback to gemini-3.6-flash if high demand
      try {
        const response = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
          },
        });
        if (response.text) {
          responseText = response.text;
          source = 'gemini-3.8-flash';
        }
      } catch (err38) {
        console.warn('gemini-3.8-flash busy, falling back to gemini-3.6-flash:', err38);
        try {
          const response = await ai.models.generateContent({
            model: 'gemini-3.6-flash',
            contents: prompt,
            config: {
              responseMimeType: 'application/json',
            },
          });
          if (response.text) {
            responseText = response.text;
            source = 'gemini-3.8-flash';
          }
        } catch (err36) {
          console.warn('Gemini 3.6 Flash also failed, falling back to local NLP parser:', err36);
        }
      }

      if (responseText) {
        try {
          const parsed = JSON.parse(responseText);
          const rawDietary = Array.isArray(parsed.dietary) ? parsed.dietary.join(' ').toLowerCase() : String(parsed.dietary || '').toLowerCase();
          const dietary: 'veg' | 'non-veg' | null = rawDietary.includes('non') ? 'non-veg' : rawDietary.includes('veg') ? 'veg' : null;

          aiParsed = {
            intent: parsed.intent || query,
            maxPrice: typeof parsed.maxPrice === 'number' ? parsed.maxPrice : null,
            cuisines: Array.isArray(parsed.cuisines) ? parsed.cuisines : [],
            dishKeywords: Array.isArray(parsed.dishKeywords) ? parsed.dishKeywords : [],
            dietary,
            moodOrContext: parsed.moodOrContext || 'Delicious Hyderabadi cuisine',
            aiExplanation: parsed.aiExplanation || 'Curated dishes based on your AI request',
            suggestedTags: Array.isArray(parsed.suggestedTags) ? parsed.suggestedTags : [],
          };
        } catch (jsonErr) {
          console.warn('Failed to parse Gemini JSON, using local parser:', jsonErr);
          aiParsed = localNlpParse(query);
        }
      } else {
        aiParsed = localNlpParse(query);
      }
    } catch (err) {
      console.warn('Gemini call failed, falling back to local NLP parser:', err);
      aiParsed = localNlpParse(query);
    }
  } else {
    aiParsed = localNlpParse(query);
  }

  // Target customer locality for distance/ETA calculation
  const targetLoc = LOCALITIES.find(l => l.id === localityId) || LOCALITIES[0];

  // Match and rank dishes from RESTAURANTS across Hyderabad
  const matchedDishes: AIMatchedDish[] = [];

  const rawQueryLower = (query || '').toLowerCase();
  const isBiryaniRequested = /biry?a[nm]i?|briyani/i.test(rawQueryLower) || 
    (aiParsed.dishKeywords && aiParsed.dishKeywords.some(k => /biry?a[nm]i?|briyani/i.test(k)));
  const isChickenRequested = rawQueryLower.includes('chicken') || rawQueryLower.includes('murgh') ||
    (aiParsed.dishKeywords && aiParsed.dishKeywords.some(k => k.includes('chicken') || k.includes('murgh')));
  const isMuttonRequested = rawQueryLower.includes('mutton') || rawQueryLower.includes('gosht') || rawQueryLower.includes('lamb') ||
    (aiParsed.dishKeywords && aiParsed.dishKeywords.some(k => k.includes('mutton') || k.includes('gosht')));

  for (const rest of RESTAURANTS) {
    // Distance & ETA for this restaurant relative to target locality
    const adjustedRest = getAdjustedRestaurant(rest, localityId);

    for (const cat of rest.menuCategories) {
      for (const item of cat.items) {
        const itemName = item.name.toLowerCase();
        const itemDesc = item.description.toLowerCase();
        const catName = cat.name.toLowerCase();

        // 1. Filter by maxPrice
        if (aiParsed.maxPrice !== null && item.price > aiParsed.maxPrice) {
          continue;
        }

        // 2. Filter by dietary preference
        if (aiParsed.dietary === 'veg' && !item.isVeg) {
          continue;
        }
        if (aiParsed.dietary === 'non-veg' && item.isVeg && isChickenRequested) {
          // If chicken requested, skip veg dishes
          continue;
        }

        // 3. STRICT FOOD CATEGORY FILTER:
        // When Biryani is requested, NEVER allow Samosas, curries, tarts, biscuits, or tea to leak into results!
        const isDishBiryani = /biry?a[nm]i?|briyani|pulao/i.test(itemName) || /biry?a[nm]i?|briyani/i.test(catName);
        if (isBiryaniRequested && !isDishBiryani) {
          continue;
        }

        // 4. PROTEIN CONFLICT FILTER:
        const isDishChicken = itemName.includes('chicken') || itemName.includes('murgh') || itemDesc.includes('chicken');
        const isDishMutton = itemName.includes('mutton') || itemName.includes('gosht') || itemName.includes('lamb');

        if (isChickenRequested && isDishMutton && !isDishChicken) {
          // User asked for chicken, do not give mutton!
          continue;
        }
        if (isMuttonRequested && isDishChicken && !isDishMutton) {
          // User asked for mutton, do not give chicken!
          continue;
        }

        // 5. Keyword Matching Score
        let matchScore = 0;
        const matchTags: string[] = [];
        let keywordHit = false;

        if (aiParsed.dishKeywords && aiParsed.dishKeywords.length > 0) {
          for (const kw of aiParsed.dishKeywords) {
            const kwLower = kw.toLowerCase();
            const kwWords = kwLower.split(/\s+/).filter(w => w.length > 2);

            if (itemName.includes(kwLower)) {
              matchScore += 35;
              keywordHit = true;
              matchTags.push('Direct Match');
            } else if (kwWords.length > 1 && kwWords.every(w => itemName.includes(w) || itemDesc.includes(w))) {
              matchScore += 30;
              keywordHit = true;
              matchTags.push('Direct Match');
            } else if (kwWords.some(w => itemName.includes(w))) {
              matchScore += 15;
              keywordHit = true;
            } else if (itemDesc.includes(kwLower) || catName.includes(kwLower)) {
              matchScore += 12;
              keywordHit = true;
            }
          }
        }

        // Bonus for Chicken match
        if (isChickenRequested && isDishChicken) {
          matchScore += 25;
          if (!matchTags.includes('Chicken Special')) matchTags.push('Chicken Special');
        }
        // Bonus for Biryani match
        if (isBiryaniRequested && isDishBiryani) {
          matchScore += 25;
          if (!matchTags.includes('Dum Biryani')) matchTags.push('Dum Biryani');
        }

        // Cuisine match bonus
        if (aiParsed.cuisines && aiParsed.cuisines.length > 0) {
          for (const c of aiParsed.cuisines) {
            if (rest.cuisines.some(rc => rc.toLowerCase().includes(c.toLowerCase()))) {
              matchScore += 8;
              break;
            }
          }
        }

        // If user specified dish keywords, dish MUST have a keyword hit!
        if (aiParsed.dishKeywords && aiParsed.dishKeywords.length > 0 && !keywordHit) {
          continue;
        }

        // If user didn't mention specific dishes but mentioned budget/light, include dishes under budget
        if (!keywordHit && (!aiParsed.dishKeywords || aiParsed.dishKeywords.length === 0) && aiParsed.maxPrice) {
          matchScore += 15;
        }

        // Bonus for bestsellers & high ratings
        if (item.isBestseller) {
          matchScore += 5;
          matchTags.push('Bestseller');
        }
        if (item.rating && item.rating >= 4.8) {
          matchScore += 5;
        }

        // Bonus for budget friendly
        if (aiParsed.maxPrice && item.price <= aiParsed.maxPrice) {
          matchTags.push(`Under ₹${aiParsed.maxPrice}`);
        }

        matchedDishes.push({
          dish: item,
          restaurantId: rest.id,
          restaurantName: rest.name,
          localityId: rest.localityId,
          localityName: rest.localityName,
          deliveryTimeMinutes: adjustedRest.deliveryTimeMinutes,
          distanceKm: adjustedRest.distanceKm,
          matchScore,
          matchTags: Array.from(new Set(matchTags)).slice(0, 3),
        });
      }
    }
  }

  // Sort matched dishes by score descending, then by price ascending
  matchedDishes.sort((a, b) => {
    if (b.matchScore !== a.matchScore) {
      return b.matchScore - a.matchScore;
    }
    return a.dish.price - b.dish.price;
  });

  const responseData: AISearchResponse = {
    success: true,
    source,
    aiParsed,
    matchedDishes: matchedDishes.slice(0, 10),
  };

  res.json(responseData);
});

// ================= AI FOODIE FRIEND (CAN'T DECIDE) =================

function localFoodieFriendParse(params: {
  localityId?: string;
  weather?: string;
  timeOfDay?: string;
  userHistory?: { pastOrders?: string[]; favoriteCuisines?: string[] };
}): FoodieFriendResponse {
  const { localityId = 'jubilee-hills', weather = 'rainy', timeOfDay, userHistory } = params;

  // Resolve time of day if not given
  let resolvedTime = timeOfDay;
  if (!resolvedTime || resolvedTime === 'auto') {
    const currentHour = new Date().getHours();
    if (currentHour >= 6 && currentHour < 11) resolvedTime = 'morning';
    else if (currentHour >= 11 && currentHour < 16) resolvedTime = 'lunch';
    else if (currentHour >= 16 && currentHour < 19) resolvedTime = 'snack';
    else if (currentHour >= 19 && currentHour < 23) resolvedTime = 'dinner';
    else resolvedTime = 'late_night';
  }

  const w = (weather || 'rainy').toLowerCase();

  let headline = '';
  let weatherCondition = '';
  let timeContext = '';
  let friendAdvice = '';
  let vibeTags: string[] = [];
  let dishMap: { id: string; reason: string }[] = [];

  if (w.includes('rain') || w.includes('drizzle') || w.includes('monsoon') || w.includes('storm')) {
    weatherCondition = '🌧️ Monsoon Drizzle / Rainy';
    timeContext = resolvedTime === 'lunch' || resolvedTime === 'dinner' ? 'Rainy Meal Time' : 'Rainy Chai & Snacks';
    headline = '🌧️ Hyderabad Monsoon Special: Chai & Mirchi Bajji Weather!';
    friendAdvice =
      "Arrey dost! Look at that rain outside! In Hyderabad, sitting idle during rains is simply unacceptable. Nothing beats piping hot Irani Chai, crunchy stuffed Mirchi Bajji, or a steaming Dum Biryani to warm you up. Trust your dost!";
    vibeTags = ['🌧️ Monsoon Comfort', '☕ Kadak Chai', '🌶️ Hyderabadi Bajji', '🍛 Steaming Biryani'];
    dishMap = [
      {
        id: 'niloufer-mirchi-bajji',
        reason: 'Desi-battered Bhavnagri chillies with roasted peanut masala — an absolute rainy day legend!',
      },
      {
        id: 'niloufer-special-mawa-chai',
        reason: 'Rich, creamy slow-simmered Irani chai in a cup that warms you right to the soul.',
      },
      {
        id: 'chutneys-mirchi-bajji',
        reason: 'Crispy golden Andhra-style bajji served with Chutneys famous 7 dips.',
      },
      {
        id: 'niloufer-keema-samosas',
        reason: 'Patti samosas packed with spiced minced mutton, fried blistered and crunchy.',
      },
      {
        id: 'bawarchi-special-mutton',
        reason: 'Spicy, aromatic RTC X Roads dum biryani to beat the cold drizzle.',
      },
      {
        id: 'shahghouse-special-chicken-biryani',
        reason: 'Fiery and deeply spiced chicken biryani that satisfies any monsoon craving.',
      },
    ];
  } else if (w.includes('warm') || w.includes('sun') || w.includes('hot')) {
    weatherCondition = '☀️ Warm Afternoon / Sunny';
    timeContext = 'Cool & Light Dining';
    headline = '☀️ Warm Day: Cool Down Hyderabad Style!';
    friendAdvice =
      "Ustaad, the sun is shining hot today! Don't step out in this heat. Let's cool down with soothing temple curd rice, refreshing filter coffee, or a chilled artisan dessert from Concu.";
    vibeTags = ['☀️ Beat The Heat', '🥭 Cool Refreshers', '🥞 Light Tiffins', '☕ Filter Coffee'];
    dishMap = [
      {
        id: 'chutneys-curd-rice',
        reason: 'Temple-style tempered curd rice with pomegranate and mustard seeds — instant coolness!',
      },
      {
        id: 'concu-tiramisu',
        reason: 'Chilled, feather-light mascarpone cream and espresso dessert from Hyderabad’s finest patisserie.',
      },
      {
        id: 'chutneys-filter-coffee',
        reason: 'Traditional frothed brass-davarah filter coffee to lift your spirits.',
      },
      {
        id: 'chutneys-ghee-sponge-dosa',
        reason: 'Fluffy Babai hotel sponge dosa roasted in cow ghee with 7 refreshing chutneys.',
      },
      {
        id: 'niloufer-golden-chai-flask',
        reason: 'Rich golden chai flask to share with friends or colleagues in the AC lounge.',
      },
    ];
  } else if (w.includes('night') || resolvedTime === 'late_night') {
    weatherCondition = '🌙 Late Night / Midnight';
    timeContext = 'Midnight Cravings';
    headline = "🌙 Midnight Cravings: Hyderabad's Late Night Feast!";
    friendAdvice =
      "Midnight hunger hitting hard, dost? You know Hyderabad never sleeps! Whether it's a late-night single Biryani from Shah Ghouse, melt-in-mouth Mutton Luqmi, or warm Double Ka Meetha, your dost has got you sorted.";
    vibeTags = ['🌙 Midnight Munchies', '🍛 Midnight Biryani', '🍖 Nizami Luqmi', '🍯 Royal Meetha'];
    dishMap = [
      {
        id: 'shahghouse-special-chicken-biryani',
        reason: 'The undisputed late-night champion biryani of Tolichowki & Charminar.',
      },
      {
        id: 'paradise-single-chicken-biryani',
        reason: 'Perfect single portion of authentic dum biryani for your midnight cravings.',
      },
      {
        id: 'niloufer-mutton-luqmi',
        reason: 'Historic square flaky pastry parcels stuffed with spicy minced lamb.',
      },
      {
        id: 'pista-double-ka-meetha',
        reason: 'Golden fried bread soaked in saffron-infused milk and roasted dry fruits.',
      },
      {
        id: 'bawarchi-single-chicken-biryani',
        reason: 'RTC X Roads legendary single biryani — pocket-friendly midnight bliss.',
      },
    ];
  } else {
    // Breezy / Pleasant / Evening
    weatherCondition = '🍃 Pleasant Evening / Breezy';
    timeContext = '4 PM Chai & Nizami Bites';
    headline = '🍃 Pleasant Hyderabad Evening: 4 PM Chai & Nizami Bites!';
    friendAdvice =
      "Bhai, look at the weather — it is so pleasant! Perfect time to take a break from work. Grab a flask of Niloufer's golden chai with Osmania biscuits, or treat yourself to fiery Ghee Podi Idlis.";
    vibeTags = ['🍃 4 PM Chai Time', '🍪 Osmania Biscuits', '☕ Niloufer Chai', '🧈 Bun Maska'];
    dishMap = [
      {
        id: 'niloufer-special-mawa-chai',
        reason: "Hyderabad's most celebrated chai to recharge your entire evening.",
      },
      {
        id: 'niloufer-osmania-biscuits',
        reason: 'Melt-in-mouth sweet-and-salty Osmania biscuits dipped straight into hot chai.',
      },
      {
        id: 'niloufer-bun-maska-amul',
        reason: 'Warm soft bakery bun loaded with Amul butter — pure comfort food.',
      },
      {
        id: 'chutneys-ghee-podi-idli',
        reason: 'Steamed mini idlis tossed in fiery gunpowder karam podi and pure cow ghee.',
      },
      {
        id: 'paradise-mutton-galouti-kebab',
        reason: 'Royal melt-in-mouth Lucknowi & Nizami mutton kebabs slow-grilled on dum.',
      },
    ];
  }

  if (userHistory?.pastOrders && userHistory.pastOrders.length > 0) {
    const lastDish = userHistory.pastOrders[0];
    friendAdvice += ` (Also noticed you loved ${lastDish} recently — I made sure these recommendations match your taste!)`;
  }

  const suggestedDishes: FoodieFriendDish[] = [];
  for (const itemMap of dishMap) {
    for (const rest of RESTAURANTS) {
      let foundDish = null;
      for (const cat of rest.menuCategories) {
        const d = cat.items.find(it => it.id === itemMap.id);
        if (d) {
          foundDish = d;
          break;
        }
      }
      if (foundDish) {
        const adjustedRest = getAdjustedRestaurant(rest, localityId);
        suggestedDishes.push({
          dish: foundDish,
          restaurantId: rest.id,
          restaurantName: rest.name,
          localityName: rest.localityName,
          deliveryTimeMinutes: adjustedRest.deliveryTimeMinutes,
          price: foundDish.price,
          friendReason: itemMap.reason,
        });
        break;
      }
    }
  }

  return {
    success: true,
    source: 'local-foodie-friend-fallback',
    headline,
    weatherCondition,
    timeContext,
    friendAdvice,
    vibeTags,
    suggestedDishes,
  };
}

// POST /ai/friend-suggest endpoint
apiRouter.post('/ai/friend-suggest', async (req, res) => {
  const { localityId = 'jubilee-hills', weather = 'rainy', timeOfDay = 'auto', userHistory } = req.body;

  const targetLocality = LOCALITIES.find(l => l.id === localityId) || LOCALITIES[0];
  const apiKey = process.env.GEMINI_API_KEY;

  if (apiKey) {
    try {
      const ai = new GoogleGenAI({ apiKey });

      // Compact list of dishes across restaurants for Gemini to choose from
      const candidateList = RESTAURANTS.slice(0, 6).flatMap(r =>
        r.menuCategories.flatMap(c =>
          c.items.slice(0, 5).map(it => ({
            id: it.id,
            name: it.name,
            price: it.price,
            isVeg: it.isVeg,
            restaurant: r.name,
          }))
        )
      );

      const prompt = `You are the ultimate "Hyderabadi Foodie Dost" (a warm, witty, food-loving local friend in Hyderabad on Zomato).
A user cannot decide what to eat right now. As their best Hyderabadi friend ("dost"), suggest what they should eat at this exact moment!

Context:
- Weather: "${weather}" (e.g. if rainy, people in Hyderabad crave piping hot Irani Chai & crispy Mirchi Bajji / Keema Samosas / hot Dum Biryani; if sunny, cooling curd rice, badam milk, iced treats; if late night, midnight biryani, luqmi, double ka meetha)
- Time of Day: "${timeOfDay}"
- Customer Locality: "${targetLocality.name}"
- User's Past Orders: ${JSON.stringify(userHistory?.pastOrders || ['Chicken Dum Biryani'])}

Available Curated Menu Items in Hyderabad Database:
${JSON.stringify(candidateList, null, 1)}

Persona & Tone:
- Talk like an authentic, caring Hyderabadi friend ("Arrey dost", "Ustaad", "Dekho...", "Khao dil khol ke", "Trust your dost").
- Pick 4-6 matching dishes from the provided list that suit the weather and time.
- For each picked dish, write a witty, warm 1-sentence friend reason explaining why they MUST have it right now.
- Return ONLY valid JSON with this schema:
{
  "headline": "string (e.g. 🌧️ Hyderabad Monsoon Special: Chai & Mirchi Bajji Weather!)",
  "weatherCondition": "string (e.g. 🌧️ Monsoon Drizzle)",
  "timeContext": "string (e.g. Evening Chai & Snacks)",
  "friendAdvice": "string (2-3 warm, persuasive buddy sentences)",
  "vibeTags": ["tag1", "tag2", "tag3"],
  "recommendations": [
    {
      "dishId": "string (must match an id from the provided items)",
      "friendReason": "string (1 personal buddy reason)"
    }
  ]
}`;

      let responseText: string | null = null;
      let modelUsed: 'gemini-3.8-flash' | 'local-foodie-friend-fallback' = 'gemini-3.8-flash';

      try {
        const response = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
          },
        });
        if (response.text) {
          responseText = response.text;
        }
      } catch (err38) {
        console.warn('gemini-3.8-flash busy for friend-suggest, trying gemini-3.6-flash:', err38);
        try {
          const response = await ai.models.generateContent({
            model: 'gemini-3.6-flash',
            contents: prompt,
            config: {
              responseMimeType: 'application/json',
            },
          });
          if (response.text) {
            responseText = response.text;
          }
        } catch (err36) {
          console.warn('Gemini 3.6 Flash also failed for friend-suggest, falling back to local dost:', err36);
        }
      }

      if (responseText) {
        const parsed = JSON.parse(responseText);
        const rawRecs: { dishId: string; friendReason: string }[] = Array.isArray(parsed.recommendations)
          ? parsed.recommendations
          : [];

        const suggestedDishes: FoodieFriendDish[] = [];
        for (const rec of rawRecs) {
          for (const rest of RESTAURANTS) {
            let found = null;
            for (const cat of rest.menuCategories) {
              const d = cat.items.find(it => it.id === rec.dishId);
              if (d) {
                found = d;
                break;
              }
            }
            if (found) {
              const adjustedRest = getAdjustedRestaurant(rest, localityId);
              suggestedDishes.push({
                dish: found,
                restaurantId: rest.id,
                restaurantName: rest.name,
                localityName: rest.localityName,
                deliveryTimeMinutes: adjustedRest.deliveryTimeMinutes,
                price: found.price,
                friendReason: rec.friendReason || 'Authentic Hyderabadi delicacy recommended by your dost!',
              });
              break;
            }
          }
        }

        if (suggestedDishes.length >= 2) {
          const responseData: FoodieFriendResponse = {
            success: true,
            source: modelUsed,
            headline: parsed.headline || '🤖 Your Foodie Dost Suggests:',
            weatherCondition: parsed.weatherCondition || (weather === 'rainy' ? '🌧️ Monsoon Drizzle' : '🍃 Pleasant Vibe'),
            timeContext: parsed.timeContext || 'Special Recommendation',
            friendAdvice: parsed.friendAdvice || 'Dekho dost, life is too short to stay hungry. Enjoy these delicious bites!',
            vibeTags: Array.isArray(parsed.vibeTags) ? parsed.vibeTags.slice(0, 4) : ['🍛 Hyderabadi Cravings'],
            suggestedDishes,
          };
          return res.json(responseData);
        }
      }
    } catch (err) {
      console.warn('Gemini friend-suggest failed, using local parser:', err);
    }
  }

  // Fallback to local foodie friend
  const fallbackData = localFoodieFriendParse({ localityId, weather, timeOfDay, userHistory });
  return res.json(fallbackData);
});


// Health check endpoint
apiRouter.get('/health', (req, res) => {
  res.json({
    success: true,
    status: 'ok',
    service: 'Zomato Hyderabad API',
    timestamp: new Date().toISOString(),
    isVercel: !!process.env.VERCEL,
  });
});

// Mount apiRouter on /api
app.use('/api', apiRouter);

// Also route requests matching known API routes directly if stripped by serverless rewrites
app.use((req, res, next) => {
  const apiPaths = ['/localities', '/restaurants', '/coupons', '/cart', '/orders', '/ai', '/health'];
  if (apiPaths.some(p => req.path.startsWith(p))) {
    return apiRouter(req, res, next);
  }
  next();
});

// Export app and server for Vercel serverless functions and testing
export { app, server, apiRouter };
export default app;

// ================= FRONTEND / VITE INTEGRATION =================

async function startServer() {
  if (!isProduction) {
    // Development mode: Vite middleware
    console.log('[Dev] Starting Vite development server middleware...');
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: { server },
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Production mode: Serve pre-built static client files
    console.log('[Prod] Serving production static files...');
    const clientDist = fs.existsSync(path.resolve(rootDir, 'dist', 'index.html'))
      ? path.resolve(rootDir, 'dist')
      : fs.existsSync(path.resolve(rootDir, 'dist', 'client', 'index.html'))
      ? path.resolve(rootDir, 'dist', 'client')
      : path.resolve(rootDir, 'dist');

    app.use(express.static(clientDist));
    app.get('*', (req, res, next) => {
      if (req.path.startsWith('/api')) {
        return next();
      }
      const indexPath = path.resolve(clientDist, 'index.html');
      if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
      } else {
        res.status(404).send('index.html not found. Please build the client using "npm run build".');
      }
    });
  }

  server.listen(PORT, () => {
    console.log(`\n======================================================`);
    console.log(`🚀 Zomato Hyderabad Web Application is Live!`);
    console.log(`📍 Default Locality: Jubilee Hills, Road No. 36`);
    console.log(`🌐 URL: http://localhost:${PORT}`);
    console.log(`⚡ Mode: ${isProduction ? 'Production' : 'Development'}`);
    console.log(`======================================================\n`);
  });
}

// Only start standalone HTTP server if not in Vercel serverless environment
if (!process.env.VERCEL) {
  startServer().catch(err => {
    console.error('Failed to start server:', err);
    process.exit(1);
  });
}
