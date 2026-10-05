import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import User from '../models/User.js';
import 'dotenv/config';

const seedAdmin = async () => {
  try {
    // 1. Connect to the database using existing connection string
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    console.log(`Connected to MongoDB: ${conn.connection.host}`);

    // 2. Check if admin already exists
    const adminEmail = 'admin@gmail.com';
    const existingAdmin = await User.findOne({ email: adminEmail });

    if (existingAdmin) {
      console.log('Admin already exists. Skipping seed.');
      process.exit(0);
    }

    // 3. Admin does not exist, hash password with exact same configuration (bcrypt rounds=10)
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash('Admin@123', saltRounds);

    // 4. Create the admin user using the exact User schema requirements
    const adminUser = new User({
      name: 'Super Admin',      // Required by schema
      email: adminEmail,        // Required by schema
      password: hashedPassword, // Required by schema
      role: 'ADMIN',            // Enum matching ['ADMIN', 'USER']
      isActive: true,           // Default is true anyway
    });

    // 5. Save the user
    await adminUser.save();
    console.log('Admin user created successfully!');

    process.exit(0);
  } catch (error) {
    console.error('Error seeding admin user:', error);
    process.exit(1);
  }
};

seedAdmin();
