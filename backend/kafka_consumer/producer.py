import json
import logging
from django.conf import settings

logger = logging.getLogger(__name__)


class KafkaProducerService:
    def __init__(self):
        self.producer = None
        self._connect()

    def _connect(self):
        try:
            from kafka import KafkaProducer
            self.producer = KafkaProducer(
                bootstrap_servers=settings.KAFKA_BOOTSTRAP_SERVERS,
                value_serializer=lambda v: json.dumps(v).encode('utf-8'),
                key_serializer=lambda k: k.encode('utf-8') if k else None,
                acks='all',
                retries=3,
            )
        except Exception as e:
            logger.warning(f"Kafka producer not available: {e}")
            self.producer = None

    def send_event(self, event_type: str, data: dict):
        if not self.producer:
            logger.warning(f"Kafka unavailable, skipping event: {event_type}")
            return False

        topic = settings.KAFKA_TOPICS.get(event_type)
        if not topic:
            logger.error(f"Unknown event type: {event_type}")
            return False

        try:
            future = self.producer.send(topic, key=event_type, value=data)
            self.producer.flush(timeout=5)
            logger.info(f"Kafka event sent: {event_type} to topic {topic}")
            return True
        except Exception as e:
            logger.error(f"Failed to send Kafka event {event_type}: {e}")
            return False

    def close(self):
        if self.producer:
            self.producer.close()
