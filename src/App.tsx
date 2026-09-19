import React, { useState, useEffect } from 'react';
import { PhoneFrame } from './components/PhoneFrame';
import { Header } from './components/Header';
import { BottomNav } from './components/BottomNav';
import { DeliveryTab } from './components/DeliveryTab';
import { DiningOutTab } from './components/DiningOutTab';
import { NightlifeTab } from './components/NightlifeTab';
import { RestaurantDetailModal } from './components/RestaurantDetailModal';
import { CartDrawer } from './components/CartDrawer';
import { OrderTrackingModal } from './components/OrderTrackingModal';
import { VoiceSearchModal } from './components/VoiceSearchModal';
import { AISearchBanner } from './components/AISearchBanner';
import { CartConflictModal } from './components/CartConflictModal';
import { InstallAppBanner } from './components/InstallAppBanner';
import { LOCALITIES, RESTAURANTS, COUPONS } from './data/hyderabadData';
import { Locality, Restaurant, MenuItem, CartItem, Coupon, Order, AISearchResponse } from './types';

export const App: React.FC = () => {
  const [isFullScreen, setIsFullScreen] = useState<boolean>(false);
  const [localities, setLocalities] = useState<Locality[]>(LOCALITIES);
  // Default Location is explicitly Jubilee Hills, Road No. 36, Hyderabad as required
  const [selectedLocality, setSelectedLocality] = useState<Locality>(
    LOCALITIES.find(l => l.id === 'jubilee-hills') || LOCALITIES[0]
  );
  const [activeTab, setActiveTab] = useState<'delivery' | 'dining' | 'nightlife' | 'cart'>('delivery');
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loadingRestaurants, setLoadingRestaurants] = useState<boolean>(true);
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);

  // Cart & Offers state
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>(COUPONS);
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>('HYD50');
  const [activeOrder, setActiveOrder] = useState<Order | null>(null);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isVegOnly, setIsVegOnly] = useState<boolean>(false);
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [selectedCuisine, setSelectedCuisine] = useState<string | null>(null);

  // AI Voice & Natural Language Search state
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState<boolean>(false);
  const [aiSearchResult, setAiSearchResult] = useState<AISearchResponse | null>(null);
  const [isAiSearching, setIsAiSearching] = useState<boolean>(false);

  // Fetch localities from API
  useEffect(() => {
    fetch('/api/localities')
      .then(res => res.json())
      .then(json => {
        if (json.success && json.data) {
          setLocalities(json.data);
          const defaultLoc = json.data.find((l: Locality) => l.id === 'jubilee-hills') || json.data[0];
          setSelectedLocality(defaultLoc);
        }
      })
      .catch(err => {
        console.warn('Using local fallback for localities:', err);
      });
  }, []);

  // Fetch coupons from API
  useEffect(() => {
    fetch('/api/coupons')
      .then(res => res.json())
      .then(json => {
        if (json.success && json.data) {
          setCoupons(json.data);
        }
      })
      .catch(err => console.warn('Using local fallback for coupons:', err));
  }, []);

  // Fetch restaurants whenever locality, tab, or search/filters change
  useEffect(() => {
    setLoadingRestaurants(true);
    const params = new URLSearchParams();
    if (activeTab !== 'cart') {
      params.append('tab', activeTab);
    }
    params.append('locality', selectedLocality.id);
    if (searchQuery) params.append('search', searchQuery);
    if (isVegOnly) params.append('vegOnly', 'true');
    if (selectedCuisine) params.append('cuisine', selectedCuisine);
    if (activeFilter === 'rating') params.append('minRating', '4.5');

    fetch(`/api/restaurants?${params.toString()}`)
      .then(res => res.json())
      .then(json => {
        if (json.success && json.data) {
          let list: Restaurant[] = json.data;
          if (activeFilter === 'fast') {
            list = list.filter(r => r.deliveryTimeMinutes <= 28);
          } else if (activeFilter === 'offers') {
            list = list.filter(r => !!r.discountOffer || !!r.diningOffer || !!r.nightlifeOffer);
          } else if (activeFilter === 'gold') {
            list = list.filter(r => r.isGoldPartner);
          }
          setRestaurants(list);
        } else {
          setRestaurants(RESTAURANTS);
        }
      })
      .catch(err => {
        console.warn('API error, falling back to local dataset:', err);
        setRestaurants(RESTAURANTS);
      })
      .finally(() => {
        setLoadingRestaurants(false);
      });
  }, [selectedLocality, activeTab, searchQuery, isVegOnly, activeFilter, selectedCuisine]);

  // Sync cart with backend API
  const syncCartWithApi = (items: CartItem[], couponCode: string | null) => {
    fetch('/api/cart/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        items,
        localityId: selectedLocality.id,
        appliedCoupon: couponCode,
      }),
    }).catch(err => console.warn('Could not sync cart with API:', err));
  };

  // Single-restaurant cart conflict state
  const [pendingConflict, setPendingConflict] = useState<{
    existingRestaurantName: string;
    newItem: MenuItem;
    newRestaurant: Restaurant;
  } | null>(null);

  // Cart operations
  const handleAddToCart = (item: MenuItem, restaurant: Restaurant) => {
    // Enforce single-restaurant cart validation
    if (cartItems.length > 0 && cartItems[0].restaurantId !== restaurant.id) {
      setPendingConflict({
        existingRestaurantName: cartItems[0].restaurantName,
        newItem: item,
        newRestaurant: restaurant,
      });
      return;
    }

    setCartItems(prev => {
      const existing = prev.find(ci => ci.item.id === item.id);
      let updated: CartItem[];
      if (existing) {
        updated = prev.map(ci =>
          ci.item.id === item.id ? { ...ci, quantity: ci.quantity + 1 } : ci
        );
      } else {
        updated = [
          ...prev,
          {
            item,
            restaurantId: restaurant.id,
            restaurantName: restaurant.name,
            quantity: 1,
          },
        ];
      }
      syncCartWithApi(updated, appliedCoupon);
      return updated;
    });
  };

  const handleConfirmDiscardAndAdd = () => {
    if (!pendingConflict) return;
    const { newItem, newRestaurant } = pendingConflict;
    const newCart: CartItem[] = [
      {
        item: newItem,
        restaurantId: newRestaurant.id,
        restaurantName: newRestaurant.name,
        quantity: 1,
      },
    ];
    setCartItems(newCart);
    syncCartWithApi(newCart, appliedCoupon);
    setPendingConflict(null);
  };

  const handleUpdateQuantity = (itemId: string, newQty: number) => {
    setCartItems(prev => {
      let updated: CartItem[];
      if (newQty <= 0) {
        updated = prev.filter(ci => ci.item.id !== itemId);
      } else {
        updated = prev.map(ci =>
          ci.item.id === itemId ? { ...ci, quantity: newQty } : ci
        );
      }
      syncCartWithApi(updated, appliedCoupon);
      return updated;
    });
  };

  const handleApplyCoupon = (code: string | null) => {
    setAppliedCoupon(code);
    syncCartWithApi(cartItems, code);
  };

  const handlePlaceOrder = async (notes: string) => {
    const res = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        items: cartItems,
        localityId: selectedLocality.id,
        addressNote: notes,
        appliedCoupon,
      }),
    });
    const json = await res.json();
    if (json.success && json.data) {
      setActiveOrder(json.data);
      setCartItems([]);
      setActiveTab('delivery');
    } else {
      alert(json.message || 'Failed to place order');
    }
  };

  const handlePerformAISearch = async (queryText: string) => {
    if (!queryText.trim()) return;
    setSearchQuery(queryText);
    setIsAiSearching(true);
    setActiveTab('delivery');
    try {
      const res = await fetch('/api/ai/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: queryText,
          localityId: selectedLocality.id,
        }),
      });
      const json: AISearchResponse = await res.json();
      if (json.success) {
        setAiSearchResult(json);
      }
    } catch (err) {
      console.error('AI search request failed:', err);
    } finally {
      setIsAiSearching(false);
    }
  };

  const handleAddDishFromAI = (dish: MenuItem, restaurantId: string, restaurantName: string) => {
    const rest = RESTAURANTS.find(r => r.id === restaurantId) || ({
      id: restaurantId,
      name: restaurantName,
    } as Restaurant);
    handleAddToCart(dish, rest);
  };

  const handleSelectRestaurantById = (restaurantId: string) => {
    const found = RESTAURANTS.find(r => r.id === restaurantId);
    if (found) {
      setSelectedRestaurant(found);
    }
  };

  const cartSubtotal = cartItems.reduce((s, it) => s + it.item.price * it.quantity, 0);

  return (
    <PhoneFrame
      isFullScreen={isFullScreen}
      onToggleFullScreen={() => setIsFullScreen(!isFullScreen)}
    >
      {/* Header: Location, Search, Veg filter */}
      <Header
        localities={localities}
        selectedLocality={selectedLocality}
        onSelectLocality={loc => setSelectedLocality(loc)}
        searchQuery={searchQuery}
        onSearchChange={q => {
          setSearchQuery(q);
          if (!q) setAiSearchResult(null);
        }}
        isVegOnly={isVegOnly}
        onToggleVegOnly={() => setIsVegOnly(!isVegOnly)}
        onOpenVoiceSearch={() => setIsVoiceModalOpen(true)}
        onSubmitAISearch={handlePerformAISearch}
      />

      {/* Main Tab Views */}
      <div className="flex-1 bg-white relative overflow-y-auto no-scrollbar">
        {activeTab === 'delivery' && (
          <div>
            <InstallAppBanner />
            {aiSearchResult && (
              <AISearchBanner
                aiData={aiSearchResult}
                onClear={() => {
                  setAiSearchResult(null);
                  setSearchQuery('');
                }}
                cartItems={cartItems}
                onAddToCart={handleAddDishFromAI}
                onUpdateQuantity={handleUpdateQuantity}
                onSelectRestaurantById={handleSelectRestaurantById}
              />
            )}
            <DeliveryTab
              restaurants={restaurants}
              selectedLocality={selectedLocality}
              onSelectRestaurant={r => setSelectedRestaurant(r)}
              activeFilter={activeFilter}
              onFilterChange={f => setActiveFilter(f)}
              selectedCuisine={selectedCuisine}
              onSelectCuisine={c => setSelectedCuisine(c)}
            />
          </div>
        )}

        {activeTab === 'dining' && (
          <DiningOutTab
            restaurants={restaurants}
            selectedLocality={selectedLocality}
          />
        )}

        {activeTab === 'nightlife' && (
          <NightlifeTab
            restaurants={restaurants}
            selectedLocality={selectedLocality}
          />
        )}

        {activeTab === 'cart' && (
          <CartDrawer
            items={cartItems}
            locality={selectedLocality}
            coupons={coupons}
            appliedCoupon={appliedCoupon}
            onApplyCoupon={handleApplyCoupon}
            onUpdateQuantity={handleUpdateQuantity}
            onClose={() => setActiveTab('delivery')}
            onPlaceOrder={handlePlaceOrder}
          />
        )}
      </div>

      {/* Restaurant Detail Modal */}
      {selectedRestaurant && (
        <RestaurantDetailModal
          restaurant={selectedRestaurant}
          onClose={() => setSelectedRestaurant(null)}
          cartItems={cartItems}
          onAddToCart={handleAddToCart}
          onUpdateQuantity={handleUpdateQuantity}
          onOpenCart={() => {
            setSelectedRestaurant(null);
            setActiveTab('cart');
          }}
        />
      )}

      {/* Cart Conflict Modal (Single-Restaurant Validation) */}
      <CartConflictModal
        conflict={pendingConflict}
        onConfirmDiscard={handleConfirmDiscardAndAdd}
        onCancel={() => setPendingConflict(null)}
      />

      {/* Active Order Live Tracking Modal */}
      {activeOrder && (
        <OrderTrackingModal
          order={activeOrder}
          onClose={() => setActiveOrder(null)}
        />
      )}

      {/* Voice Search AI Modal */}
      <VoiceSearchModal
        isOpen={isVoiceModalOpen}
        onClose={() => setIsVoiceModalOpen(false)}
        onSelectQuery={handlePerformAISearch}
      />

      {/* Bottom Navigation Bar */}
      <BottomNav
        activeTab={activeTab}
        onSelectTab={tab => setActiveTab(tab)}
        cartItems={cartItems}
        cartTotal={cartSubtotal}
        onOpenCart={() => setActiveTab('cart')}
      />
    </PhoneFrame>
  );
};

export default App;
