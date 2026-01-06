#!/usr/bin/env bash
# Sonántica Docker Helper Script
# "Adjust. Listen. Decide."

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Functions
print_header() {
    echo -e "${BLUE}╔════════════════════════════════════════╗${NC}"
    echo -e "${BLUE}║         Sonántica Docker CLI          ║${NC}"
    echo -e "${BLUE}║   Audio-first multimedia player       ║${NC}"
    echo -e "${BLUE}╚════════════════════════════════════════╝${NC}"
    echo ""
}

print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

print_info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

# Check if Docker is installed
check_docker() {
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed. Please install Docker first."
        exit 1
    fi
    
    if ! docker compose version &> /dev/null; then
        print_error "Docker Compose is not installed. Please install Docker Compose first."
        exit 1
    fi
    
    print_success "Docker and Docker Compose are installed"
}

# Create required directories
setup_directories() {
    print_info "Creating required directories..."
    
    mkdir -p media buckets config docker
    
    if [ ! -f .env ]; then
        cp .env.example .env
        print_success "Created .env file from .env.example"
        print_warning "Please edit .env file with your configuration"
    fi
    
    print_success "Directories created"
}

# Production commands
start_production() {
    print_info "Starting Sonántica in production mode..."
    docker compose up -d web
    print_success "Sonántica is running at http://localhost:${WEB_PORT:-3000}"
    print_info "View logs: ./docker.sh logs"
}

start_development() {
    print_info "Starting Sonántica in development mode..."
    docker compose --profile dev up dev
}

start_with_tools() {
    print_info "Starting Sonántica with file browser..."
    docker compose --profile tools up -d web filebrowser
    print_success "Sonántica is running at http://localhost:${WEB_PORT:-3000}"
    print_success "File Browser is running at http://localhost:${FILEBROWSER_PORT:-8080}"
}

# Stop services
stop_services() {
    print_info "Stopping all services..."
    docker compose down
    print_success "All services stopped"
}

# View logs
view_logs() {
    SERVICE=${1:-web}
    print_info "Viewing logs for $SERVICE..."
    docker compose logs -f "$SERVICE"
}

# Rebuild
rebuild() {
    print_info "Rebuilding Docker images..."
    docker compose build --no-cache
    print_success "Images rebuilt"
}

# Clean up
cleanup() {
    print_warning "This will remove all containers, images, and volumes. Are you sure? (y/N)"
    read -r response
    if [[ "$response" =~ ^[Yy]$ ]]; then
        print_info "Cleaning up..."
        docker compose down -v --rmi all
        print_success "Cleanup complete"
    else
        print_info "Cleanup cancelled"
    fi
}

# Status
show_status() {
    print_info "Service status:"
    docker compose ps
    echo ""
    print_info "Resource usage:"
    docker stats --no-stream $(docker compose ps -q) 2>/dev/null || print_warning "No running containers"
}

# Health check
health_check() {
    print_info "Checking service health..."
    
    if curl -f http://localhost:${WEB_PORT:-3000}/health &> /dev/null; then
        print_success "Web service is healthy"
    else
        print_error "Web service is not responding"
    fi
}

# Backup config
backup_config() {
    BACKUP_FILE="config-backup-$(date +%Y%m%d-%H%M%S).tar.gz"
    print_info "Creating backup: $BACKUP_FILE"
    tar -czf "$BACKUP_FILE" config/
    print_success "Backup created: $BACKUP_FILE"
}

# Show help
show_help() {
    cat << EOF
Usage: ./docker.sh [command]

Commands:
  start           Start in production mode
  dev             Start in development mode (with hot-reload)
  tools           Start with file browser
  stop            Stop all services
  restart         Restart services
  logs [service]  View logs (default: web)
  build           Rebuild Docker images
  clean           Remove all containers, images, and volumes
  status          Show service status and resource usage
  health          Check service health
  backup          Backup config directory
  setup           Create required directories and .env file
  help            Show this help message

Examples:
  ./docker.sh start          # Start production
  ./docker.sh dev            # Start development
  ./docker.sh logs web       # View web service logs
  ./docker.sh logs dev       # View dev service logs
  ./docker.sh tools          # Start with file browser

Environment:
  Edit .env file to configure ports and paths
  
  WEB_PORT=3000              # Production web port
  DEV_PORT=5173              # Development port
  MEDIA_PATH=./media         # Path to media files
  BUCKETS_PATH=./buckets     # Path to buckets
  CONFIG_PATH=./config       # Path to config

Philosophy:
  "Every file has an intention."
  "Respect the intention of the sound and the freedom of the listener."

EOF
}

# Main script
main() {
    print_header
    check_docker
    
    case "${1:-help}" in
        start|prod|production)
            setup_directories
            start_production
            ;;
        dev|develop|development)
            setup_directories
            start_development
            ;;
        tools)
            setup_directories
            start_with_tools
            ;;
        stop)
            stop_services
            ;;
        restart)
            stop_services
            sleep 2
            start_production
            ;;
        logs)
            view_logs "${2:-web}"
            ;;
        build|rebuild)
            rebuild
            ;;
        clean|cleanup)
            cleanup
            ;;
        status|ps)
            show_status
            ;;
        health)
            health_check
            ;;
        backup)
            backup_config
            ;;
        setup)
            setup_directories
            ;;
        help|--help|-h)
            show_help
            ;;
        *)
            print_error "Unknown command: $1"
            echo ""
            show_help
            exit 1
            ;;
    esac
}

# Run main function
main "$@"
