import request from 'supertest';
import mongoose from 'mongoose';
import {app} from '../../index';    

describe('GET /courses', () => {
  beforeAll(async () => {
    await mongoose.connect(process.env.MONGODB_TEST_URI!);
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  it('should return 200 and courses array', async () => {
    const res = await request(app).get('/courses');
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});
