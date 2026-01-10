import logging
import os
import sys
from .json_formatter import JSONFormatter
from .pretty_formatter import PrettyFormatter

def setup_logger(name: str, log_level: str = "INFO", log_format: str = "json", log_enabled: bool = True):
    # If logging is disabled, use NullHandler to prevent any output
    if not log_enabled:
        logger = logging.getLogger(name)
        if logger.hasHandlers():
            logger.handlers.clear()
        logger.addHandler(logging.NullHandler())
        logger.propagate = False
        return logger

    log_dir = "/var/log/sonantica"
    try:
        os.makedirs(log_dir, exist_ok=True)
        file_handler = logging.FileHandler(os.path.join(log_dir, "worker.log"))
    except Exception:
        # Fallback if log_dir is not writable
        file_handler = None

    console_handler = logging.StreamHandler(sys.stdout)

    # Select Formatter
    if log_format.lower() == "text":
        formatter = PrettyFormatter()
    else:
        formatter = JSONFormatter()

    if file_handler:
        file_handler.setFormatter(formatter)
    console_handler.setFormatter(formatter)

    # Configure Logger
    logger = logging.getLogger(name)
    logger.setLevel(log_level.upper())
    
    # Clean existing handlers to avoid duplicates
    if logger.hasHandlers():
        logger.handlers.clear()

    if file_handler:
        logger.addHandler(file_handler)
    logger.addHandler(console_handler)
    
    return logger
