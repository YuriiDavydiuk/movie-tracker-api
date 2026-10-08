import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { User } from '../src/models/user.js';
import { Session } from '../src/models/session.js';
import { createTestAgent } from './helpers/createTestAgent.js';

const credentials = { email: 'user@example.com', password: 'test-password' };
let mongoServer;
let agent;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
  await User.init();
});

beforeEach(() => {
  agent = createTestAgent();
});

afterEach(async () => {
  await Promise.all([User.deleteMany({}), Session.deleteMany({})]);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer?.stop();
});

describe('POST /auth/register', () => {
  it('registers a user, hashes the password and authenticates the session', async () => {
    const res = await agent.post('/auth/register').send(credentials);

    expect(res.status).toBe(201);
    expect(res.body.user.email).toBe(credentials.email);
    expect(res.body.user).not.toHaveProperty('password');
    const user = await User.findById(res.body.user._id);
    expect(user.password).not.toBe(credentials.password);
    expect(await bcrypt.compare(credentials.password, user.password)).toBe(true);
    expect(await Session.countDocuments({ userId: user._id })).toBe(1);
    for (const name of ['accessToken', 'refreshToken', 'sessionId']) {
      const cookie = res.headers['set-cookie'].find((value) => value.startsWith(`${name}=`));
      expect(cookie).toContain('HttpOnly');
      expect(cookie).toContain('Secure');
      expect(cookie).toContain('SameSite=None');
    }
    const current = await agent.get('/auth/me');
    expect(current.status).toBe(200);
    expect(current.body.user._id).toBe(res.body.user._id);
    expect(current.body.user).not.toHaveProperty('password');
  });

  it('rejects a duplicate email', async () => {
    await agent.post('/auth/register').send(credentials);
    const res = await agent.post('/auth/register').send(credentials);
    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Email in use');
    expect(await User.countDocuments()).toBe(1);
    expect(await Session.countDocuments()).toBe(1);
  });

  it.each([
    ['invalid email', { ...credentials, email: 'invalid' }],
    ['short password', { ...credentials, password: 'ab' }],
    ['missing email', { password: credentials.password }],
    ['missing password', { email: credentials.email }],
  ])('rejects registration with %s', async (_name, body) => {
    const res = await agent.post('/auth/register').send(body);
    expect(res.status).toBe(400);
    expect(await User.countDocuments()).toBe(0);
    expect(await Session.countDocuments()).toBe(0);
  });
});

describe('POST /auth/login', () => {
  beforeEach(async () => {
    await User.create({ ...credentials, password: await bcrypt.hash(credentials.password, 10) });
  });

  it('logs in and grants access to a protected endpoint', async () => {
    const res = await agent.post('/auth/login').send(credentials);
    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe(credentials.email);
    expect(res.body.user).not.toHaveProperty('password');
    const current = await agent.get('/auth/me');
    expect(current.status).toBe(200);
    expect(current.body.user._id).toBe(res.body.user._id);
  });

  it.each([
    ['wrong password', { ...credentials, password: 'wrong-password' }],
    ['non-existent user', { ...credentials, email: 'missing@example.com' }],
  ])('rejects %s', async (_name, body) => {
    const res = await agent.post('/auth/login').send(body);
    expect(res.status).toBe(401);
    expect(res.body.message).toBe('Invalid credentials');
    expect(await Session.countDocuments()).toBe(0);
    expect((await agent.get('/auth/me')).status).toBe(401);
  });

  it.each([
    ['email', { password: credentials.password }],
    ['password', { email: credentials.email }],
    ['both credentials', {}],
  ])('rejects login without %s', async (_name, body) => {
    const res = await agent.post('/auth/login').send(body);
    expect(res.status).toBe(400);
    expect(await Session.countDocuments()).toBe(0);
  });
});

describe('POST /auth/logout', () => {
  it('removes the session, clears cookies and revokes protected access', async () => {
    const registration = await agent.post('/auth/register').send(credentials);
    expect(registration.status).toBe(201);
    expect((await agent.get('/auth/me')).status).toBe(200);
    const oldCookies = registration.headers['set-cookie'].map((cookie) => cookie.split(';')[0]).join('; ');

    const res = await agent.post('/auth/logout');
    expect(res.status).toBe(204);
    expect(res.text).toBe('');
    expect(await Session.countDocuments()).toBe(0);
    for (const name of ['accessToken', 'refreshToken', 'sessionId']) {
      const cookie = res.headers['set-cookie'].find((value) => value.startsWith(`${name}=`));
      expect(cookie).toContain(`${name}=;`);
      expect(cookie).toContain('Expires=Thu, 01 Jan 1970');
    }
    expect((await agent.get('/auth/me')).status).toBe(401);
    // Even replaying the old credentials cannot restore a deleted session.
    expect((await createTestAgent().get('/auth/me').set('Cookie', oldCookies)).status).toBe(401);
  });
});
