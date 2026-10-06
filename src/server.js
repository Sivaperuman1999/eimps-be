import app from './app.js';
import { connectDB } from './config/db.js';
import 'dotenv/config';

const PORT = process.env.PORT || 3000;

// Connect to Database
await connectDB();

// Start Server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on port ${PORT}`);
});
