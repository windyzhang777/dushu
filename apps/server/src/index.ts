import cors from 'cors';
import express from 'express';
import mongoose from 'mongoose';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { documentRouter } from './routes/documentRoutes';
import { uploadRouter } from './routes/uploadRoutes';
// dotenv.config({ path: path.join(__dirname, '../.env') });

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const UPLOAD_DIR = path.join(__dirname, '../uploads');

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
app.use(express.json());

// Routes
app.use('/health', (_req, res) => res.json({ ok: true, services: 'dushu-server' }));
app.use('/api/upload', express.static(UPLOAD_DIR));

app.use('/api/document', documentRouter);
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
