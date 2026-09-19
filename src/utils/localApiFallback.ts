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
  const isBiryaniRequested = /biry?a[nm]i?|briyani/i.test(q) || 
    (aiParsed.dishKeywords && aiParsed.dishKeywords.some(k => /biry?a[nm]i?|briyani/i.test(k)));
  const isChickenRequested = q.includes('chicken') || q.includes('murgh') ||
    (aiParsed.dishKeywords && aiParsed.dishKeywords.some(k => k.includes('chicken') || k.includes('murgh')));
  const isMuttonRequested = q.includes('mutton') || q.includes('gosht') || q.includes('lamb') ||
    (aiParsed.dishKeywords && aiParsed.dishKeywords.some(k => k.includes('mutton') || k.includes('gosht')));

  for (const rest of RESTAURANTS) {
    const adjustedRest = getAdjustedRestaurantClient(rest, localityId);

    for (const cat of rest.menuCategories) {
      for (const item of cat.items) {
        const itemName = item.name.toLowerCase();
        const itemDesc = item.description.toLowerCase();
        const catName = cat.name.toLowerCase();

        // 1. Max price filter
        if (aiParsed.maxPrice !== null && item.price > aiParsed.maxPrice) {
          continue;
        }

        // 2. Dietary preference filter
        if (aiParsed.dietary === 'veg' && !item.isVeg) {
          continue;
        }
        if (aiParsed.dietary === 'non-veg' && item.isVeg && isChickenRequested) {
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
          continue;
        }
        if (isMuttonRequested && isDishChicken && !isDishMutton) {
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

        if (item.isBestseller) {
          matchScore += 5;
          matchTags.push('Bestseller');
        }

        if (item.rating && item.rating >= 4.8) {
          matchScore += 5;
        }

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
