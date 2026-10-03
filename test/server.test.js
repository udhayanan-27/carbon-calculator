const test = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');

const app = require('../server');

test('POST /api/auth/register creates a user', async () => {
  const res = await request(app)
    .post('/api/auth/register')
    .send({
      name: 'Test User',
      email: 'testuser@example.com',
      password: 'secret123'
    });

  assert.equal(res.status, 201);
  assert.equal(res.body.success, true);
  assert.ok(res.body.token);
  assert.equal(res.body.name, 'Test User');
});

test('POST /api/calculate requires valid auth token', async () => {
  const res = await request(app)
    .post('/api/calculate')
    .set('Authorization', 'Bearer invalid-token')
    .send({
      electricity: '150',
      petrolKm: '300',
      diet: '180'
    });

  assert.equal(res.status, 401);
  assert.equal(res.body.success, false);
});

test('GET /api/history returns a list for an authenticated user', async () => {
  const registerRes = await request(app)
    .post('/api/auth/register')
    .send({
      name: 'History User',
      email: 'history@example.com',
      password: 'secret456'
    });

  const token = registerRes.body.token;

  const calcRes = await request(app)
    .post('/api/calculate')
    .set('Authorization', `Bearer ${token}`)
    .send({
      electricity: '100',
      petrolKm: '250',
      diet: '140'
    });

  assert.equal(calcRes.status, 200);

  const historyRes = await request(app)
    .get('/api/history')
    .set('Authorization', `Bearer ${token}`);

  assert.equal(historyRes.status, 200);
  assert.equal(historyRes.body.success, true);
  assert.ok(Array.isArray(historyRes.body.history));
  assert.ok(historyRes.body.history.length >= 1);
});
