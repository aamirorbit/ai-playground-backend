#!/bin/bash

# AI Model Playground - Server Startup Script
echo "🚀 Starting AI Model Playground Server..."

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "⚠️  .env file not found. Creating from example..."
    cp env.example .env
    echo "📝 Please edit .env file with your API keys before running again."
    exit 1
fi

# Check if MongoDB is running
echo "🔍 Checking MongoDB connection..."
if ! mongo --eval "db.runCommand('ping')" > /dev/null 2>&1; then
    echo "⚠️  MongoDB not running. Starting MongoDB..."
    if command -v mongod &> /dev/null; then
        mongod --fork --logpath /tmp/mongodb.log --dbpath ~/data/db 2>/dev/null || echo "Please start MongoDB manually"
    else
        echo "❌ MongoDB not installed. Please install MongoDB first."
        exit 1
    fi
fi

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install --legacy-peer-deps
fi

# Build the project
echo "🔨 Building project..."
npm run build

# Start the server
echo "✅ Starting development server..."
echo "🌐 Server will be available at: http://localhost:3000"
echo "📡 WebSocket available at: ws://localhost:3000"
echo ""
echo "Press Ctrl+C to stop the server"
npm run start:dev 