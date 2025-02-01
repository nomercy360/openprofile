package db

import (
	"time"
)

type Space struct {
	ID          string    `json:"id" db:"id"`
	Handle      string    `json:"handle" db:"handle"`
	Name        *string   `json:"name" db:"name"`
	Description *string   `json:"description" db:"description"`
	PictureURL  *string   `json:"picture_url" db:"picture_url"`
	CreatedAt   time.Time `json:"created_at" db:"created_at"`
	UpdatedAt   time.Time `json:"updated_at" db:"updated_at"`
	BotID       int64     `json:"-" db:"bot_id"`
}

func (s *storage) ListSpaces(search string) ([]Space, error) {
	badges := make([]Space, 0)

	query := `
        SELECT id, handle, name, description, picture_url, created_at, updated_at, bot_id
        FROM spaces
    `

	if search != "" {
		query += " WHERE name ILIKE $1"
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

func (s *storage) GetSpaceByHandle(handle string) (Space, error) {
	var space Space

	query := `
        SELECT id, handle, name, description, picture_url, created_at, updated_at, bot_id
        FROM spaces
        WHERE handle = $1
    `

	err := s.db.Get(&space, query, handle)
	if err != nil && IsNoRowsError(err) {
		return Space{}, ErrNotFound
	} else if err != nil {
		return Space{}, err
	}

	return space, nil
}
