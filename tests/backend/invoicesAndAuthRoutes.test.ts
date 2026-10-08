import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../../server/index';

describe('Backend Auth and Invoices API Endpoints', () => {
  it('should reject login when password is not 9090', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'operator@company.in', password: 'wrong' });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toContain('Invalid password');
  });

  it('should accept login when password is 9090', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'operator@company.in', password: '9090' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.user).toBeDefined();
    expect(res.body.user.email).toBe('operator@company.in');
  });

  it('should reject clear invoices when password is not 9090', async () => {
    const res = await request(app)
      .post('/api/invoices/clear')
      .send({ password: 'wrongpassword' });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toContain('Invalid security password');
  });

  it('should allow clearing invoices when password is 9090', async () => {
    const res = await request(app)
      .post('/api/invoices/clear')
      .send({ password: '9090' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toContain('cleared successfully');
  });
});
