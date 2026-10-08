import request from 'supertest';
import app from '../../src/app.js';

export const createTestAgent = () => {
  const agent = request.agent(app);

  // Supertest uses HTTP. Keep production Secure cookies unchanged, but allow
  // this test-only cookie jar to replay them over its local HTTP connection.
  agent.use((req) => {
    req.on('response', (res) => {
      const cookies = res.headers['set-cookie'] || [];
      agent.jar.setCookies(
        cookies.map((cookie) => cookie.replace(/;\s*Secure\b/gi, '')),
      );
    });
  });

  return agent;
};
