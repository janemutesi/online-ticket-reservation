const request = require('supertest');
const { app, sequelize, server } = require('../app');
const Ticket = require('../models/Ticket')(sequelize);

describe('Ticket API', () => {
  beforeAll(async () => {
    await sequelize.sync({ force: true });
  });

  beforeEach(async () => {
    await Ticket.destroy({ truncate: true });
    await Ticket.bulkCreate([
      { eventName: 'Test Event 1', description: 'Description 1', date: new Date(), price: 50, quantity: 100 },
      { eventName: 'Test Event 2', description: 'Description 2', date: new Date(), price: 75, quantity: 100 }
    ]);
  });

  afterEach(async () => {
    await Ticket.destroy({ truncate: true });
  });

  afterAll(async () => {
    await sequelize.close();
    if (server) server.close();
  });

  describe('GET /api/tickets', () => {
    it('should return available tickets', async () => {
      const response = await request(app)
        .get('/api/tickets')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(2);
      expect(response.body[0]).toHaveProperty('eventName');
      expect(response.body[0]).toHaveProperty('price');
      expect(response.body[0]).toHaveProperty('quantity');
    });
  });
});