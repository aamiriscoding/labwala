import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Product from './models/Product.js';
import ProductInventory from './models/ProductInventory.js';
import ShopConfig from './models/ShopConfig.js';

dotenv.config();

const sampleProducts = [
  { name: 'Arduino Uno R3', description: 'The classic Arduino Uno R3 microcontroller board based on ATmega328P. Features 14 digital I/O pins, 6 analog inputs, USB connection, and 16MHz crystal oscillator.', category: 'Microcontrollers', sellingPrice: 350, marketPrice: 500, totalSold: 42, isPinned: true, adminNotes: '💡 Pro Tip: Always use a 5V power source. If your project draws more than 500mA, use an external power supply instead of USB. Great for beginners — start with the Blink example!', tags: ['arduino', 'uno', 'atmega328', 'microcontroller', 'beginner'], images: ['https://upload.wikimedia.org/wikipedia/commons/3/38/Arduino_Uno_-_R3.jpg'], stock: 15, costPrice: 220 },
  { name: 'Arduino Nano', description: 'Compact Arduino Nano based on ATmega328P. Breadboard-friendly design with mini USB. Same power as Uno but in a tiny package.', category: 'Microcontrollers', sellingPrice: 220, marketPrice: 320, totalSold: 38, adminNotes: '⚡ Best value board I stock! The CH340 USB chip version works fine on Windows — just install the driver.', tags: ['arduino', 'nano', 'compact', 'breadboard'], images: [], stock: 20, costPrice: 140 },
  { name: 'NodeMCU ESP8266', description: 'WiFi-enabled microcontroller based on ESP8266. Program with Arduino IDE. Built-in WiFi makes it perfect for IoT projects.', category: 'Microcontrollers', sellingPrice: 180, marketPrice: 280, totalSold: 65, isPinned: true, adminNotes: '🌐 Most popular board for IoT! Pair with DHT11 for a weather station in under an hour.', tags: ['esp8266', 'nodemcu', 'wifi', 'iot'], images: [], stock: 25, costPrice: 100 },
  { name: 'ESP32 Development Board', description: 'Dual-core microcontroller with WiFi + Bluetooth. 520KB SRAM, 4MB Flash, 34 GPIO pins.', category: 'Microcontrollers', sellingPrice: 280, marketPrice: 420, totalSold: 29, adminNotes: '🔥 Dual-core at 240MHz with Bluetooth AND WiFi. Use for voice-controlled projects or BLE-connected apps.', tags: ['esp32', 'wifi', 'bluetooth', 'iot'], images: [], stock: 12, costPrice: 170 },
  { name: 'DHT11 Temperature & Humidity Sensor', description: 'Basic digital temperature and humidity sensor. Measures 0-50°C and 20-80% humidity. Single-wire interface.', category: 'Sensors', sellingPrice: 60, marketPrice: 100, totalSold: 88, adminNotes: '🌡️ Use the DHT library in Arduino IDE — plug and play. Only read every 2 seconds or it gives garbage data!', tags: ['dht11', 'temperature', 'humidity', 'sensor'], images: [], stock: 40, costPrice: 30 },
  { name: 'HC-SR04 Ultrasonic Sensor', description: 'Ultrasonic distance sensor with 2cm-400cm range and 3mm accuracy. 5V operation, Trigger and Echo pins.', category: 'Sensors', sellingPrice: 55, marketPrice: 90, totalSold: 72, adminNotes: '📏 Use the NewPing library for cleaner code. Can detect objects up to 4 meters away!', tags: ['ultrasonic', 'distance', 'hcsr04', 'robotics'], images: [], stock: 30, costPrice: 28 },
  { name: 'PIR Motion Sensor', description: 'Passive Infrared motion sensor. Detects motion up to 7 meters. Adjustable sensitivity and time delay.', category: 'Sensors', sellingPrice: 75, marketPrice: 130, totalSold: 33, adminNotes: '👁️ Give it 30-60 seconds to warm up after powering on before it starts detecting reliably.', tags: ['pir', 'motion', 'infrared', 'security'], images: [], stock: 18, costPrice: 40 },
  { name: 'OLED Display 0.96" I2C', description: '128x64 OLED display. I2C interface. No backlight needed — pixels emit their own light. Works with SSD1306 library.', category: 'Display', sellingPrice: 120, marketPrice: 200, totalSold: 41, adminNotes: '✨ Only uses 2 wires (I2C). Can show custom logos — ask if you need help converting images to bitmap!', tags: ['oled', 'display', 'i2c', 'ssd1306'], images: [], stock: 22, costPrice: 70 },
  { name: 'L298N Motor Driver', description: 'Dual H-bridge motor driver. Controls 2 DC motors or 1 stepper. Input: 5-35V, peak current 2A per channel.', category: 'Modules', sellingPrice: 90, marketPrice: 150, totalSold: 26, adminNotes: '🤖 The onboard 5V regulator means you can power your Arduino from this module too!', tags: ['motor driver', 'l298n', 'h-bridge', 'robot'], images: [], stock: 14, costPrice: 50 },
  { name: 'Breadboard 830 Points', description: 'Full-size solderless breadboard with 830 tie points. Includes power rails on both sides.', category: 'Components', sellingPrice: 80, marketPrice: 120, totalSold: 55, adminNotes: '🧩 Get this before any other component. The 830-point size fits Arduino Uno comfortably.', tags: ['breadboard', 'prototyping', 'solderless'], images: [], stock: 35, costPrice: 45 },
  { name: 'Jumper Wires M-M 40pcs', description: '40 dupont jumper wires, 20cm, male to male. Multicolor for easy identification.', category: 'Components', sellingPrice: 40, marketPrice: 70, totalSold: 120, adminNotes: '🌈 You will always need more than you think. Buy 2 packs. M-F and F-F also available — just ask!', tags: ['jumper wires', 'dupont', 'cables'], images: [], stock: 50, costPrice: 20 },
  { name: 'Resistor Kit 600pcs', description: '600 resistors, 30 values from 10Ω to 1MΩ. Metal film, 1% tolerance, 1/4W. Organized storage box.', category: 'Components', sellingPrice: 120, marketPrice: 200, totalSold: 34, adminNotes: '📦 Best investment for ₹120. Once you have this kit you never worry about "do I have a 10K resistor?"', tags: ['resistor', 'kit', 'assortment'], images: [], stock: 0, outOfStockLabel: 'restocking_soon', costPrice: 65 },
];

async function seed() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    await Product.deleteMany({});
    await ProductInventory.deleteMany({});
    console.log('🗑️  Cleared existing data');

    for (const data of sampleProducts) {
      const { stock, costPrice, ...productData } = data;
      const product = await Product.create(productData);
      await ProductInventory.create({ product: product._id, stock, costPrice });
      console.log(`  ✓ ${product.name} — stock: ${stock}, cost: ₹${costPrice}`);
    }

    // Init shop config
    await ShopConfig.deleteMany({});
    await ShopConfig.create({ singleton: 'config', location: 'Hostel Room 204' });
    console.log('✓ ShopConfig initialized');

    console.log(`\n✅ Seeded ${sampleProducts.length} products successfully!`);
    process.exit(0);
  } catch (err) {
    console.error('❌ Seed failed:', err.message);
    process.exit(1);
  }
}

seed();
