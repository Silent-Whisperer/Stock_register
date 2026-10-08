import { Router, Request, Response } from 'express';

const router = Router();

/**
 * POST /api/auth/login
 * Validates system access password (9090) on the backend.
 */
router.post('/auth/login', (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body;

  if (!password || typeof password !== 'string' || password.trim() !== '9090') {
    res.status(401).json({
      success: false,
      error: 'Invalid password. Security password is 9090.',
    });
    return Promise.resolve();
  }

  const userEmail = (email && typeof email === 'string' && email.trim()) || 'operator@company.in';
  res.status(200).json({
    success: true,
    user: {
      id: `usr-${userEmail.replace(/[^a-zA-Z0-9]/g, '')}`,
      email: userEmail,
      role: 'operator',
      fullName: userEmail.split('@')[0].toUpperCase(),
    },
  });
  return Promise.resolve();
});

export default router;
