import { emitToRoom } from './demoSocket';

const DB_KEY = 'queueless_demo_db_v2';
const TOKEN_PREFIX = 'demo.';

type Role = 'customer' | 'business_owner' | 'admin';
type TokenStatus = 'waiting' | 'called' | 'completed' | 'skipped' | 'cancelled' | 'expired';

interface DemoUser {
  _id: string;
  name: string;
  email: string;
  password: string;
  role: Role;
  isActive: boolean;
  createdAt: string;
}

interface DemoBusiness {
  _id: string;
  owner: string;
  name: string;
  description: string;
  category: string;
  address: string;
  phone: string;
  operatingHours: { open: string; close: string };
  isSuspended: boolean;
  isActive: boolean;
  createdAt: string;
}

interface DemoService {
  _id: string;
  business: string;
  name: string;
  description: string;
  averageDuration: number;
  isActive: boolean;
  createdAt: string;
}

interface DemoQueue {
  _id: string;
  business: string;
  service: string;
  date: string;
  status: 'active' | 'paused' | 'closed';
  currentTokenNumber: number;
  lastTokenNumber: number;
  createdAt: string;
}

interface DemoToken {
  _id: string;
  queue: string;
  customer: string;
  business: string;
  service: string;
  tokenNumber: number;
  tokenCode: string;
  status: TokenStatus;
  joinedAt: string;
  calledAt?: string;
  completedAt?: string;
  estimatedWaitTime: number;
  qrCodePath?: string;
  createdAt: string;
}

interface DemoDb {
  users: DemoUser[];
  businesses: DemoBusiness[];
  services: DemoService[];
  queues: DemoQueue[];
  tokens: DemoToken[];
}

const CATEGORIES = ['Hospital', 'Clinic', 'Bank', 'Salon', 'Restaurant', 'Government', 'Service Center', 'Retail', 'Other'];
const ACTIVE_STATUSES: TokenStatus[] = ['waiting', 'called'];
const FINAL_STATUSES: TokenStatus[] = ['completed', 'skipped', 'cancelled', 'expired'];

const CUSTOMERS = ['Satwik Harpale', 'Jane Watson', 'Robert Downey', 'Alice Cooper', 'David Beckham'];

const SHOPS: Array<{
  key: string;
  owner: string;
  name: string;
  category: string;
  description: string;
  address: string;
  phone: string;
  hours: [string, string];
  services: Array<[string, string, number]>;
}> = [
  {
    key: 'hospital',
    owner: 'Dr. Sarah Connor',
    name: 'City General Hospital',
    category: 'Hospital',
    description: 'Primary health care services with a specialized emergency care unit.',
    address: '101 Wellness Boulevard, Metro City',
    phone: '+91 98200 10199',
    hours: ['08:00', '20:00'],
    services: [
      ['General Checkup', 'Routine medical exam and consultation', 15],
      ['Pediatric Care', 'Children health consultation and immunization', 20],
      ['Cardiology Clinic', 'ECG and specialized heart health diagnostics', 30],
    ],
  },
  {
    key: 'salon',
    owner: 'Sophia Loren',
    name: 'Glow & Style Salon',
    category: 'Salon',
    description: 'Hair styling, facial therapies and organic cosmetics spa.',
    address: '88 Glamour Crescent, Fashion District',
    phone: '+91 98200 10377',
    hours: ['10:00', '21:00'],
    services: [
      ['Hair Cut & Styling', 'Trimming, washing and colouring', 35],
      ['Facial Therapy', 'Cleanse and skin restoration massage', 45],
    ],
  },
  {
    key: 'clinic',
    owner: 'Dr. Anita Rao',
    name: 'Smile Bright Dental Clinic',
    category: 'Clinic',
    description: 'Family dentistry, cleaning and orthodontic consultations.',
    address: '12 Lakeview Road, Green Park',
    phone: '+91 98200 10412',
    hours: ['09:30', '19:00'],
    services: [
      ['Dental Checkup', 'Oral examination and X-ray review', 20],
      ['Teeth Cleaning', 'Scaling and polishing session', 30],
    ],
  },
  {
    key: 'restaurant',
    owner: 'Vikram Mehta',
    name: 'Spice Route Kitchen',
    category: 'Restaurant',
    description: 'Regional Indian cuisine with a virtual waitlist for tables.',
    address: '5 Food Street, Old Town',
    phone: '+91 98200 10533',
    hours: ['11:00', '23:00'],
    services: [
      ['Dine-in Table', 'Waitlist for indoor seating', 25],
      ['Takeaway Pickup', 'Collect pre-ordered meals at the counter', 10],
    ],
  },
  {
    key: 'govt',
    owner: 'Rajesh Kumar',
    name: 'Passport Seva Kendra',
    category: 'Government',
    description: 'Passport application, document verification and biometrics.',
    address: '22 Civic Centre, Sector 4',
    phone: '+91 98200 10644',
    hours: ['09:00', '16:00'],
    services: [
      ['Document Verification', 'Verify application documents with an officer', 15],
      ['Biometrics Capture', 'Photo and fingerprint capture', 10],
    ],
  },
  {
    key: 'service',
    owner: 'Arjun Nair',
    name: 'QuickFix Mobile Service Center',
    category: 'Service Center',
    description: 'Authorized smartphone repairs, screen and battery replacement.',
    address: '67 Tech Arcade, MG Road',
    phone: '+91 98200 10755',
    hours: ['10:00', '20:00'],
    services: [
      ['Screen Replacement', 'Display diagnosis and replacement', 40],
      ['Battery Check', 'Battery health test and swap', 15],
    ],
  },
  {
    key: 'retail',
    owner: 'Priya Sharma',
    name: 'FreshMart Supermarket',
    category: 'Retail',
    description: 'Groceries and daily essentials with express billing counters.',
    address: '3 Market Square, Central Avenue',
    phone: '+91 98200 10866',
    hours: ['07:00', '22:00'],
    services: [
      ['Express Billing', 'Billing counter for up to 10 items', 5],
      ['Home Delivery Desk', 'Schedule doorstep delivery', 10],
    ],
  },
];

