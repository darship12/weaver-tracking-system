import json
import logging
from django.conf import settings

logger = logging.getLogger(__name__)

class KafkaProducer:
    def __init__(self):
        self._producer = None

    def _get_producer(self):
        if self._producer is None:
            try:
                from kafka import KafkaProducer as KP
                self._producer = KP(
                    bootstrap_servers=settings.KAFKA_BOOTSTRAP_SERVERS,
                    value_serializer=lambda v: json.dumps(v).encode("utf-8"),
                    key_serializer=lambda v: v.encode("utf-8") if v else None,
                    acks="all",
                    retries=3,
                )
            except Exception as e:
                logger.error(f"Failed to connect to Kafka: {e}")
                raise
        return self._producer

    def publish(self, topic, message, key=None):
        try:
            producer = self._get_producer()
            future = producer.send(topic, value=message, key=key)
            producer.flush()
            record_metadata = future.get(timeout=10)
            logger.info(f"Message sent to {topic} partition {record_metadata.partition}")
            return True
        except Exception as e:
            logger.error(f"Failed to publish to Kafka topic {topic}: {e}")
            raise
