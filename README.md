# 🏪 Smart Shop — Native Vercel E-Commerce Platform

Smart Shop is a high-performance, mobile-first Telegram Mini App (TMA) and e-commerce platform built natively for Vercel Serverless hosting. It unites a blazing-fast React frontend with an edge-ready Node.js API, backed by a persistent Supabase database.

---

## 🗺️ System Architecture Flow

The following Mermaid diagram illustrates the data flow, stakeholder interactions, and component boundaries across the Smart Shop ecosystem:

```mermaid
graph TD
    %% Clients
    subgraph Telegram WebApp Clients
        C[🛒 Customer Client]
        V[🏪 Vendor Client]
        D[🚚 Driver Client]
    end

    %% Web Servers
    subgraph Vercel Cloud Platform
        FE[⚛️ Vite React Frontend]
        API[⚡ Serverless Node.js API]
    end

    %% Database & Messaging
    subgraph External Infrastructure
        DB[(🛢️ Supabase Database)]
        TG[💬 Telegram Bot API]
        CH[💳 Chapa Payment Gateway]
    end

    %% Client Interactions
    C ── Request Views ──► FE
    V ── Request Views ──► FE
    D ── Request Views ──► FE

    %% API Data Flow
    FE ── REST Requests ──► API
    API ── JSON Queries ──► DB
    API ── Webhooks ────► TG
    API ── Disbursals ───► CH
    CH  ── Payment Webhooks ──► API
```

---

## 🛠️ Tech Stack & Specifications

| Technology | Role inside Smart Shop | Versions |
| :--- | :--- | :--- |
| **Vite + React 19** | Ultra-lightweight reactive client-side rendering optimized for Telegram WebViews. | `^19.2.7` |
| **TypeScript 6** | Strict type-safety across front-and-backend modules (`noImplicitAny`). | `~6.0.2` |
| **Node.js** | Vercel Edge & Serverless API Handler. | `v20.x` |
| **Tailwind CSS 4** | Theme-aware utility styling supporting instant dark-mode toggling. | `^4.3.3` |
| **Supabase Client** | Real-time database synchronizations, connection pooling, and RLS policies. | `^2.109.0` |
| **Zustand** | Highly performant client-side state store with localStorage persistence. | `^5.0.14` |

---

## 📊 Performance & Target Metrics

The following metrics represent standard performance targets and benchmarks for a production-grade deployment of the Smart Shop platform:

| Measurement Metric | Target Benchmark | Verification Method |
| :--- | :--- | :--- |
| **First Contentful Paint (FCP)** | `< 0.8 seconds` | Lighthouse Mobile Audit |
| **API Response Time (Edge)** | `< 80ms` (Avg) | Vercel Analytics |
| **Database Query Latency** | `< 25ms` (Indexed) | Supabase Dashboard |
| **Payload Size (Core Bundle)**| `< 120 KB` (Gzipped) | Vite Build Analyzer |
| **Payout Disbursal API Delay** | `< 1.5 seconds` | Chapa/Telebirr Gateway Webhook |

---

## 🚀 Getting Started

### 1. Installation & Environment Setup

Clone your repository and install dependencies locally:

```bash
# Clone the repository
git clone https://github.com/zitadave/Smartshop.git
cd Smartshop

# Install dependencies
npm install

# Build client for production
npm run build
```

Create a `.env` file inside the root directory and configure your credentials:

```ini
VITE_API_URL=https://your-domain.vercel.app/api
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your_service_role_key
TELEGRAM_ADMIN_BOT_TOKEN=your_admin_bot_token
VENDOR_BOT_TOKEN=your_vendor_bot_token
TELEGRAM_ADMIN_CHAT_ID=your_chat_id
CHAPA_SECRET_KEY=your_chapa_key
```

### 2. Standard Code Snippets

#### A. Dynamic Proximity Dispatch Call (Backend)
To trigger the dynamic Haversine proximity-based driver matching and dispatch notifications from any backend controller:

```typescript
import { createDeliveryForOrder } from './api/index';

// Call the dispatch engine when an order payment is confirmed
async function onPaymentSuccess(orderNumber: string) {
  console.log(`Payment confirmed for ${orderNumber}. Summoning couriers...`);
  
  // Triggers the automated proximity scanner (absorbs platform taxes & matches within 7km-15km)
  await createDeliveryForOrder(orderNumber);
}
```

#### B. Applying Dynamic Themes (Frontend)
To dynamically change the visual theme and apply primary CSS variables to the document:

```typescript
import { applyThemeToDocument } from '@/components/features/ThemePicker';

// Apply saved theme preset and custom accent color on startup
function initializeCustomTheme() {
  const savedTheme = localStorage.getItem('ss_theme') || 'default';
  const savedAccent = localStorage.getItem('ss_accent') || '#6C63FF';
  
  applyThemeToDocument(savedTheme, savedAccent);
}
```

---

## 🤝 Project Structure Directory

* **`api/`**: Edge-optimized Node.js serverless functions (routing, transactions, and webhooks).
* **`src/assets/`**: Logo vectors, hero media, and static assets.
* **`src/components/`**: Presentation modules grouped by administrative boundaries (`admin/`, `ui/`, `features/`, `ai/`).
* **`src/hooks/`**: Specialized React state & lifecycles (search tokenizers, speech recognitions).
* **`src/pages/`**: Primary page Target views (`delivery/` drivers, `vendor/` promoters).
* **`src/stores/`**: Persisted client-side Zustand store engines.
