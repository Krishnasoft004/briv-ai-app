#!/bin/bash

echo "Starting Briv AI Development Environment..."

# Create logs directories
mkdir -p logs
mkdir -p backend/logs

# Check if Python backend dependencies are installed
if [ ! -d "backend/venv" ]; then
    echo "Setting up Python virtual environment..."
    cd backend
    python3 -m venv venv
    source venv/bin/activate
    pip install -r requirements.txt
    cd ..
fi

# Start Python backend in background
echo "Starting Python backend..."
cd backend
source venv/bin/activate
python run.py &
PYTHON_PID=$!
cd ..

# Wait a moment for Python backend to start
sleep 3

# Start Next.js frontend
echo "Starting Next.js frontend..."
npm run dev &
NEXTJS_PID=$!

# Function to cleanup processes on exit
cleanup() {
    echo "Shutting down services..."
    kill $PYTHON_PID 2>/dev/null
    kill $NEXTJS_PID 2>/dev/null
    exit
}

# Set trap to cleanup on script exit
trap cleanup SIGINT SIGTERM

echo "Both services are starting..."
echo "Python Backend: http://localhost:5000"
echo "Next.js Frontend: http://localhost:3000"
echo "Press Ctrl+C to stop all services"

# Wait for both processes
wait
