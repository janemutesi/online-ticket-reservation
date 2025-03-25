require('dotenv').config();
const express = require('express');
const amqp = require('amqplib');
const nodemailer = require('nodemailer');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const app = express();
app.use(express.json());

// Email configuration
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

// RabbitMQ connection
app.connectQueue = async function() {
  try {
    const connection = await amqp.connect('amqp://localhost');
    const channel = await connection.createChannel();
    const queue = 'reservation_queue';
    
    await channel.assertQueue(queue, { durable: true });
    
    const consumer = await channel.consume(queue, async (data) => {
      if (!data) return;
      
      const { amount, paymentMethodId } = JSON.parse(data.content);
      
      try {
        const result = await stripe.paymentIntents.create({
          amount,
          currency: 'usd',
          payment_method: paymentMethodId,
          confirm: true
        });
        
        channel.ack(data);
        return result;
      } catch (error) {
        console.error('Error processing payment:', error);
        channel.nack(data);
        throw error;
      }
    });
    
    return { channel, consumer };
  } catch (error) {
    console.error('Error connecting to RabbitMQ:', error);
    throw error;
  }
}

// Payment webhook endpoint
app.post('/webhook', express.raw({type: 'application/json'}), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  
  try {
    const event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
    
    if (event.type === 'payment_intent.succeeded') {
      const paymentIntent = event.data.object;
      console.log('Payment succeeded:', paymentIntent.id);
    }
    
    res.json({received: true});
  } catch (err) {
    res.status(400).send(`Webhook Error: ${err.message}`);
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'healthy' });
});

// Start server and connect to message queue only if not in test environment
if (process.env.NODE_ENV !== 'test') {
  const PORT = process.env.PORT || 3001;
  app.listen(PORT, () => {
    console.log(`Microservice is running on port ${PORT}`);
    connectQueue();
  });
}

module.exports = app; // For testing purposes