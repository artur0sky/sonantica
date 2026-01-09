package shared

import (
	"encoding/json"
	"log/slog"
	"net/http"
)

func ErrorMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		defer func() {
			if rec := recover(); rec != nil {
				slog.ErrorContext(r.Context(), "panic recovered", "panic", rec)
				http.Error(w, `{"code": 500, "message": "internal server error"}`, http.StatusInternalServerError)
			}
		}()
		next.ServeHTTP(w, r)
	})
}

func RenderError(w http.ResponseWriter, r *http.Request, err error) {
	statusCode := http.StatusInternalServerError
	message := "internal server error"
	// In a real app we'd use errors.As
	// For simplicity, we'll check common ones
	if err == ErrNotFound {
		statusCode = http.StatusNotFound
		message = "not found"
	} else if err == ErrBadRequest {
		statusCode = http.StatusBadRequest
		message = "bad request"
	} else if err == ErrUnauthorized {
		statusCode = http.StatusUnauthorized
		message = "unauthorized"
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(statusCode)
	json.NewEncoder(w).Encode(map[string]interface{}{
		"code":    statusCode,
		"message": message,
	})

	slog.ErrorContext(r.Context(), "request error", "error", err, "status", statusCode)
}
