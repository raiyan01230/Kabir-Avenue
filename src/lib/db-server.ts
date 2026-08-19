import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

// Initial high-quality Bangladesh Gadget Store Seed Data
const INITIAL_CATEGORIES = [
  {
    id: 'cat-gaming-pc',
    name: 'Gaming & PC',
    slug: 'gaming-pc',
    description: 'High performance gaming hardware, mechanical keyboards, and precision peripherals.',
    image_url: 'https://images.unsplash.com/photo-1587202372775-e229f172b9d7?auto=format&fit=crop&w=600&q=80',
    storage_path: 'https://images.unsplash.com/photo-1587202372775-e229f172b9d7?auto=format&fit=crop&w=600&q=80',
    sort_order: 1,
    is_active: true
  },
  {
    id: 'cat-peripherals',
    name: 'Peripherals',
    slug: 'peripherals',
    description: 'Custom mechanical keyboards, high-DPI wireless mice, and audiophile headsets.',
    image_url: 'https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?auto=format&fit=crop&w=600&q=80',
    storage_path: 'https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?auto=format&fit=crop&w=600&q=80',
    sort_order: 2,
    is_active: true
  },
  {
    id: 'cat-smart-gadgets',
    name: 'Smart Gadgets',
    slug: 'smart-gadgets',
    description: 'AMOLED smartwatches, ANC wireless earbuds, and lifestyle tech gadgets.',
    image_url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=600&q=80',
    storage_path: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=600&q=80',
    sort_order: 3,
    is_active: true
  },
  {
    id: 'cat-mobile-accessories',
    name: 'Mobile & Accessories',
    slug: 'mobile-accessories',
    description: 'GaN ultra-fast chargers, braided high-speed cables, and durable protective cases.',
    image_url: 'https://images.unsplash.com/photo-1583394838336-acd977736f90?auto=format&fit=crop&w=600&q=80',
    storage_path: 'https://images.unsplash.com/photo-1583394838336-acd977736f90?auto=format&fit=crop&w=600&q=80',
    sort_order: 4,
    is_active: true
  }
];

