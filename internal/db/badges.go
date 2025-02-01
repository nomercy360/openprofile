package db

import (
	"time"
)

type Badge struct {
	ID        string    `json:"id" db:"id"`
	Text      string    `json:"text" db:"text"`
	Icon      string    `json:"icon" db:"icon"`
	Color     string    `json:"color" db:"color"`
	CreatedAt time.Time `json:"created_at" db:"created_at"`
}

func (s *storage) ListBadges(search string) ([]Badge, error) {
	badges := make([]Badge, 0)

	query := `
        SELECT id, text, icon, color, created_at
        FROM badges
        ORDER BY created_at DESC
    `

	if search != "" {
		query += " WHERE text ILIKE $1"
		search = "%" + search + "%"
	}

	var err error
	if search == "" {
		err = s.db.Select(&badges, query)
	} else {
		err = s.db.Select(&badges, query, search)
	}

	if err != nil {
		return nil, err
	}

	return badges, nil
}

func (s *storage) CreateBadge(badge Badge) error {
	query := `
		INSERT INTO badges (id, text, icon, color)
		VALUES ($1, $2, $3, $4)
	`

	_, err := s.db.Exec(query, badge.ID, badge.Text, badge.Icon, badge.Color)

	if err != nil {
		return err
	}

	return nil
}
