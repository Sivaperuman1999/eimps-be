import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

import User from '../models/User.js';
import Category from '../models/Category.js';
import Item from '../models/Item.js';
import Vendor from '../models/Vendor.js';
import PurchaseOrder from '../models/PurchaseOrder.js';
import GoodsReceipt from '../models/GoodsReceipt.js';

// Setup environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/eimps';

async function seedDatabase() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB.');

    // ---------------------------------------------------------
    // 1. SEED USERS
    // ---------------------------------------------------------
    console.log('Seeding Users...');
    const passwordHash = await bcrypt.hash('Admin@123', 10);
    const usersData = [
      { name: 'Super Admin', email: 'superadmin@eimps.com', password: passwordHash, role: 'ADMIN', isActive: true }
    ];

    const users = [];
    for (const u of usersData) {
      const existingUser = await User.findOne({ email: u.email });
      if (existingUser) {
        users.push(existingUser);
      } else {
        const newUser = new User(u);
        await newUser.save();
        users.push(newUser);
      }
    }
    console.log(`Users seeded (Count: ${users.length})`);

    // ---------------------------------------------------------
    // 2. SEED CATEGORIES
    // ---------------------------------------------------------
    console.log('Seeding Categories...');
    const categoriesData = [
      { name: 'Electronics', description: 'Electronic devices and gadgets' },
      { name: 'Office Supplies', description: 'General office consumables' },
      { name: 'IT Hardware', description: 'Servers, networking, and IT infrastructure' },
      { name: 'Furniture', description: 'Office desks, chairs, and cabinets' },
      { name: 'Cleaning Supplies', description: 'Janitorial and sanitation items' }
    ];

    const categories = [];
    for (const c of categoriesData) {
      const existingCat = await Category.findOne({ name: c.name });
      if (existingCat) {
        categories.push(existingCat);
      } else {
        const newCat = new Category(c);
        await newCat.save();
        categories.push(newCat);
      }
    }
    console.log(`Categories seeded (Count: ${categories.length})`);

    // Helper map
    const catMap = {
      'Electronics': categories.find(c => c.name === 'Electronics')._id,
      'Office Supplies': categories.find(c => c.name === 'Office Supplies')._id,
      'IT Hardware': categories.find(c => c.name === 'IT Hardware')._id,
      'Furniture': categories.find(c => c.name === 'Furniture')._id,
      'Cleaning Supplies': categories.find(c => c.name === 'Cleaning Supplies')._id
    };

    // ---------------------------------------------------------
    // 3. SEED INVENTORY ITEMS
    // ---------------------------------------------------------
    console.log('Seeding Items...');
    const itemsData = [
      { name: 'Laptop Pro 15', sku: 'ELEC-LAP-001', description: '15-inch professional laptop', unitPrice: 1200, categoryId: catMap['Electronics'], quantity: 50 },
      { name: 'Wireless Mouse', sku: 'ELEC-MOU-002', description: 'Ergonomic wireless mouse', unitPrice: 25, categoryId: catMap['Electronics'], quantity: 150 },
      { name: 'Mechanical Keyboard', sku: 'ELEC-KEY-003', description: 'Clicky mechanical keyboard', unitPrice: 80, categoryId: catMap['Electronics'], quantity: 100 },
      { name: 'A4 Printer Paper', sku: 'OFF-PAP-001', description: 'Box of 5 reams A4 paper', unitPrice: 20, categoryId: catMap['Office Supplies'], quantity: 500 },
      { name: 'Ballpoint Pens', sku: 'OFF-PEN-002', description: 'Box of 50 blue pens', unitPrice: 10, categoryId: catMap['Office Supplies'], quantity: 300 },
      { name: 'Network Switch 24-Port', sku: 'IT-SWI-001', description: 'Managed Gigabit Switch', unitPrice: 350, categoryId: catMap['IT Hardware'], quantity: 20 },
      { name: 'Ethernet Cable Cat6', sku: 'IT-CAB-002', description: '10ft Cat6 Patch Cable', unitPrice: 5, categoryId: catMap['IT Hardware'], quantity: 1000 },
      { name: 'Ergonomic Chair', sku: 'FUR-CHR-001', description: 'Mesh ergonomic office chair', unitPrice: 150, categoryId: catMap['Furniture'], quantity: 40 },
      { name: 'Standing Desk', sku: 'FUR-DSK-002', description: 'Motorized standing desk', unitPrice: 400, categoryId: catMap['Furniture'], quantity: 15 },
      { name: 'All-Purpose Cleaner', sku: 'CLN-ALL-001', description: '5L All purpose floor cleaner', unitPrice: 15, categoryId: catMap['Cleaning Supplies'], quantity: 80 }
    ];

    const items = [];
    for (const i of itemsData) {
      const existingItem = await Item.findOne({ sku: i.sku });
      if (existingItem) {
        items.push(existingItem);
      } else {
        const newItem = new Item(i);
        await newItem.save();
        items.push(newItem);
      }
    }
    console.log(`Items seeded (Count: ${items.length})`);

    // Helper map
    const itemMap = {};
    items.forEach(i => itemMap[i.sku] = i._id);

    // ---------------------------------------------------------
    // 4. SEED VENDORS
    // ---------------------------------------------------------
    console.log('Seeding Vendors...');
    const vendorsData = [
      { name: 'TechSource Solutions', code: 'VEND-TECH-01', email: 'sales@techsource.test', phone: '123-456-7890', address: '123 Tech Park, Silicon Valley' },
      { name: 'ABC Office Supplies', code: 'VEND-ABC-02', email: 'orders@abcoffice.test', phone: '098-765-4321', address: '456 Paper St, Paper City' },
      { name: 'Global IT Systems', code: 'VEND-GIT-03', email: 'contact@globalit.test', phone: '555-123-4567', address: '789 Server Rd, Data Center' },
      { name: 'Smart Office Solutions', code: 'VEND-SOS-04', email: 'hello@smartoffice.test', phone: '444-987-6543', address: '321 Desk Blvd, Comfort Town' }
    ];

    const vendors = [];
    for (const v of vendorsData) {
      const existingVendor = await Vendor.findOne({ code: v.code });
      if (existingVendor) {
        vendors.push(existingVendor);
      } else {
        const newVendor = new Vendor(v);
        await newVendor.save();
        vendors.push(newVendor);
      }
    }
    console.log(`Vendors seeded (Count: ${vendors.length})`);

    const vendorMap = {};
    vendors.forEach(v => vendorMap[v.code] = v._id);

    // ---------------------------------------------------------
    // 5. SEED PURCHASE ORDERS
    // ---------------------------------------------------------
    console.log('Seeding Purchase Orders...');
    const posData = [
      {
        poNumber: 'PO-2026-0001',
        vendorId: vendorMap['VEND-TECH-01'],
        status: 'COMPLETED',
        items: [
          { itemId: itemMap['ELEC-LAP-001'], quantity: 10, unitPrice: 1200, totalPrice: 12000 },
          { itemId: itemMap['ELEC-MOU-002'], quantity: 20, unitPrice: 25, totalPrice: 500 }
        ],
        totalAmount: 12500,
        orderDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // 30 days ago
      },
      {
        poNumber: 'PO-2026-0002',
        vendorId: vendorMap['VEND-ABC-02'],
        status: 'SUBMITTED',
        items: [
          { itemId: itemMap['OFF-PAP-001'], quantity: 50, unitPrice: 20, totalPrice: 1000 },
          { itemId: itemMap['OFF-PEN-002'], quantity: 100, unitPrice: 10, totalPrice: 1000 }
        ],
        totalAmount: 2000,
        orderDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000) // 15 days ago
      },
      {
        poNumber: 'PO-2026-0003',
        vendorId: vendorMap['VEND-GIT-03'],
        status: 'DRAFT',
        items: [
          { itemId: itemMap['IT-SWI-001'], quantity: 5, unitPrice: 350, totalPrice: 1750 },
          { itemId: itemMap['IT-CAB-002'], quantity: 200, unitPrice: 5, totalPrice: 1000 }
        ],
        totalAmount: 2750,
        orderDate: new Date()
      }
    ];

    const pos = [];
    for (const po of posData) {
      const existingPO = await PurchaseOrder.findOne({ poNumber: po.poNumber });
      if (existingPO) {
        pos.push(existingPO);
      } else {
        const newPO = new PurchaseOrder(po);
        await newPO.save();
        pos.push(newPO);
      }
    }
    console.log(`Purchase Orders seeded (Count: ${pos.length})`);

    const poMap = {};
    pos.forEach(po => poMap[po.poNumber] = po._id);

    // ---------------------------------------------------------
    // 6. SEED GOODS RECEIPTS (GRN)
    // ---------------------------------------------------------
    console.log('Seeding Goods Receipts...');
    // We only create GRNs for POs that are approved/submitted/completed
    const grnsData = [
      {
        grnNumber: 'GRN-2026-0001',
        purchaseOrderId: poMap['PO-2026-0001'],
        status: 'RECEIVED',
        receivedDate: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000), // 25 days ago
        items: [
          { itemId: itemMap['ELEC-LAP-001'], receivedQuantity: 10 },
          { itemId: itemMap['ELEC-MOU-002'], receivedQuantity: 20 }
        ]
      },
      {
        grnNumber: 'GRN-2026-0002',
        purchaseOrderId: poMap['PO-2026-0002'],
        status: 'RECEIVED',
        receivedDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
        items: [
          { itemId: itemMap['OFF-PAP-001'], receivedQuantity: 20 }, // Partial receipt
          { itemId: itemMap['OFF-PEN-002'], receivedQuantity: 100 }
        ]
      }
    ];

    let grnsSeededCount = 0;
    for (const grn of grnsData) {
      const existingGRN = await GoodsReceipt.findOne({ grnNumber: grn.grnNumber });
      if (!existingGRN) {
        const newGRN = new GoodsReceipt(grn);
        await newGRN.save();
        grnsSeededCount++;

        // Update Inventory Logic (As typical in real projects)
        // If GRN is received, we must add to stock
        if (grn.status === 'RECEIVED') {
          for (const grnItem of grn.items) {
             await Item.findByIdAndUpdate(grnItem.itemId, {
               $inc: { quantity: grnItem.receivedQuantity }
             });
          }
        }
      }
    }
    console.log(`Goods Receipts seeded (New Count: ${grnsSeededCount})`);

    console.log('\n=====================================');
    console.log('✅ SEEDING COMPLETED SUCCESSFULLY ✅');
    console.log('=====================================\n');

  } catch (error) {
    console.error('Error seeding database:', error);
  } finally {
    await mongoose.connection.close();
    console.log('MongoDB connection closed.');
  }
}

seedDatabase();
