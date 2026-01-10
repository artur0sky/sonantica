package config

import (
	"log/slog"
	"strings"

	"github.com/spf13/viper"
)

type Config struct {
	Port              string   `mapstructure:"PORT"`
	PostgresURL       string   `mapstructure:"POSTGRES_URL"`
	RedisHost         string   `mapstructure:"REDIS_HOST"`
	RedisPort         string   `mapstructure:"REDIS_PORT"`
	RedisPassword     string   `mapstructure:"REDIS_PASSWORD"`
	MediaPath         string   `mapstructure:"MEDIA_PATH"`
	AllowedOrigins    []string `mapstructure:"ALLOWED_ORIGINS"`
	LogLevel          string   `mapstructure:"LOG_LEVEL"`
	LogFormat         string   `mapstructure:"LOG_FORMAT"`
	LogEnabled        bool     `mapstructure:"LOG_ENABLED"`
	AnalyticsEnabled  bool     `mapstructure:"ANALYTICS_ENABLED"`
	CoverPath         string   `mapstructure:"COVER_PATH"`
	InternalAPISecret string   `mapstructure:"INTERNAL_API_SECRET"`
	DemucsURL         string   `mapstructure:"DEMUCS_URL"`
	BrainURL          string   `mapstructure:"BRAIN_URL"`
	KnowledgeURL      string   `mapstructure:"KNOWLEDGE_URL"`
}

func Load() *Config {
	v := viper.New()

	// 1. Defaults
	v.SetDefault("PORT", "8080")
	v.SetDefault("REDIS_HOST", "redis")
	v.SetDefault("REDIS_PORT", "6379")
	v.SetDefault("POSTGRES_URL", "postgres://sonantica:sonantica@postgres:5432/sonantica?sslmode=disable")
	v.SetDefault("MEDIA_PATH", "/media")
	v.SetDefault("LOG_LEVEL", "info")
	v.SetDefault("LOG_FORMAT", "json")
	v.SetDefault("LOG_ENABLED", true)
	v.SetDefault("ANALYTICS_ENABLED", true)
	v.SetDefault("COVER_PATH", "/covers")
	v.SetDefault("ALLOWED_ORIGINS", "http://localhost:5173,http://localhost:3000,http://localhost,capacitor://localhost")
	v.SetDefault("INTERNAL_API_SECRET", "generate-secure-token-here")
	v.SetDefault("DEMUCS_URL", "http://sonantica-plugin-demucs:8080")
	v.SetDefault("BRAIN_URL", "http://sonantica-plugin-brain:8080")
	v.SetDefault("KNOWLEDGE_URL", "http://sonantica-plugin-knowledge:8080")

	// 2. Read from Environment
	v.AutomaticEnv()
	v.SetEnvKeyReplacer(strings.NewReplacer(".", "_"))

	// Explicit bindings to catch environment variables reliably
	_ = v.BindEnv("PORT")
	_ = v.BindEnv("POSTGRES_URL")
	_ = v.BindEnv("REDIS_HOST")
	_ = v.BindEnv("REDIS_PORT")
	_ = v.BindEnv("REDIS_PASSWORD")
	_ = v.BindEnv("MEDIA_PATH")
	_ = v.BindEnv("ALLOWED_ORIGINS")
	_ = v.BindEnv("LOG_LEVEL")
	_ = v.BindEnv("LOG_FORMAT")
	_ = v.BindEnv("LOG_ENABLED")
	_ = v.BindEnv("ANALYTICS_ENABLED")
	_ = v.BindEnv("COVER_PATH")
	_ = v.BindEnv("INTERNAL_API_SECRET")
	_ = v.BindEnv("DEMUCS_URL")
	_ = v.BindEnv("BRAIN_URL")
	_ = v.BindEnv("KNOWLEDGE_URL")

	// 3. Read from Config File (Optional)
	v.SetConfigName("config")
	v.SetConfigType("yaml")
	v.AddConfigPath("/config") // Docker volume
	v.AddConfigPath(".")       // Local dev

	if err := v.ReadInConfig(); err != nil {
		if _, ok := err.(viper.ConfigFileNotFoundError); !ok {
			slog.Warn("Failed to read config file", "error", err)
		}
	}

	cfg := &Config{}

	// Handle slice conversion for ALLOWED_ORIGINS if string
	origins := v.Get("ALLOWED_ORIGINS")
	if s, ok := origins.(string); ok {
		v.Set("ALLOWED_ORIGINS", strings.Split(s, ","))
	}

	if err := v.Unmarshal(cfg); err != nil {
		slog.Error("Failed to unmarshal config", "error", err)
	}

	return cfg
}
