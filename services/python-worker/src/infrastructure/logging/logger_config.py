import logging
import os
import sys
from .json_formatter import JSONFormatter

def setup_logger(name: str, log_level: str = "INFO"):
    log_dir = "/var/log/sonantica"
    try:
        os.makedirs(log_dir, exist_ok=True)
        file_handler = logging.FileHandler(os.path.join(log_dir, "worker.log"))
        file_handler.setFormatter(JSONFormatter())
    except Exception:
        # Fallback to console only if log_dir is not writable
        file_handler = None

    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setFormatter(JSONFormatter())

    logger = logging.getLogger(name)
    logger.setLevel(log_level)
    
    if file_handler:
        logger.addHandler(file_handler)
    logger.addHandler(console_handler)
    
    return logger
