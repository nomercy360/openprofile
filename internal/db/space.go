package db

import (
	"log"
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
	query := `
        SELECT id, handle, name, description, picture_url, created_at, updated_at, bot_id
        FROM spaces
    `
	var args []interface{}

	if search != "" {
		query += " WHERE name LIKE ?"
		search = "%" + search + "%"
		args = append(args, search)
	}

	query += " ORDER BY created_at DESC"

	rows, err := s.db.Query(query, args...)
	if err != nil {
		log.Println("Error executing query:", err)
		return nil, err
	}
	defer rows.Close()

	var spaces []Space
	for rows.Next() {
		var space Space
		if err := rows.Scan(
			&space.ID, &space.Handle, &space.Name, &space.Description,
			&space.PictureURL, &space.CreatedAt, &space.UpdatedAt, &space.BotID,
		); err != nil {
			log.Println("Error scanning row:", err)
			return nil, err
		}
		spaces = append(spaces, space)
	}

	if err := rows.Err(); err != nil {
		return nil, err
	}

	return spaces, nil
}

func (s *storage) GetSpaceByHandle(handle string) (Space, error) {
	query := `
        SELECT id, handle, name, description, picture_url, created_at, updated_at, bot_id
        FROM spaces
        WHERE handle = ?
    `

	var space Space
	err := s.db.QueryRow(query, handle).Scan(
		&space.ID, &space.Handle, &space.Name, &space.Description,
		&space.PictureURL, &space.CreatedAt, &space.UpdatedAt, &space.BotID,
	)

	if err != nil && IsNoRowsError(err) {
		return Space{}, ErrNotFound
	} else if err != nil {
		log.Println("Error fetching space by handle:", err)
		return Space{}, err
	}

	return space, nil
}
