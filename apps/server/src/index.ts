import cors from 'cors';
import express from 'express';
import mongoose from 'mongoose';
import { UPLOAD_DIR } from './config';
import { bookRouter } from './routes/bookRoutes';
import { uploadRouter } from './routes/uploadRoutes';
// dotenv.config({ path: path.join(__dirname, '../.env') });

const app = express();
const PORT = process.env.PORT || 4000;
const MONGOURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/dushu';

try {
  await mongoose.connect(MONGOURI);
  console.log('✅ MongoDB connected');
} catch (error) {
  console.error('❌ MongoDB connection error:', error);
}

// Middleware
app.use(cors());
app.use(express.json({ limit: '5mb' })); // Default 100kb is too small for book metadata with cover images
// app.use(express.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded, if needed in the future

// Routes
app.use('/health', (_req, res) => res.json({ ok: true, services: 'dushu-server' }));
app.use('/api/uploads', express.static(UPLOAD_DIR));

app.use('/api/book', bookRouter);
app.use('/api/upload', uploadRouter);

// Health check
// app.get('/api/health', (_req: Request, res: Response) => {
//   res.json({
//     status: 'OK',
//     timestamp: new Date().toISOString(),
//     features: {
//       chunkedUpload: true,
//       maxChunkSize: '10MB',
//       supportedFormats: ['txt', 'pdf', 'epub', 'mobi'],
//     },
//   });
// });

// Error handling middleware
// app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
//   res.status(500).json({ error: err.message || 'Internal server error' });
// });

app.listen(PORT, () => {
  console.log(`🚀 Dushu server running on http://localhost:${PORT}`);
});
