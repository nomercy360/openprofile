package db

import (
	"context"
	"database/sql"
	"encoding/json"
	"errors"
	"fmt"
	"github.com/lib/pq"
	"time"

	"github.com/jmoiron/sqlx"
	_ "github.com/lib/pq" // PostgreSQL driver
)

type storage struct {
	db *sqlx.DB
}

func IsNoRowsError(err error) bool {
	return errors.Is(err, sql.ErrNoRows)
}

func UnmarshalJSONToSlice[T any](src interface{}) ([]T, error) {
	var source []byte

	switch s := src.(type) {
	case []byte:
		source = s
	case string:
		source = []byte(s)
	case nil:
		return []T{}, nil
	default:
		return nil, fmt.Errorf("unsupported type: %T", s)
	}

	var result []T
	if err := json.Unmarshal(source, &result); err != nil {
		return nil, fmt.Errorf("error unmarshalling JSON: %w", err)
	}

	return result, nil
}

func IsAlreadyExistsError(err error) bool {
	var pgErr *pq.Error
	ok := errors.As(err, &pgErr)
	if ok {
		if pgErr.Code == "23505" {
			return true
		}
	}

	return false
}

func ConnectDB(db *sql.DB) (*storage, error) {
	// Optionally set connection pool settings
	db.SetMaxOpenConns(25)
	db.SetMaxIdleConns(25)
	db.SetConnMaxLifetime(5 * time.Minute)

	return &storage{db: sqlx.NewDb(db, "postgres")}, nil
}

var (
	ErrNotFound      = errors.New("not found")
	ErrAlreadyExists = errors.New("already exists")
)

type HealthStats struct {
	Status            string `json:"status"`
	Error             string `json:"error,omitempty"`
	Message           string `json:"message"`
	OpenConnections   int    `json:"open_connections"`
	InUse             int    `json:"in_use"`
	Idle              int    `json:"idle"`
	WaitCount         int64  `json:"wait_count"`
	WaitDuration      string `json:"wait_duration"`
	MaxIdleClosed     int64  `json:"max_idle_closed"`
	MaxLifetimeClosed int64  `json:"max_lifetime_closed"`
}

func (s *storage) Health() (HealthStats, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 1*time.Second)
	defer cancel()

	stats := HealthStats{}

	// Ping the database
	err := s.db.PingContext(ctx)
	if err != nil {
		stats.Status = "down"
		stats.Error = fmt.Sprintf("db down: %v", err)
		return stats, fmt.Errorf("db down: %w", err)
	}

	stats.Status = "up"
	stats.Message = "It's healthy"

	dbStats := s.db.Stats()
	stats.OpenConnections = dbStats.OpenConnections
	stats.InUse = dbStats.InUse
	stats.Idle = dbStats.Idle
	stats.WaitCount = dbStats.WaitCount
	stats.WaitDuration = dbStats.WaitDuration.String()
	stats.MaxIdleClosed = dbStats.MaxIdleClosed
	stats.MaxLifetimeClosed = dbStats.MaxLifetimeClosed

	return stats, nil
}
