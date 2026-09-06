/**
 * LabWala — Sales Data Seed Script
 * ==================================
 * Generates realistic fake sales records over the past 60 days.
 *
 * Patterns baked in:
 *  - Busier on weekends and Friday evenings
 *  - Quieter on Monday/Tuesday (exam dread)
 *  - Popular combos: Arduino + sensors, ESP + jumper wires
 *  - Low-cost items (wires, resistors) sell in higher qty
 *  - A few return records scattered throughout
 *  - Random notes mimicking real seller behaviour
 *  - Revenue grows slightly over time (word spreads on campus)
 *
 * Usage:
 *   cd server && node seedSales.js
 *
 * NOTE: Run AFTER `npm run seed` so products exist in DB.
 * This script does NOT delete existing sales — run it once.
 * To reset: delete SaleRecords from MongoDB manually.
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Product from './models/Product.js';
import ProductInventory from './models/ProductInventory.js';
import SaleRecord from './models/SaleRecord.js';

dotenv.config();

// ── Helpers ──────────────────────────────────────────────────

const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const chance = (pct) => Math.random() < pct; // e.g. chance(0.3) = 30% probability

/** Return a Date object for N days ago at a specific hour:min */
function daysAgo(n, hour, min = 0) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(hour, min, rand(0, 59), 0);
  return d;
}

/** Day-of-week multiplier for number of sales (0=Sun ... 6=Sat) */
function dayMultiplier(date) {
  const day = date.getDay();
  // 0=Sun,1=Mon,2=Tue,3=Wed,4=Thu,5=Fri,6=Sat
  return [1.2, 0.5, 0.6, 0.8, 1.0, 1.6, 1.4][day];
}

/** Typical sale hours weighted toward evenings (18-22) */
function saleHour() {
  const r = Math.random();
  if (r < 0.10) return rand(10, 13); // occasional daytime
  if (r < 0.25) return rand(14, 17); // afternoon
  if (r < 0.80) return rand(18, 21); // peak evening
  return rand(22, 23);               // late night
}

const SELLER_NOTES = [
  '', '', '', '', // mostly no notes
  'Paid by UPI',
  'Paid cash',
  'Friend of Rohit — gave him a discount',
  'Quick pick-up, no questions asked',
  'Project submission tomorrow lol',
  'Final year project stuff',
  'Robotics club order',
  'Asked a lot of questions, hope the project works out',
  'Repeat customer',
  'Paid ₹5 extra tip haha',
  'Will come back for more next week',
  'Lab assignment',
  'Minor project components',
];

// ── Product combos — realistic buying patterns ────────────────
// Each combo is [productNameKeyword, qty] pairs.
// We match by keyword against real product names from DB.
const COMBOS = [
  // Starter kit vibes
  [['Uno', 1], ['Jumper', 2], ['Breadboard', 1]],
  [['Uno', 1], ['DHT11', 1], ['Jumper', 1]],
  [['Nano', 1], ['Breadboard', 1], ['Resistor', 1]],
  [['Uno', 1], ['Ultrasonic', 1], ['Jumper', 1]],
  [['Uno', 1], ['OLED', 1], ['Jumper', 1]],
  [['Nano', 2], ['Jumper', 1]],

  // IoT combos
  [['ESP8266', 1], ['DHT11', 2], ['Jumper', 1]],
  [['ESP32', 1], ['OLED', 1], ['Jumper', 1]],
  [['ESP8266', 1], ['PIR', 1], ['Jumper', 1]],
  [['ESP32', 1], ['DHT11', 1], ['Breadboard', 1]],

  // Robotics
  [['L298N', 1], ['Nano', 1], ['Jumper', 2]],
  [['L298N', 1], ['Uno', 1], ['Ultrasonic', 1]],

  // Small top-ups (common repeat buys)
  [['Jumper', 2]],
  [['Jumper', 3]],
  [['Resistor', 1]],
  [['DHT11', 2]],
  [['Ultrasonic', 1]],
  [['DHT11', 1], ['Ultrasonic', 1]],
  [['Breadboard', 1], ['Jumper', 1]],
  [['PIR', 1]],
  [['OLED', 1]],

  // Bulk / project orders
  [['Nano', 3], ['Jumper', 2], ['Breadboard', 2]],
  [['ESP8266', 2], ['DHT11', 3]],
  [['Resistor', 2], ['Jumper', 2], ['Breadboard', 1]],
  [['Uno', 2], ['L298N', 1], ['Ultrasonic', 2]],
];

