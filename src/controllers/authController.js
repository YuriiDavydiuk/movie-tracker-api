import {
  createSession,
  setSessionCookies,
  clearSessionCookies,
} from '../services/auth.js';
import { Session } from '../models/session.js';
import { isObjectIdOrHexString } from 'mongoose';
import createHttpError from 'http-errors';
import { User } from '../models/user.js';
import bcrypt from 'bcrypt';

export const registerUser = async (req, res) => {
  const { email, password } = req.body;

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw createHttpError(400, 'Email in use');
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  let newUser;
  try {
    newUser = await User.create({
      email,
      password: hashedPassword,
    });
  } catch (error) {
    if (error.code === 11000 && error.keyPattern?.email) {
      throw createHttpError(400, 'Email in use');
    }
    throw error;
  }

  const newSession = await createSession(newUser._id);

  setSessionCookies(res, newSession);

  res.status(201).json({ user: newUser });
};

export const loginUser = async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });
  if (!user) {
    throw createHttpError(401, 'Invalid credentials');
  }

  const isValidPassword = await bcrypt.compare(password, user.password);
  if (!isValidPassword) {
    throw createHttpError(401, 'Invalid credentials');
  }

  await Session.deleteMany({ userId: user._id });

  const newSession = await createSession(user._id);

  setSessionCookies(res, newSession);

  res.status(200).json({ user });
};

export const logoutUser = async (req, res) => {
  const { sessionId } = req.cookies;

  if (isObjectIdOrHexString(sessionId)) {
    await Session.deleteOne({ _id: sessionId });
  }

  clearSessionCookies(res);

  res.status(204).send();
};

export const refreshUserSession = async (req, res) => {
  const { sessionId, refreshToken } = req.cookies;

  if (!sessionId || !refreshToken) {
    throw createHttpError(401, 'Missing session credentials');
  }

  if (!isObjectIdOrHexString(sessionId)) {
    throw createHttpError(401, 'Invalid session ID');
  }
  // 1. Знаходимо поточну сесію за id сесії та рефреш токеном
  const session = await Session.findOneAndDelete({
    _id: sessionId,
    refreshToken,
  });
  // 2. Якщо такої сесії нема, повертаємо помилку
  if (!session) {
    throw createHttpError(401, 'Session not found');
  }

  // 3. Якщо сесія існує, перевіряємо валідність рефреш токена
  const isSessionTokenExpired = session.refreshTokenValidUntil < new Date();

  // Якщо термін дії рефреш токена вийшов, видаляємо сесію і повертаємо помилку
  if (isSessionTokenExpired) {
    clearSessionCookies(res);
    throw createHttpError(401, 'Session token expired');
  }

  // 5. Створюємо нову сесію та додаємо кукі
  const newSession = await createSession(session.userId);
  setSessionCookies(res, newSession);

  res.status(200).json({
    message: 'Session refreshed',
  });
};

export const getCurrentUser = (req, res) => {
  res.status(200).json({ user: req.user });
};
