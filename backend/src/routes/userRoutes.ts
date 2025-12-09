import { Router } from 'express';
import { changePassword, me } from '../controllers/usersController';
import { jwtMiddleware } from '../middleware/auth';

export const userRouter = Router();

userRouter.get('/me', jwtMiddleware, me);
userRouter.put('/change-password', jwtMiddleware, changePassword);
