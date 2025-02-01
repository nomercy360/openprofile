package api

import (
	"github.com/labstack/echo/v4"
	"net/http"
)

func (a API) SearchCities(c echo.Context) error {
	query := c.QueryParam("query")

	if len(query) < 3 {
		return c.JSON(http.StatusOK, []string{})
	}

	cities, err := a.storage.SearchCities(query)
	if err != nil {
		return err
	}

	return c.JSON(http.StatusOK, cities)
}