// Today's live queues: shop key, service index, and [status, customer index] per token in order.
const TODAY_QUEUES: Array<[string, number, Array<[TokenStatus, number]>]> = [
  ['hospital', 0, [['completed', 0], ['called', 1], ['waiting', 2], ['waiting', 3], ['cancelled', 4]]],
  ['salon', 0, [['skipped', 3], ['called', 2], ['waiting', 0], ['waiting', 4]]],
  ['clinic', 1, [['completed', 2], ['waiting', 4]]],
  ['restaurant', 0, [['completed', 3], ['called', 4], ['waiting', 2]]],
  ['govt', 0, [['called', 3], ['waiting', 4]]],
];

class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

const fail = (status: number, message: string): never => {
  throw new HttpError(status, message);
};

const newId = (prefix: string) => `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;

const dateKey = (d = new Date()) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

const minutesAgo = (minutes: number) => new Date(Date.now() - minutes * 60000).toISOString();

const codePart = (text: string) => text.replace(/[^a-zA-Z0-9]/g, '').substring(0, 3).toUpperCase();

const tokenCodeFor = (biz: DemoBusiness, svc: DemoService, suffix: string) =>
  `QL-${codePart(biz.name)}-${codePart(svc.name)}-${suffix}`;

const qrUrl = (code: string) => `https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(code)}`;

// Deterministic pseudo-random generator so every visitor sees the same seeded history.
const seededRandom = (seed: number) => () => {
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

const createSeedDb = (): DemoDb => {
  const db: DemoDb = { users: [], businesses: [], services: [], queues: [], tokens: [] };
  const createdAt = new Date(Date.now() - 30 * 24 * 60 * 60000).toISOString();
  const random = seededRandom(42);
  const pick = <T,>(items: T[]) => items[Math.floor(random() * items.length)];

  db.users.push({ _id: 'u_admin', name: 'System Admin', email: 'admin@queueless.com', password: 'admin123', role: 'admin', isActive: true, createdAt });
  CUSTOMERS.forEach((name, i) => {
    db.users.push({ _id: `u_customer${i + 1}`, name, email: `customer${i + 1}@queueless.com`, password: 'customer123', role: 'customer', isActive: true, createdAt });
  });

  SHOPS.forEach((shop) => {
    const ownerId = `u_${shop.key}`;
    const businessId = `b_${shop.key}`;
    db.users.push({ _id: ownerId, name: shop.owner, email: `${shop.key}@queueless.com`, password: 'owner123', role: 'business_owner', isActive: true, createdAt });
    db.businesses.push({
      _id: businessId,
      owner: ownerId,
      name: shop.name,
      description: shop.description,
      category: shop.category,
      address: shop.address,
      phone: shop.phone,
      operatingHours: { open: shop.hours[0], close: shop.hours[1] },
      isSuspended: false,
      isActive: true,
      createdAt,
    });
    shop.services.forEach(([name, description, averageDuration], i) => {
      db.services.push({ _id: `s_${shop.key}_${i}`, business: businessId, name, description, averageDuration, isActive: true, createdAt });
    });
  });

  const customerIds = db.users.filter((u) => u.role === 'customer').map((u) => u._id);

  TODAY_QUEUES.forEach(([key, serviceIndex, entries]) => {
    const biz = db.businesses.find((b) => b._id === `b_${key}`)!;
    const svc = db.services.find((s) => s._id === `s_${key}_${serviceIndex}`)!;
    const queue: DemoQueue = {
      _id: newId('q'),
      business: biz._id,
      service: svc._id,
      date: dateKey(),
      status: 'active',
      currentTokenNumber: 0,
      lastTokenNumber: entries.length,
      createdAt: minutesAgo(entries.length * 12 + 5),
    };
    entries.forEach(([status, customerIndex], i) => {
      const tokenNumber = i + 1;
      const joined = (entries.length - i) * 12;
      const wasCalled = status === 'called' || status === 'completed';
      if (wasCalled) queue.currentTokenNumber = Math.max(queue.currentTokenNumber, tokenNumber);
      const code = tokenCodeFor(biz, svc, String(tokenNumber).padStart(3, '0'));
      db.tokens.push({
        _id: newId('t'),
        queue: queue._id,
        customer: customerIds[customerIndex],
        business: biz._id,
        service: svc._id,
        tokenNumber,
        tokenCode: code,
        status,
        joinedAt: minutesAgo(joined),
        calledAt: wasCalled ? minutesAgo(Math.max(1, joined - 8)) : undefined,
        completedAt: status === 'completed' ? minutesAgo(Math.max(1, joined - 20)) : undefined,
        estimatedWaitTime: svc.averageDuration * tokenNumber,
        qrCodePath: qrUrl(code),
        createdAt: minutesAgo(joined),
      });
    });
    db.queues.push(queue);
  });

  // Past week of history so analytics charts and customer history have content.
  for (let day = 1; day <= 7; day++) {
    const date = new Date();
    date.setDate(date.getDate() - day);

    db.businesses.forEach((biz) => {
      const services = db.services.filter((s) => s.business === biz._id);
      const queues = new Map<string, DemoQueue>();
      const visits = 3 + Math.floor(random() * 4);
      const openHour = parseInt(biz.operatingHours.open, 10);
      const closeHour = parseInt(biz.operatingHours.close, 10);

      for (let i = 0; i < visits; i++) {
        const svc = pick(services);
        let queue = queues.get(svc._id);
        if (!queue) {
          queue = { _id: newId('q'), business: biz._id, service: svc._id, date: dateKey(date), status: 'closed', currentTokenNumber: 0, lastTokenNumber: 0, createdAt: date.toISOString() };
          queues.set(svc._id, queue);
          db.queues.push(queue);
        }
        queue.lastTokenNumber += 1;
        queue.currentTokenNumber = queue.lastTokenNumber;

        const roll = random();
        const status: TokenStatus = roll < 0.8 ? 'completed' : roll < 0.9 ? 'cancelled' : 'skipped';
        const joinedAt = new Date(date);
        joinedAt.setHours(openHour + Math.floor(random() * Math.max(1, closeHour - openHour - 1)), Math.floor(random() * 60), 0, 0);
        const calledAt = new Date(joinedAt.getTime() + (5 + Math.floor(random() * 20)) * 60000);
        const completedAt = new Date(calledAt.getTime() + svc.averageDuration * 60000);
        const code = tokenCodeFor(biz, svc, `${day}${String(queue.lastTokenNumber).padStart(2, '0')}`);

        db.tokens.push({
          _id: newId('t'),
          queue: queue._id,
          customer: pick(customerIds),
          business: biz._id,
          service: svc._id,
          tokenNumber: queue.lastTokenNumber,
          tokenCode: code,
          status,
          joinedAt: joinedAt.toISOString(),
          calledAt: status === 'cancelled' ? undefined : calledAt.toISOString(),
          completedAt: status === 'completed' ? completedAt.toISOString() : undefined,
          estimatedWaitTime: svc.averageDuration,
          qrCodePath: qrUrl(code),
          createdAt: joinedAt.toISOString(),
        });
      }
    });
  }

  return db;
};

const saveDb = (db: DemoDb) => localStorage.setItem(DB_KEY, JSON.stringify(db));

const loadDb = (): DemoDb => {
  const raw = localStorage.getItem(DB_KEY);
  if (raw) {
    try {
      return JSON.parse(raw) as DemoDb;
    } catch {
      // Corrupted demo data is replaced with a fresh seed below.
    }
  }
  const db = createSeedDb();
  saveDb(db);
  return db;
};

export const resetDemoData = () => {
  localStorage.removeItem(DB_KEY);
  localStorage.removeItem('token');
};

const publicUser = ({ password: _password, ...user }: DemoUser) => user;

const userSummary = (db: DemoDb, id: string) => {
  const user = db.users.find((u) => u._id === id);
  return user ? { _id: user._id, name: user.name, email: user.email } : null;
};

const populateToken = (db: DemoDb, token: DemoToken) => ({
  ...token,
  business: db.businesses.find((b) => b._id === token.business) ?? null,
  service: db.services.find((s) => s._id === token.service) ?? null,
  customer: userSummary(db, token.customer),
});

const queuePosition = (db: DemoDb, token: DemoToken) =>
  token.status === 'called'
    ? 0
    : db.tokens.filter((t) => t.queue === token.queue && t.status === 'waiting' && t.tokenNumber < token.tokenNumber).length + 1;

const liveQueue = (db: DemoDb, businessId: string) => ({
  queues: db.queues
    .filter((q) => q.business === businessId && q.date === dateKey())
    .map((q) => ({ ...q, service: db.services.find((s) => s._id === q.service) ?? null })),
  activeTokens: db.tokens
    .filter((t) => t.business === businessId && ACTIVE_STATUSES.includes(t.status))
    .sort((a, b) => a.tokenNumber - b.tokenNumber)
    .map((t) => populateToken(db, t)),
});

const broadcast = (db: DemoDb, businessId: string, changed: DemoToken[] = []) => {
  emitToRoom(`business_${businessId}`, 'queue_updated', liveQueue(db, businessId));
  const affected = db.tokens.filter((t) => t.business === businessId && ACTIVE_STATUSES.includes(t.status));
  changed.forEach((t) => {
    if (!affected.includes(t)) affected.push(t);
  });
  affected.forEach((t) => {
    emitToRoom(`customer_${t.customer}`, 'token_status_changed', { token: populateToken(db, t), position: queuePosition(db, t) });
  });
};

interface ShopInput {
  name?: string;
  description?: string;
  category?: string;
  address?: string;
  phone?: string;
  operatingHours?: { open?: string; close?: string };
  service?: { name?: string; description?: string; averageDuration?: number | string };
}

const createBusiness = (db: DemoDb, ownerId: string, input: ShopInput) => {
  const business: DemoBusiness = {
    _id: newId('b'),
    owner: ownerId,
    name: String(input.name).trim(),
    description: input.description?.trim() ?? '',
    category: CATEGORIES.includes(input.category ?? '') ? input.category! : 'Other',
    address: String(input.address).trim(),
    phone: input.phone?.trim() ?? '',
    operatingHours: { open: input.operatingHours?.open || '09:00', close: input.operatingHours?.close || '18:00' },
    isSuspended: false,
    isActive: true,
    createdAt: new Date().toISOString(),
  };
  db.businesses.push(business);
  return business;
};

const createService = (db: DemoDb, businessId: string, input: NonNullable<ShopInput['service']>) => {
  const service: DemoService = {
    _id: newId('s'),
    business: businessId,
    name: String(input.name).trim(),
    description: input.description?.trim() ?? '',
    averageDuration: Math.max(1, Number(input.averageDuration) || 15),
    isActive: true,
    createdAt: new Date().toISOString(),
  };
  db.services.push(service);
  return service;
};

interface Ctx {
  db: DemoDb;
  user: DemoUser | null;
  body: Record<string, any>;
  query: URLSearchParams;
  params: string[];
}

interface Reply {
  status?: number;
  body: unknown;
}

const requireUser = (ctx: Ctx, roles?: Role[]) => {
  if (!ctx.user) return fail(401, 'Not authorized to access this route');
  if (roles && !roles.includes(ctx.user.role)) return fail(403, `User role ${ctx.user.role} is not authorized to access this route`);
  return ctx.user;
};

const ownedBusiness = (ctx: Ctx, businessId: string) => {
  const user = requireUser(ctx);
  const business = ctx.db.businesses.find((b) => b._id === businessId) ?? fail(404, 'Business not found');
  if (business.owner !== user._id && user.role !== 'admin') fail(403, 'Not authorized to manage this business');
  return business;
};

const findToken = (ctx: Ctx, id: string) => ctx.db.tokens.find((t) => t._id === id) ?? fail(404, 'Token not found');

const routes: Array<[string, RegExp, (ctx: Ctx) => Reply]> = [
  ['POST', /^\/api\/auth\/register$/, (ctx) => {
    const { db, body } = ctx;
    const { name, email, password, role = 'customer', business } = body;
    if (!['customer', 'business_owner'].includes(role)) fail(400, 'Invalid role. Only customer and business_owner can be registered.');
    if (!name || !email || !password) fail(400, 'Please provide name, email and password');
    if (String(password).length < 6) fail(400, 'Password must be at least 6 characters');

    const normalizedEmail = String(email).trim().toLowerCase();
    if (db.users.some((u) => u.email === normalizedEmail)) fail(400, 'User already exists with this email');

    const shop: ShopInput | null = role === 'business_owner' ? business : null;
    if (shop && (!shop.name || !shop.category || !shop.address)) fail(400, 'Please provide your shop name, category and address');

    const user: DemoUser = { _id: newId('u'), name: String(name).trim(), email: normalizedEmail, password: String(password), role, isActive: true, createdAt: new Date().toISOString() };
    db.users.push(user);
    if (shop) {
      const created = createBusiness(db, user._id, shop);
      if (shop.service?.name) createService(db, created._id, shop.service);
    }
    saveDb(db);
    return { status: 201, body: { success: true, token: TOKEN_PREFIX + user._id, user: publicUser(user) } };
  }],

  ['POST', /^\/api\/auth\/login$/, ({ db, body }) => {
    if (!body.email || !body.password) fail(400, 'Please provide an email and password');
    const user = db.users.find((u) => u.email === String(body.email).trim().toLowerCase());
    if (!user || user.password !== body.password) return fail(401, 'Invalid credentials');
    if (!user.isActive) fail(403, 'Your account has been suspended. Please contact admin.');
    return { body: { success: true, token: TOKEN_PREFIX + user._id, user: publicUser(user) } };
  }],

  ['GET', /^\/api\/auth\/me$/, (ctx) => ({ body: { success: true, data: publicUser(requireUser(ctx)) } })],

  ['GET', /^\/api\/businesses$/, ({ db, query }) => {
    const category = query.get('category');
    const search = query.get('search')?.trim().toLowerCase();
    const limit = parseInt(query.get('limit') ?? '10', 10);
    const page = parseInt(query.get('page') ?? '1', 10);

    let list = db.businesses.filter((b) => !b.isSuspended && b.isActive);
    if (category) list = list.filter((b) => b.category === category);
    if (search) list = list.filter((b) => [b.name, b.category, b.description].some((field) => field.toLowerCase().includes(search)));
    list = [...list].sort((a, b) => b.createdAt.localeCompare(a.createdAt));

    const data = list.slice((page - 1) * limit, page * limit);
    return { body: { success: true, count: data.length, pagination: { total: list.length, page, limit, pages: Math.ceil(list.length / limit) }, data } };
  }],

  ['POST', /^\/api\/businesses$/, (ctx) => {
    const user = requireUser(ctx, ['business_owner', 'admin']);
    if (user.role !== 'admin' && ctx.db.businesses.some((b) => b.owner === user._id)) {
      fail(400, 'You have already registered a business. QueueLess current plan supports one business per account.');
    }
    if (!ctx.body.name || !ctx.body.address) fail(400, 'Please add a business name and address');
    const business = createBusiness(ctx.db, user._id, ctx.body);
    saveDb(ctx.db);
    return { status: 201, body: { success: true, data: business } };
  }],

  ['GET', /^\/api\/businesses\/owner\/me$/, (ctx) => {
    const user = requireUser(ctx, ['business_owner', 'admin']);
    const business = ctx.db.businesses.find((b) => b.owner === user._id) ?? fail(404, 'No business registered for this owner');
    return { body: { success: true, data: business } };
  }],

  ['GET', /^\/api\/businesses\/admin\/all$/, (ctx) => {
    requireUser(ctx, ['admin']);
    const data = ctx.db.businesses.map((b) => {
      const owner = ctx.db.users.find((u) => u._id === b.owner);
      return { ...b, owner: owner ? { _id: owner._id, name: owner.name, email: owner.email, isActive: owner.isActive } : null };
    });
    return { body: { success: true, count: data.length, data } };
  }],

  ['GET', /^\/api\/businesses\/([^/]+)$/, ({ db, params }) => {
    const business = db.businesses.find((b) => b._id === params[0]) ?? fail(404, 'Business not found');
    return { body: { success: true, data: { ...business, owner: userSummary(db, business.owner) } } };
  }],

  ['PUT', /^\/api\/businesses\/([^/]+)$/, (ctx) => {
    const business = ownedBusiness(ctx, ctx.params[0]);
    const { name, description, category, address, phone, operatingHours } = ctx.body;
    Object.assign(business, {
      ...(name !== undefined && { name }),
      ...(description !== undefined && { description }),
      ...(category !== undefined && CATEGORIES.includes(category) && { category }),
      ...(address !== undefined && { address }),
      ...(phone !== undefined && { phone }),
      ...(operatingHours !== undefined && { operatingHours }),
    });
    saveDb(ctx.db);
    return { body: { success: true, data: business } };
  }],

  ['PUT', /^\/api\/businesses\/([^/]+)\/suspend$/, (ctx) => {
    requireUser(ctx, ['admin']);
    const business = ctx.db.businesses.find((b) => b._id === ctx.params[0]) ?? fail(404, 'Business not found');
    business.isSuspended = !business.isSuspended;
    saveDb(ctx.db);
    return { body: { success: true, message: `Business has been ${business.isSuspended ? 'suspended' : 'activated'}`, data: business } };
  }],

  ['GET', /^\/api\/services\/business\/([^/]+)$/, ({ db, params }) => {
    const data = db.services.filter((s) => s.business === params[0] && s.isActive);
    return { body: { success: true, count: data.length, data } };
  }],

  ['POST', /^\/api\/services$/, (ctx) => {
    requireUser(ctx, ['business_owner', 'admin']);
    const business = ownedBusiness(ctx, ctx.body.businessId);
    if (!ctx.body.name) fail(400, 'Please add a service name');
    const service = createService(ctx.db, business._id, ctx.body);
    saveDb(ctx.db);
    return { status: 201, body: { success: true, data: service } };
  }],

  ['PUT', /^\/api\/services\/([^/]+)$/, (ctx) => {
    requireUser(ctx, ['business_owner', 'admin']);
    const service = ctx.db.services.find((s) => s._id === ctx.params[0]) ?? fail(404, 'Service not found');
    ownedBusiness(ctx, service.business);
    const { name, description, averageDuration } = ctx.body;
    if (name !== undefined) service.name = name;
    if (description !== undefined) service.description = description;
    if (averageDuration !== undefined) service.averageDuration = Math.max(1, Number(averageDuration) || service.averageDuration);
    saveDb(ctx.db);
    return { body: { success: true, data: service } };
  }],

  ['DELETE', /^\/api\/services\/([^/]+)$/, (ctx) => {
    requireUser(ctx, ['business_owner', 'admin']);
    const service = ctx.db.services.find((s) => s._id === ctx.params[0]) ?? fail(404, 'Service not found');
    ownedBusiness(ctx, service.business);
    service.isActive = false;
    saveDb(ctx.db);
    return { body: { success: true, message: 'Service deactivated successfully' } };
  }],

  ['POST', /^\/api\/queue\/join$/, (ctx) => {
    const user = requireUser(ctx, ['customer', 'admin']);
    const { db } = ctx;
    const { businessId, serviceId } = ctx.body;
    const business = db.businesses.find((b) => b._id === businessId) ?? fail(404, 'Business not found');
    if (business.isSuspended || !business.isActive) fail(400, 'Business is not active or is suspended');
    const service = db.services.find((s) => s._id === serviceId && s.business === businessId) ?? fail(404, 'Service not found for this business');

    if (db.tokens.some((t) => t.customer === user._id && t.business === businessId && ACTIVE_STATUSES.includes(t.status))) {
      fail(400, 'You are already in the queue for this business');
    }

    let queue = db.queues.find((q) => q.business === businessId && q.service === serviceId && q.date === dateKey());
    if (!queue) {
      queue = { _id: newId('q'), business: businessId, service: serviceId, date: dateKey(), status: 'active', currentTokenNumber: 0, lastTokenNumber: 0, createdAt: new Date().toISOString() };
      db.queues.push(queue);
    }
    if (queue.status === 'closed') fail(400, 'Queue is currently closed for this service');

    queue.lastTokenNumber += 1;
    const waitingAhead = db.tokens.filter((t) => t.queue === queue!._id && t.status === 'waiting').length;
    const code = tokenCodeFor(business, service, String(queue.lastTokenNumber).padStart(3, '0'));
    const now = new Date().toISOString();
    const token: DemoToken = {
      _id: newId('t'),
      queue: queue._id,
      customer: user._id,
      business: businessId,
      service: serviceId,
      tokenNumber: queue.lastTokenNumber,
      tokenCode: code,
      status: 'waiting',
      joinedAt: now,
      estimatedWaitTime: service.averageDuration * (waitingAhead + 1),
      qrCodePath: qrUrl(code),
      createdAt: now,
    };
    db.tokens.push(token);
    saveDb(db);
    broadcast(db, businessId);
    return { status: 201, body: { success: true, data: token } };
  }],

  ['GET', /^\/api\/queue\/active$/, (ctx) => {
    const user = requireUser(ctx);
    const token = ctx.db.tokens.find((t) => t.customer === user._id && ACTIVE_STATUSES.includes(t.status));
    if (!token) return { body: { success: true, data: null } };
    return { body: { success: true, data: populateToken(ctx.db, token), position: queuePosition(ctx.db, token) } };
  }],

  ['GET', /^\/api\/queue\/history$/, (ctx) => {
    const user = requireUser(ctx);
    const data = ctx.db.tokens
      .filter((t) => t.customer === user._id && FINAL_STATUSES.includes(t.status))
      .sort((a, b) => b.joinedAt.localeCompare(a.joinedAt))
      .map((t) => populateToken(ctx.db, t));
    return { body: { success: true, data } };
  }],

  ['PUT', /^\/api\/queue\/cancel\/([^/]+)$/, (ctx) => {
    const user = requireUser(ctx);
    const token = findToken(ctx, ctx.params[0]);
    if (token.customer !== user._id && user.role !== 'admin') fail(403, 'Not authorized to cancel this token');
    if (!ACTIVE_STATUSES.includes(token.status)) fail(400, 'Cannot cancel a token that is not active');
    token.status = 'cancelled';
    saveDb(ctx.db);
    broadcast(ctx.db, token.business, [token]);
    return { body: { success: true, message: 'Token cancelled successfully', data: token } };
  }],

  ['GET', /^\/api\/queue\/live\/([^/]+)$/, ({ db, params }) => ({ body: { success: true, ...liveQueue(db, params[0]) } })],

  ['GET', /^\/api\/queue\/search\/([^/]+)$/, ({ db, params }) => {
    const code = decodeURIComponent(params[0]).toUpperCase();
    const token = db.tokens.find((t) => t.tokenCode === code) ?? fail(404, 'Token not found');
    return { body: { success: true, data: populateToken(db, token) } };
  }],

  ['POST', /^\/api\/queue\/call-next$/, (ctx) => {
    const user = requireUser(ctx, ['business_owner', 'admin']);
    const { db } = ctx;
    const business = db.businesses.find((b) => b.owner === user._id) ?? fail(404, 'Business not registered for this owner');
    const queue = db.queues.find((q) => q.business === business._id && q.service === ctx.body.serviceId && q.date === dateKey());
    if (!queue) return fail(400, 'No active queue for this service today');
    if (queue.status === 'paused') fail(400, 'Queue is paused. Please resume it first');

    const next = db.tokens
      .filter((t) => t.queue === queue._id && t.status === 'waiting')
      .sort((a, b) => a.tokenNumber - b.tokenNumber)[0];
    if (!next) return { body: { success: true, message: 'No customers waiting in this queue', data: null } };

    queue.currentTokenNumber = next.tokenNumber;
    next.status = 'called';
    next.calledAt = new Date().toISOString();
    saveDb(db);
    broadcast(db, business._id, [next]);
    return { body: { success: true, message: `Called token ${next.tokenCode}`, data: next } };
  }],

  ['PUT', /^\/api\/queue\/(skip|complete)\/([^/]+)$/, (ctx) => {
    requireUser(ctx, ['business_owner', 'admin']);
    const [action, tokenId] = ctx.params;
    const token = findToken(ctx, tokenId);
    ownedBusiness(ctx, token.business);
    if (action === 'skip') {
      token.status = 'skipped';
    } else {
      token.status = 'completed';
      token.completedAt = new Date().toISOString();
    }
    saveDb(ctx.db);
    broadcast(ctx.db, token.business, [token]);
    return { body: { success: true, message: `Token ${token.tokenCode} ${action === 'skip' ? 'skipped' : 'completed'}`, data: token } };
  }],

  ['PUT', /^\/api\/queue\/toggle\/([^/]+)$/, (ctx) => {
    requireUser(ctx, ['business_owner', 'admin']);
    const queue = ctx.db.queues.find((q) => q._id === ctx.params[0]) ?? fail(404, 'Queue not found');
    ownedBusiness(ctx, queue.business);
    queue.status = queue.status === 'active' ? 'paused' : 'active';
    saveDb(ctx.db);
    broadcast(ctx.db, queue.business);
    return { body: { success: true, message: `Queue status updated to ${queue.status}`, data: queue } };
  }],

  ['GET', /^\/api\/analytics\/business\/([^/]+)$/, (ctx) => {
    requireUser(ctx, ['business_owner', 'admin']);
    const business = ownedBusiness(ctx, ctx.params[0]);
    const since = Date.now() - 30 * 24 * 60 * 60000;
    const tokens = ctx.db.tokens.filter((t) => t.business === business._id && new Date(t.joinedAt).getTime() >= since);

    let completed = 0;
    let totalWait = 0;
    const serviceCounts: Record<string, number> = {};
    const hourCounts: Record<number, number> = {};
    tokens.forEach((t) => {
      if (t.status === 'completed') {
        completed++;
        if (t.completedAt) totalWait += (new Date(t.completedAt).getTime() - new Date(t.joinedAt).getTime()) / 60000;
      }
      const serviceName = ctx.db.services.find((s) => s._id === t.service)?.name ?? 'Unknown Service';
      serviceCounts[serviceName] = (serviceCounts[serviceName] ?? 0) + 1;
      const hour = new Date(t.joinedAt).getHours();
      hourCounts[hour] = (hourCounts[hour] ?? 0) + 1;
    });

    return {
      body: {
        success: true,
        data: {
          total_customers: tokens.length,
          completed_count: completed,
          cancelled_count: tokens.filter((t) => t.status === 'cancelled').length,
          skipped_count: tokens.filter((t) => t.status === 'skipped').length,
          average_waiting_time: completed ? Math.round(totalWait / completed) : 0,
          popular_services: Object.entries(serviceCounts)
            .map(([name, count]) => ({ name, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 5),
          peak_hours: Object.entries(hourCounts)
            .map(([hour, count]) => ({ hour: Number(hour), count }))
            .sort((a, b) => a.hour - b.hour),
        },
      },
    };
  }],

  ['GET', /^\/api\/analytics\/admin\/stats$/, (ctx) => {
    requireUser(ctx, ['admin']);
    const { db } = ctx;
    const categoryCounts: Record<string, number> = {};
    db.businesses.forEach((b) => {
      categoryCounts[b.category] = (categoryCounts[b.category] ?? 0) + 1;
    });
    return {
      body: {
        success: true,
        data: {
          totalUsers: db.users.length,
          totalBusinesses: db.businesses.length,
          totalTokens: db.tokens.length,
          categoriesStats: Object.entries(categoryCounts).map(([category, count]) => ({ category, count })),
          activeTokensCount: db.tokens.filter((t) => ACTIVE_STATUSES.includes(t.status)).length,
          completedTokensCount: db.tokens.filter((t) => t.status === 'completed').length,
        },
      },
    };
  }],
];

const handleRequest = (method: string, url: URL, headers: Headers, body: Record<string, any>): Reply => {
  const db = loadDb();
  const auth = headers.get('Authorization') ?? '';
  const bearer = auth.startsWith('Bearer ') ? auth.slice(7) : '';
  const user = bearer.startsWith(TOKEN_PREFIX) ? db.users.find((u) => u._id === bearer.slice(TOKEN_PREFIX.length)) ?? null : null;

  for (const [routeMethod, pattern, handler] of routes) {
    if (routeMethod !== method) continue;
    const match = url.pathname.match(pattern);
    if (!match) continue;
    try {
      return handler({ db, user, body, query: url.searchParams, params: match.slice(1) });
    } catch (err) {
      if (err instanceof HttpError) return { status: err.status, body: { success: false, message: err.message } };
      console.error('Demo API error', err);
      return { status: 500, body: { success: false, message: 'Demo server error' } };
    }
  }
  return { status: 404, body: { success: false, message: `Route ${method} ${url.pathname} not found` } };
};

const parseBody = (body: BodyInit | null | undefined) => {
  if (typeof body !== 'string') return {};
  try {
    return JSON.parse(body);
  } catch {
    return {};
  }
};

export const installMockApi = () => {
  const realFetch = window.fetch.bind(window);

  window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    const request = input instanceof Request ? input : null;
    const url = new URL(request ? request.url : String(input), window.location.origin);
    if (!url.pathname.startsWith('/api/')) return realFetch(input, init);

    const method = (init?.method ?? request?.method ?? 'GET').toUpperCase();
    const headers = new Headers(init?.headers ?? request?.headers);
    await new Promise((resolve) => setTimeout(resolve, 150 + Math.random() * 200));

    const reply = handleRequest(method, url, headers, parseBody(init?.body));
    return new Response(JSON.stringify(reply.body), {
      status: reply.status ?? 200,
      headers: { 'Content-Type': 'application/json' },
    });
  };
};
