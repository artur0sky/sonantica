import logging
import datetime
from .context import get_trace_id

class PrettyFormatter(logging.Formatter):
    def format(self, record):
        # High precision timestamp (microseconds)
        dt = datetime.datetime.fromtimestamp(record.created)
        timestamp = dt.strftime("%Y-%m-%d %H:%M:%S.%f")
        
        # Get trace_id from record or context
        trace_id = getattr(record, "trace_id", None) or get_trace_id()
        
        msg = f"[{timestamp}] [{record.levelname}] {record.getMessage()}"
        
        if trace_id:
            msg += f" | traceId={trace_id}"
            
        return msg
