import sys
import os

# Ensure src is in path
sys.path.append(os.path.join(os.path.dirname(__file__), 'src'))

from src.celery_app import app
from src.infrastructure.logging.logger_config import setup_logger
from src.config.settings import settings

logger = setup_logger("AudioWorker", settings.LOG_LEVEL)

if __name__ == '__main__':
    logger.info("🚀 Sonántica Worker Entrypoint Starting...")
    app.start()