const INITIAL_PRODUCTS = [
  {
    id: 'prod-hyper-75-keyboard',
    name: 'Vortex 75% Wireless Mechanical Keyboard',
    slug: 'vortex-75-wireless-mechanical-keyboard',
    sku: 'VTX-75-WHT',
    short_description: 'Tri-mode wireless 75% hot-swappable mechanical keyboard with gasket mount, lubricated linear switches, and per-key RGB backlighting.',
    description: '<h3>Next-Generation Typing Experience</h3><p>The <strong>Vortex 75% Wireless Mechanical Keyboard</strong> brings enthusiast-grade acoustic dampening and seamless tri-mode connectivity (2.4GHz ultra-low latency, Bluetooth 5.2, and USB-C). Engineered with pre-lubricated custom linear switches and factory-tuned stabilizers for zero rattle.</p><h3>Key Specifications</h3><ul><li>75% Compact layout with dedicated aluminum rotary encoder</li><li>Gasket-mounted sound isolation structure with Poron foam layers</li><li>Hot-swappable 3-pin / 5-pin PCB with south-facing LEDs</li><li>4000mAh battery for up to 200 hours of continuous gameplay</li><li>1 Year Official Replacement Warranty in Bangladesh</li></ul>',
    price: 4850,
    compare_price: 5600,
    discount_percentage: 13,
    stock_quantity: 24,
    status: 'active',
    featured: true,
    category_id: 'cat-gaming-pc',
    created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
    updated_at: new Date().toISOString(),
    product_images: [
      {
        id: 'img-1-1',
        product_id: 'prod-hyper-75-keyboard',
        image_url: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=800&q=80',
        storage_path: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=800&q=80',
        sort_order: 0,
        is_primary: true,
        alt_text: 'Vortex 75% Mechanical Keyboard Angle View'
      },
      {
        id: 'img-1-2',
        product_id: 'prod-hyper-75-keyboard',
        image_url: 'https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?auto=format&fit=crop&w=800&q=80',
        storage_path: 'https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?auto=format&fit=crop&w=800&q=80',
        sort_order: 1,
        is_primary: false,
        alt_text: 'Vortex 75% Mechanical Keyboard Top Down'
      }
    ]
  },
  {
    id: 'prod-phantom-mouse',
    name: 'Phantom Ultra-Light Wireless Gaming Mouse',
    slug: 'phantom-ultra-light-wireless-gaming-mouse',
    sku: 'PHT-49G-BLK',
    short_description: '49g featherlight magnesium-chassis mouse featuring PAW3395 26,000 DPI sensor and Nordic 52840 MCU for true 4K polling rate.',
    description: '<h3>Esports-Grade Speed & Accuracy</h3><p>Engineered for competitive esports champions across Bangladesh. Weighing just 49 grams with zero holes on the outer shell, the <strong>Phantom Ultra-Light</strong> provides unmatched flick responsiveness and ergonomic comfort during marathon sessions.</p><h3>Key Specifications</h3><ul><li>PixArt PAW3395 optical sensor (26,000 DPI, 650 IPS, 50G acceleration)</li><li>Native 4000Hz wireless polling rate dongle included</li><li>Optical micro-switches rated for 90 million crisp clicks</li><li>Pure 100% PTFE virgin mouse feet for zero-friction glide</li><li>60 Hours battery life with Type-C fast recharge</li></ul>',
    price: 3850,
    compare_price: 4400,
    discount_percentage: 12,
    stock_quantity: 18,
    status: 'active',
    featured: true,
    category_id: 'cat-peripherals',
    created_at: new Date(Date.now() - 86400000 * 4).toISOString(),
    updated_at: new Date().toISOString(),
    product_images: [
      {
        id: 'img-2-1',
        product_id: 'prod-phantom-mouse',
        image_url: 'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?auto=format&fit=crop&w=800&q=80',
        storage_path: 'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?auto=format&fit=crop&w=800&q=80',
        sort_order: 0,
        is_primary: true,
        alt_text: 'Phantom Wireless Gaming Mouse'
      }
    ]
  },
  {
    id: 'prod-apex-anc-headset',
    name: 'Apex Pro Hybrid ANC Studio Wireless Headphones',
    slug: 'apex-pro-hybrid-anc-studio-wireless-headphones',
    sku: 'APX-ANC-700',
    short_description: 'Hi-Res certified 40mm beryllium drivers with 42dB active noise cancellation, LDAC lossless codec, and 65-hour marathon battery.',
    description: '<h3>Studio Fidelity Meets Deep Silence</h3><p>Immerse yourself in rich, high-resolution acoustics with <strong>Apex Pro Hybrid ANC</strong> headphones. Custom 40mm beryllium drivers deliver punchy, distortion-free sub-bass and crisp, airy treble across the entire frequency range.</p><h3>Key Specifications</h3><ul><li>42dB Hybrid Active Noise Cancellation with Transparency mode</li><li>Hi-Res Audio & Hi-Res Wireless certified with Sony LDAC codec support</li><li>65 Hours playback on a single charge; 10 min charge = 5 hours play</li><li>Memory foam protein leather earcups with lightweight steel headband</li><li>Built-in quad microphone array with AI environmental noise suppression</li></ul>',
    price: 5950,
    compare_price: 7200,
    discount_percentage: 17,
    stock_quantity: 15,
    status: 'active',
    featured: true,
    category_id: 'cat-smart-gadgets',
    created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
    updated_at: new Date().toISOString(),
    product_images: [
      {
        id: 'img-3-1',
        product_id: 'prod-apex-anc-headset',
        image_url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80',
        storage_path: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80',
        sort_order: 0,
        is_primary: true,
        alt_text: 'Apex Pro ANC Wireless Headphones'
      }
    ]
  },
  {
    id: 'prod-titan-65w-gan',
    name: 'Titan 65W GaN III Fast Desktop Charger',
    slug: 'titan-65w-gan-iii-fast-desktop-charger',
    sku: 'TTN-65W-GAN',
    short_description: 'Compact 3-port GaN charger with Power Delivery 3.0, PPS fast charging for MacBook, iPhone, Samsung Galaxy, and iPads.',
    description: '<h3>Universal High-Speed Power in Compact Size</h3><p>Powered by advanced Gallium Nitride (GaN III) semiconductors, the <strong>Titan 65W Charger</strong> delivers 3x faster charging speeds while generating 40% less heat. Charge your laptop, phone, and earbuds simultaneously with intelligent power allocation.</p><h3>Key Specifications</h3><ul><li>2x USB-C Power Delivery 3.0 ports (up to 65W single port)</li><li>1x USB-A Quick Charge 4.0+ port (up to 30W)</li><li>Intelligent dynamic power distribution and thermal guard protection</li><li>Foldable plug design with Bangladesh standard safety compliance</li><li>Full compatibility with Apple M-series, Dell XPS, iPhone 15/16, Galaxy S24</li></ul>',
    price: 2150,
    compare_price: 2600,
    discount_percentage: 17,
    stock_quantity: 35,
    status: 'active',
    featured: false,
    category_id: 'cat-mobile-accessories',
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    updated_at: new Date().toISOString(),
    product_images: [
      {
        id: 'img-4-1',
        product_id: 'prod-titan-65w-gan',
        image_url: 'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?auto=format&fit=crop&w=800&q=80',
        storage_path: 'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?auto=format&fit=crop&w=800&q=80',
        sort_order: 0,
        is_primary: true,
        alt_text: 'Titan 65W GaN Charger'
      }
    ]
  },
  {
    id: 'prod-chronos-amoled-watch',
    name: 'Chronos Pro AMOLED Smartwatch',
    slug: 'chronos-pro-amoled-smartwatch',
    sku: 'CHR-AMOLED-SLV',
    short_description: '1.43" HD AMOLED display, stainless steel case, Bluetooth phone calling, comprehensive heart rate, SpO2, and 12-day battery life.',
    description: '<h3>Elegance Meets Intelligent Health Tracking</h3><p>The <strong>Chronos Pro Smartwatch</strong> combines timeless stainless steel craftsmanship with cutting-edge health biometrics. Featuring a 1.43-inch Always-On AMOLED screen with 1000 nits peak brightness for crystal-clear readability under bright sunlight.</p><h3>Key Specifications</h3><ul><li>1.43-inch Ultra-HD AMOLED (466x466 res, 60fps refresh)</li><li>High-fidelity speaker and microphone for clear Bluetooth phone calls</li><li>24/7 PPG Bio-sensor for real-time Heart Rate, Blood Oxygen & Sleep tracking</li><li>100+ Professional workout modes with IP68 waterproof rating</li><li>Up to 12 days battery life under typical daily usage</li></ul>',
    price: 3650,
    compare_price: 4300,
    discount_percentage: 15,
    stock_quantity: 20,
    status: 'active',
    featured: true,
    category_id: 'cat-smart-gadgets',
    created_at: new Date(Date.now() - 86400000 * 1).toISOString(),
    updated_at: new Date().toISOString(),
    product_images: [
      {
        id: 'img-5-1',
        product_id: 'prod-chronos-amoled-watch',
        image_url: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80',
        storage_path: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80',
        sort_order: 0,
        is_primary: true,
        alt_text: 'Chronos Pro AMOLED Smartwatch'
      }
    ]
  }
];

