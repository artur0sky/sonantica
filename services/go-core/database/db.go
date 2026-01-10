package database

import (
	"context"
	"fmt"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
)

var DB *pgxpool.Pool

func Connect(dbURL string) error {
	if dbURL == "" {
		return fmt.Errorf("database URL is empty")
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

	var DB_err error
	DB, DB_err = pgxpool.NewWithConfig(ctx, config)
	if DB_err != nil {
		return fmt.Errorf("unable to create connection pool: %v", DB_err)
	}

	if err := DB.Ping(ctx); err != nil {
		return fmt.Errorf("unable to ping database: %v", err)
	}

	fmt.Println("✅ Connected to PostgreSQL successfully")
	return nil
}

func Close() {
	if DB != nil {
		DB.Close()
	}
}
