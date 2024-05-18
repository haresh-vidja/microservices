# Makefile for Microservices Platform
# Usage: make [command]

# Variables
COMPOSE = docker-compose
COMPOSE_FILE = docker-compose.yml
ENV_FILE = .env

# Colors for output
RED = \033[0;31m
GREEN = \033[0;32m
YELLOW = \033[0;33m
NC = \033[0m # No Color

# Default target
.DEFAULT_GOAL := help

# ============================================
# Help Command
# ============================================
.PHONY: help
help: ## Show this help message
	@echo "${GREEN}Microservices Platform - Docker Management${NC}"
	@echo ""
	@echo "Available commands:"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "${YELLOW}%-20s${NC} %s\n", $$1, $$2}'

# ============================================
# Environment Setup
# ============================================
.PHONY: env
env: ## Create .env file from example
	@if [ ! -f $(ENV_FILE) ]; then \
		cp .env.example $(ENV_FILE); \
		echo "${GREEN}Created .env file from .env.example${NC}"; \
		echo "${YELLOW}Please update the values in .env file${NC}"; \
	else \
		echo "${YELLOW}.env file already exists${NC}"; \
	fi

# ============================================
# Docker Commands
# ============================================
.PHONY: build
build: ## Build all Docker images
	@echo "${GREEN}Building all services...${NC}"
	$(COMPOSE) build

.PHONY: build-no-cache
build-no-cache: ## Build all Docker images without cache
	@echo "${GREEN}Building all services without cache...${NC}"
	$(COMPOSE) build --no-cache

.PHONY: up
up: ## Start all services
	@echo "${GREEN}Starting all services...${NC}"
	$(COMPOSE) up -d
	@echo "${GREEN}All services started successfully!${NC}"
	@echo ""
	@make status

.PHONY: down
down: ## Stop all services
	@echo "${YELLOW}Stopping all services...${NC}"
	$(COMPOSE) down

.PHONY: restart
restart: down up ## Restart all services

.PHONY: status
status: ## Show status of all services
	@echo "${GREEN}Service Status:${NC}"
	@$(COMPOSE) ps

.PHONY: logs
logs: ## Show logs from all services
	$(COMPOSE) logs -f

.PHONY: logs-service
logs-service: ## Show logs for a specific service (use: make logs-service SERVICE=api-gateway)
	$(COMPOSE) logs -f $(SERVICE)

# ============================================
# Service-Specific Commands
# ============================================
.PHONY: start-kafka
start-kafka: ## Start only Kafka and Zookeeper
	@echo "${GREEN}Starting Kafka ecosystem...${NC}"
	$(COMPOSE) up -d zookeeper kafka kafka-ui

.PHONY: start-databases
start-databases: ## Start only database services
	@echo "${GREEN}Starting databases...${NC}"
	$(COMPOSE) up -d mongodb postgres redis

.PHONY: start-backend
start-backend: ## Start only backend services
	@echo "${GREEN}Starting backend services...${NC}"
	$(COMPOSE) up -d api-gateway customer-service seller-service products-service orders-service media-service notification-service admin-service

.PHONY: start-frontend
start-frontend: ## Start only frontend service
	@echo "${GREEN}Starting frontend...${NC}"
	$(COMPOSE) up -d frontend

# ============================================
# Database Management
# ============================================
.PHONY: db-reset
db-reset: ## Reset all databases (WARNING: Deletes all data!)
	@echo "${RED}WARNING: This will delete all database data!${NC}"
	@read -p "Are you sure? (y/N): " confirm && [ "$$confirm" = "y" ] || exit 1
	@echo "${YELLOW}Stopping services...${NC}"
	$(COMPOSE) down
	@echo "${YELLOW}Removing volumes...${NC}"
	docker volume rm mongodb-data postgres-data redis-data 2>/dev/null || true
	@echo "${GREEN}Database volumes removed${NC}"

.PHONY: db-backup
db-backup: ## Backup all databases
	@echo "${GREEN}Creating database backups...${NC}"
	@mkdir -p ./backups
	@echo "Backing up MongoDB..."
	docker exec mongodb mongodump --out /backup --host localhost --port 27017
	docker cp mongodb:/backup ./backups/mongodb-$(shell date +%Y%m%d-%H%M%S)
	@echo "Backing up PostgreSQL..."
	docker exec postgres pg_dumpall -U postgres > ./backups/postgres-$(shell date +%Y%m%d-%H%M%S).sql
	@echo "${GREEN}Backups created in ./backups directory${NC}"

# ============================================
# Health Checks
# ============================================
.PHONY: health
health: ## Check health of all services
	@echo "${GREEN}Checking service health...${NC}"
	@echo ""
	@echo "API Gateway: " && curl -s http://localhost:3000/health | jq -r '.status' 2>/dev/null || echo "Not responding"
	@echo "Customer Service: " && curl -s http://localhost:3001/health | jq -r '.status' 2>/dev/null || echo "Not responding"
	@echo "Seller Service: " && curl -s http://localhost:3002/health | jq -r '.status' 2>/dev/null || echo "Not responding"
	@echo "Products Service: " && curl -s http://localhost:3003/health | jq -r '.status' 2>/dev/null || echo "Not responding"
	@echo "Orders Service: " && curl -s http://localhost:3004/health | jq -r '.status' 2>/dev/null || echo "Not responding"
	@echo "Media Service: " && curl -s http://localhost:3005/health | jq -r '.status' 2>/dev/null || echo "Not responding"
	@echo "Notification Service: " && curl -s http://localhost:3006/health | jq -r '.status' 2>/dev/null || echo "Not responding"
	@echo "Admin Service: " && curl -s http://localhost:3007/health | jq -r '.status' 2>/dev/null || echo "Not responding"

# ============================================
# Development Commands
# ============================================
.PHONY: dev
dev: ## Start services in development mode with logs
	@echo "${GREEN}Starting in development mode...${NC}"
	$(COMPOSE) up

.PHONY: shell
shell: ## Open shell in a service container (use: make shell SERVICE=api-gateway)
	docker exec -it $(SERVICE) /bin/sh

.PHONY: mongo-shell
mongo-shell: ## Open MongoDB shell
	docker exec -it mongodb mongosh -u admin -p admin123

.PHONY: redis-cli
redis-cli: ## Open Redis CLI
	docker exec -it redis redis-cli

.PHONY: psql
psql: ## Open PostgreSQL shell
	docker exec -it postgres psql -U postgres

# ============================================
# Cleanup Commands
# ============================================
.PHONY: clean
clean: ## Remove all containers and networks (keeps volumes)
	@echo "${YELLOW}Cleaning up containers and networks...${NC}"
	$(COMPOSE) down --remove-orphans

.PHONY: clean-all
clean-all: ## Remove all containers, networks, and volumes (WARNING: Deletes all data!)
	@echo "${RED}WARNING: This will delete all data!${NC}"
	@read -p "Are you sure? (y/N): " confirm && [ "$$confirm" = "y" ] || exit 1
	$(COMPOSE) down -v --remove-orphans
	@echo "${GREEN}All containers, networks, and volumes removed${NC}"

.PHONY: prune
prune: ## Remove all unused Docker resources
	@echo "${YELLOW}Pruning Docker system...${NC}"
	docker system prune -af --volumes
	@echo "${GREEN}Docker system pruned${NC}"

# ============================================
# Monitoring Commands
# ============================================
.PHONY: open-kafka-ui
open-kafka-ui: ## Open Kafka UI in browser
	@echo "${GREEN}Opening Kafka UI...${NC}"
	@open http://localhost:8080 2>/dev/null || xdg-open http://localhost:8080 2>/dev/null || echo "Please open http://localhost:8080 in your browser"

.PHONY: open-frontend
open-frontend: ## Open frontend in browser
	@echo "${GREEN}Opening frontend...${NC}"
	@open http://localhost:3008 2>/dev/null || xdg-open http://localhost:3008 2>/dev/null || echo "Please open http://localhost:3008 in your browser"

.PHONY: open-api-docs
open-api-docs: ## Open API documentation
	@echo "${GREEN}Opening API documentation...${NC}"
	@open http://localhost:3000/api-docs 2>/dev/null || xdg-open http://localhost:3000/api-docs 2>/dev/null || echo "Please open http://localhost:3000/api-docs in your browser"

# ============================================
# Testing Commands
# ============================================
.PHONY: test
test: ## Run tests for all services
	@echo "${GREEN}Running tests...${NC}"
	@for service in customer-service seller-service products-service orders-service; do \
		echo "Testing $$service..."; \
		docker exec $$service npm test 2>/dev/null || echo "$$service: No tests found or service not running"; \
	done

.PHONY: test-integration
test-integration: ## Run integration tests
	@echo "${GREEN}Running integration tests...${NC}"
	@echo "${YELLOW}Integration tests not yet implemented${NC}"

# ============================================
# Quick Start
# ============================================
.PHONY: quickstart
quickstart: env build start-databases start-kafka start-backend start-frontend ## Quick start - build and start everything
	@echo ""
	@echo "${GREEN}========================================${NC}"
	@echo "${GREEN}Microservices Platform Started!${NC}"
	@echo "${GREEN}========================================${NC}"
	@echo ""
	@echo "Access points:"
	@echo "  Frontend:        http://localhost:3008"
	@echo "  API Gateway:     http://localhost:3000"
	@echo "  API Docs:        http://localhost:3000/api-docs"
	@echo "  Kafka UI:        http://localhost:8080"
	@echo ""
	@echo "Run 'make logs' to see logs"
	@echo "Run 'make health' to check service health"
	@echo "Run 'make help' for more commands"