// Return combos (smaller, simpler)
const RETURN_COMBOS = [
  [['Jumper', 1]],
  [['DHT11', 1]],
  [['Ultrasonic', 1]],
  [['Nano', 1]],
];

const RETURN_NOTES = [
  'Wrong item picked up',
  'Customer returned — defective',
  'Gave wrong quantity by mistake',
  'Customer changed their mind',
  'Mistakenly sold wrong product',
];

// ── Main seed function ────────────────────────────────────────

async function seedSales() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB connected');

    // Load all products + their inventory
    const products = await Product.find({ isActive: true });
    if (!products.length) {
      console.error('❌ No products found. Run `npm run seed` first.');
      process.exit(1);
    }

    const inventories = await ProductInventory.find({});
    const invMap = {};
    inventories.forEach(inv => { invMap[inv.product.toString()] = inv; });

    // Build lookup: keyword → product
    const findProduct = (keyword) => {
      return products.find(p => p.name.toLowerCase().includes(keyword.toLowerCase()));
    };

    console.log(`\n📦 Found ${products.length} products. Generating 60 days of sales...\n`);

    let totalRecords = 0;
    let totalRevenue = 0;

    // ── Loop over past 60 days ────────────────────────────────
    for (let daysBack = 60; daysBack >= 0; daysBack--) {
      const dayDate = new Date();
      dayDate.setDate(dayDate.getDate() - daysBack);

      const multiplier = dayMultiplier(dayDate);
      // Growth factor: slightly more sales in recent weeks
      const growthFactor = 0.6 + (60 - daysBack) / 60 * 0.8;

      // Base 1-3 sales per day, scaled by day multiplier and growth
      const baseSales = Math.round(rand(1, 3) * multiplier * growthFactor);
      const numSales = Math.max(0, baseSales);

      for (let s = 0; s < numSales; s++) {
        const hour = saleHour();
        const saleDate = daysAgo(daysBack, hour);

        // Pick a random combo
        const combo = pick(COMBOS);
        const saleItems = [];
        let totalAmount = 0;
        let totalProfit = 0;
        let totalCost = 0;
        let validCombo = true;

        for (const [keyword, baseQty] of combo) {
          const product = findProduct(keyword);
          if (!product) { validCombo = false; break; }

          const inv = invMap[product._id.toString()];
          if (!inv) { validCombo = false; break; }

          // Vary quantity slightly for realism
          const qty = baseQty + (chance(0.3) ? rand(0, 1) : 0);

          const subtotal = qty * product.sellingPrice;
          const cost     = qty * inv.costPrice;
          const profit   = subtotal - cost;

          totalAmount += subtotal;
          totalCost   += cost;
          totalProfit += profit;

          saleItems.push({
            product:      product._id,
            productName:  product.name,
            quantity:     qty,
            sellingPrice: product.sellingPrice,
            costPrice:    inv.costPrice,
            subtotal,
            profit,
          });
        }

        if (!validCombo || !saleItems.length) continue;

        const record = new SaleRecord({
          items:       saleItems,
          totalAmount,
          totalProfit,
          totalCost,
          soldBy:      'seller',
          note:        pick(SELLER_NOTES),
          createdAt:   saleDate,
          updatedAt:   saleDate,
        });

        await SaleRecord.collection.insertOne({
          ...record.toObject(),
          createdAt: saleDate,
          updatedAt: saleDate,
        });

        totalRevenue += totalAmount;
        totalRecords++;
      }

      // Occasional return record (≈8% of days)
      if (chance(0.08)) {
        const rCombo = pick(RETURN_COMBOS);
        const returnItems = [];
        let rAmount = 0, rProfit = 0, rCost = 0;

        for (const [keyword, qty] of rCombo) {
          const product = findProduct(keyword);
          if (!product) continue;
          const inv = invMap[product._id.toString()];
          if (!inv) continue;

          const subtotal = -(qty * product.sellingPrice);
          const cost     = -(qty * inv.costPrice);
          const profit   = subtotal - cost;
          rAmount += subtotal; rCost += cost; rProfit += profit;

          returnItems.push({
            product:      product._id,
            productName:  product.name,
            quantity:     -qty,
            sellingPrice: product.sellingPrice,
            costPrice:    inv.costPrice,
            subtotal,
            profit,
          });
        }

        if (returnItems.length) {
          const returnDate = daysAgo(daysBack, rand(14, 20));
          await SaleRecord.collection.insertOne({
            _id:         new mongoose.Types.ObjectId(),
            items:       returnItems,
            totalAmount: rAmount,
            totalProfit: rProfit,
            totalCost:   rCost,
            soldBy:      'seller',
            note:        `RETURN: ${pick(RETURN_NOTES)}`,
            createdAt:   returnDate,
            updatedAt:   returnDate,
          });
          totalRecords++;
        }
      }

      // Progress dots every 10 days
      if (daysBack % 10 === 0) {
        process.stdout.write(`  ✓ Day -${String(daysBack).padStart(2, '0')} done (${totalRecords} records so far)\n`);
      }
    }

    // ── Update totalSold on products to match generated sales ──
    console.log('\n🔄 Updating product totalSold counts...');
    const allSales = await SaleRecord.find({});
    const soldCounts = {};
    for (const sale of allSales) {
      for (const item of sale.items) {
        const pid = item.product.toString();
        soldCounts[pid] = (soldCounts[pid] || 0) + Math.max(0, item.quantity);
      }
    }
    for (const [pid, count] of Object.entries(soldCounts)) {
      await Product.findByIdAndUpdate(pid, { totalSold: count });
    }

    console.log(`\n✅ Done! Generated ${totalRecords} sale records`);
    console.log(`💰 Total simulated revenue: ₹${totalRevenue.toFixed(0)}`);
    console.log(`📅 Spanning last 60 days with realistic daily/weekly patterns\n`);

    // Print a quick breakdown
    const today = new Date(); today.setHours(0,0,0,0);
    const weekAgo = new Date(today); weekAgo.setDate(today.getDate() - 7);
    const monthAgo = new Date(today); monthAgo.setDate(today.getDate() - 30);

    const todaySales  = allSales.filter(s => new Date(s.createdAt) >= today);
    const weekSales   = allSales.filter(s => new Date(s.createdAt) >= weekAgo);
    const monthSales  = allSales.filter(s => new Date(s.createdAt) >= monthAgo);

    const sum = (arr) => arr.reduce((t, s) => t + (s.totalAmount > 0 ? s.totalAmount : 0), 0);

    console.log('📊 Quick summary:');
    console.log(`  Today     : ${todaySales.length} sales  | ₹${sum(todaySales).toFixed(0)} revenue`);
    console.log(`  This week : ${weekSales.length} sales  | ₹${sum(weekSales).toFixed(0)} revenue`);
    console.log(`  This month: ${monthSales.length} sales | ₹${sum(monthSales).toFixed(0)} revenue`);
    console.log(`  All time  : ${allSales.length} records | ₹${sum(allSales).toFixed(0)} revenue`);
    console.log('\n🚀 Start your server and check the admin dashboard!\n');

    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

seedSales();
