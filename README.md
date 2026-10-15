# 🚀 All-In-One Payment Receipt Generator & API (Single Vercel Project)

A unified, multi-template Payment Receipt Generator and Direct PNG Image API supporting **🟡 Binance**, **🌸 bKash**, and **🟠 Nagad** in a **single, unified Vercel deployment**.

---

## 🎯 Architecture Overview

- **Single Vercel Project**: Deploy once to Vercel, host all 3 receipt designs and APIs together.
- **Frontend SPA**: Interactive visual studio with real-time toggle between **Binance**, **bKash**, and **Nagad**.
- **Serverless API**: Fast headless Puppeteer + `@sparticuz/chromium` serverless function captures `#receipt-card` and returns direct binary PNG image (`image/png`).
- **Dynamic Customization**: Every detail (amounts, recipient/sender, timestamps, transaction IDs, status bar) can be customized via URL query parameters.

---

## 🌐 Web App URLs (Preview in Browser)

- **Binance Receipt**:
  ```http
  https://your-app.vercel.app/?type=binance&usd=50&name=Shakib&number=1007670536
  ```
  *(or `https://your-app.vercel.app/binance?usd=50`)*

- **bKash Receipt**:
  ```http
  https://your-app.vercel.app/?type=bk&amount=15,000.00&sender=01712345678&trxId=DJE3VTZ0VN
  ```
  *(or `https://your-app.vercel.app/bk?amount=15,000.00`)*

- **Nagad Receipt**:
  ```http
  https://your-app.vercel.app/?type=ng&amount=8,500.00&sender=01912345678&trxId=75X0LHYP
  ```
  *(or `https://your-app.vercel.app/ng?amount=8,500.00`)*

---

## 🖼️ Direct Image API Endpoints (`image/png`)

Returns raw binary PNG image directly for embedding in `<img>`, Telegram bots, Discord bots, cURL, etc.

### Option 1: Unified Endpoint (`/api/receipt`)

Pass `type=binance`, `type=bk`, or `type=ng` (or `app=...`):

- **Binance PNG:**
  ```http
  GET /api/receipt?type=binance&usd=100&name=Tonmoykhan&number=1007670536
  ```
- **bKash PNG:**
  ```http
  GET /api/receipt?type=bk&amount=12,800.00&sender=01840172190&trxId=DJE3VTZ0VN
  ```
- **Nagad PNG:**
  ```http
  GET /api/receipt?type=ng&amount=5,000.00&sender=01718727784&trxId=75X0LHYP
  ```

---

### Option 2: Dedicated Endpoints

- **Binance**:
  ```http
  GET /api/binance?usd=50&name=Rahim
  ```
- **bKash**:
  ```http
  GET /api/bk?amount=20,000.00&sender=01711223344
  GET /api/bkash?amount=20,000.00&sender=01711223344
  ```
- **Nagad**:
  ```http
  GET /api/ng?amount=7,500.00&sender=01811223344
  GET /api/nagad?amount=7,500.00&sender=01811223344
  ```

---

## ⚙️ Query Parameters Reference

### 🟡 Binance Parameters
| Param | Default | Description |
| :--- | :--- | :--- |
| `usd` | `21` | Amount in USDT |
| `name` | `Tonmoykhan` | Recipient Nickname |
| `number` | `1007670536` | Account Number / ID |
| `orderId` | *Random 18-digit* | Order ID |
| `speed` | *Random* | Network Speed text |
| `battery` | *Random (35-95)* | Battery level |

### 🌸 bKash Parameters
| Param | Default | Description |
| :--- | :--- | :--- |
| `amount` | `12,800.00` | Received Amount (Tk) |
| `sender` | `01840172190` | Sender mobile number |
| `ref` | `Black Rock` | Reference Note |
| `balance` | `23,426.85` | New Balance (Tk) |
| `trxId` | `DJE3VTZ0VN` | Transaction ID |
| `fee` | `0.00` | Fee |
| `date` | `15/10/2026 08:42` | Transaction Date & Time |
| `metaTime` | `Today 8:42 AM` | Message header timestamp |

### 🟠 Nagad Parameters
| Param | Default | Description |
| :--- | :--- | :--- |
| `amount` | `5000.00` | Received Amount (Tk) |
| `sender` | `01718727784` | Sender mobile number |
| `ref` | `N/A` | Reference Note |
| `balance` | `5026.59` | New Balance (Tk) |
| `trxId` | `75X0LHYP` | Transaction ID |
| `date` | `01/09/2026 16:05` | Transaction Date & Time |
| `metaTime1` | `9/1 5:47PM` | Message 1 timestamp |
| `metaTime2` | `9/1 5:51PM` | Message 2 timestamp |

---

## 📦 How to Deploy to Vercel

1. Push this repository to GitHub.
2. In [Vercel Dashboard](https://vercel.com), click **Add New Project** and select this repo.
3. Keep default settings (Framework: **Vite**, Root Directory: `./`).
4. Click **Deploy**. Vercel will automatically build the frontend and deploy the serverless functions in `/api/`!
