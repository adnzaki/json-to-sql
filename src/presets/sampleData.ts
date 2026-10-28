import type { PresetSample } from '../types/schema';

export const samplePresets: PresetSample[] = [
  {
    id: 'ecommerce_order',
    name: 'E-Commerce Orders & Items',
    description: 'Pesanan toko online dengan customer, shipping address, dan array items produk',
    category: 'Commerce',
    data: [
      {
        order_number: 'ORD-2026-9021',
        created_at: '2026-10-25T14:30:00Z',
        total_amount: 1450000.5,
        payment_status: 'PAID',
        payment_method: 'BCA_VIRTUAL_ACCOUNT',
        customer: {
          customer_id: 'CUST-8812',
          full_name: 'Budi Santoso',
          email: 'budi.santoso@example.com',
          phone_number: '+6281234567890',
          is_verified: true,
        },
        shipping_address: {
          recipient_name: 'Budi Santoso',
          street: 'Jl. Sudirman No. 45 Kav 12',
          city: 'Jakarta Selatan',
          postal_code: '12190',
          province: 'DKI Jakarta',
        },
        items: [
          {
            product_sku: 'PROD-MECH-KB',
            product_name: 'Wireless Mechanical Keyboard RGB',
            unit_price: 850000,
            quantity: 1,
            discount: 50000,
            subtotal: 800000,
          },
          {
            product_sku: 'PROD-DESK-PAD',
            product_name: 'Large Ergonomic Desk Mat 90x40cm',
            unit_price: 150000,
            quantity: 2,
            discount: 0,
            subtotal: 300000,
          },
        ],
        tags: ['flash_sale', 'priority_shipping'],
      },
      {
        order_number: 'ORD-2026-9022',
        created_at: '2026-10-26T09:15:00Z',
        total_amount: 320000.0,
        payment_status: 'PENDING',
        payment_method: 'GOPAY',
        customer: {
          customer_id: 'CUST-3341',
          full_name: 'Siti Rahmawati',
          email: 'siti.rahma@example.com',
          phone_number: '+6281987654321',
          is_verified: false,
        },
        shipping_address: {
          recipient_name: 'Siti Rahmawati',
          street: 'Jl. Diponegoro No. 8',
          city: 'Bandung',
          postal_code: '40115',
          province: 'Jawa Barat',
        },
        items: [
          {
            product_sku: 'PROD-USB-HUB',
            product_name: 'USB-C 7-in-1 Aluminum Hub',
            unit_price: 320000,
            quantity: 1,
            discount: 0,
            subtotal: 320000,
          },
        ],
        tags: ['regular'],
      },
    ],
  },
  {
    id: 'blog_and_comments',
    name: 'Blog Post & Comments',
    description: 'Postingan blog dengan author, tags, likes, serta daftar komentar bersarang',
    category: 'Content',
    data: [
      {
        post_id: 'post-101',
        title: 'Panduan Membangun PWA Modern dengan Vue 3',
        slug: 'panduan-membangun-pwa-vue-3',
        content: 'Progressive Web App menghadirkan pengalaman native app langsung di browser...',
        published_at: '2026-09-12T08:00:00Z',
        view_count: 1420,
        is_featured: true,
        author: {
          author_id: 'auth-01',
          name: 'Rian Pratama',
          email: 'rian@techblog.id',
          role: 'SENIOR_WRITER',
        },
        comments: [
          {
            comment_id: 'com-501',
            author_name: 'Andi Wijaya',
            comment_text: 'Artikel sangat bermanfaat dan mudah dipahami, terima kasih!',
            created_at: '2026-09-12T10:15:00Z',
            rating: 5,
          },
          {
            comment_id: 'com-502',
            author_name: 'Dewi Lestari',
            comment_text: 'Apakah performa caching service worker aman di mobile?',
            created_at: '2026-09-12T11:40:00Z',
            rating: 4,
          },
        ],
        tags: ['vuejs', 'pwa', 'frontend', 'javascript'],
      },
    ],
  },
  {
    id: 'saas_tenants',
    name: 'SaaS Multi-tenant Organizations',
    description: 'Skema organisasi SaaS dengan subscription plan, member roles, dan billing invoices',
    category: 'SaaS',
    data: [
      {
        tenant_id: 'org_alpha_77',
        company_name: 'Nusantara Cloud Tech',
        subdomain: 'nusantara',
        plan_tier: 'ENTERPRISE',
        monthly_mrr: 4500000,
        is_active: true,
        contact_email: 'admin@nusantaracloud.com',
        members: [
          {
            user_id: 'usr_001',
            full_name: 'Farhan Maulana',
            role: 'OWNER',
            joined_at: '2025-01-10T00:00:00Z',
          },
          {
            user_id: 'usr_002',
            full_name: 'Jessica Tan',
            role: 'DEVELOPER',
            joined_at: '2025-03-15T00:00:00Z',
          },
        ],
        invoices: [
          {
            invoice_code: 'INV-2026-10-01',
            amount: 4500000,
            status: 'PAID',
            due_date: '2026-10-01',
          },
        ],
      },
    ],
  },
  {
    id: 'iot_telemetry',
    name: 'IoT Sensor Telemetry',
    description: 'Data log perangkat IoT dengan koordinat GPS, telemetri suhu & kelembaban',
    category: 'IoT & Hardware',
    data: [
      {
        device_id: 'esp32_sensor_09',
        mac_address: '48:3F:DA:11:22:33',
        firmware_version: 'v2.4.1',
        is_online: true,
        location: {
          latitude: -6.2088,
          longitude: 106.8456,
          city: 'Jakarta',
        },
        readings: [
          {
            timestamp: '2026-10-27T10:00:00Z',
            temperature_celsius: 28.4,
            humidity_percent: 65.2,
            battery_voltage: 4.12,
          },
          {
            timestamp: '2026-10-27T10:05:00Z',
            temperature_celsius: 28.7,
            humidity_percent: 64.8,
            battery_voltage: 4.11,
          },
        ],
      },
    ],
  },
];
