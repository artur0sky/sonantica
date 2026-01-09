import logging
import json
from .context import get_trace_id

class JSONFormatter(logging.Formatter):
    def format(self, record):
        trace_id = getattr(record, "trace_id", None) or get_trace_id()
        
        log_record = {
            "timestamp": self.formatTime(record, self.datefmt),
            "level": record.levelname,
            "message": record.getMessage(),
            "logger": record.name,
            "module": record.module,
            "line": record.lineno,
            "trace_id": trace_id
        }
        if record.exc_info:
            log_record["exception"] = self.formatException(record.exc_info)
        return json.dumps(log_record)
