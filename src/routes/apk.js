import express from 'express';
import { generateApk } from '../services/apkGenerator.js';

const router = express.Router();

router.post('/generate-apk', async (req, res, next) => {
  try {
    const { url, name } = req.body;

    if (!url || !name) {
      return res.status(400).json({ 
        error: 'Missing required fields' 
      });
    }

    const downloadUrl = await generateApk(url, name);
    res.json({ downloadUrl });
  } catch (error) {
    next(error);
  }
});

export const apkRouter = router;