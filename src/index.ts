import express, { Express, Request, Response } from 'express';
import dotenv from 'dotenv';
import webhookRouter from './routes/webhook';

// Load environment variables
dotenv.config();

const app: Express = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Root endpoint
app.get('/', (_req: Request, res: Response) => {
  res.status(200).json({
    service: 'Homie WhatsApp Travel Guide Bot',
    version: '1.0.0',
    status: 'running'
  });
});

// Webhook routes
app.use('/webhook', webhookRouter);

// 404 handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({ error: 'Not found' });
});

// Error handler
app.use((err: Error, _req: Request, res: Response) => {
  console.error('Error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`\n🚀 Homie WhatsApp Bot is running!`);
  console.log(`📍 Server: http://localhost:${PORT}`);
  console.log(`🔗 Webhook: http://localhost:${PORT}/webhook`);
  console.log(`🏥 Health: http://localhost:${PORT}/health`);
  console.log(`\nEnvironment: ${process.env.NODE_ENV || 'development'}\n`);
});

export default app;
