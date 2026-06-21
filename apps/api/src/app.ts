import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import authRoutes from './routes/auth';
import groupRoutes from './routes/groups';
import companyRoutes from './routes/companies';
import siteRoutes from './routes/sites';
import pageRoutes from './routes/pages';
import navigationRoutes from './routes/navigation';
import mediaRoutes from './routes/media';
import dashboardRoutes from './routes/dashboard';
import languageRoutes from './routes/languages';
import publicRoutes from './routes/public';

const app = express();

app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true,
  })
);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

const uploadDir = process.env.UPLOAD_DIR || './uploads';
app.use('/uploads', express.static(path.resolve(uploadDir)));

app.get('/api/health', (_req, res) => {
  res.json({ success: true, message: 'Group CMS API is running' });
});

app.use('/api/auth', authRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/companies', companyRoutes);
app.use('/api/sites', siteRoutes);
app.use('/api/pages', pageRoutes);
app.use('/api/navigation', navigationRoutes);
app.use('/api/media', mediaRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/languages', languageRoutes);
app.use('/api/public', publicRoutes);

app.use((_req, res) => {
  res.status(404).json({ success: false, error: 'Route not found' });
});

app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  // Prisma unique constraint violation
  if (
    typeof err === 'object' &&
    err !== null &&
    'code' in err &&
    (err as { code: string }).code === 'P2002'
  ) {
    const target = ((err as { meta?: { target?: string[] } }).meta?.target || []).join(', ');
    return res.status(409).json({ success: false, error: `A record with this ${target || 'value'} already exists` });
  }
  const message = err instanceof Error ? err.message : 'Internal server error';
  return res.status(500).json({ success: false, error: message });
});

export default app;
