package analytics

import (
	"context"
	"embed"
	"fmt"
	"log"
	"sort"
	"strings"

	"sonantica-core/database"
)

//go:embed migrations/*.sql
var migrationsFS embed.FS

// Migration represents a database migration
type Migration struct {
	Version string
	Name    string
	SQL     string
}

// RunMigrations executes all pending database migrations
func RunMigrations() error {
	logger := GetLogger()
	logger.Info("Starting analytics database migrations")

	// Create migrations tracking table if it doesn't exist
	if err := createMigrationsTable(); err != nil {
		return fmt.Errorf("failed to create migrations table: %w", err)
	}

	// Get all migration files
	migrations, err := loadMigrations()
	if err != nil {
		return fmt.Errorf("failed to load migrations: %w", err)
	}

	// Get applied migrations
	applied, err := getAppliedMigrations()
	if err != nil {
		return fmt.Errorf("failed to get applied migrations: %w", err)
	}

	// Apply pending migrations
	for _, migration := range migrations {
		if _, exists := applied[migration.Version]; exists {
			logger.Debug(fmt.Sprintf("Migration %s already applied, skipping", migration.Version))
			continue
		}

		logger.Info(fmt.Sprintf("Applying migration %s: %s", migration.Version, migration.Name))

		if err := applyMigration(migration); err != nil {
			return fmt.Errorf("failed to apply migration %s: %w", migration.Version, err)
		}

		logger.Info(fmt.Sprintf("Migration %s applied successfully", migration.Version))
	}

	logger.Info("All analytics migrations completed successfully")
	return nil
}

// createMigrationsTable creates the migrations tracking table
func createMigrationsTable() error {
	ctx := context.Background()
	query := `
		CREATE TABLE IF NOT EXISTS analytics_migrations (
			version VARCHAR(255) PRIMARY KEY,
			name VARCHAR(255) NOT NULL,
			applied_at TIMESTAMP DEFAULT NOW()
		)
	`

	_, err := database.DB.Exec(ctx, query)
	return err
}

// loadMigrations loads all migration files from embedded filesystem
func loadMigrations() ([]Migration, error) {
	entries, err := migrationsFS.ReadDir("migrations")
	if err != nil {
		return nil, err
	}

	var migrations []Migration

	for _, entry := range entries {
		if entry.IsDir() || !strings.HasSuffix(entry.Name(), ".sql") {
			continue
		}

		// Skip the run-migrations.sh script
		if strings.HasSuffix(entry.Name(), ".sh") {
			continue
		}

		content, err := migrationsFS.ReadFile("migrations/" + entry.Name())
		if err != nil {
			return nil, fmt.Errorf("failed to read migration file %s: %w", entry.Name(), err)
		}

		// Extract version and name from filename (e.g., "001_initial_schema.sql")
		parts := strings.SplitN(strings.TrimSuffix(entry.Name(), ".sql"), "_", 2)
		if len(parts) != 2 {
			log.Printf("⚠️ Skipping invalid migration filename: %s", entry.Name())
			continue
		}

		migrations = append(migrations, Migration{
			Version: parts[0],
			Name:    parts[1],
			SQL:     string(content),
		})
	}

	// Sort migrations by version
	sort.Slice(migrations, func(i, j int) bool {
		return migrations[i].Version < migrations[j].Version
	})

	return migrations, nil
}

// getAppliedMigrations returns a map of applied migration versions
func getAppliedMigrations() (map[string]bool, error) {
	ctx := context.Background()
	query := "SELECT version FROM analytics_migrations"

	rows, err := database.DB.Query(ctx, query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	applied := make(map[string]bool)

	for rows.Next() {
		var version string
		if err := rows.Scan(&version); err != nil {
			return nil, err
		}
		applied[version] = true
	}

	if err := rows.Err(); err != nil {
		return nil, err
	}

	return applied, nil
}

// applyMigration applies a single migration
func applyMigration(migration Migration) error {
	ctx := context.Background()

	// Start transaction
	tx, err := database.DB.Begin(ctx)
	if err != nil {
		return fmt.Errorf("failed to begin transaction: %w", err)
	}
	defer tx.Rollback(ctx)

	// Execute migration SQL
	_, err = tx.Exec(ctx, migration.SQL)
	if err != nil {
		return fmt.Errorf("failed to execute migration SQL: %w", err)
	}

	// Record migration as applied
	recordQuery := `
		INSERT INTO analytics_migrations (version, name)
		VALUES ($1, $2)
	`
	_, err = tx.Exec(ctx, recordQuery, migration.Version, migration.Name)
	if err != nil {
		return fmt.Errorf("failed to record migration: %w", err)
	}

	// Commit transaction
	if err := tx.Commit(ctx); err != nil {
		return fmt.Errorf("failed to commit transaction: %w", err)
	}

	return nil
}

// GetMigrationStatus returns the status of all migrations
func GetMigrationStatus() ([]MigrationStatus, error) {
	migrations, err := loadMigrations()
	if err != nil {
		return nil, err
	}

	applied, err := getAppliedMigrations()
	if err != nil {
		return nil, err
	}

	var status []MigrationStatus
	for _, m := range migrations {
		status = append(status, MigrationStatus{
			Version: m.Version,
			Name:    m.Name,
			Applied: applied[m.Version],
		})
	}

	return status, nil
}

// MigrationStatus represents the status of a migration
type MigrationStatus struct {
	Version string `json:"version"`
	Name    string `json:"name"`
	Applied bool   `json:"applied"`
}
