package database

import (
	"context"
	"fmt"
	"os"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"

	_ "embed"
)

//go:embed schema.sql
var databaseSchema string

var DB *pgxpool.Pool

func Connect() error {
	dbURL := os.Getenv("POSTGRES_URL")
	if dbURL == "" {
		return fmt.Errorf("POSTGRES_URL environment variable is not set")
	}

	config, err := pgxpool.ParseConfig(dbURL)
	if err != nil {
		return fmt.Errorf("unable to parse database config: %v", err)
	}

	config.MaxConns = 10
	config.MinConns = 2
	config.MaxConnLifetime = time.Hour

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	DB, err = pgxpool.NewWithConfig(ctx, config)
	if err != nil {
		return fmt.Errorf("unable to create connection pool: %v", err)
	}

	if err := DB.Ping(ctx); err != nil {
		return fmt.Errorf("unable to ping database: %v", err)
	}

	fmt.Println("✅ Connected to PostgreSQL successfully")
	return nil
}

func RunMigrations() error {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	fmt.Println("📦 Running database migrations...")

	// Execute Complete Database Schema
	if _, err := DB.Exec(ctx, databaseSchema); err != nil {
		return fmt.Errorf("failed to execute database schema: %v", err)
	}

	fmt.Println("✅ Database migrations completed")
	return nil
}

func Close() {
	if DB != nil {
		DB.Close()
	}
}
