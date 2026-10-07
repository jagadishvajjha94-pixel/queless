const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');

// Models
const User = require('./models/User');
const Business = require('./models/Business');
const Service = require('./models/Service');
const Queue = require('./models/Queue');
const Token = require('./models/Token');
const Notification = require('./models/Notification');
const GroceryList = require('./models/GroceryList');

dotenv.config();

// Helper to format date
const getLocalDateString = (offsetDays = 0) => {
  const d = new Date();
  d.setDate(d.getDate() - offsetDays);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const seedData = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/queueless';
    await mongoose.connect(mongoUri);
    console.log('Connected to database to seed...');

    // Clear previous data
    await User.deleteMany();
    await Business.deleteMany();
    await Service.deleteMany();
    await Queue.deleteMany();
    await Token.deleteMany();
    await Notification.deleteMany();
    await GroceryList.deleteMany();
    console.log('Database cleared.');

    // 1. Seed Users
    const salt = await bcrypt.genSalt(10);
    const hashedAdminPassword = await bcrypt.hash('admin123', salt);
    const hashedOwnerPassword = await bcrypt.hash('owner123', salt);
    const hashedCustomerPassword = await bcrypt.hash('customer123', salt);

    const adminUser = await User.create({
      name: 'System Admin',
      email: 'admin@queueless.com',
      password: 'admin123', // hooks handle hashing, but since we manually put plain text here, Pre-save hook does hashing
      role: 'admin'
    });

    const owners = await User.create([
      { name: 'Dr. Sarah Connor', email: 'hospital@queueless.com', password: 'owner123', role: 'business_owner' },
      { name: 'Priya Sharma', email: 'retail@queueless.com', password: 'owner123', role: 'business_owner' },
      { name: 'Sophia Loren', email: 'salon@queueless.com', password: 'owner123', role: 'business_owner' }
    ]);

    const customers = await User.create([
      { name: 'Satwik Harpale', email: 'customer1@queueless.com', password: 'customer123', role: 'customer' },
      { name: 'Jane Watson', email: 'customer2@queueless.com', password: 'customer123', role: 'customer' },
      { name: 'Robert Downey', email: 'customer3@queueless.com', password: 'customer123', role: 'customer' },
      { name: 'Alice Cooper', email: 'customer4@queueless.com', password: 'customer123', role: 'customer' },
      { name: 'David Beckham', email: 'customer5@queueless.com', password: 'customer123', role: 'customer' }
    ]);

    console.log('Users seeded.');

    // 2. Seed Businesses
    const bizHospital = await Business.create({
      owner: owners[0]._id,
      name: 'City General Hospital',
      description: 'Primary health care services with specialized emergency care unit.',
      category: 'Hospital',
      address: '101 Wellness Boulevard, Metro City',
      phone: '+1-555-0199',
      operatingHours: { open: '08:00', close: '20:00' }
    });

    const bizRetail = await Business.create({
      owner: owners[1]._id,
      name: 'FreshMart Supermarket',
      description: 'Groceries and daily essentials. Send your grocery list and pick it up packed.',
      category: 'Retail',
      address: '3 Market Square, Central Avenue',
      phone: '+1-555-0245',
      operatingHours: { open: '07:00', close: '22:00' }
    });

    const bizSalon = await Business.create({
      owner: owners[2]._id,
      name: 'Glow & Style Salon',
      description: 'Luxury hair styling, facial therapies, and organic cosmetics spa.',
      category: 'Salon',
      address: '88 Glamour Crescent, Fashion District',
      phone: '+1-555-0377',
      operatingHours: { open: '10:00', close: '21:00' }
    });

    console.log('Businesses seeded.');

    // 3. Seed Services
    const svcsHospital = await Service.create([
      { business: bizHospital._id, name: 'General Checkup', description: 'Routine medical exam and consultation', averageDuration: 15 },
      { business: bizHospital._id, name: 'Pediatric Care', description: 'Children health consultation and immunization', averageDuration: 20 },
      { business: bizHospital._id, name: 'Cardiology Clinic', description: 'ECG and specialized heart health diagnostics', averageDuration: 30 }
    ]);

    const svcsRetail = await Service.create([
      { business: bizRetail._id, name: 'Express Billing', description: 'Billing counter for up to 10 items', averageDuration: 5 },
      { business: bizRetail._id, name: 'Home Delivery Desk', description: 'Schedule doorstep delivery', averageDuration: 10 }
    ]);

    const svcsSalon = await Service.create([
      { business: bizSalon._id, name: 'Hair Cut & Styling', description: 'Classic trimming, washing and coloring services', averageDuration: 35 },
      { business: bizSalon._id, name: 'Facial Therapy', description: 'Cleanse and skin restoration massage sessions', averageDuration: 45 }
    ]);

    console.log('Services seeded.');

    // 4. Seed Queues (Today)
    const todayStr = getLocalDateString();
    
    const queueHospGen = await Queue.create({
      business: bizHospital._id,
      service: svcsHospital[0]._id,
      date: todayStr,
      currentTokenNumber: 2,
      lastTokenNumber: 5
    });

    const queueRetailBilling = await Queue.create({
      business: bizRetail._id,
      service: svcsRetail[0]._id,
      date: todayStr,
      currentTokenNumber: 1,
      lastTokenNumber: 4
    });

    console.log('Queues seeded.');

    // 5. Seed Tokens
    // Hospital Tokens
    await Token.create([
      {
        queue: queueHospGen._id,
        customer: customers[0]._id, // Satwik
        business: bizHospital._id,
        service: svcsHospital[0]._id,
        tokenNumber: 1,
        tokenCode: 'QL-CIT-GEN-001',
        status: 'completed',
        joinedAt: new Date(Date.now() - 40 * 60 * 1000), // 40m ago
        calledAt: new Date(Date.now() - 25 * 60 * 1000),
        completedAt: new Date(Date.now() - 10 * 60 * 1000),
        estimatedWaitTime: 15
      },
      {
        queue: queueHospGen._id,
        customer: customers[1]._id, // Jane
        business: bizHospital._id,
        service: svcsHospital[0]._id,
        tokenNumber: 2,
        tokenCode: 'QL-CIT-GEN-002',
        status: 'called',
        joinedAt: new Date(Date.now() - 30 * 60 * 1000),
        calledAt: new Date(Date.now() - 5 * 60 * 1000),
        estimatedWaitTime: 15
      },
      {
        queue: queueHospGen._id,
        customer: customers[2]._id, // Robert
        business: bizHospital._id,
        service: svcsHospital[0]._id,
        tokenNumber: 3,
        tokenCode: 'QL-CIT-GEN-003',
        status: 'waiting',
        joinedAt: new Date(Date.now() - 20 * 60 * 1000),
        estimatedWaitTime: 15
      },
      {
        queue: queueHospGen._id,
        customer: customers[3]._id, // Alice
        business: bizHospital._id,
        service: svcsHospital[0]._id,
        tokenNumber: 4,
        tokenCode: 'QL-CIT-GEN-004',
        status: 'waiting',
        joinedAt: new Date(Date.now() - 10 * 60 * 1000),
        estimatedWaitTime: 30
      },
      {
        queue: queueHospGen._id,
        customer: customers[4]._id, // David
        business: bizHospital._id,
        service: svcsHospital[0]._id,
        tokenNumber: 5,
        tokenCode: 'QL-CIT-GEN-005',
        status: 'cancelled',
        joinedAt: new Date(Date.now() - 5 * 60 * 1000),
        estimatedWaitTime: 45
      }
    ]);

    // Retail Tokens
    await Token.create([
      {
        queue: queueRetailBilling._id,
        customer: customers[1]._id,
        business: bizRetail._id,
        service: svcsRetail[0]._id,
        tokenNumber: 1,
        tokenCode: 'QL-FRE-EXP-001',
        status: 'called',
        joinedAt: new Date(Date.now() - 15 * 60 * 1000),
        calledAt: new Date(Date.now() - 2 * 60 * 1000),
        estimatedWaitTime: 5
      },
      {
        queue: queueRetailBilling._id,
        customer: customers[0]._id,
        business: bizRetail._id,
        service: svcsRetail[0]._id,
        tokenNumber: 2,
        tokenCode: 'QL-FRE-EXP-002',
        status: 'waiting',
        joinedAt: new Date(Date.now() - 10 * 60 * 1000),
        estimatedWaitTime: 5
      },
      {
        queue: queueRetailBilling._id,
        customer: customers[2]._id,
        business: bizRetail._id,
        service: svcsRetail[0]._id,
        tokenNumber: 3,
        tokenCode: 'QL-FRE-EXP-003',
        status: 'waiting',
        joinedAt: new Date(Date.now() - 5 * 60 * 1000),
        estimatedWaitTime: 10
      },
      {
        queue: queueRetailBilling._id,
        customer: customers[3]._id,
        business: bizRetail._id,
        service: svcsRetail[0]._id,
        tokenNumber: 4,
        tokenCode: 'QL-FRE-EXP-004',
        status: 'skipped',
        joinedAt: new Date(Date.now() - 30 * 60 * 1000),
        estimatedWaitTime: 5
      }
    ]);

    // Grocery lists sent to the retail shop
    await GroceryList.create([
      {
        customer: customers[0]._id,
        business: bizRetail._id,
        items: [
          { name: 'Basmati rice', quantity: '5 kg', status: 'available' },
          { name: 'Toor dal', quantity: '1 kg', status: 'available' },
          { name: 'Full cream milk', quantity: '2 L', status: 'available' },
          { name: 'Paneer', quantity: '500 g', status: 'unavailable' },
          { name: 'Tomatoes', quantity: '1 kg', status: 'pending' }
        ],
        note: 'Please pick ripe tomatoes.',
        status: 'packing',
        updates: [
          { status: 'submitted', message: 'Grocery list sent to the shop.', at: new Date(Date.now() - 50 * 60 * 1000) },
          { status: 'accepted', message: 'Got your list, we will start packing shortly.', at: new Date(Date.now() - 40 * 60 * 1000) },
          { status: 'packing', message: 'Paneer is out of stock today. Packing the rest now.', at: new Date(Date.now() - 20 * 60 * 1000) }
        ]
      },
      {
        customer: customers[1]._id,
        business: bizRetail._id,
        items: [
          { name: 'Brown bread', quantity: '1 loaf' },
          { name: 'Eggs', quantity: '12' },
          { name: 'Butter', quantity: '100 g' }
        ],
        status: 'submitted',
        updates: [{ status: 'submitted', message: 'Grocery list sent to the shop.', at: new Date(Date.now() - 5 * 60 * 1000) }]
      }
    ]);

    // Seed historical data for analytics (last 10 days)
    for (let dayOffset = 1; dayOffset <= 7; dayOffset++) {
      const pastDateStr = getLocalDateString(dayOffset);
      
      const pastHospQueue = await Queue.create({
        business: bizHospital._id,
        service: svcsHospital[0]._id,
        date: pastDateStr,
        currentTokenNumber: 5,
        lastTokenNumber: 5
      });

      // Create random completed & cancelled tokens
      for (let i = 1; i <= 5; i++) {
        const randCust = customers[Math.floor(Math.random() * customers.length)];
        const isCancelled = i === 4;
        
        // Random hour in peak business hours: 9AM to 5PM (9 to 17)
        const joinHour = 9 + Math.floor(Math.random() * 8);
        const joinTime = new Date();
        joinTime.setDate(joinTime.getDate() - dayOffset);
        joinTime.setHours(joinHour, Math.floor(Math.random() * 60), 0);

        const callTime = new Date(joinTime.getTime() + (10 + Math.floor(Math.random() * 15)) * 60000); // 10-25m wait
        const compTime = new Date(callTime.getTime() + (10 + Math.floor(Math.random() * 10)) * 60000); // 10-20m service

        await Token.create({
          queue: pastHospQueue._id,
          customer: randCust._id,
          business: bizHospital._id,
          service: svcsHospital[0]._id,
          tokenNumber: i,
          tokenCode: `QL-CIT-GEN-${dayOffset}0${i}`,
          status: isCancelled ? 'cancelled' : 'completed',
          joinedAt: joinTime,
          calledAt: isCancelled ? null : callTime,
          completedAt: isCancelled ? null : compTime,
          estimatedWaitTime: 15
        });
      }
    }

    console.log('Token and Analytics history seeded.');
    console.log('Database seeding successfully finished.');
    process.exit(0);
  } catch (err) {
    console.error('Seeding failed:', err.message);
    process.exit(1);
  }
};

seedData();
