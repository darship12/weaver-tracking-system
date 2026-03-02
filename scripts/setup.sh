#!/bin/bash
# Weaver Tracking System - Setup Script
set -e

echo "🧵 Weaver Employee Tracking System - Setup"
echo "==========================================="

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

log() { echo -e "${GREEN}[✓] $1${NC}"; }
warn() { echo -e "${YELLOW}[!] $1${NC}"; }
error() { echo -e "${RED}[✗] $1${NC}"; exit 1; }

# Check dependencies
command -v docker >/dev/null 2>&1 || error "Docker is required but not installed."
command -v docker-compose >/dev/null 2>&1 || error "Docker Compose is required."

log "Dependencies check passed"

# Copy env file
if [ ! -f backend/.env ]; then
  cp backend/.env.example backend/.env
  warn "Created backend/.env from template. Please update with real values."
fi

# Build and start
log "Building Docker images..."
docker-compose build

log "Starting services..."
docker-compose up -d db redis

echo "Waiting for database..."
sleep 8

log "Starting all services..."
docker-compose up -d

echo "Waiting for backend to be ready..."
sleep 15

# Run migrations and create superuser
log "Running migrations..."
docker-compose exec -T backend python manage.py migrate

log "Creating superuser..."
docker-compose exec -T backend python manage.py shell -c "
from django.contrib.auth.models import User
if not User.objects.filter(username='admin').exists():
    User.objects.create_superuser('admin', 'admin@weaver.com', 'admin123')
    print('Superuser created: admin/admin123')
else:
    print('Superuser already exists')
"

log "Loading sample data..."
docker-compose exec -T backend python manage.py shell << 'PYEOF'
from apps.employee.models import Employee
from datetime import date, timedelta
import random

if Employee.objects.count() == 0:
    names = ['Ramesh Kumar', 'Suresh Patel', 'Priya Sharma', 'Vikram Singh', 'Anita Devi',
             'Rajesh Yadav', 'Meena Kumari', 'Amit Shah', 'Sunita Verma', 'Rahul Gupta']
    skills = ['beginner', 'intermediate', 'expert']
    rates = {'beginner': 10, 'intermediate': 15, 'expert': 20}

    for i, name in enumerate(names):
        skill = random.choice(skills)
        Employee.objects.create(
            employee_id=f'EMP{i+1:03d}',
            name=name,
            phone=f'98765{i:05d}',
            address=f'{random.randint(1,100)} Main Street, City',
            skill_level=skill,
            joining_date=date.today() - timedelta(days=random.randint(30, 365)),
            status='active',
            rate_per_meter=rates[skill],
        )
    print(f'Created {len(names)} sample employees')
else:
    print(f'Employees already exist ({Employee.objects.count()})')
PYEOF

echo ""
echo "==========================================="
echo -e "${GREEN}🎉 Setup complete!${NC}"
echo ""
echo "Access the system:"
echo "  🌐 Frontend:  http://localhost"
echo "  🔧 Backend:   http://localhost:8000"
echo "  📊 Grafana:   http://localhost:3001 (admin/admin123)"
echo "  🔑 Django Admin: http://localhost/admin (admin/admin123)"
echo ""
echo "Stop: docker-compose down"
echo "Logs: docker-compose logs -f [service]"
