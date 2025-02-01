package api

import (
	"github.com/labstack/echo/v4"
	"github.com/user/project/internal/db"
	"github.com/user/project/internal/s3"
	"github.com/user/project/internal/terrors"
	"net/http"
)

// storager interface for database operations
type storager interface {
	Health() (db.HealthStats, error)
	GetUserByChatID(chatID int64) (db.User, error)
	GetUserByID(id string) (db.User, error)
	GetUserByUsername(uname string) (db.User, error)
	CreateUser(user db.User) error
	CreateBadge(badge db.Badge) error
	ListBadges(search string) ([]db.Badge, error)
	UpdateUser(user db.User, badges []string) (db.User, error)
	SearchCities(query string) ([]db.City, error)
	ListUsers(page, limit int, searchQuery string) ([]db.User, error)
	GetSpaceByHandle(name string) (db.Space, error)
	ListSpaces(searchQuery string) ([]db.Space, error)
}

type API struct {
	storage  storager
	cfg      Config
	s3Client *s3.Client
}

type Config struct {
	JWTSecret string
	BotID     int64
	AssetsURL string
	OpenAIKey string
}

func New(storage storager, cfg Config, s3Client *s3.Client) *API {
	return &API{
		storage:  storage,
		cfg:      cfg,
		s3Client: s3Client,
	}
}

func (a API) Health(c echo.Context) error {
	stats, err := a.storage.Health()
	if err != nil {
		return terrors.InternalServer(err, "failed to get health stats")
	}

	return c.JSON(http.StatusOK, stats)
}
