package logger

import (
	"net/http"
)

func TraceMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		traceID := r.Header.Get("X-Trace-ID")
		if traceID == "" {
			traceID = r.Header.Get("X-Request-ID") // Compatibility with Chi RequestID middleware
		}

		ctx := WithTraceID(r.Context(), traceID)

		// Set it back to header so clients can see it
		w.Header().Set("X-Trace-ID", FromContext(ctx))

		next.ServeHTTP(w, r.WithContext(ctx))
	})
}
