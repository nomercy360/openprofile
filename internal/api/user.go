package api

import (
	"errors"
	"fmt"
	"github.com/golang-jwt/jwt/v5"
	"github.com/labstack/echo/v4"
	"github.com/user/project/internal/contract"
	"github.com/user/project/internal/db"
	"github.com/user/project/internal/terrors"
	"io"
	"math/rand"
	"net/http"
	"strconv"
	"strings"
	"time"
)

func getUserID(c echo.Context) string {
	user := c.Get("user").(*jwt.Token)
	claims := user.Claims.(*contract.JWTClaims)
	return claims.UID
}

func (a API) GetUserByUsername(c echo.Context) error {
	username := c.Param("handle")
	user, err := a.storage.GetUserByUsername(username)
	if err != nil {
		return err
	}

	return c.JSON(http.StatusOK, user)
}

func (a API) UpdateUser(c echo.Context) error {
	uid := getUserID(c)

	var req contract.UpdateUserRequest
	if err := c.Bind(&req); err != nil {
		return err
	}

	if err := req.Validate(); err != nil {
		return terrors.BadRequest(err, fmt.Sprintf("error validating request: %v", err))
	}

	user := db.User{
		ID:          uid,
		Title:       &req.Title,
		Description: &req.Description,
		FirstName:   &req.FirstName,
		LastName:    &req.LastName,
		AvatarURL:   &req.AvatarURL,
		Location:    &req.LocationName,
		Latitude:    &req.Latitude,
		Longitude:   &req.Longitude,
		Country:     &req.CountryCode,
	}

	resp, err := a.storage.UpdateUser(user, req.Badges)
	if err != nil && errors.Is(db.ErrNotFound, err) {
		return terrors.NotFound(err, "user not found")
	} else if err != nil {
		return err
	}

	return c.JSON(http.StatusOK, resp)
}

func (a API) ListUsers(c echo.Context) error {
	page, err := strconv.Atoi(c.QueryParam("page"))
	if err != nil || page < 1 {
		page = 1
	}

	limit, err := strconv.Atoi(c.QueryParam("limit"))
	if err != nil || limit < 1 {
		limit = 40
	}

	searchQuery := c.QueryParam("search")
	if searchQuery == "" {
		searchQuery = "%"
	} else {
		searchQuery = "%" + strings.ToLower(searchQuery) + "%"
	}

	users, err := a.storage.ListUsers(page, limit, searchQuery)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "Failed to fetch users")
	}

	filteredUsers := make([]contract.UserResponse, len(users))
	for i, user := range users {
		filteredUsers[i] = contract.UserResponse{
			ID:          user.ID,
			Username:    user.Username,
			FirstName:   user.FirstName,
			LastName:    user.LastName,
			AvatarURL:   user.AvatarURL,
			Title:       user.Title,
			Description: user.Description,
			Location:    user.Location,
			Country:     user.Country,
			Badges:      user.Badges,
		}
	}

	return c.JSON(http.StatusOK, filteredUsers)
}

func (a API) GetRandomAvatar(c echo.Context) error {
	s := rand.NewSource(time.Now().UnixNano())
	r := rand.New(s)

	avatarID := r.Intn(30) + 1
	url := fmt.Sprintf("https://assets.peatch.io/avatars/%d.svg", avatarID)

	resp, err := http.Get(url)
	if err != nil {
		return c.String(http.StatusInternalServerError, "Failed to request avatar")
	}
	defer resp.Body.Close()

	c.Response().Header().Set(echo.HeaderContentType, resp.Header.Get("Content-Type"))

	_, err = io.Copy(c.Response().Writer, resp.Body)
	if err != nil {
		return c.String(http.StatusInternalServerError, "Failed to stream avatar")
	}

	return nil
}