const INITIAL_BANNERS = [
  {
    id: 'banner-1',
    title: 'Flagship Gaming Gear & Peripherals',
    subtitle: 'Exclusive authentic mechanical keyboards, 4K mice & audiophile ANC audio with nationwide delivery in Bangladesh.',
    image_url: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=1600&q=80',
    button_text: 'Explore Catalog',
    button_link: '/shop',
    sort_order: 1,
    is_active: true
  },
  {
    id: 'banner-2',
    title: 'Enthusiast Mechanical Keyboards',
    subtitle: 'Custom hot-swap keyboards with gasket isolation, linear switches and RGB lighting.',
    image_url: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=1600&q=80',
    button_text: 'Shop Keyboards',
    button_link: '/category/gaming-pc',
    sort_order: 2,
    is_active: true
  },
  {
    id: 'banner-3',
    title: 'Smart Gadgets & Wearables',
    subtitle: 'AMOLED smartwatches, ANC wireless earbuds and lifestyle tech with 1-Year warranty.',
    image_url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=1600&q=80',
    button_text: 'Discover Gadgets',
    button_link: '/category/smart-gadgets',
    sort_order: 3,
    is_active: true
  }
];

const INITIAL_SETTINGS: Record<string, string> = {
  store_name: 'SHM GADGET ZONE',
  storeName: 'SHM GADGET ZONE',
  store_description: 'Bangladesh premier destination for genuine enthusiast hardware, high-refresh displays, and ergonomic mechanical peripherals.',
  contact_phone: '+880 1700-000000',
  hotline_phone: '+880 1700-000000',
  support_phone: '+880 1700-000000',
  contact_email: 'support@shmgadgetzone.com',
  support_email: 'support@shmgadgetzone.com',
  contact_address: 'Level 4, Tech Plaza, Agargaon, Dhaka-1207, Bangladesh',
  head_office_address: 'Level 4, Tech Plaza, Agargaon, Dhaka-1207, Bangladesh',
  business_hours: 'Saturday to Thursday: 10:00 AM – 8:00 PM (Friday Closed)',
  copyright_year: '2026',
  marquee_text: 'Free Express Delivery on Orders Over ৳5000 • 100% Genuine Guaranteed Official Warranty • Cash on Delivery Available Across Bangladesh • Inside Dhaka ৳70 | Outside Dhaka ৳130 • Fast 24-48h Home Delivery',
  shipping_inside_dhaka: '70',
  shipping_outside_dhaka: '130',
  seo_site_title: 'SHM Gadget Zone | Official Tech & Gaming Gadgets Store in Bangladesh',
  seo_meta_title: 'SHM Gadget Zone | Official Tech & Gaming Gadgets Store in Bangladesh',
  seo_site_description: 'Buy 100% authentic mechanical keyboards, wireless gaming mice, smartwatches, and GaN chargers at the best price in Bangladesh with cash on delivery.',
  seo_meta_description: 'Buy 100% authentic mechanical keyboards, wireless gaming mice, smartwatches, and GaN chargers at the best price in Bangladesh with cash on delivery.',
  seo_keywords: 'gadget zone bd, gaming gear bangladesh, mechanical keyboard bd, wireless mouse bd, smart watch price in bangladesh',
  seo_google_verification: '',
  seo_site_url: 'https://shmgadgetzone.onrender.com'
};

