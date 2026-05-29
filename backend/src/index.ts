import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { connectDB } from './config/db';
import authRoutes from './routes/auth';
import borrowerRoutes from './routes/borrower';
import executiveRoutes from './routes/executive';

// Initialize configuration
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

// Connect to MongoDB
connectDB();

// Core Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve Static Uploads (Salary Slips)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// API Routes Mapping
app.use('/api/auth', authRoutes);
app.use('/api/borrower', borrowerRoutes);
app.use('/api/executive', executiveRoutes);

// Base Route / Health Check
app.get('/', (req, res) => {
  res.json({ 
    message: 'Welcome to LendFlow LMS API Engine!',
    status: 'Operational',
    version: '1.0.0'
  });
});

// 404 Route handler
app.use((req, res) => {
  res.status(404).json({ message: 'Requested endpoint does not exist' });
});

// Launch Express Server
app.listen(PORT, () => {
  console.log(`[LendFlow API] Listening on http://localhost:${PORT}`);
});
