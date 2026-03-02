import json
import logging
import os
import django

logger = logging.getLogger(__name__)

def start_consumer():
    os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings.development")
    django.setup()

    from django.conf import settings
    from kafka import KafkaConsumer

    topics = list(settings.KAFKA_TOPICS.values())

    consumer = KafkaConsumer(
        *topics,
        bootstrap_servers=settings.KAFKA_BOOTSTRAP_SERVERS,
        auto_offset_reset="earliest",
        enable_auto_commit=True,
        group_id="weaver-consumer-group",
        value_deserializer=lambda m: json.loads(m.decode("utf-8")),
    )

    logger.info(f"Kafka consumer started. Listening to topics: {topics}")

    for message in consumer:
        try:
            handle_message(message.topic, message.value)
        except Exception as e:
            logger.error(f"Error processing message from {message.topic}: {e}")

def handle_message(topic, data):
    from django.conf import settings
    logger.info(f"Processing message from topic {topic}: {data}")

    if topic == settings.KAFKA_TOPICS["ATTENDANCE_CREATED"]:
        logger.info(f"Attendance event: employee {data.get('employee_id')} - {data.get('status')}")

    elif topic == settings.KAFKA_TOPICS["PRODUCTION_CREATED"]:
        logger.info(f"Production event: {data.get('meter_woven')}m by employee {data.get('employee_id')}")
        # Trigger async salary recalculation
        from celery_tasks.tasks import recalculate_salary_task
        from datetime import datetime
        date_str = data.get("date", "")
        if date_str:
            date = datetime.fromisoformat(date_str)
            recalculate_salary_task.delay(data["employee_id"], date.month, date.year)

    elif topic == settings.KAFKA_TOPICS["SALARY_CALCULATED"]:
        logger.info(f"Salary event: salary_id {data.get('salary_id')}")

if __name__ == "__main__":
    start_consumer()
