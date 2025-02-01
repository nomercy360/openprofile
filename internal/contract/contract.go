package contract

import (
	"errors"
	"fmt"
	"github.com/golang-jwt/jwt/v5"
	"github.com/user/project/internal/db"
	"regexp"
	"strings"
)

type Error struct {
	Message string `json:"message"`
}

type UserAuthResponse struct {
	Token string   `json:"token"`
	User  db.User  `json:"user"`
	Space db.Space `json:"space"`
}

type JWTClaims struct {
	jwt.RegisteredClaims
	UID    string `json:"uid"`
	ChatID int64  `json:"chat_id"`
}
type AuthTelegramRequest struct {
	Query      string  `json:"query"`
	ReferrerID *string `json:"referrer_id"`
	Space      string  `json:"space"`
}

func (a AuthTelegramRequest) Validate() error {
	if a.Query == "" {
		return fmt.Errorf("query cannot be empty")
	}

	// if not nil, check not empty
	if a.ReferrerID != nil && *a.ReferrerID == "" {
		return fmt.Errorf("referrer id cannot be empty")
	}

	if a.Space == "" {
		return fmt.Errorf("empty space")
	}

	return nil
}

type SendNotificationParams struct {
	ChatID     int64
	Message    string
	BotWebApp  string
	WebAppURL  string
	Image      []byte
	ButtonText string
}

type CreateBadgeRequest struct {
	Text  string `json:"text"`
	Icon  string `json:"icon"`
	Color string `json:"color"`
}

func (r CreateBadgeRequest) Validate() error {
	if r.Text == "" {
		return fmt.Errorf("text cannot be empty")
	}

	if len(r.Icon) != 4 {
		return fmt.Errorf("icon must be 4 characters long")
	}

	if len(r.Color) != 6 {
		return fmt.Errorf("color must be 6 characters long")
	}

	return nil
}

type UpdateUserRequest struct {
	FirstName    string   `json:"first_name"`
	LastName     string   `json:"last_name"`
	AvatarURL    string   `json:"avatar_url"`
	Title        string   `json:"title"`
	Description  string   `json:"description"`
	Badges       []string `json:"badge_ids"`
	Latitude     float64  `json:"latitude"`
	Longitude    float64  `json:"longitude"`
	LocationName string   `json:"location_name"`
	CountryCode  string   `json:"country_code"`
}

func (u UpdateUserRequest) Validate() error {
	if u.FirstName == "" {
		return fmt.Errorf("first name cannot be empty")
	}

	if u.LastName == "" {
		return fmt.Errorf("last name cannot be empty")
	}

	if u.AvatarURL == "" {
		return fmt.Errorf("avatar url cannot be empty")
	}

	if u.Title == "" {
		return fmt.Errorf("title cannot be empty")
	}

	if u.Description == "" {
		return fmt.Errorf("description cannot be empty")
	}

	if len(u.Badges) == 0 {
		return fmt.Errorf("badges cannot be empty")
	}

	if u.Latitude < -90 || u.Latitude > 90 {
		return errors.New("latitude must be between -90 and 90")
	}

	if u.Longitude < -180 || u.Longitude > 180 {
		return errors.New("longitude must be between -180 and 180")
	}

	if u.LocationName == "" {
		return errors.New("location name cannot be empty")
	}

	countryCodePattern := regexp.MustCompile(`^[A-Z]{2}$`)
	if !countryCodePattern.MatchString(strings.ToUpper(u.CountryCode)) {
		return errors.New("country code must be a valid 2-letter ISO 3166-1 alpha-2 code")
	}

	return nil
}

type UserResponse struct {
	ID          string     `json:"id"`
	Username    string     `json:"username"`
	FirstName   *string    `json:"first_name"`
	LastName    *string    `json:"last_name"`
	AvatarURL   *string    `json:"avatar_url"`
	Title       *string    `json:"title"`
	Description *string    `json:"description"`
	Location    *string    `json:"location_name"`
	Country     *string    `json:"country_code"`
	Badges      []db.Badge `json:"badges"`
}
