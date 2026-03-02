#!/usr/bin/env python
"""Seed script for demo data"""
import os
import sys
import django

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))) + '/backend')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.development')
django.setup()

from datetime import date, timedelta
from decimal import Decimal
from apps.employee.models import Employee
from apps.attendance.models import Attendance
from apps.production.models import Production
import random

print("Seeding employees...")
employees_data = [
    {"employee_id": "EMP001", "name": "Ramesh Kumar", "phone": "9876543210", "skill_level": "expert", "salary_rate": 15},
    {"employee_id": "EMP002", "name": "Suresh Patel", "phone": "9876543211", "skill_level": "intermediate", "salary_rate": 12},
    {"employee_id": "EMP003", "name": "Mahesh Singh", "phone": "9876543212", "skill_level": "beginner", "salary_rate": 10},
    {"employee_id": "EMP004", "name": "Dinesh Yadav", "phone": "9876543213", "skill_level": "expert", "salary_rate": 15},
    {"employee_id": "EMP005", "name": "Rajesh Sharma", "phone": "9876543214", "skill_level": "intermediate", "salary_rate": 12},
]

employees = []
for data in employees_data:
    emp, created = Employee.objects.get_or_create(
        employee_id=data["employee_id"],
        defaults={**data, "joining_date": date(2023, 1, 1), "address": "Surat, Gujarat"}
    )
    employees.append(emp)
    if created:
        print(f"  Created: {emp.name}")

print("Seeding attendance & production for last 30 days...")
today = date.today()
designs = ["Patola", "Banarasi", "Kanjivaram", "Chanderi", "Pochampally"]
looms = ["L001", "L002", "L003", "L004", "L005"]

for i in range(30):
    day = today - timedelta(days=i)
    for emp in employees:
        status = random.choice(["present", "present", "present", "absent"])
        Attendance.objects.get_or_create(
            employee=emp, date=day,
            defaults={"status": status}
        )
        if status == "present":
            meters = Decimal(str(round(random.uniform(20, 50), 2)))
            Production.objects.get_or_create(
                employee=emp, date=day, loom_number=random.choice(looms),
                defaults={
                    "design": random.choice(designs),
                    "meter_woven": meters,
                    "defects": random.randint(0, 3),
                    "work_hours": Decimal("8.0"),
                }
            )

print("Seeding complete!")
