# ⚡ LabWala — College Electronics Store

> Dorm-room electronics shop. Arduinos, sensors, modules & more.

---

## 🗂️ Project Structure

```
labwala/
├── server/                  # Node.js + Express + MongoDB backend
│   ├── models/
│   │   ├── Product.js       # Product schema
│   │   └── SaleRecord.js    # Sale record schema
│   ├── routes/
│   │   ├── auth.js          # Login endpoints
│   │   ├── products.js      # Public product routes
│   │   ├── sell.js          # Seller routes (JWT protected)
│   │   └── admin.js         # Admin routes (JWT protected)
│   ├── middleware/
│   │   └── auth.js          # JWT verification middleware
│   ├── index.js             # Express app entry point
│   ├── seed.js              # Database seeder with sample products
│   └── .env                 # Environment variables (edit this!)
│
└── client/                  # React + Vite frontend
    └── src/
        ├── pages/
        │   ├── HomePage.jsx       # Public product browse
        │   ├── ProductPage.jsx    # Product detail + admin notes
        │   ├── ServicesPage.jsx   # Soldering, project help etc.
        │   ├── LoginPage.jsx      # Login for /sell and /admin
        │   ├── SellPage.jsx       # Seller dashboard
        │   └── AdminPage.jsx      # Full admin dashboard
        ├── components/
        │   ├── Navbar.jsx         # Top nav with search + cart
        │   ├── ProductCard.jsx    # Product card with add-to-cart
        │   ├── CartDrawer.jsx     # Slide-in cart (customer + seller modes)
        │   └── Footer.jsx
        ├── context/
        │   ├── ThemeContext.jsx   # Dark/light theme state
        │   ├── CartContext.jsx    # Cart with localStorage persistence
        │   └── AuthContext.jsx    # JWT auth state
        ├── theme/
        │   └── theme.js          # ⬅ ALL colors live here — edit to retheme
        └── api/
            └── axios.js          # Axios instance with JWT interceptor
```

---

## 🚀 Setup Instructions

### Prerequisites
- **Node.js** v18+ installed
- **MongoDB** running locally OR a MongoDB Atlas URI

---

### Step 1 — Clone & install dependencies

```bash
# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install
```

---

### Step 2 — Configure environment variables

Edit `server/.env`:

```env
MONGODB_URI=mongodb://localhost:27017/labwala
JWT_SECRET=change_this_to_something_secret_and_long

PORT=5000

# Seller credentials (the /sell route)
SELLER_USERNAME=seller
SELLER_PASSWORD=yourSellerPassword

# Admin credentials (the /admin route)
ADMIN_USERNAME=admin
ADMIN_PASSWORD=yourAdminPassword
```

⚠️ **Change the passwords before using in production!**

---

### Step 3 — Seed the database (optional but recommended)

This adds 12 sample electronics products to get you started:

```bash
cd server
npm run seed
```

---

### Step 4 — Run in development

Open **two terminals**:

**Terminal 1 — Backend:**
```bash
cd server
npm run dev
# Server runs at http://localhost:5000
```

**Terminal 2 — Frontend:**
```bash
cd client
npm run dev
# Frontend runs at http://localhost:5173
```

---

## 🌐 Routes

| URL | Who | Description |
|-----|-----|-------------|
| `/` | Public | Homepage — browse, search, add to cart |
| `/product/:id` | Public | Product detail with golden Admin Notes |
| `/services` | Public | Soldering, project building, etc. |
| `/login?role=seller` | Hidden | Seller login page |
| `/login?role=admin` | Hidden | Admin login page |
| `/sell` | Seller (JWT) | Browse + mark sales + today's summary |
| `/admin` | Admin (JWT) | Full dashboard — analytics, CRUD, sales log |

> 💡 `/sell` and `/admin` are **not linked anywhere** on the public site. Users must manually type the URL.

---

## 🎨 How to Change the Theme

All colors are in one file: `client/src/theme/theme.js`

To change the primary color from amber to any other color:

```js
// In theme.js, under themes.dark:
'--color-primary': '#your-new-color',
'--color-primary-dim': '#slightly-darker',
'--color-primary-glow': 'rgba(r, g, b, 0.15)',
```

To add a new theme (e.g. purple):
```js
export const themes = {
  dark: { ... },
  light: { ... },
  purple: {              // ← add this
    '--color-primary': '#a855f7',
    // ... rest of vars
  }
}
```

---

## 🛒 How the Cart Works

- **Customer cart**: Stored in `localStorage`, persists across page refreshes. Used only to calculate total price — no order is placed.
- **Seller cart**: Same cart, but on `/sell` the cart drawer shows a **"Mark as Sold"** button. Clicking it:
  1. Sends items + quantities to the server
  2. Server deducts stock from each product
  3. Records a `SaleRecord` in the database
  4. Clears the cart
  5. Updates today's summary bar

---

## 📊 Admin Dashboard Features

- **Revenue stats**: Today / This Week / This Month / All Time
- **Profit tracking**: Calculated from cost price vs selling price
- **7-day chart**: Revenue and profit line chart
- **Top products**: Ranked by units sold
- **Low stock alerts**: Products with 5 or fewer units
- **Product CRUD**: Add, edit, deactivate, reactivate products
- **Sales log**: Every transaction with items, quantities, and profit

---

## 🔐 Security Notes

- Passwords are stored in `.env` (plain text) — fine for personal dorm use
- JWT tokens expire after 24 hours
- For production use, consider hashing passwords with bcrypt
- The `/sell` and `/admin` routes are security-by-obscurity — add IP restrictions if needed

---

## 📦 Adding Products

Via Admin panel (`/admin` → Products → Add Product):
- Name, description, category
- Selling price + Cost price (margin auto-calculated)
- Stock quantity
- Image URLs (one per line — use Imgur, Google Drive, or any public URL)
- Tags (comma-separated, used for search)
- **Seller's Notes** — shown as golden glowing section on product page

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + Vite |
| Routing | React Router v6 |
| State | Context API + localStorage |
| Styling | CSS Modules + CSS Variables |
| Charts | Recharts |
| Backend | Node.js + Express |
| Database | MongoDB + Mongoose |
| Auth | JWT (jsonwebtoken) |
| Notifications | react-hot-toast |

---

*Built for dorm-room hustle. ⚡*
