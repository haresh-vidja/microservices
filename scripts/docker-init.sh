#!/bin/bash

# Docker initialization script for microservices platform

set -e

echo "Initializing microservices platform..."

# Check Docker installation
if ! command -v docker &> /dev/null; then
    echo "Error: Docker is not installed"
    exit 1
fi

# Check Docker Compose installation
if ! command -v docker-compose &> /dev/null; then
    echo "Error: Docker Compose is not installed"
    exit 1
fi

# Create required directories
mkdir -p docker/mongo-init
mkdir -p docker/postgres-init
mkdir -p docker/nginx/sites-available
mkdir -p docker/nginx/ssl
mkdir -p backups

# Create .env from example if not exists
if [ ! -f .env ]; then
    cp .env.example .env
    echo "Created .env file from template"
fi

# Pull required images
echo "Pulling Docker images..."
docker-compose pull

echo "Initialization complete!"
echo "Run 'make quickstart' to start all services"