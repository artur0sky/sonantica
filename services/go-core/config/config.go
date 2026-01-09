package config

import (
	"os"
	"strings"
)

type Config struct {
	Port           string
	PostgresURL    string
	RedisHost      string
	RedisPort      string
	RedisPassword  string
	MediaPath      string
	AllowedOrigins []string
	LogLevel       string
}

func Load() *Config {
	return &Config{
		Port:           getEnv("PORT", "8080"),
		PostgresURL:    os.Getenv("POSTGRES_URL"),
		RedisHost:      getEnv("REDIS_HOST", "redis"),
		RedisPort:      getEnv("REDIS_PORT", "6379"),
		RedisPassword:  os.Getenv("REDIS_PASSWORD"),
		MediaPath:      getEnv("MEDIA_PATH", "/media"),
		AllowedOrigins: strings.Split(getEnv("ALLOWED_ORIGINS", "http://localhost:5173,http://localhost:3000,http://localhost,capacitor://localhost"), ","),
		LogLevel:       getEnv("LOG_LEVEL", "info"),
	}
}

func getEnv(key, fallback string) string {
	if value, ok := os.LookupEnv(key); ok {
		return value
	}
	return fallback
}
