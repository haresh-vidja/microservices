#!/bin/bash

# Microservices Startup Script
# Starts API Gateway and all microservices using PM2

echo "🚀 Starting Microservices Infrastructure..."
echo ""

# Create logs directory if it doesn't exist
mkdir -p logs

# Install dependencies for API Gateway if not already installed
if [ ! -d "api-gateway/node_modules" ]; then
    echo "📦 Installing API Gateway dependencies..."
    cd api-gateway && npm install && cd ..
fi

# Start all services using PM2 ecosystem
echo "🔧 Starting services with PM2..."
pm2 start ecosystem.config.js

echo ""
echo "✅ All services started!"
echo ""
echo "🌐 API Gateway (Single Entry Point): http://localhost:8000"
echo "📚 API Documentation: http://localhost:8000/api/docs"
echo "🏥 Health Check: http://localhost:8000/health"
echo "📊 Service Status: http://localhost:8000/api/status"
echo ""
echo "🔍 Individual Services (Direct Access):"
echo "   • Customer Service: http://localhost:3001"
echo "   • Sellers Service: http://localhost:3002"
echo "   • Media Service: http://localhost:3003"
echo "   • Products Service: http://localhost:3004"
echo "   • Orders Service: http://localhost:3005"
echo "   • Admin Service: http://localhost:3006"
echo "   • Notifications Service: http://localhost:3007"
echo ""
echo "📱 PM2 Commands:"
echo "   pm2 status         # Check service status"
echo "   pm2 logs           # View all logs"
echo "   pm2 logs gateway   # View gateway logs only"
echo "   pm2 restart all    # Restart all services"
echo "   pm2 stop all       # Stop all services"
echo "   pm2 delete all     # Delete all services"
echo ""
echo "🎯 Use API Gateway at port 8000 for all API requests!"
echo "   Example: curl http://localhost:8000/api/customer/customers"