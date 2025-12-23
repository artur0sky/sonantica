# Sonántica Docker Helper Script (PowerShell)
# "Adjust. Listen. Decide."

param(
    [Parameter(Position=0)]
    [string]$Command = "help",
    
    [Parameter(Position=1)]
    [string]$Service = "web"
)

# Colors
function Write-Success { Write-Host "✓ $args" -ForegroundColor Green }
function Write-Error { Write-Host "✗ $args" -ForegroundColor Red }
function Write-Info { Write-Host "ℹ $args" -ForegroundColor Blue }
function Write-Warning { Write-Host "⚠ $args" -ForegroundColor Yellow }

function Write-Header {
    Write-Host "╔════════════════════════════════════════╗" -ForegroundColor Blue
    Write-Host "║         Sonántica Docker CLI          ║" -ForegroundColor Blue
    Write-Host "║   Audio-first multimedia player       ║" -ForegroundColor Blue
    Write-Host "╚════════════════════════════════════════╝" -ForegroundColor Blue
    Write-Host ""
}

function Test-Docker {
    if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
        Write-Error "Docker is not installed. Please install Docker Desktop first."
        exit 1
    }
    
    if (-not (docker compose version 2>$null)) {
        Write-Error "Docker Compose is not available. Please install Docker Desktop."
        exit 1
    }
    
    Write-Success "Docker and Docker Compose are installed"
}

function Initialize-Directories {
    Write-Info "Creating required directories..."
    
    @("media", "buckets", "config", "docker") | ForEach-Object {
        if (-not (Test-Path $_)) {
            New-Item -ItemType Directory -Path $_ | Out-Null
        }
    }
    
    if (-not (Test-Path ".env")) {
        Copy-Item ".env.example" ".env"
        Write-Success "Created .env file from .env.example"
        Write-Warning "Please edit .env file with your configuration"
    }
    
    Write-Success "Directories created"
}

function Start-Production {
    Write-Info "Starting Sonántica in production mode..."
    docker compose up -d web
    
    $port = $env:WEB_PORT
    if (-not $port) { $port = "3000" }
    
    Write-Success "Sonántica is running at http://localhost:$port"
    Write-Info "View logs: .\docker.ps1 logs"
}

function Start-Development {
    Write-Info "Starting Sonántica in development mode..."
    docker compose --profile dev up dev
}

function Start-WithTools {
    Write-Info "Starting Sonántica with file browser..."
    docker compose --profile tools up -d web filebrowser
    
    $webPort = $env:WEB_PORT
    if (-not $webPort) { $webPort = "3000" }
    
    $fbPort = $env:FILEBROWSER_PORT
    if (-not $fbPort) { $fbPort = "8080" }
    
    Write-Success "Sonántica is running at http://localhost:$webPort"
    Write-Success "File Browser is running at http://localhost:$fbPort"
}

function Stop-Services {
    Write-Info "Stopping all services..."
    docker compose down
    Write-Success "All services stopped"
}

function Show-Logs {
    param([string]$ServiceName = "web")
    Write-Info "Viewing logs for $ServiceName..."
    docker compose logs -f $ServiceName
}

function Rebuild-Images {
    Write-Info "Rebuilding Docker images..."
    docker compose build --no-cache
    Write-Success "Images rebuilt"
}

function Remove-All {
    $response = Read-Host "This will remove all containers, images, and volumes. Are you sure? (y/N)"
    if ($response -eq "y" -or $response -eq "Y") {
        Write-Info "Cleaning up..."
        docker compose down -v --rmi all
        Write-Success "Cleanup complete"
    } else {
        Write-Info "Cleanup cancelled"
    }
}

function Show-Status {
    Write-Info "Service status:"
    docker compose ps
    Write-Host ""
    Write-Info "Resource usage:"
    
    $containers = docker compose ps -q
    if ($containers) {
        docker stats --no-stream $containers
    } else {
        Write-Warning "No running containers"
    }
}

function Test-Health {
    Write-Info "Checking service health..."
    
    $port = $env:WEB_PORT
    if (-not $port) { $port = "3000" }
    
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:$port/health" -UseBasicParsing -TimeoutSec 3
        if ($response.StatusCode -eq 200) {
            Write-Success "Web service is healthy"
        }
    } catch {
        Write-Error "Web service is not responding"
    }
}

function Backup-Config {
    $timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
    $backupFile = "config-backup-$timestamp.zip"
    
    Write-Info "Creating backup: $backupFile"
    Compress-Archive -Path "config" -DestinationPath $backupFile
    Write-Success "Backup created: $backupFile"
}

function Show-Help {
    @"
Usage: .\docker.ps1 [command] [service]

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
  .\docker.ps1 start          # Start production
  .\docker.ps1 dev            # Start development
  .\docker.ps1 logs web       # View web service logs
  .\docker.ps1 logs dev       # View dev service logs
  .\docker.ps1 tools          # Start with file browser

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

"@
}

# Main execution
Write-Header
Test-Docker

switch ($Command.ToLower()) {
    { $_ -in "start", "prod", "production" } {
        Initialize-Directories
        Start-Production
    }
    { $_ -in "dev", "develop", "development" } {
        Initialize-Directories
        Start-Development
    }
    "tools" {
        Initialize-Directories
        Start-WithTools
    }
    "stop" {
        Stop-Services
    }
    "restart" {
        Stop-Services
        Start-Sleep -Seconds 2
        Start-Production
    }
    "logs" {
        Show-Logs -ServiceName $Service
    }
    { $_ -in "build", "rebuild" } {
        Rebuild-Images
    }
    { $_ -in "clean", "cleanup" } {
        Remove-All
    }
    { $_ -in "status", "ps" } {
        Show-Status
    }
    "health" {
        Test-Health
    }
    "backup" {
        Backup-Config
    }
    "setup" {
        Initialize-Directories
    }
    { $_ -in "help", "--help", "-h" } {
        Show-Help
    }
    default {
        Write-Error "Unknown command: $Command"
        Write-Host ""
        Show-Help
        exit 1
    }
}
