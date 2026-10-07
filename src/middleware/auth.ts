import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { HttpError } from '../errors';
import { User } from '../models/User';

export const signToken = (user: User) =>
  jwt.sign({ sub: String(user.id), role: user.role }, config.jwtSecret, { expiresIn: config.jwtExpiresIn });

export const requireAuth = async (req: Request, res: Response, next: NextFunction) => {
  const header = req.headers.authorization ?? '';
  const [scheme, token] = header.split(' ');
  if (scheme !== 'Bearer' || !token) throw new HttpError(401, 'unauthorized', 'Missing bearer token');

  let payload: jwt.JwtPayload;
  try {
    payload = jwt.verify(token, config.jwtSecret) as jwt.JwtPayload;
  } catch {
    throw new HttpError(401, 'unauthorized', 'Invalid or expired token');
  }

  const user = await User.findByPk(Number(payload.sub));
  if (!user) throw new HttpError(401, 'unauthorized', 'User no longer exists');
  res.locals.user = user;
  next();
};

export const requireRole =
  (role: 'admin' | 'editor') => (_req: Request, res: Response, next: NextFunction) => {
    const user = res.locals.user as User;
    if (role === 'admin' && user.role !== 'admin') {
      throw new HttpError(403, 'forbidden', 'Only admins can do this');
    }
    next();
  };