const INITIAL_PROMO_CODES = [
  {
    id: 'promo-welcome10',
    code: 'WELCOME10',
    description: '10% discount for first-time orders over ৳1500',
    discount_type: 'percentage',
    discount_value: 10,
    minimum_order_amount: 1500,
    maximum_discount_amount: 500,
    usage_limit: 500,
    is_active: true,
    start_date: new Date(Date.now() - 86400000 * 30).toISOString(),
    expiry_date: new Date(Date.now() + 86400000 * 365).toISOString(),
    created_at: new Date().toISOString()
  },
  {
    id: 'promo-gadget200',
    code: 'GADGET200',
    description: 'Flat ৳200 discount on orders above ৳3000',
    discount_type: 'fixed',
    discount_value: 200,
    minimum_order_amount: 3000,
    maximum_discount_amount: 200,
    usage_limit: 200,
    is_active: true,
    start_date: new Date(Date.now() - 86400000 * 10).toISOString(),
    expiry_date: new Date(Date.now() + 86400000 * 180).toISOString(),
    created_at: new Date().toISOString()
  }
];

const INITIAL_REVIEWS = [
  {
    id: 'rev-1',
    product_id: 'prod-hyper-75-keyboard',
    rating: 5,
    title: 'Superb mechanical keyboard! Zero rattle.',
    review_text: 'The Vortex 75% feels and sounds incredible right out of the box. Switches are smooth and gasket flex is super comfortable. Got delivered to Dhanmondi within 24 hours.',
    author_name: 'Tanvir Hossain',
    author_email: 'tanvir@gmail.com',
    author_city: 'Dhaka',
    status: 'approved',
    is_verified: true,
    created_at: new Date(Date.now() - 86400000 * 2).toISOString()
  },
  {
    id: 'rev-2',
    product_id: 'prod-phantom-mouse',
    rating: 5,
    title: 'Best lightweight mouse in BD',
    review_text: '49g is super light and PAW3395 tracking is flawless in CS2 and Valorant. Highly recommended store!',
    author_name: 'Shakil Ahmed',
    author_email: 'shakil.ahmed@yahoo.com',
    author_city: 'Chittagong',
    status: 'approved',
    is_verified: true,
    created_at: new Date(Date.now() - 86400000 * 1).toISOString()
  }
];

