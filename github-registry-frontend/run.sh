#!/bin/bash

# ARA Registry Frontend - Development Server

echo "🎯 Starting ARA Registry Frontend..."
echo ""

# Check if uvicorn is installed
if ! command -v uvicorn &> /dev/null; then
    echo "Installing dependencies..."
    pip install -r requirements.txt
fi

# Start the server
echo "Server starting at http://localhost:8000"
echo "Press Ctrl+C to stop"
echo ""

uvicorn api.main:app --reload --host 0.0.0.0 --port 8000
