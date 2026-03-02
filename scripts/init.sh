#!/bin/bash
set -e
echo "=== Weaver Tracking System Initialization ==="

echo "Waiting for database..."
sleep 5

echo "Running migrations..."
docker compose exec backend python manage.py migrate

echo "Creating superuser..."
docker compose exec backend python manage.py shell -c "
from apps.authentication.models import User
if not User.objects.filter(username='admin').exists():
    User.objects.create_superuser('admin', 'admin@weaver.com', 'admin123', role='admin')
    print('Superuser created: admin / admin123')
else:
    print('Superuser already exists')
"

echo "Creating Kafka topics..."
docker compose exec kafka kafka-topics --create --if-not-exists --bootstrap-server localhost:9092 --replication-factor 1 --partitions 3 --topic attendance_created
docker compose exec kafka kafka-topics --create --if-not-exists --bootstrap-server localhost:9092 --replication-factor 1 --partitions 3 --topic production_created
docker compose exec kafka kafka-topics --create --if-not-exists --bootstrap-server localhost:9092 --replication-factor 1 --partitions 3 --topic salary_calculated

echo "=== Setup complete! ==="
echo "Backend:  http://localhost/api/"
echo "Frontend: http://localhost"
echo "API Docs: http://localhost/api/docs/"
echo "Grafana:  http://localhost:3001 (admin/weaver123)"
echo "Django Admin: http://localhost/admin/ (admin/admin123)"
