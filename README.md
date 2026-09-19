# Zomato Hyderabad - AI-Powered Food Delivery Web App & PWA

A full-stack, mobile-first Zomato web application hyper-localized for **Hyderabad, India**. Built with **React 18, TypeScript, Tailwind CSS, Vite, Node.js/Express, and Google Gemini AI**.

---

## 🌟 Highlights & Features

- 📱 **Mobile-First Experience & Phone Frame**:
  - Interactive smartphone mockup with a realistic camera notch, dynamic status bar clock, and battery indicator.
  - Desktop-to-mobile toggle to switch between phone frame and full-screen responsive view.
  - Auto-detection for physical mobile browsers and built-in **"Open on Mobile" QR code modal** for instant testing on local networks.

- 📍 **Hyper-Localized Hyderabad Experience**:
  - Default delivery location: **Jubilee Hills, Road No. 36, Hyderabad**.
  - Interactive locality selector covering *Banjara Hills, Hitec City, Gachibowli, Charminar, and RTC X Roads*.
  - Dynamic delivery fees, ETAs, and distance calculations customized per locality.

- 🍲 **Authentic Hyderabad Restaurant Portfolio**:
  - **Paradise Biryani** (Secunderabad): World Famous Special Mutton Dum Biryani, Chicken Dum Biryani, Chicken 65, Double Ka Meetha.
  - **Bawarchi Restaurant** (RTC X Roads): Cult classic Mutton Biryani, Special Chicken Biryani, Mutton Boti Kebab.
  - **Cafe Niloufer & Tea Lounge** (Lakdikapul): Special Mawa Irani Chai, Osmania Biscuits, Bun Maska with Amul Butter, Keema Samosas.
  - **Chutneys** (Banjara Hills & Jubilee Hills): Pure Veg Babai Hotel Ghee Sponge Dosa with 7 signature chutneys, Guntur Steamed Button Idlis, MLA Pesarattu.
  - **Pista House** (Charminar & Gachibowli): GI-Tagged Hyderabadi Mutton Haleem, Zafrani Mutton Biryani, Pista Biscuits.
  - **Shah Ghouse** (Tolichowki): Shah Ghouse Mutton Biryani, Hyderabadi Mutton Marag, Tala Hua Gosht.
  - **Rayalaseema Ruchulu** (Jubilee Hills): Gongura Mutton with Sona Masoori rice, Natu Kodi Pulusu, Ragi Sangati.
  - **Conçu Patisserie** (Jubilee Hills): Signature Tiramisu, Belgian Chocolate Tart, Parisian Macarons.
  - **Karachi Bakery** (Banjara Hills) & **Nimrah Cafe** (Charminar): Fruit biscuits, kadak samovar chai, and tie biscuits.
  - **Nightlife & Dining Out**: Craft breweries including Prost Brewpub, Broadway Brewery, and Zero40 Brewing.

- 🎙️ **Gemini AI Voice & Natural Language Search**:
  - Real-time speech recognition via the Web Speech API with animated pulse indicators.
  - Powered by **Google GenAI SDK (`gemini-3.8-flash`)** to extract intent, budget caps, cuisines, dietary preferences, and contextual tags.
  - Robust offline **local NLP fallback parser** that ensures voice search works seamlessly even without an API key.

- 🛒 **End-to-End Ordering & Cart Workflow**:
  - Quantity controls, single-restaurant cart validation, and automated tax/delivery calculation.
  - Coupon redemption engine supporting `HYDERABAD50` (50% off up to ₹150) and `ZOMATOGOLD` (Free delivery).

- 🛵 **Live Simulated Order Tracking**:
  - 5 real-time milestone states: *Order Placed → Kitchen Preparing → Delivery Partner Assigned → Out for Delivery → Arrived*.
  - Delivery partner details (*Ramesh K, ★ 4.9*) with phone contact.
  - Interactive visual map route between restaurant coordinates and user locality.

- 📲 **Progressive Web App (PWA)**:
  - Custom Web App Manifest (`manifest.json`) and Service Worker (`sw.js`) with cache-first offline support.
  - In-app install banner with step-by-step instructions for Android and iOS Safari users.

---

## 🛠️ Tech Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS, Lucide React, Canvas Confetti, Vite
- **Backend**: Node.js, Express, TSX, @google/genai SDK
- **Production Bundler**: Vite (client) + esbuild (server CommonJS bundle)

---

## 🚀 Getting Started

### 1. Clone the repository
```bash
git clone https://github.com/sanjayhansda911/AIinZomato.git
cd AIinZomato
```

### 2. Install dependencies
```bash
npm install
```

### 3. Configure environment (optional)
Copy the example environment file:
```bash
cp .env.example .env
```
Add your Gemini API Key in `.env` if you want live Gemini 3.8 Flash query parsing:
```env
GEMINI_API_KEY=your_gemini_api_key_here
PORT=3000
```
*(Note: If no API key is set, the application automatically uses the built-in Hyderabad NLP parser)*.

### 4. Run in development
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 5. Build and run in production
```bash
npm run build
npm start
```

---

## 📄 License
MIT License
