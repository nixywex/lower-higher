import { describe, test, expect } from '@jest/globals';
import express from 'express';

const factsRouter = require('../routes/facts').default;
const request = require('supertest');

const app = express();
app.use(express.json());
app.use('/facts', factsRouter);

describe('POST /facts/submit', () => {
  test('returns 400 if ids is not an array', async () => {
    const res = await request(app).post('/facts/submit').send({ ids: 'not-an-array' });
    expect(res.status).toBe(400);
  });

  test('returns 400 if ids contains non-numbers', async () => {
    const res = await request(app)
      .post('/facts/submit')
      .send({ ids: [1, 'two'] });
    expect(res.status).toBe(400);
  });

  test('returns 400 if ids is missing', async () => {
    const res = await request(app).post('/facts/submit').send({});
    expect(res.status).toBe(400);
  });

  test('returns 400 if ids is empty', async () => {
    const res = await request(app).post('/facts/submit').send({ ids: [] });
    expect(res.status).toBe(400);
  });

  test('returns 400 if ids contain non-existent fact ids', async () => {
    const res = await request(app)
      .post('/facts/submit')
      .send({ ids: [99999] });
    expect(res.status).toBe(400);
  });

  test('returns score and rightAnswers for valid ids', async () => {
    const res = await request(app)
      .post('/facts/submit')
      .send({ ids: [1, 2, 3] });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('rightAnswers');
    expect(res.body).toHaveProperty('score');
    expect(Array.isArray(res.body.rightAnswers)).toBe(true);
  });
});

describe('GET /facts/round', () => {
  test('returns an array of facts without answer field', async () => {
    const res = await request(app).get('/facts/round');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    res.body.forEach((f: Record<string, unknown>) => {
      expect(f).toHaveProperty('id');
      expect(f).toHaveProperty('question');
      expect(f).not.toHaveProperty('answer');
    });
  });
});
