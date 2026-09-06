import mongoose from 'mongoose';

const dayScheduleSchema = new mongoose.Schema({
  day: { type: String },
  isOpen: { type: Boolean, default: true },
  openTime: { type: String, default: '09:00' },
  closeTime: { type: String, default: '21:00' },
}, { _id: false });

const serviceCardSchema = new mongoose.Schema({
  id: { type: String },
  title: { type: String, required: true },
  description: { type: String, default: '' },
  price: { type: String, default: '' },
  turnaround: { type: String, default: '' },
  tags: { type: [String], default: [] },
  icon: { type: String, default: 'Wrench' },
  isVisible: { type: Boolean, default: true },
  order: { type: Number, default: 0 },
}, { _id: false });

const homeStatSchema = new mongoose.Schema({
  num: { type: String, default: '50+' },
  label: { type: String, default: 'Products' },
  isVisible: { type: Boolean, default: true },
}, { _id: false });

const homeFeatureSchema = new mongoose.Schema({
  id: { type: String },
  icon: { type: String, default: 'Zap' },
  title: { type: String, default: 'Feature' },
  description: { type: String, default: '' },
  isVisible: { type: Boolean, default: true },
  order: { type: Number, default: 0 },
}, { _id: false });

const shopConfigSchema = new mongoose.Schema({
  singleton: { type: String, default: 'config', unique: true },
  location: { type: String, default: 'Hostel Room 204' },  // fully editable location string
  whatsappNumber: { type: String, default: '' },
  telegramLink: { type: String, default: '' },
  tagline: { type: String, default: 'Electronics parts, right from the hostel.' },

  schedule: {
    type: [dayScheduleSchema],
    default: [
      { day: 'Monday',    isOpen: true,  openTime: '18:00', closeTime: '22:00' },
      { day: 'Tuesday',   isOpen: true,  openTime: '18:00', closeTime: '22:00' },
      { day: 'Wednesday', isOpen: true,  openTime: '18:00', closeTime: '22:00' },
      { day: 'Thursday',  isOpen: true,  openTime: '18:00', closeTime: '22:00' },
      { day: 'Friday',    isOpen: true,  openTime: '18:00', closeTime: '22:00' },
      { day: 'Saturday',  isOpen: true,  openTime: '10:00', closeTime: '22:00' },
      { day: 'Sunday',    isOpen: false, openTime: '10:00', closeTime: '20:00' },
    ]
  },

  homeStats: {
    type: [homeStatSchema],
    default: [
      { num: '50+',     label: 'Products',  isVisible: true },
      { num: '₹40+',   label: 'From',      isVisible: true },
      { num: 'Instant', label: 'Pickup',    isVisible: true },
      { num: '100%',   label: 'Genuine',   isVisible: true },
    ]
  },

  homeFeatures: {
    type: [homeFeatureSchema],
    default: [
      { id: 'fast',    icon: 'Zap',         title: 'Campus Fast',  description: 'Walk over and pick up instantly. No waiting for couriers or delivery windows.',       isVisible: true, order: 0 },
      { id: 'genuine', icon: 'Shield',       title: 'Genuine Parts', description: 'All components are tested and genuine. No knockoffs or counterfeit sensors.',         isVisible: true, order: 1 },
      { id: 'advice',  icon: 'Wrench',       title: 'Free Advice',   description: 'Stuck on your project? Get free technical help alongside every purchase.',           isVisible: true, order: 2 },
      { id: 'hours',   icon: 'Clock',        title: 'Open Evenings', description: 'Available after college hours when you actually need parts for your lab work.',       isVisible: true, order: 3 },
      { id: 'solder',  icon: 'Zap',          title: 'Soldering',     description: 'We solder headers, SMD components and repair PCBs. Bring your board over.',          isVisible: true, order: 4 },
      { id: 'projects',icon: 'Cpu',          title: 'Project Building', description: 'Got an idea? We build full electronics projects — from simple to advanced IoT.',   isVisible: true, order: 5 },
    ]
  },

  services: {
    type: [serviceCardSchema],
    default: [
      { id: 'soldering', title: 'Soldering', icon: 'Zap', description: "Need something soldered? Headers, SMD components, wires, PCB repairs — bring it over.", price: 'Starting ₹20', turnaround: '30 mins – same day', tags: ['Headers', 'SMD', 'Through-hole', 'PCB Repair'], isVisible: true, order: 0 },
      { id: 'project', title: 'Full Project Building', icon: 'Cpu', description: "Got a project idea but no time or skills? I will build it for you.", price: 'Custom quote', turnaround: '1–5 days depending on complexity', tags: ['IoT', 'Arduino', 'Sensors', 'Robotics'], isVisible: true, order: 1 },
      { id: 'programming', title: 'Arduino / ESP Programming', icon: 'Code', description: "Stuck on code? I will write, debug, or optimize your Arduino/ESP8266/ESP32 code.", price: 'Starting ₹50', turnaround: '1–2 hours for simple sketches', tags: ['Arduino IDE', 'C++', 'WiFi', 'Libraries'], isVisible: true, order: 2 },
      { id: 'pcb', title: 'PCB Design', icon: 'Wrench', description: "Need a custom PCB? I will design it in EasyEDA and help you get it fabricated.", price: 'Starting ₹200', turnaround: '2–4 days for design; fabrication extra', tags: ['EasyEDA', 'Gerber Files', 'Schematic', 'Layout'], isVisible: true, order: 3 },
      { id: 'consultation', title: 'Project Consultation', icon: 'Lightbulb', description: "Not sure which components to buy? Free 15 min chat.", price: 'Free / ₹50 extended', turnaround: 'On-demand, same day', tags: ['Component Selection', 'Circuit Design', 'Architecture'], isVisible: true, order: 4 },
      { id: 'support', title: 'WhatsApp Support', icon: 'MessageCircle', description: "Bought something and got stuck? Message me on WhatsApp. Quick replies on weekdays.", price: 'Free for customers', turnaround: 'Usually within 1–2 hours', tags: ['Troubleshooting', 'Wiring Help', 'Code Debug'], isVisible: true, order: 5 },
    ]
  },
}, { timestamps: true });

export default mongoose.model('ShopConfig', shopConfigSchema);