// Persistent File Store Helper
interface StoreData {
  products: any[];
  categories: any[];
  homepage_banners: any[];
  store_settings: Record<string, string>;
  promo_codes: any[];
  orders: any[];
  customers: any[];
  reviews: any[];
  audit_logs: any[];
}

const DATA_DIR = path.join(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'ecommerce_store.json');

function ensureDataFile(): StoreData {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, 'utf8');
      const parsed = JSON.parse(raw);
      return {
        products: Array.isArray(parsed.products) ? parsed.products : INITIAL_PRODUCTS,
        categories: Array.isArray(parsed.categories) ? parsed.categories : INITIAL_CATEGORIES,
        homepage_banners: Array.isArray(parsed.homepage_banners) ? parsed.homepage_banners : INITIAL_BANNERS,
        store_settings: { ...INITIAL_SETTINGS, ...(parsed.store_settings || {}) },
        promo_codes: Array.isArray(parsed.promo_codes) ? parsed.promo_codes : INITIAL_PROMO_CODES,
        orders: Array.isArray(parsed.orders) ? parsed.orders : [],
        customers: Array.isArray(parsed.customers) ? parsed.customers : [],
        reviews: Array.isArray(parsed.reviews) ? parsed.reviews : INITIAL_REVIEWS,
        audit_logs: Array.isArray(parsed.audit_logs) ? parsed.audit_logs : []
      };
    }
  } catch (err) {
    console.warn('Error reading data file, using defaults:', err);
  }

  const initialData: StoreData = {
    products: INITIAL_PRODUCTS,
    categories: INITIAL_CATEGORIES,
    homepage_banners: INITIAL_BANNERS,
    store_settings: INITIAL_SETTINGS,
    promo_codes: INITIAL_PROMO_CODES,
    orders: [],
    customers: [],
    reviews: INITIAL_REVIEWS,
    audit_logs: []
  };

  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(initialData, null, 2), 'utf8');
  } catch (e) {
    console.warn('Error creating data file:', e);
  }

  return initialData;
}

let inMemoryStore: StoreData = ensureDataFile();

export function saveStoreData(newData?: Partial<StoreData>): StoreData {
  if (newData) {
    inMemoryStore = {
      ...inMemoryStore,
      ...newData
    };
  }

  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(DATA_FILE, JSON.stringify(inMemoryStore, null, 2), 'utf8');
  } catch (err) {
    console.error('Failed to persist store data to disk:', err);
  }

  return inMemoryStore;
}

export function getStoreData(): StoreData {
  return inMemoryStore;
}

// Database Sync Layer with Supabase
let supabaseAdminInstance: ReturnType<typeof createClient> | null = null;

export function getSupabaseAdminClient(): ReturnType<typeof createClient> | null {
  if (!supabaseAdminInstance) {
    const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (supabaseUrl && supabaseKey) {
      try {
        supabaseAdminInstance = createClient(supabaseUrl, supabaseKey);
      } catch (err) {
        console.warn('Could not initialize Supabase Admin Client:', err);
      }
    }
  }
  return supabaseAdminInstance;
}

// Helper to log Admin action
export async function logAdminActionSafe(
  adminEmail: string,
  action: string,
  resource: string,
  resourceId: string,
  previousValue: any,
  newValue: any,
  description: string
) {
  const entry = {
    id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    admin_email: adminEmail || 'admin@shmgadgetzone.com',
    action,
    resource,
    resource_id: resourceId,
    previous_value: previousValue ? JSON.stringify(previousValue) : null,
    new_value: newValue ? JSON.stringify(newValue) : null,
    description,
    created_at: new Date().toISOString()
  };

  inMemoryStore.audit_logs.unshift(entry);
  if (inMemoryStore.audit_logs.length > 200) {
    inMemoryStore.audit_logs = inMemoryStore.audit_logs.slice(0, 200);
  }
  saveStoreData();

  const db = getSupabaseAdminClient();
  if (db) {
    try {
      await (db.from('audit_logs') as any).insert({
        admin_email: entry.admin_email,
        action: entry.action,
        resource: entry.resource,
        resource_id: entry.resource_id,
        previous_value: entry.previous_value,
        new_value: entry.new_value,
        description: entry.description
      });
    } catch (err) {
      console.warn('Supabase audit log insert non-fatal warning:', err);
    }
  }
}
