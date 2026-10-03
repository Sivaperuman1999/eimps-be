import express from 'express';
import cors from 'cors';
import { responseHandler } from './middlewares/responseHandler.js';
import { errorHandler } from './middlewares/errorHandler.js';
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import categoryRoutes from './routes/categoryRoutes.js';
import itemRoutes from './routes/itemRoutes.js';
import vendorRoutes from './routes/vendorRoutes.js';
import purchaseOrderRoutes from './routes/purchaseOrderRoutes.js';
import goodsReceiptRoutes from './routes/goodsReceiptRoutes.js';
import metadataRoutes from './routes/metadataRoutes.js';

const app = express();

// Global Middlewares
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Attach custom response interceptor equivalent
app.use(responseHandler);

import dashboardRoutes from './routes/dashboardRoutes.js';
import searchRoutes from './routes/searchRoutes.js';

// Routes will be mounted here in future steps
app.use('/auth', authRoutes);
app.use('/users', userRoutes);
app.use('/categories', categoryRoutes);
app.use('/items', itemRoutes);
app.use('/vendors', vendorRoutes);
app.use('/purchase-orders', purchaseOrderRoutes);
app.use('/goods-receipt', goodsReceiptRoutes);
app.use('/metadata', metadataRoutes);
app.use('/dashboard', dashboardRoutes);
app.use('/search', searchRoutes);

// Fallback 404 Route
app.use((req, res, next) => {
  const error = new Error(`Cannot ${req.method} ${req.originalUrl}`);
  error.statusCode = 404;
  next(error);
});

// Global Error Handler (Must be last)
app.use(errorHandler);

export default app;
