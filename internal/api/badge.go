package api

import (
	"github.com/labstack/echo/v4"
	"github.com/user/project/internal/contract"
	"github.com/user/project/internal/db"
	"github.com/user/project/internal/nanoid"
	"net/http"
)

func (a API) ListBadges(c echo.Context) error {
	query := c.QueryParam("search")

	badges, err := a.storage.ListBadges(query)
	if err != nil {
		return err
	}

	return c.JSON(http.StatusOK, badges)
}

func (a API) CreateBadge(c echo.Context) error {
	var req contract.CreateBadgeRequest
	if err := c.Bind(&req); err != nil {
		return err
	}

	if err := req.Validate(); err != nil {
		return err
	}

	badge := db.Badge{
		ID:    nanoid.Must(),
		Text:  req.Text,
		Color: req.Color,
		Icon:  req.Icon,
	}

	err := a.storage.CreateBadge(badge)
	if err != nil {
		return err
	}

	return c.JSON(http.StatusCreated, badge)
}
