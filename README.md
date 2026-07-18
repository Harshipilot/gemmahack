# Gemma Supermarket Intelligence Dashboard

This project is a full-stack supermarket analytics dashboard that combines a FastAPI backend, a React/Vite frontend, and SQLite-backed inventory data. It is designed for demoing inventory intelligence, reorder planning, sales trends, and expiry alerts in a single web application.

## Project Overview

The application provides:
- A live inventory dashboard with KPI summaries
- Product analytics for fast-moving and slow-moving items
- Reorder recommendations and low-stock insights
- Expiry alert views for near-expiry inventory
- A conversational chatbot-style context endpoint for inventory questions

## Tech Stack

- Backend: FastAPI, Uvicorn, APScheduler
- Frontend: React, Vite
- Database: SQLite
- Containerization: Docker
- Deployment target: Render Web Service

## Project Structure

- backend/: FastAPI application, routes, analytics, scheduler
- data/: seed logic and supermarket dataset
- frontend/: React dashboard UI
- tests/: basic seed/database verification tests

## Prerequisites

- Python 3.11+
- Node.js 20+
- Docker (optional, for containerized deployment)

## Local Development

1. Open the project folder.
2. Create and activate a virtual environment:
   - Windows PowerShell:
     - python -m venv venv
     - .\venv\Scripts\Activate.ps1
3. Install backend dependencies:
   - pip install -r backend/requirements.txt
4. Install frontend dependencies:
   - cd frontend
   - npm install
5. Start the backend:
   - cd ..
   - uvicorn backend.main:app --reload --host 0.0.0.0 --port 8000
6. Start the frontend:
   - cd frontend
   - npm run dev

The frontend will typically run at http://localhost:5173 and the API will be available at http://localhost:8000/api.

## Running with Docker

Build the image:

```bash
docker build -t gemma-dashboard .
```

Run the container:

```bash
docker run -p 8000:8000 gemma-dashboard
```

The app will be available on port 8000.

## Render Deployment

This project is prepared for deployment on Render as a Web Service using Docker.

### Render Configuration

Use these settings in Render:
- Environment: Docker
- Build Command: leave empty or use the default Docker build flow
- Start Command: leave empty; the container already starts the app
- Port: 8000
- Health Check Path: /

Render will use the container's startup command defined in the Dockerfile. The app listens on the port provided by the PORT environment variable, which Render sets automatically.

## Notes on the Docker Setup

The Dockerfile now:
- Builds the React frontend with Vite
- Copies the built frontend assets into the container
- Starts the FastAPI app with Uvicorn
- Uses the correct Render-compatible port variable

## Testing

Run the backend tests with:

```bash
python -m pytest -q
```

If pytest is not installed yet, install it first:

```bash
pip install pytest
```

## Submission Summary

This submission demonstrates a complete end-to-end supermarket intelligence solution with a containerized deployment path for Render.
