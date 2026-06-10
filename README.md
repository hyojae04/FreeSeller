# OpenSabangnet (Sabangnet Local)

An open-source, local-first alternative to commercial e-commerce multi-channel listing managers (like Sabangnet) in South Korea. Registered products can be synchronized across major Korean e-commerce marketplaces (Naver SmartStore, Coupang WING, SSG.COM, Lotte ON, Kakao Talk Store) using a standardized bulk Excel template.

---

## 💡 Motivation & Philosophy

In South Korea, multi-channel product management services like Sabangnet are essential for e-commerce entrepreneurs. However, their subscription plans typically cost **over 1.2 million KRW per year (approx. $900 USD)**. 

For solo founders, side-hustlers, and cash-strapped early-stage startup founders, this annual cost is a heavy financial barrier. 

**OpenSabangnet** was conceived and built to break down this barrier. This project provides a **completely free, open-source, local-first program** that lets users manage bulk registration, updates, and sync actions directly from their own computer without expensive subscription plans or security worries.

---

## ✨ Key Features

### 1. Multi-Market Synchronizer (5 Major Platforms)
Supports product registration and information updates for the top five e-commerce platforms in South Korea:
- **Naver SmartStore** (네이버 스마트스토어)
- **Coupang WING** (쿠팡 WING)
- **SSG.COM** (신세계몰)
- **Lotte ON** (롯데온)
- **Kakao Talk Store** (카카오톡스토어)

### 2. Standardized 27-Field Excel Template & Bulk Uploader
- **Unified Schema**: Standardized Excel template containing exactly 27 retail fields (from `Product Code` to `Cert Sequence`).
- **Beautiful Design**: A customized Excel sheet styled with a professional brown header `#993301` using `xlsx-js-style`.
- **API Compatibility**: Auto-populates legacy fields (e.g. shipping defaults, category mapping) to bridge Excel data with platform API requirements.

### 3. Bulletproof 11-Field "NOT NULL" Validation
To prevent API registration failures before they hit the marketplace, the bulk uploader validates **11 mandatory fields** and throws precise, readable Korean error messages for empty values:
- *Required Fields*: Product Code (품번코드), Mall Code (쇼핑몰코드), Mall Name (쇼핑몰명), Mall Sale Price (쇼핑몰 판매가), Seller Product Code (자체상품코드), Product Name (상품명), Sale Price (판매가), Cost (원가), Cost 2 (원가2), Brand Name (브랜드명), Model Name (모델명).

### 4. Smart Upsert with Compound Primary Key
- **Compound Key**: Utilizes a compound primary key combining `Mall Code` and `Product Code` (`${mallCode}_${productCode}`) as the unique database `id`.
- **Sync History Protection**: Re-uploading or saving matching products updates pricing, details, and costs, but **explicitly preserves existing marketplace sync states** (`SUCCESS`/`ERROR`), sync IDs, and sync timestamps. This prevents overwriting or losing active listings when refreshing local datasets.

### 5. Interactive Dashboard & Management UI
- **Market Status Badges**: Visual indicator badges (`[N]`, `[C]`, `[S]`, `[L]`, `[K]`) showing the live sync state for each platform on the product list.
- **Two-Column Inline Editor**: An advanced modal interface grouping the 27 fields logically (Basic Info, Mall Info, Cert & Extra Info) for fast manual adjustments.
- **Developer Console & Logs**: Real-time event streams (SSE) printing logs directly on the screen as products are synced with the marketplaces.
- **Simulation Mode**: A safe-environment toggle that allows testing the full upload, editing, and sync flow without making live API requests or spending credits.

---

## 🛠️ Tech Stack

- **Frontend**: React, Vite, CSS (Harmonious Dark Theme, Micro-animations, responsive layout)
- **Backend**: Node.js, Express, Server-Sent Events (SSE)
- **Database**: Local JSON File Database (Lightweight, local-first, zero configuration required)
- **Excel Handling**: `xlsx-js-style` (For template rendering and parsing)

---

## 🚀 Getting Started

### Prerequisites
- Node.js (version 18 or above recommended)
- npm (Node Package Manager)

### 1. Clone the repository and Install Dependencies
Install all root, client, and server dependencies with a single command:
```bash
npm run install-all
```

### 2. Run the Development Server
Launch both the backend API server (Port 5001) and the Vite frontend (Port 3000) concurrently:
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your web browser.

### 3. Build for Production
Bundle the React client application for deployment:
```bash
npm run build
```

---

## 📁 Project Directory Structure

```
├── client/                 # React frontend (Vite)
│   ├── src/
│   │   ├── components/     # ProductList, Dashboard, Settings, etc.
│   │   └── App.jsx         # Main layout & event source listener
│   └── package.json
│
├── server/                 # Express backend API
│   ├── api-clients/        # Platform-specific integration code (Naver, Coupang, etc.)
│   ├── data/               # Local JSON database storage
│   ├── database.js         # Compound key and upsert DB logic
│   ├── excel-handler.js    # Excel template generator and uploader validator
│   ├── server.js           # Server routing and Event Streams
│   └── package.json
│
├── package.json            # Root configuration and dev script runners
└── README.md
```

---

## 🗺️ Roadmap & Future Improvements

We welcome contributions! Here are the core areas we plan to improve next:

### 1. Smart Shopping Mall Routing (Automatic Mapping)
- **Problem**: Currently, selected products are synced to all chosen platforms irrespective of their `Mall Code` or `Mall Name`.
- **Planned Feature**: Parse the product's `mallCode` or `mallName` during synchronization and auto-route them exclusively to their matching marketplaces (e.g., `shop0055` maps to Naver SmartStore, `shop0075` to Coupang WING), skipping mismatched APIs automatically.

### 2. Export Sync Results Report
- **Planned Feature**: Export product status reports back to Excel, including registration URLs, marketplace product IDs, sync timestamps, and raw API error logs for offline auditing.

### 3. API Connection Validator
- **Planned Feature**: Provide a "Test Connection" button in the Settings interface to validate Client IDs/Secrets/Vendor IDs against live marketplace sandbox servers instantly.

### 4. Image Hosting & Autoloading
- **Planned Feature**: Automate uploading local images to integrated cloud storage (like Imgur, AWS S3) before syncing to solve external image URL requirements in marketplace APIs.

---

## 📝 License

Distributed under the MIT License. See `LICENSE` for more information.
