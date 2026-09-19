export interface Locality {
  id: string;
  name: string;
  area: string;
  address: string;
  estimatedDeliveryMinutes: number;
  distanceKm: number;
  deliveryFee: number;
  tagline: string;
  coordinates?: { lat: number; lng: number };
}

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  isVeg: boolean;
  isBestseller?: boolean;
  isSpicy?: boolean;
  category: string;
  rating?: number;
  votes?: number;
  imageUrl: string;
  tags?: string[];
}

export interface MenuCategory {
  name: string;
  items: MenuItem[];
}

export interface Restaurant {
  id: string;
  name: string;
  tagline: string;
  localityId: string;
  localityName: string;
  cuisines: string[];
  rating: number;
  ratingCount: string;
  deliveryTimeMinutes: number;
  distanceKm: number;
  costForTwo: number;
  heroImage: string;
  isGoldPartner?: boolean;
  discountOffer?: string;
  diningOffer?: string;
  nightlifeOffer?: string;
  isPureVeg?: boolean;
  isHalal?: boolean;
  tabTypes: ('delivery' | 'dining' | 'nightlife')[];
  address: string;
  openingHours: string;
  menuCategories: MenuCategory[];
  coordinates?: { lat: number; lng: number };
}

export interface CartItem {
  item: MenuItem;
  restaurantId: string;
  restaurantName: string;
  quantity: number;
}

export interface Coupon {
  code: string;
  discountPercent: number;
  maxDiscount: number;
  minOrder: number;
  description: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  createdAt: string;
  restaurantId: string;
  restaurantName: string;
  items: CartItem[];
  subtotal: number;
  deliveryFee: number;
  discount: number;
  taxes: number;
  platformFee: number;
  total: number;
  status: 'placed' | 'preparing' | 'valet_assigned' | 'out_for_delivery' | 'arrived';
  statusText: string;
  deliveryAddress: string;
  localityName: string;
  estimatedDeliveryTime: string;
  restaurantCoordinates: { lat: number; lng: number };
  deliveryCoordinates: { lat: number; lng: number };
  deliveryPartner: {
    name: string;
    phone: string;
    vehicle?: string;
    vehicleNumber?: string;
    rating: number;
    photo: string;
  };
}

export interface AIParsedQuery {
  intent: string;
  maxPrice: number | null;
  cuisines: string[];
  dishKeywords: string[];
  dietary: 'veg' | 'non-veg' | null;
  moodOrContext: string;
  aiExplanation: string;
  suggestedTags: string[];
}

export interface AIMatchedDish {
  dish: MenuItem;
  restaurantId: string;
  restaurantName: string;
  localityId: string;
  localityName: string;
  deliveryTimeMinutes: number;
  distanceKm: number;
  matchScore: number;
  matchTags: string[];
}

export interface AISearchResponse {
  success: boolean;
  source: 'gemini-3.8-flash' | 'local-nlp-fallback';
  aiParsed: AIParsedQuery;
  matchedDishes: AIMatchedDish[];
}

export interface FoodieFriendDish {
  dish: MenuItem;
  restaurantId: string;
  restaurantName: string;
  localityName: string;
  deliveryTimeMinutes: number;
  price: number;
  friendReason: string;
}

export interface FoodieFriendResponse {
  success: boolean;
  source: 'gemini-3.8-flash' | 'local-foodie-friend-fallback';
  headline: string;
  weatherCondition: string;
  timeContext: string;
  friendAdvice: string;
  vibeTags: string[];
  suggestedDishes: FoodieFriendDish[];
}


