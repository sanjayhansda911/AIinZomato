import { LOCALITIES, RESTAURANTS, COUPONS } from '../data/hyderabadData';
import { Order, CartItem, AIParsedQuery, AIMatchedDish, AISearchResponse, Restaurant } from '../types';

export function getAdjustedRestaurantClient(restaurant: Restaurant, targetLocalityId?: string): Restaurant {
  if (!targetLocalityId) return restaurant;
  const targetLoc = LOCALITIES.find(l => l.id === targetLocalityId) || LOCALITIES[0];
  const originLoc = LOCALITIES.find(l => l.id === restaurant.localityId) || LOCALITIES[0];

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

export function clientNlpSearch(query: string, localityId: string = 'jubilee-hills'): AISearchResponse {
  const q = query.toLowerCase();

  let maxPrice: number | null = null;
  const priceMatch = q.match(/(?:under|below|less than|within|max|around|under\s*rs\.?|under\s*₹)\s*(\d+)/i)
    || q.match(/(\d+)\s*(?:rs|rupees|inr|bucks)/i);
  if (priceMatch) {
    maxPrice = parseInt(priceMatch[1], 10);
  }

  let dietary: 'veg' | 'non-veg' | null = null;
  if (q.includes('non-veg') || q.includes('nonveg') || q.includes('chicken') || q.includes('mutton') || q.includes('keema') || q.includes('haleem') || q.includes('meat') || q.includes('gosht') || q.includes('boti')) {
    dietary = 'non-veg';
  } else if (q.includes('pure veg') || q.includes('veg only') || q.includes('vegetarian') || q.includes('pure-veg') || q.includes('veg')) {
    dietary = 'veg';
  }

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

  if (q.includes('beer') || q.includes('brew') || q.includes('craft') || q.includes('lager') || q.includes('ale') || q.includes('ipa') || q.includes('stout')) {
    cuisines.push('Craft Beer', 'Microbrewery');
    suggestedTags.push('Craft Brews', 'Nightlife');
  }

  if (q.includes('light') || q.includes('bites') || q.includes('snack')) {
    suggestedTags.push('Light Bites');
  }

  if (maxPrice) {
    suggestedTags.unshift(`Under ₹${maxPrice}`);
  }

  let moodOrContext = 'Casual dining / craving';
  if (q.includes('light') || q.includes('snack')) moodOrContext = 'Light snacking & quick refreshment';
  else if (q.includes('dinner') || q.includes('lunch') || q.includes('meal')) moodOrContext = 'Satisfying hearty meal';
  else if (q.includes('morning') || q.includes('breakfast')) moodOrContext = 'Authentic morning breakfast';
  else if (q.includes('late night') || q.includes('midnight')) moodOrContext = 'Midnight hunger fix';
  else if (q.includes('sweet') || q.includes('dessert')) moodOrContext = 'Sweet dessert celebration';

  const intent = `Looking for ${dishKeywords.length ? dishKeywords.join(', ') : 'Hyderabad specialties'} ${dietary ? `(${dietary})` : ''} ${maxPrice ? `under ₹${maxPrice}` : ''}`.trim();

  let aiExplanation = 'Curated top-rated dishes in Hyderabad based on your request.';
  if (dishKeywords.length && maxPrice) {
    aiExplanation = `Found authentic ${dishKeywords.join(' and ')} from iconic spots like Cafe Niloufer, Nimrah, or Chutneys within ₹${maxPrice}.`;
  } else if (maxPrice) {
    aiExplanation = `Curated delicious authentic bites and meals under your budget of ₹${maxPrice}.`;
  } else if (dishKeywords.length) {
    aiExplanation = `Recommended authentic ${dishKeywords.join(' and ')} from legendary Hyderabad kitchens.`;
  }

  const aiParsed: AIParsedQuery = {
    intent,
    maxPrice,
    cuisines: Array.from(new Set(cuisines)),
    dishKeywords: Array.from(new Set(dishKeywords)),
    dietary,
    moodOrContext,
    aiExplanation,
    suggestedTags: Array.from(new Set(suggestedTags)).slice(0, 4),
  };

  const matchedDishes: AIMatchedDish[] = [];

  for (const rest of RESTAURANTS) {
    const adjustedRest = getAdjustedRestaurantClient(rest, localityId);

    for (const cat of rest.menuCategories) {
      for (const item of cat.items) {
        if (aiParsed.maxPrice !== null && item.price > aiParsed.maxPrice) {
          continue;
        }

        if (aiParsed.dietary === 'veg' && !item.isVeg) {
          continue;
        }
        if (aiParsed.dietary === 'non-veg' && item.isVeg && aiParsed.dishKeywords.some(k => ['chicken', 'mutton', 'meat', 'keema', 'boti', 'haleem'].some(m => k.includes(m)))) {
          continue;
        }

        let matchScore = 0;
        const matchTags: string[] = [];
        const itemName = item.name.toLowerCase();
        const itemDesc = item.description.toLowerCase();
        const catName = cat.name.toLowerCase();

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
              matchTags.push('Keyword Hit');
            }
          }
        }

        if (aiParsed.cuisines && aiParsed.cuisines.length > 0) {
          for (const c of aiParsed.cuisines) {
            if (rest.cuisines.some(rc => rc.toLowerCase().includes(c.toLowerCase()))) {
              matchScore += 8;
              break;
            }
          }
        }

        if (aiParsed.dietary === 'veg' && item.isVeg) {
          matchScore += 4;
        }

        if (item.isBestseller) {
          matchScore += 5;
          matchTags.push('Bestseller');
        }

        if (item.rating && item.rating >= 4.8) {
          matchScore += 4;
          matchTags.push('Top Rated');
        }

        if (keywordHit || matchScore >= 12) {
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
  }

  matchedDishes.sort((a, b) => {
    if (b.matchScore !== a.matchScore) {
      return b.matchScore - a.matchScore;
    }
    return a.dish.price - b.dish.price;
  });

  return {
    success: true,
    source: 'local-nlp-fallback',
    aiParsed,
    matchedDishes: matchedDishes.slice(0, 10),
  };
}

export function createClientOrder(params: {
  items: CartItem[];
  localityId: string;
  addressNote?: string;
  appliedCoupon?: string | null;
}): Order {
  const { items, localityId, addressNote, appliedCoupon } = params;
  const targetLocality = LOCALITIES.find(l => l.id === localityId) || LOCALITIES[0];
  const firstRestaurant = RESTAURANTS.find(r => r.id === items[0]?.restaurantId) || RESTAURANTS[0];

  const subtotal = items.reduce((sum, it) => sum + it.item.price * it.quantity, 0);

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
  const total = Math.max(0, subtotal + deliveryFee + platformFee + taxes - discount);

  const orderId = `ORD-${Date.now().toString().slice(-6)}`;
  const restaurantCoords = firstRestaurant.coordinates || { lat: 17.4087, lng: 78.4982 };
  const deliveryCoords = targetLocality.coordinates || { lat: 17.4319, lng: 78.4073 };

  return {
    id: orderId,
    orderNumber: `#HYD-${Math.floor(100000 + Math.random() * 900000)}`,
    createdAt: new Date().toISOString(),
    restaurantId: firstRestaurant.id,
    restaurantName: firstRestaurant.name,
    items,
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
}
