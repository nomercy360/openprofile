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
	query := `
        SELECT id, text, icon, color, created_at
        FROM badges
    `
	var args []interface{}

	if search != "" {
		query += " WHERE text LIKE ?"
		search = "%" + search + "%"
		args = append(args, search)
	}

	query += " ORDER BY created_at DESC"

	rows, err := s.db.Query(query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var badges []Badge
	for rows.Next() {
		var badge Badge
		err := rows.Scan(&badge.ID, &badge.Text, &badge.Icon, &badge.Color, &badge.CreatedAt)
		if err != nil {
			return nil, err
		}
		badges = append(badges, badge)
	}

	if err = rows.Err(); err != nil {
		return nil, err
	}

	return badges, nil
}

func (s *storage) CreateBadge(badge Badge) error {
	query := `
		INSERT INTO badges (id, text, icon, color, created_at)
		VALUES (?, ?, ?, ?, ?)
	`

	_, err := s.db.Exec(query, badge.ID, badge.Text, badge.Icon, badge.Color, time.Now())
	return err
}
