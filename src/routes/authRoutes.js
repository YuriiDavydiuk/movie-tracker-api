import { Router } from 'express';
import { celebrate } from 'celebrate';

import {
  loginUser,
  logoutUser,
  registerUser,
  refreshUserSession,
  getCurrentUser,
} from '../controllers/authController.js';
import {
  loginUserSchema,
  registerUserSchema,
} from '../validations/authValidation.js';

import { authenticate } from '../middleware/authenticate.js';

const router = Router();

router.post('/auth/register', celebrate(registerUserSchema), registerUser);
router.get('/auth/me', authenticate, getCurrentUser);

router.post('/auth/login', celebrate(loginUserSchema), loginUser);

router.post('/auth/logout', logoutUser);

router.post('/auth/refresh', refreshUserSession);

export default router;
