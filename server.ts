import express from 'express';
import http from 'http';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { GoogleGenAI } from '@google/genai';
import { LOCALITIES, RESTAURANTS, COUPONS } from './src/data/hyderabadData';
import { Order, CartItem, AIParsedQuery, AIMatchedDish, AISearchResponse } from './src/types';

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

  if (q.includes('chai') || q.includes('tea') || q.includes('bun maska') || q.includes('irani') || q.includes('osmania') || q.includes('biscuit') || q.includes('samosa') || q.includes('tie biscuit')) {
    cuisines.push('Irani Chai', 'Bakery');
    if (q.includes('chai') || q.includes('tea') || q.includes('irani')) dishKeywords.push('irani chai', 'chai');
    if (q.includes('osmania')) dishKeywords.push('osmania biscuits');
    if (q.includes('bun maska') || q.includes('maska')) dishKeywords.push('bun maska with amul butter');
    if (q.includes('samosa') || q.includes('keema')) dishKeywords.push('keema samosas');
    if (q.includes('tie')) dishKeywords.push('tie biscuits');
    suggestedTags.push('Chai Time', 'Hyderabad Heritage');
  }

  if (q.includes('biryani') || q.includes('dum biryani') || q.includes('pulao') || q.includes('65')) {
    cuisines.push('Biryani', 'Mughlai');
    if (q.includes('mutton')) dishKeywords.push('mutton biryani');
    if (q.includes('chicken')) dishKeywords.push('chicken biryani');
    if (q.includes('65')) dishKeywords.push('chicken 65');
    if (!dishKeywords.some(k => k.includes('biryani'))) dishKeywords.push('biryani');
    suggestedTags.push('Dum Biryani', 'Hyderabadi Special');
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

Extract the following:
- "intent": string summary
- "maxPrice": number or null (e.g. 250)
- "cuisines": array of matched cuisines
- "dishKeywords": array of food items
- "dietary": "veg" | "non-veg" | null
- "moodOrContext": string
- "aiExplanation": clear explanation sentence
- "suggestedTags": badges like ["Under ₹250", "Light Bites"]

User Query: "${query}"`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
        },
      });

      if (response.text) {
        aiParsed = JSON.parse(response.text);
        source = 'gemini-3.8-flash';
      } else {
        aiParsed = localNlpParse(query);
      }
    } catch (err) {
      console.warn('Gemini 3.8 Flash call failed, falling back to local NLP parser:', err);
      aiParsed = localNlpParse(query);
    }
  } else {
    aiParsed = localNlpParse(query);
  }

  // Target customer locality for distance/ETA calculation
  const targetLoc = LOCALITIES.find(l => l.id === localityId) || LOCALITIES[0];

  // Match and rank dishes from RESTAURANTS across Hyderabad
  const matchedDishes: AIMatchedDish[] = [];

  for (const rest of RESTAURANTS) {
    // Distance & ETA for this restaurant relative to target locality
    const adjustedRest = getAdjustedRestaurant(rest, localityId);

    for (const cat of rest.menuCategories) {
      for (const item of cat.items) {
        // Filter by maxPrice
        if (aiParsed.maxPrice !== null && item.price > aiParsed.maxPrice) {
          continue;
        }

        // Filter by dietary preference
        if (aiParsed.dietary === 'veg' && !item.isVeg) {
          continue;
        }
        if (aiParsed.dietary === 'non-veg' && item.isVeg && aiParsed.dishKeywords.some(k => ['chicken', 'mutton', 'meat', 'keema', 'boti', 'haleem'].some(m => k.includes(m)))) {
          continue;
        }

        // Calculate relevance match score
        let matchScore = 0;
        const matchTags: string[] = [];
        const itemName = item.name.toLowerCase();
        const itemDesc = item.description.toLowerCase();
        const catName = cat.name.toLowerCase();

        // Check dish keyword matches
        let keywordHit = false;
        if (aiParsed.dishKeywords && aiParsed.dishKeywords.length > 0) {
          for (const kw of aiParsed.dishKeywords) {
            const kwLower = kw.toLowerCase();
            if (itemName.includes(kwLower)) {
              matchScore += 25;
              keywordHit = true;
              matchTags.push('Direct Match');
            } else if (itemDesc.includes(kwLower) || catName.includes(kwLower)) {
              matchScore += 12;
              keywordHit = true;
            }
          }
        }

        // Check cuisine matches
        if (aiParsed.cuisines && aiParsed.cuisines.length > 0) {
          for (const c of aiParsed.cuisines) {
            if (rest.cuisines.some(rc => rc.toLowerCase().includes(c.toLowerCase()))) {
              matchScore += 10;
              if (!matchTags.includes(c)) matchTags.push(c);
            }
          }
        }

        // If user didn't mention specific dishes but mentioned budget/light, include dishes under budget
        if (!keywordHit && aiParsed.dishKeywords.length === 0 && aiParsed.maxPrice) {
          matchScore += 15;
        }

        // If no match at all and user had specific keywords, skip
        if (aiParsed.dishKeywords.length > 0 && !keywordHit && matchScore < 10) {
          continue;
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
