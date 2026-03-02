#!/usr/bin/env python
"""
Kafka Consumer Service - Run as separate process
Usage: python -m kafka_consumer.consumer
"""
import os
import sys
import json
import logging
import django

# Setup Django
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.conf import settings

logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO, format='%(asctime)s %(levelname)s %(message)s')


def handle_attendance_created(data):
    logger.info(f"Processing attendance event: {data}")
    # Additional processing can go here
    # e.g., update aggregated stats, send notifications, etc.


def handle_production_created(data):
    logger.info(f"Processing production event: {data}")
    # Trigger salary recalculation check


def handle_salary_calculated(data):
    logger.info(f"Processing salary event: {data}")
    # Send notifications, update dashboards, etc.


HANDLERS = {
    settings.KAFKA_TOPICS['ATTENDANCE_CREATED']: handle_attendance_created,
    settings.KAFKA_TOPICS['PRODUCTION_CREATED']: handle_production_created,
    settings.KAFKA_TOPICS['SALARY_CALCULATED']: handle_salary_calculated,
}


def run_consumer():
    try:
        from kafka import KafkaConsumer
        topics = list(settings.KAFKA_TOPICS.values())

        consumer = KafkaConsumer(
            *topics,
            bootstrap_servers=settings.KAFKA_BOOTSTRAP_SERVERS,
            group_id='weaver-consumer-group',
            auto_offset_reset='earliest',
            enable_auto_commit=True,
            value_deserializer=lambda m: json.loads(m.decode('utf-8')),
        )

        logger.info(f"Kafka consumer started, listening to topics: {topics}")

        for message in consumer:
            try:
                handler = HANDLERS.get(message.topic)
                if handler:
                    handler(message.value)
                else:
                    logger.warning(f"No handler for topic: {message.topic}")
            except Exception as e:
                logger.error(f"Error processing message: {e}")

    except ImportError:
        logger.error("kafka-python not installed. Run: pip install kafka-python")
    except Exception as e:
        logger.error(f"Kafka consumer error: {e}")


if __name__ == '__main__':
    run_consumer()
