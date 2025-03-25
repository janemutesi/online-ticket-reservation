const request = require('supertest');

const mockStripe = {
  paymentIntents: {
    create: jest.fn().mockResolvedValue({ id: 'test_payment_intent' })
  },
  webhooks: {
    constructEvent: jest.fn().mockReturnValue({
      type: 'payment_intent.succeeded',
      data: { object: { id: 'test_payment_intent' } }
    })
  }
};

jest.mock('stripe', () => (() => mockStripe));

jest.mock('amqplib', () => ({
  connect: jest.fn().mockResolvedValue({
    createChannel: jest.fn().mockResolvedValue({
      assertQueue: jest.fn(),
      sendToQueue: jest.fn(),
      consume: jest.fn(),
      ack: jest.fn(),
      nack: jest.fn()
    })
  })
}));

jest.mock('nodemailer', () => ({
  createTransport: jest.fn().mockReturnValue({
    sendMail: jest.fn().mockResolvedValue({})
  })
}));

const app = require('../microservice');

describe('Payment Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /health', () => {
    it('should return healthy status', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body).toEqual({ status: 'healthy' });
    });
  });

  describe('POST /webhook', () => {
    it('should handle valid Stripe webhook events', async () => {
      const response = await request(app)
        .post('/webhook')
        .set('stripe-signature', 'test_signature')
        .send({ type: 'payment_intent.succeeded' })
        .expect(200);

      expect(mockStripe.webhooks.constructEvent).toHaveBeenCalled();
      expect(response.body).toEqual({ received: true });
    });

    it('should handle invalid webhook signatures', async () => {
      mockStripe.webhooks.constructEvent.mockImplementationOnce(() => {
        throw new Error('Invalid signature');
      });

      const response = await request(app)
        .post('/webhook')
        .set('stripe-signature', 'invalid_signature')
        .send({ type: 'payment_intent.succeeded' })
        .expect(400);

      expect(response.text).toBe('Webhook Error: Invalid signature');
    });
  });
});