import { createRazorpayOrder } from '../../controllers/paymentController';
import { Request, Response } from 'express';
import { Course } from '../../models/courseModel';
import { Order } from '../../models/orderModel';

jest.mock('../../models/courseModel');
jest.mock('../../models/orderModel');

describe('createRazorpayOrder', () => {
  it('returns 404 if course not found', async () => {
    const req = {
      body: { courseId: '123' },
      user: { _id: 'user123' },
    } as unknown as Request;

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    } as unknown as Response;

    (Course.findById as jest.Mock).mockResolvedValue(null);

    await createRazorpayOrder(req, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: 'Course not found' });
  });
});
