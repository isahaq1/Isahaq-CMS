import { Router, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { prisma } from '../lib/prisma';
import { authenticate, AuthRequest, requireRole } from '../middleware/auth';
import { logActivity } from '../lib/helpers';
import { paramId } from '../lib/params';

const router = Router();

const uploadDir = process.env.UPLOAD_DIR || './uploads';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${uuidv4()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: Number(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = /jpeg|jpg|png|gif|webp|svg|pdf|mp4|webm/;
    const ext = allowed.test(path.extname(file.originalname).toLowerCase());
    const mime = allowed.test(file.mimetype.split('/')[1] || '');
    if (ext || mime) cb(null, true);
    else cb(new Error('File type not allowed'));
  },
});

function getMediaType(mimeType: string): string {
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType.startsWith('video/')) return 'video';
  if (mimeType === 'application/pdf') return 'document';
  return 'other';
}

router.use(authenticate);

router.get('/', async (req: AuthRequest, res: Response) => {
  const { companyId } = req.query;
  if (!companyId) {
    return res.status(400).json({ success: false, error: 'companyId query parameter required' });
  }

  const media = await prisma.media.findMany({
    where: { companyId: String(companyId) },
    orderBy: { createdAt: 'desc' },
  });
  return res.json({ success: true, data: media });
});

router.post(
  '/upload',
  requireRole('SUPER_ADMIN', 'GROUP_ADMIN', 'COMPANY_ADMIN', 'EDITOR'),
  upload.single('file'),
  async (req: AuthRequest, res: Response) => {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No file uploaded' });
    }

    const { companyId, alt } = req.body;
    if (!companyId) {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ success: false, error: 'companyId required' });
    }

    const url = `/uploads/${req.file.filename}`;
    const media = await prisma.media.create({
      data: {
        companyId,
        filename: req.file.filename,
        originalName: req.file.originalname,
        mimeType: req.file.mimetype,
        size: req.file.size,
        url,
        type: getMediaType(req.file.mimetype),
        alt: alt || null,
      },
    });

    await logActivity(req.user!.userId, 'uploaded', 'media', media.id, media.originalName);
    return res.status(201).json({ success: true, data: media });
  }
);

router.delete(
  '/:id',
  requireRole('SUPER_ADMIN', 'GROUP_ADMIN', 'COMPANY_ADMIN'),
  async (req: AuthRequest, res: Response) => {
    const media = await prisma.media.findUnique({ where: { id: paramId(req.params.id) } });
    if (!media) return res.status(404).json({ success: false, error: 'Media not found' });

    const filePath = path.join(uploadDir, media.filename);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

    await prisma.media.delete({ where: { id: paramId(req.params.id) } });
    return res.json({ success: true, message: 'Media deleted' });
  }
);

export default router;
