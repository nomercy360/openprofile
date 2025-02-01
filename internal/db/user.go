package db

import (
	"strings"
	"time"
)

type User struct {
	ID           string     `db:"id" json:"id"`
	ChatID       int64      `db:"chat_id" json:"chat_id"`
	Username     string     `db:"username" json:"username"`
	FirstName    *string    `db:"first_name" json:"first_name"`
	LastName     *string    `db:"last_name" json:"last_name"`
	CreatedAt    time.Time  `db:"created_at" json:"created_at"`
	UpdatedAt    time.Time  `db:"updated_at" json:"updated_at"`
	LanguageCode string     `db:"language_code" json:"language_code"`
	PublishedAt  *time.Time `db:"published_at" json:"published_at"`
	HiddenAt     *time.Time `db:"hidden_at" json:"hidden_at"`
	AvatarURL    *string    `db:"avatar_url" json:"avatar_url"`
	Title        *string    `db:"title" json:"title"`
	Description  *string    `db:"description" json:"description"`
	ReviewStatus string     `db:"review_status" json:"review_status"`
	Rating       *int       `db:"rating" json:"rating"`
	Latitude     *float64   `db:"latitude" json:"latitude"`
	Longitude    *float64   `db:"longitude" json:"longitude"`
	Location     *string    `db:"location_name" json:"location_name"`
	Country      *string    `db:"country_code" json:"country_code"`

	Badges []Badge `json:"badges"`
}

const (
	ReviewStatusPending  = "pending"
	ReviewStatusApproved = "approved"
	ReviewStatusRejected = "rejected"
)

type Location struct {
	ID        string    `db:"id" json:"id"`
	UserID    string    `db:"user_id" json:"user_id"`
	Latitude  float64   `db:"latitude" json:"latitude"`
	Longitude float64   `db:"longitude" json:"longitude"`
	Location  string    `db:"location_name" json:"location_name"`
	Country   string    `db:"country_code" json:"country_code"`
	CreatedAt time.Time `db:"created_at" json:"created_at"`
	UpdatedAt time.Time `db:"updated_at" json:"updated_at"`
	IsActive  bool      `db:"is_active" json:"is_active"`
}

func (s *storage) CreateUser(user User) error {
	query := `
		INSERT INTO users (
			id, chat_id, username, first_name, last_name, language_code, avatar_url
		) VALUES (
			:id, :chat_id, :username, :first_name, :last_name, :language_code, :avatar_url
		)
	`
	_, err := s.db.NamedExec(query, user)
	return err
}

func (s *storage) GetUserByChatID(chatID int64) (User, error) {
	var user User
	query := `
		SELECT 
            u.*, 
            COALESCE(json_agg(json_build_object('id', b.id, 'text', b.text, 'icon', b.icon, 'color', b.color)) 
                FILTER (WHERE b.id IS NOT NULL), '[]') AS badges
        FROM users u
        LEFT JOIN user_badges ub ON u.id = ub.user_id
        LEFT JOIN badges b ON ub.badge_id = b.id
		WHERE chat_id = $1
		GROUP BY u.id
	`

	row := s.db.QueryRowx(query, chatID)
	var badgeJSON string
	err := row.Scan(
		&user.ID, &user.ChatID, &user.Username, &user.FirstName, &user.LastName,
		&user.CreatedAt, &user.UpdatedAt, &user.LanguageCode, &user.PublishedAt, &user.HiddenAt,
		&user.AvatarURL, &user.Title, &user.Description, &user.ReviewStatus, &user.Rating,
		&user.Latitude, &user.Longitude, &user.Country, &user.Location, &badgeJSON,
	)

	if err != nil && IsNoRowsError(err) {
		return user, ErrNotFound
	} else if err != nil {
		return user, err
	}

	user.Badges, err = UnmarshalJSONToSlice[Badge](badgeJSON)
	if err != nil {
		return user, err
	}

	return user, nil
}

