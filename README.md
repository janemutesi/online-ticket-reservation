# Student Online Ticket Reservation System

A microservices-based application for managing student event ticket reservations.

## Architecture

- Backend Service: Handles core ticket reservation logic and user management
- Microservice: Manages payment processing and email notifications
- Kubernetes: Orchestrates containerized services
- CI/CD: Automated testing and deployment using Jenkins and GitHub Actions

## API Endpoints

### Backend Service (localhost:3000)

- `GET /api/tickets`: List all available tickets
- `POST /api/reservations`: Create a new ticket reservation

### Microservice (localhost:3001)

- `POST /webhook`: Stripe payment webhook
- `GET /health`: Service health check

## Setup Instructions

1. Install dependencies:
   ```bash
   cd backend && npm install
   cd ../microservice && npm install
   ```

2. Set up environment variables:
   - Backend: MongoDB connection string
   - Microservice: Stripe keys, SMTP settings

3. Start services:
   ```bash
   # Backend
   cd backend && npm start
   
   # Microservice
   cd microservice && npm start
   ```

## Docker Deployment

```bash
# Build images
docker build -t ticket-backend ./backend
docker build -t ticket-microservice ./microservice

# Run containers
docker run -p 3000:3000 ticket-backend
docker run -p 3001:3001 ticket-microservice
```

## Kubernetes Deployment

```bash
kubectl apply -f k8s/
```

## Testing

Run tests for both services:

```bash
cd backend && npm test
cd ../microservice && npm test
```