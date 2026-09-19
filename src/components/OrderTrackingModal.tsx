import React, { useEffect, useState, useRef } from 'react';
import {
  CheckCircle2,
  Clock,
  Phone,
  MessageSquare,
  MapPin,
  Navigation,
  Compass,
  X,
  Sparkles,
  ShieldCheck,
  Plus,
  Minus,
  Maximize2
} from 'lucide-react';
import { Order } from '../types';

interface OrderTrackingModalProps {
  order: Order;
  onClose: () => void;
}

export const OrderTrackingModal: React.FC<OrderTrackingModalProps> = ({
  order,
  onClose,
}) => {
  // 5 Milestones:
  // 1: Order Placed
  // 2: Preparing in Kitchen
  // 3: Valet Assigned
  // 4: Out for Delivery
  // 5: Arrived
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [countdownSeconds, setCountdownSeconds] = useState<number>(1380); // ~23 mins
  const [mapZoom, setMapZoom] = useState<number>(1);
  const [isMapExpanded, setIsMapExpanded] = useState<boolean>(false);

  // Poll order updates from server
  useEffect(() => {
    const fetchOrderStatus = () => {
      fetch(`/api/orders/${order.id}`)
        .then(res => res.json())
        .then(json => {
          if (json.success && json.data) {
            const statusMap: Record<string, number> = {
              placed: 1,
              preparing: 2,
              valet_assigned: 3,
              out_for_delivery: 4,
              arrived: 5,
            };
            const step = statusMap[json.data.status] || 1;
            setCurrentStep(step);
          }
        })
        .catch(err => console.warn('Order polling error:', err));
    };

    fetchOrderStatus();
    const interval = setInterval(fetchOrderStatus, 3000);
    return () => clearInterval(interval);
  }, [order.id]);

  // Simulated countdown
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdownSeconds(prev => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatMinutes = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  // Calculate moving valet position on Hyderabad vector map
  // Milestone progression progress 0 -> 1
  const progressRatio =
    currentStep === 1
      ? 0.08
      : currentStep === 2
      ? 0.25
      : currentStep === 3
      ? 0.52
      : currentStep === 4
      ? 0.82
      : 1.0;

  // Coordinate interpolation
  const rLat = order.restaurantCoordinates?.lat || 17.4087;
  const rLng = order.restaurantCoordinates?.lng || 78.4982;
  const dLat = order.deliveryCoordinates?.lat || 17.4319;
  const dLng = order.deliveryCoordinates?.lng || 78.4073;

  const currentValetLat = (rLat + (dLat - rLat) * progressRatio).toFixed(4);
  const currentValetLng = (rLng + (dLng - rLng) * progressRatio).toFixed(4);

  // Map SVG coordinates (Origin: Restaurant 60, 240; Destination: Customer 320, 80)
  const bikeX = 60 + (320 - 60) * progressRatio;
  const bikeY = 240 + (80 - 240) * progressRatio - Math.sin(progressRatio * Math.PI) * 45;

  const partnerDisplayName = (order.deliveryPartner?.name || 'Ramesh K')
    .replace(/\s*-\s*Bajaj.*$/i, '')
    .trim();

  const milestones = [
    {
      step: 1,
      title: 'Order Placed',
      desc: 'Order confirmed and sent to kitchen',
      statusKey: 'placed',
    },
    {
      step: 2,
      title: 'Preparing in Kitchen',
      desc: `${order.restaurantName} is preparing your hot meal`,
      statusKey: 'preparing',
    },
    {
      step: 3,
      title: 'Delivery Partner Assigned',
      desc: `${partnerDisplayName} assigned and reached restaurant`,
      statusKey: 'valet_assigned',
    },
    {
      step: 4,
      title: 'Out for Delivery',
      desc: 'Delivery partner is on the way to your Hyderabad address',
      statusKey: 'out_for_delivery',
    },
    {
      step: 5,
      title: 'Arrived',
      desc: `Delivery partner arrived at ${order.localityName}. Enjoy your meal!`,
      statusKey: 'arrived',
    },
  ];

  return (
    <div className="absolute inset-0 z-50 bg-white flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-300">
      {/* Top Header */}
      <div className="bg-slate-950 text-white px-4 py-3 flex items-center justify-between border-b border-zinc-800 shadow-lg">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></div>
          <div>
            <span className="text-[10px] uppercase font-mono font-bold text-rose-400 tracking-wider">
              Live Order Tracking • Hyderabad
            </span>
            <h3 className="text-xs font-black tracking-tight">{order.orderNumber}</h3>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-7 h-7 rounded-full bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center text-slate-300 hover:text-white transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto no-scrollbar p-3.5 space-y-3.5 bg-zinc-50">
        
        {/* Estimated Arrival Time Card */}
        <div className="bg-gradient-to-r from-rose-600 via-rose-700 to-red-600 rounded-3xl p-4 text-white shadow-lg relative overflow-hidden">
          <div className="relative z-10 flex items-center justify-between">
            <div>
              <span className="inline-flex items-center gap-1 bg-white/20 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide">
                <Clock className="w-3 h-3" />
                Estimated Arrival
              </span>
              <div className="text-3xl font-black mt-1 tracking-tight">
                {currentStep === 5 ? 'Arrived!' : formatMinutes(countdownSeconds)}
              </div>
              <p className="text-[11px] text-rose-100 font-semibold mt-0.5 max-w-[220px]">
                {milestones[currentStep - 1]?.desc}
              </p>
            </div>

            <div className="text-right flex flex-col items-end">
              <span className="text-[10px] font-bold text-rose-200 uppercase">Live Delivery Speed</span>
              <span className="text-base font-black font-mono mt-0.5">
                {currentStep >= 4 ? '36 km/h' : currentStep >= 3 ? '18 km/h' : 'Stationary'}
              </span>
              <span className="text-[10px] text-rose-200 mt-1 font-mono">
                {currentStep === 5 ? '0 km remaining' : `${(2.8 * (1 - progressRatio)).toFixed(1)} km left`}
              </span>
            </div>
          </div>

          <div className="absolute -right-8 -bottom-8 w-28 h-28 rounded-full bg-white/10 blur-xl pointer-events-none"></div>
        </div>

        {/* Interactive Hyderabad Map Representation */}
        <div className="bg-slate-950 rounded-3xl overflow-hidden border border-zinc-800 shadow-xl relative">
          
          {/* Map Top Bar */}
          <div className="px-3.5 py-2 bg-slate-900/90 border-b border-zinc-800 flex items-center justify-between text-[11px] text-zinc-300">
            <div className="flex items-center gap-1.5 font-mono">
              <Compass className="w-3.5 h-3.5 text-rose-500 animate-spin" />
              <span>
                GPS: {currentValetLat}°N, {currentValetLng}°E
              </span>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setMapZoom(prev => Math.min(1.4, prev + 0.1))}
                className="w-5 h-5 rounded bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center text-white"
                title="Zoom In"
              >
                <Plus className="w-3 h-3" />
              </button>
              <button
                onClick={() => setMapZoom(prev => Math.max(0.8, prev - 0.1))}
                className="w-5 h-5 rounded bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center text-white"
                title="Zoom Out"
              >
                <Minus className="w-3 h-3" />
              </button>
            </div>
          </div>

          {/* Interactive Vector Map SVG */}
          <div
            className="relative w-full h-56 bg-slate-950 overflow-hidden select-none transition-transform duration-300"
            style={{ transform: `scale(${mapZoom})`, transformOrigin: 'center center' }}
          >
            <svg
              viewBox="0 0 380 280"
              className="w-full h-full"
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                {/* Background Grid Pattern */}
                <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                  <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#1E293B" strokeWidth="0.5" />
                </pattern>
                {/* Route Gradient */}
                <linearGradient id="routeGrad" x1="0%" y1="100%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#E23744" />
                  <stop offset="60%" stopColor="#FFB800" />
                  <stop offset="100%" stopColor="#10B981" />
                </linearGradient>
                {/* Pulse Filter */}
                <filter id="glow">
                  <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                  <feMerge>
                    <feMergeNode in="coloredBlur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              {/* Grid Background */}
              <rect width="380" height="280" fill="#090D16" />
              <rect width="380" height="280" fill="url(#grid)" opacity="0.8" />

              {/* Landmark 1: Hussain Sagar Lake (Center Water Body) */}
              <path
                d="M 170 140 C 190 120, 230 130, 240 160 C 245 180, 210 200, 180 190 C 155 180, 155 155, 170 140 Z"
                fill="#0F2847"
                stroke="#1E40AF"
                strokeWidth="1"
              />
              <text x="180" y="165" fill="#60A5FA" fontSize="8" fontWeight="bold" opacity="0.8">
                Hussain Sagar
              </text>

              {/* Landmark 2: KBR Park (Jubilee Hills Green Zone) */}
              <ellipse cx="290" cy="90" rx="30" ry="22" fill="#064E3B" stroke="#059669" strokeWidth="0.8" opacity="0.7" />
              <text x="270" y="93" fill="#34D399" fontSize="7" fontWeight="bold" opacity="0.9">
                KBR Park
              </text>

              {/* Hyderabad Main Arteries & Roads */}
              {/* PVNR Expressway / Inner Ring Road */}
              <path d="M 30 260 Q 120 180 200 130 T 360 40" fill="none" stroke="#334155" strokeWidth="3" opacity="0.6" />
              {/* Road No. 36 Jubilee Hills */}
              <path d="M 220 70 L 350 95" fill="none" stroke="#475569" strokeWidth="2.5" strokeDasharray="3,3" opacity="0.8" />
              {/* Outer Ring Road */}
              <path d="M 10 70 Q 100 40 250 30" fill="none" stroke="#1E293B" strokeWidth="4" />

              {/* Landmark Labels */}
              <text x="28" y="270" fill="#94A3B8" fontSize="8" fontWeight="bold">Charminar</text>
              <text x="270" y="65" fill="#F87171" fontSize="8" fontWeight="bold">Jubilee Hills Rd 36</text>
              <text x="40" y="235" fill="#FBBF24" fontSize="8" fontWeight="bold">RTC X Roads</text>
              <text x="310" y="140" fill="#94A3B8" fontSize="7">Durgam Cheruvu</text>

              {/* Active Delivery Route Arc */}
              <path
                d="M 60 240 Q 150 150 320 80"
                fill="none"
                stroke="#1E293B"
                strokeWidth="5"
                strokeLinecap="round"
              />
              <path
                d="M 60 240 Q 150 150 320 80"
                fill="none"
                stroke="url(#routeGrad)"
                strokeWidth="3.5"
                strokeLinecap="round"
                strokeDasharray="6,4"
              />

              {/* Restaurant Origin Marker (RTC X Roads / Secunderabad) */}
              <g transform="translate(60, 240)">
                <circle r="12" fill="#E23744" opacity="0.3" />
                <circle r="7" fill="#E23744" stroke="#FFFFFF" strokeWidth="2" />
                <text x="-25" y="-12" fill="#FCA5A5" fontSize="8" fontWeight="black">
                  {order.restaurantName.split(' ')[0]}
                </text>
              </g>

              {/* Customer Destination Marker (Jubilee Hills) */}
              <g transform="translate(320, 80)">
                <circle r="14" fill="#10B981" opacity="0.3" className="animate-ping" />
                <circle r="8" fill="#10B981" stroke="#FFFFFF" strokeWidth="2" />
                <text x="-32" y="-12" fill="#6EE7B7" fontSize="8" fontWeight="black">
                  Your Address
                </text>
              </g>

              {/* Animated Delivery Valet (Bajaj Pulsar) Moving along Route */}
              <g transform={`translate(${bikeX}, ${bikeY})`}>
                {/* Valet Radar Ring */}
                <circle r="16" fill="#F59E0B" opacity="0.25" className="animate-pulse" />
                <circle r="8" fill="#D97706" stroke="#FFFFFF" strokeWidth="1.5" />
                
                {/* Headlight beam */}
                <polygon points="6,0 24,-8 24,8" fill="#FDE68A" opacity="0.4" />

                {/* Bajaj Pulsar Icon / Indicator */}
                <circle r="3" fill="#FFFFFF" />
              </g>
            </svg>

            {/* Floating Live Delivery Partner Pill on Map */}
            <div className="absolute bottom-2.5 left-2.5 right-2.5 bg-slate-900/95 backdrop-blur-md px-3 py-2 rounded-2xl border border-zinc-700/80 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                  <Navigation className="w-4 h-4 text-amber-400 rotate-45" />
                </div>
                <div>
                  <div className="font-extrabold text-white text-[11px] leading-tight">
                    {partnerDisplayName}
                  </div>
                  <div className="text-[10px] text-zinc-400 flex items-center gap-1 font-medium mt-0.5">
                    <span className="text-amber-400 font-bold">★ {order.deliveryPartner.rating}</span>
                    <span>Overall Rating</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-700/50">
                  {currentStep >= 4 ? 'On The Way ⚡' : currentStep === 3 ? 'Picked Up 📦' : 'Preparing 🍳'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 5 Progress Milestones Step List */}
        <div className="bg-white rounded-3xl p-4 border border-zinc-100 shadow-sm space-y-3.5">
          <div className="flex items-center justify-between border-b border-zinc-100 pb-2.5">
            <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">
              Order Milestones
            </h4>
            <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full">
              Step {currentStep} of 5
            </span>
          </div>

          <div className="space-y-3">
            {milestones.map((m, idx) => {
              const isCompleted = currentStep > m.step;
              const isCurrent = currentStep === m.step;
              return (
                <div key={m.step} className="flex items-start gap-3 relative">
                  {/* Connecting Line between steps */}
                  {idx < milestones.length - 1 && (
                    <div
                      className={`absolute left-3.5 top-7 bottom-0 w-0.5 -ml-[1px] ${
                        currentStep > m.step ? 'bg-emerald-500' : 'bg-zinc-200'
                      }`}
                    ></div>
                  )}

                  {/* Step Icon Badge */}
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-black transition-all shadow-sm ${
                      isCompleted
                        ? 'bg-emerald-600 text-white'
                        : isCurrent
                        ? 'bg-rose-600 text-white ring-4 ring-rose-100 animate-pulse-subtle'
                        : 'bg-zinc-100 text-zinc-400'
                    }`}
                  >
                    {isCompleted ? '✓' : m.step}
                  </div>

                  {/* Step Text Info */}
                  <div className="flex-1 min-w-0 pb-1">
                    <div className="flex items-center justify-between">
                      <h5
                        className={`text-xs font-black leading-tight ${
                          isCurrent
                            ? 'text-rose-600'
                            : isCompleted
                            ? 'text-slate-900'
                            : 'text-slate-400'
                        }`}
                      >
                        {m.title}
                      </h5>
                      {isCurrent && (
                        <span className="text-[9px] font-extrabold text-rose-600 bg-rose-50 px-1.5 py-0.2 rounded animate-pulse">
                          LIVE
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                      {m.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Delivery Partner Details Card (Name & Overall Average Rating only) */}
        <div className="bg-white rounded-3xl p-3.5 border border-zinc-100 shadow-sm flex items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <div className="relative">
              <img
                src={order.deliveryPartner.photo}
                alt={partnerDisplayName}
                className="w-12 h-12 rounded-2xl object-cover border border-zinc-200"
              />
              <span className="absolute -bottom-1 -right-1 bg-emerald-600 text-white text-[9px] font-bold px-1.5 py-0.2 rounded-full border border-white flex items-center gap-0.5 shadow-xs">
                ★ {order.deliveryPartner.rating}
              </span>
            </div>

            <div>
              <div className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                <span>{partnerDisplayName}</span>
              </div>
              <div className="flex items-center gap-1 text-[11px] text-slate-700 font-bold mt-0.5">
                <span className="text-amber-500">★ {order.deliveryPartner.rating}</span>
                <span>Average Rating</span>
              </div>
              <p className="text-[10px] text-slate-400 font-medium mt-0.5">
                Verified Hyderabad Delivery Partner
              </p>
            </div>
          </div>

          {/* Quick Action Buttons: Call & Chat */}
          <div className="flex items-center gap-2">
            <a
              href={`tel:${order.deliveryPartner.phone}`}
              className="w-9 h-9 rounded-2xl bg-emerald-50 text-emerald-600 hover:bg-emerald-100 flex items-center justify-center shadow-xs transition-colors"
              title="Call Delivery Partner"
            >
              <Phone className="w-4 h-4" />
            </a>
            <button
              onClick={() => alert(`Direct chat with delivery partner ${partnerDisplayName}`)}
              className="w-9 h-9 rounded-2xl bg-zinc-100 text-slate-700 hover:bg-zinc-200 flex items-center justify-center shadow-xs transition-colors"
              title="Message Delivery Partner"
            >
              <MessageSquare className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Delivery Address & Security Note */}
        <div className="bg-white rounded-3xl p-3.5 border border-zinc-100 shadow-sm flex items-start gap-2.5">
          <div className="w-7 h-7 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center flex-shrink-0 mt-0.5">
            <MapPin className="w-3.5 h-3.5 fill-rose-600 text-white" />
          </div>
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
              Delivering to Hyderabad Address
            </span>
            <p className="text-xs font-black text-slate-800 mt-0.5 leading-snug">
              {order.deliveryAddress}
            </p>
          </div>
        </div>

        {/* Order Items Breakdown */}
        <div className="bg-white rounded-3xl p-3.5 border border-zinc-100 shadow-sm">
          <div className="flex items-center justify-between border-b border-zinc-100 pb-2 mb-2">
            <span className="text-xs font-black text-slate-900">
              Order Items ({order.items.length})
            </span>
            <span className="text-[10px] text-slate-500 font-semibold">
              Total: ₹{order.total}
            </span>
          </div>
          <div className="space-y-1.5 text-xs text-slate-700">
            {order.items.map(ci => (
              <div key={ci.item.id} className="flex justify-between">
                <span>
                  {ci.quantity}x {ci.item.name}
                </span>
                <span className="font-bold">₹{ci.item.price * ci.quantity}</span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};
