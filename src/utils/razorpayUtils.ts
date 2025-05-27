import Razorpay from 'razorpay';
import crypto from 'crypto';

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID! as string,
    key_secret: process.env.RAZORPAY_KEY_SECRET! as string
});

export const createRazorpayOrder = (amount: number): Promise<any> => {
    return new Promise((resolve, reject) => {
        const options = {
            amount: amount * 100, // Amount in paise
            currency: 'INR',
            receipt: `order_receipt_${Date.now()}`,
            payment_capture: 1,
        };

        razorpay.orders.create(options, (err, order) => {
            if (err) reject(err);
            resolve(order);
        });
    });
};

export const verifySignature = (paymentId: string, orderId: string, signature: string): boolean => {
    const body = `${orderId}|${paymentId}`;
    const expectedSignature = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
        .update(body.toString())
        .digest('hex');

    return signature === expectedSignature;
};