func (s *storage) GetUserByID(id string) (User, error) {
	var user User
	query := `
		SELECT 
            u.*, 
            COALESCE(json_agg(json_build_object('id', b.id, 'text', b.text, 'icon', b.icon, 'color', b.color)) 
                FILTER (WHERE b.id IS NOT NULL), '[]') AS badges
        FROM users u
        LEFT JOIN user_badges ub ON u.id = ub.user_id
        LEFT JOIN badges b ON ub.badge_id = b.id
		WHERE u.id = $1
		GROUP BY u.id
	`

	row := s.db.QueryRowx(query, id)
	var badgeJSON string
	err := row.Scan(
		&user.ID, &user.ChatID, &user.Username, &user.FirstName, &user.LastName,
		&user.CreatedAt, &user.UpdatedAt, &user.LanguageCode, &user.PublishedAt, &user.HiddenAt,
		&user.AvatarURL, &user.Title, &user.Description, &user.ReviewStatus, &user.Rating,
		&user.Latitude, &user.Longitude, &user.Country, &user.Location, &badgeJSON,
	)

	if err != nil && IsNoRowsError(err) {
		return user, ErrNotFound
	} else if err != nil {
		return user, err
	}

	user.Badges, err = UnmarshalJSONToSlice[Badge](badgeJSON)
	if err != nil {
		return user, err
	}

	return user, nil
}

func (s *storage) GetUserByUsername(username string) (User, error) {
	var user User
	query := "SELECT * FROM users WHERE username = $1"
	err := s.db.Get(&user, query, username)

	if err != nil && IsNoRowsError(err) {
		return user, ErrNotFound
	} else if err != nil {
		return user, err
	}

	return user, nil
}

func (s *storage) UpdateUser(user User, badges []string) (User, error) {
	tx, err := s.db.Beginx()
	if err != nil {
		return User{}, err
	}
	defer func() {
		if p := recover(); p != nil {
			tx.Rollback()
			panic(p)
		} else if err != nil {
			tx.Rollback()
		} else {
			err = tx.Commit()
		}
	}()

	query := `
		UPDATE users SET 
			first_name = :first_name, last_name = :last_name, 
			avatar_url = :avatar_url, title = :title, description = :description,
			updated_at = NOW(), latitude = :latitude, longitude = :longitude,
			location_name = :location_name, country_code = :country_code
		WHERE id = :id
	`
	res, err := tx.NamedExec(query, user)
	if err != nil {
		return User{}, err
	}

	if rows, _ := res.RowsAffected(); rows == 0 {
		return User{}, ErrNotFound
	}

	if len(badges) > 0 {
		query = "DELETE FROM user_badges WHERE user_id = $1"
		_, err = tx.Exec(query, user.ID)
		if err != nil {
			return User{}, err
		}

		query = "INSERT INTO user_badges (user_id, badge_id) VALUES ($1, $2)"
		for _, badgeID := range badges {
			_, err = tx.Exec(query, user.ID, badgeID)
			if err != nil {
				return User{}, err
			}
		}
	}

	return s.GetUserByID(user.ID)
}

func (s *storage) ListUsers(page, limit int, searchQuery string) ([]User, error) {
	offset := (page - 1) * limit

	query := `
        SELECT 
            u.*, 
            COALESCE(json_agg(json_build_object('id', b.id, 'text', b.text, 'icon', b.icon, 'color', b.color)) 
                FILTER (WHERE b.id IS NOT NULL), '[]') AS badges
        FROM users u
        LEFT JOIN user_badges ub ON u.id = ub.user_id
        LEFT JOIN badges b ON ub.badge_id = b.id
        WHERE LOWER(u.title) LIKE LOWER($1) 
           OR LOWER(u.description) LIKE LOWER($1) 
           OR LOWER(u.first_name) LIKE LOWER($1) 
           OR LOWER(u.last_name) LIKE LOWER($1)
        GROUP BY u.id
        ORDER BY u.created_at DESC 
        LIMIT $2 OFFSET $3`

	searchPattern := "%" + strings.ToLower(searchQuery) + "%"

	rows, err := s.db.Queryx(query, searchPattern, limit, offset)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var result []User
	for rows.Next() {
		var user User
		var badgeJSON string

		if err := rows.Scan(
			&user.ID, &user.ChatID, &user.Username, &user.FirstName, &user.LastName,
			&user.CreatedAt, &user.UpdatedAt, &user.LanguageCode, &user.PublishedAt, &user.HiddenAt,
			&user.AvatarURL, &user.Title, &user.Description, &user.ReviewStatus, &user.Rating,
			&user.Latitude, &user.Longitude, &user.Country, &user.Location, &badgeJSON,
		); err != nil {
			return nil, err
		}

		user.Badges, err = UnmarshalJSONToSlice[Badge](badgeJSON)
		if err != nil {
			return nil, err
		}

		result = append(result, user)
	}

	return result, nil
}
