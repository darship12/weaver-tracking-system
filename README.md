# 🧵 Weaver Employee Tracking System

A production-ready, full-stack weaver employee management system built with **React**, **Django REST Framework**, **PostgreSQL**, **Apache Kafka**, **Redis**, **Celery**, and **Grafana**.

---

## 🏗️ Architecture Overview

```
Admin/Supervisor/Owner
        ↓
   Browser (React UI)
        ↓
  Nginx (API Gateway)
        ↓
  Django REST API ─────→ JWT Auth
        ↓                     ↓
  Apache Kafka         Redis Cache
        ↓
  Kafka Consumer
        ↓
  PostgreSQL DB ←───── Celery Worker
        ↓
  Grafana Dashboard
```

---

## 📋 Features

- **Authentication**: JWT-based login/logout with role-based access (Admin, Supervisor, Owner)
- **Employee Management**: Add, edit, delete employees with skill levels
- **Attendance Tracking**: Bulk mark attendance daily
- **Production Tracking**: Log meters woven per loom per day
- **Salary Auto-Calculation**: `salary = meters × rate + bonus - deductions`
- **Reports**: Monthly/daily reports with Excel export
- **Grafana Dashboards**: Real-time production and attendance charts
- **Event-Driven**: Kafka events for attendance, production, salary
- **Background Jobs**: Celery for salary calculation and report generation

---

## 🚀 Quick Start with Docker (Recommended)

### Prerequisites
- Docker >= 24.0
- Docker Compose >= 2.20

### Step 1 — Clone and Configure

```bash
cd weaver-tracking-system

# Copy environment file
cp backend/.env.example backend/.env
```

Edit `backend/.env` if needed (defaults work for Docker setup).

### Step 2 — Start All Services

```bash
docker compose up -d --build
```

Wait ~2 minutes for all services to initialize (Kafka takes time).

### Step 3 — Initialize Database

```bash
# Run migrations
docker compose exec backend python manage.py migrate

# Create admin user
docker compose exec backend python manage.py shell -c "
from apps.authentication.models import User
User.objects.create_superuser('admin', 'admin@weaver.com', 'admin123', role='admin')
print('Admin created: admin / admin123')
"

# (Optional) Seed demo data
docker compose exec backend python scripts/seed_data.py
```

### Step 4 — Create Kafka Topics

```bash
docker compose exec kafka kafka-topics --create --bootstrap-server localhost:9092 --replication-factor 1 --partitions 3 --topic attendance_created
docker compose exec kafka kafka-topics --create --bootstrap-server localhost:9092 --replication-factor 1 --partitions 3 --topic production_created
docker compose exec kafka kafka-topics --create --bootstrap-server localhost:9092 --replication-factor 1 --partitions 3 --topic salary_calculated
```

---

## 🌐 Access Points

| Service | URL | Credentials |
|---------|-----|-------------|
| **Frontend** | http://localhost | admin / admin123 |
| **API** | http://localhost/api/ | Bearer JWT |
| **API Docs (Swagger)** | http://localhost/api/docs/ | — |
| **Django Admin** | http://localhost/admin/ | admin / admin123 |
| **Grafana** | http://localhost:3001 | admin / weaver123 |
| **PostgreSQL** | localhost:5432 | weaver_user / weaver_password |

---

## 🛠️ Local Development Setup (Without Docker)

### Backend Setup

```bash
cd backend

# Create virtual environment
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env with your local DB settings

# Set Django settings for development
export DJANGO_SETTINGS_MODULE=config.settings.development

# Run migrations
python manage.py migrate

# Create superuser
python manage.py createsuperuser

# Start development server
python manage.py runserver
```

### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev


```

### Start Celery Worker

```bash
cd backend
celery -A celery_app.celery worker --loglevel=info
```

### Start Celery Beat (Scheduler)

```bash
cd backend
celery -A celery_app.celery beat --loglevel=info
```

### Start Kafka Consumer

```bash
cd backend
python -m kafka_service.consumer
```

---

## 📁 Project Structure

```
weaver-tracking-system/
├── backend/                    # Django REST API
│   ├── apps/
│   │   ├── authentication/     # JWT auth, users
│   │   ├── employee/           # Employee CRUD
│   │   ├── attendance/         # Attendance tracking
│   │   ├── production/         # Production records
│   │   ├── salary/             # Salary calculation
│   │   └── reports/            # Dashboard & exports
│   ├── config/
│   │   ├── settings/
│   │   │   ├── base.py         # Shared settings
│   │   │   ├── development.py  # Dev settings
│   │   │   └── production.py   # Prod settings
│   │   └── urls.py             # Root URL config
│   ├── kafka_service/
│   │   ├── producer.py         # Kafka event publisher
│   │   └── consumer.py         # Kafka event consumer
│   ├── celery_tasks/
│   │   └── tasks.py            # Background Celery tasks
│   └── requirements.txt
│
├── frontend/                   # React + Tailwind CSS
│   └── src/
│       ├── pages/              # Login, Dashboard, Employee, etc.
│       ├── components/         # Reusable UI components
│       ├── services/           # Axios API calls
│       ├── store/              # Zustand state management
│       └── hooks/              # Custom React hooks
│
├── kafka-consumer/             # Standalone Kafka consumer service
├── nginx/                      # Nginx reverse proxy config
├── grafana/                    # Grafana dashboards & provisioning
├── scripts/                    # Utility scripts
└── docker-compose.yml          # Full stack orchestration
```

---

## 📊 API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/login/` | Login, get JWT |
| POST | `/api/auth/logout/` | Logout, blacklist token |
| POST | `/api/auth/token/refresh/` | Refresh access token |
| GET/PUT | `/api/auth/profile/` | Get/update user profile |

