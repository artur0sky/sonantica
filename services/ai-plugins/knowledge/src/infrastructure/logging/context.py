import contextvars
from uuid import uuid4

_trace_id_ctx = contextvars.ContextVar('trace_id', default=None)

def set_trace_id(trace_id: str = None) -> str:
    if trace_id is None:
        trace_id = str(uuid4())
    _trace_id_ctx.set(trace_id)
    return trace_id

def get_trace_id() -> str:
    return _trace_id_ctx.get()
