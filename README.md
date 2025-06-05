# Chapter Performance Dashboard

A Node.js application for managing and analyzing chapter-wise performance data for students. Features MongoDB for storage, Redis for caching and rate limiting, file upload, and robust filtering.

---

## Features
- RESTful API for chapters
- File upload (JSON)
- Caching with Redis
- Rate limiting (per IP, Redis-backed)
- Docker support

---

## 1. Local Setup

### Prerequisites
- Node.js (v18+ recommended)
- npm
- MongoDB instance
- Redis server (local or Docker)

### Redis in Local Development
- The app uses Redis for caching and rate limiting.
- **If Redis is not running locally, the app will now log a warning and continue to run.**
- In this case, caching and rate limiting will be disabled, but you can still use all other features.
- In production, the app will require Redis to be available and will exit if it cannot connect.

### Redis in Deployment (Production)
- **You do NOT need to run a Redis Docker image or manage Redis yourself in deployment if you use a managed/cloud Redis service (e.g., Redis Cloud, Upstash, Render Redis Blueprint, etc.).**
- Provision a managed Redis instance and get the connection details (host, port, username, password).
- Set these details as environment variables (`REDIS_HOST`, `REDIS_PORT`, `REDIS_USERNAME`, `REDIS_PASSWORD`) in your deployment platform's dashboard.
- Your deployed app will automatically connect to the cloud Redis instance.
- This is the recommended and secure approach for production deployments.

### Installation
1. Clone the repository:
   ```sh
   git clone https://github.com/Key-runnnnnnn/Performance-Navigator.git
   cd Chapter Performance Dashboard
   ```
2. Install dependencies:
   ```sh
   npm install
   ```
3. Copy `.env.example` to `.env` and update values as needed.

4. Start MongoDB and Redis (see below for Docker instructions).
   - To run Redis locally with Docker:
     ```sh
     docker run --name redis-dashboard -p 6379:6379 -d redis
     ```

5. Run the app:
   ```sh
   npm run dev
   ```
   or
   ```sh
   npm start
   ```

---

## 2. Running with Docker

### Build and Run the App
```sh
docker build -t chapter-dashboard .
docker run --env-file .env -p 8000:8000 -v "${PWD}/uploads:/app/uploads" chapter-dashboard
```

### Run Redis with Docker
If you don’t have Redis locally, you can run it easily with Docker:
```sh
docker run --name redis-dashboard -p 6379:6379 -d redis
```

---

## 3. Environment Variables
See `.env.example` for all required variables. Typical values:

```
# .env.example
PORT=3000
MONGODB_URI=mongodb://localhost:27017/chapter_dashboard
ADMIN_TOKEN=YOUR_ADMIN_TOKEN
```

---

## 4. Caching (How to Check)
- The app uses Redis to cache chapter queries for 60 seconds.
- To test: Fetch `/api/v1/chapters` with the same filters multiple times. The first request will hit the database, subsequent requests (within 60s) will be served from cache (faster response).
- You can also connect to Redis CLI and check for keys like `chapter:*`.

---

## 5. Rate Limiting (How to Check)
- The app limits each IP to **10 requests per 15 minutes** (configurable in `middleware/rateLimiter.js`).
- To test:
  - Use a tool like curl, Postman, or a browser to make rapid requests to any endpoint (e.g., `/api/v1/chapters`).
  - After 10 requests, you’ll receive HTTP 429 with a message: `Too many requests from this IP, please try again after 15 minutes.`
- You can check Redis for keys like `ratelimit:*`.

---

## 6. Example Requests

### Get all chapters
```
GET http://localhost:8000/api/v1/chapters
```

### Upload chapters (admin only)
```
POST http://localhost:8000/api/v1/chapters
Content-Type: multipart/form-data
Body: file (JSON)
```

---

## 7. Troubleshooting
- **Redis connection error:** Ensure Redis is running and your `REDIS_URL` is correct.
- **MongoDB connection error:** Ensure MongoDB is running and your `MONGODB_URI` is correct.
- **Docker issues:** Ensure ports are not already in use.

---

## 8. Useful Commands

- **Start app:** `npm run dev` or `npm start`
- **Start Redis (Docker):** `docker run --name redis-dashboard -p 6379:6379 -d redis`
- **Build Docker image:** `docker build -t chapter-dashboard .`
- **Run Docker container:** `docker run -p 8000:8000 --env-file .env chapter-dashboard`

---