### Employees
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET/POST | `/api/employees/` | List / Create |
| GET/PUT/DELETE | `/api/employees/{id}/` | Detail |
| GET | `/api/employees/stats/` | Statistics |

### Attendance
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET/POST | `/api/attendance/` | List / Create |
| GET | `/api/attendance/today/` | Today's summary |
| POST | `/api/attendance/bulk/` | Bulk mark attendance |

### Production
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET/POST | `/api/production/` | List / Create |
| GET | `/api/production/dashboard/` | Dashboard data |

### Salary
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/salary/` | List salary records |
| POST | `/api/salary/calculate/` | Calculate salaries |
| PATCH | `/api/salary/{id}/` | Update salary status |

### Reports
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/reports/dashboard/` | Dashboard stats |
| GET | `/api/reports/daily/` | Daily report |
| GET | `/api/reports/monthly/` | Monthly report |
| GET | `/api/reports/export/excel/?type=production` | Export Excel |

---

## 🔑 Salary Calculation Formula

```
base_salary = total_meters × rate_per_meter
bonus = ₹500 if total_meters > 500 else ₹0
deductions = absent_days × ₹50
total_salary = base_salary + bonus - deductions
```

---

## 📦 Kafka Topics

| Topic | Event | Trigger |
|-------|-------|---------|
| `attendance_created` | Attendance marked | POST /api/attendance/ |
| `production_created` | Production logged | POST /api/production/ |
| `salary_calculated` | Salary computed | POST /api/salary/calculate/ |

---

## 🔧 Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `SECRET_KEY` | — | Django secret key |
| `DB_NAME` | `weaver_db` | PostgreSQL database |
| `DB_USER` | `weaver_user` | PostgreSQL user |
| `DB_PASSWORD` | `weaver_password` | PostgreSQL password |
| `DB_HOST` | `db` | PostgreSQL host |
| `REDIS_URL` | `redis://redis:6379/0` | Redis connection |
| `KAFKA_BOOTSTRAP_SERVERS` | `kafka:9092` | Kafka brokers |

---

## 🐳 Docker Services

| Service | Image | Port |
|---------|-------|------|
| db | postgres:15 | 5432 |
| redis | redis:7 | 6379 |
| zookeeper | cp-zookeeper:7.5 | 2181 |
| kafka | cp-kafka:7.5 | 9092 |
| backend | python:3.11 | 8000 |
| celery-worker | (backend) | — |
| celery-beat | (backend) | — |
| kafka-consumer | (backend) | — |
| frontend | node:20 | 3000 |
| nginx | nginx:alpine | 80 |
| grafana | grafana:10.2 | 3001 |

---

## 🛡️ Security Features

- JWT authentication with token blacklisting on logout
- Role-based access control (Admin, Supervisor, Owner)
- Password hashing via Django's built-in PBKDF2
- CORS configuration
- HTTPS-ready (configure SSL in nginx)

---

## 📈 Grafana Setup

1. Open http://localhost:3001
2. Login: `admin` / `weaver123`
3. Dashboards are auto-provisioned from `grafana/dashboards/`
4. PostgreSQL datasource is auto-configured

---

## 🚨 Troubleshooting

**Kafka not connecting?**
```bash
docker compose logs kafka
# Wait 30-60 seconds for Kafka to fully start
```

**Migrations failing?**
```bash
docker compose exec backend python manage.py migrate --run-syncdb
```

**Frontend can't reach API?**
- Check `VITE_API_URL` in frontend environment
- Ensure nginx is running: `docker compose ps nginx`

**Reset everything:**
```bash
docker compose down -v
docker compose up -d --build
```

---

## 📝 License

MIT License — Built for production weaving factory management.
