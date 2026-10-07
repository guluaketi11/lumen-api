import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { HttpError } from '../errors';
import { requireAuth, signToken } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { User } from '../models/User';
import { loginSchema, registerSchema } from '../schemas';

export const authRouter = Router();

authRouter.post('/register', validate(registerSchema), async (req, res) => {
  const { name, email, password } = req.body;
  const existing = await User.findOne({ where: { email } });
  if (existing) throw new HttpError(409, 'email_taken', 'An account with this email already exists');

  const user = await User.create({ name, email, passwordHash: await bcrypt.hash(password, 10) });
  res.status(201).json({ token: signToken(user), user });
});

authRouter.post('/login', validate(loginSchema), async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ where: { email } });
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    throw new HttpError(401, 'invalid_credentials', 'Email or password is incorrect');
  }
  res.json({ token: signToken(user), user });
});

authRouter.get('/me', requireAuth, (_req, res) => {
  res.json({ user: res.locals.user });
});
