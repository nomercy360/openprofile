package api

import (
	"errors"
	"fmt"
	"github.com/labstack/echo/v4"
	"github.com/user/project/internal/terrors"
	"net/http"
	"time"
)

func (a API) GetPresignedURL(c echo.Context) error {
	userID := getUserID(c)
	fileName := c.QueryParam("file_name")

	if fileName == "" {
		return terrors.BadRequest(errors.New("file_name is required"), "file_name is required")
	}

	fileName = fmt.Sprintf("%s/%s", userID, fileName)

	url, err := a.s3Client.GetPresignedURL(fileName, 15*time.Minute)

	if err != nil {
		return terrors.InternalServer(err, "failed to get presigned URL")
	}

	return c.JSON(http.StatusOK, map[string]string{"url": url, "cdn_url": a.cfg.AssetsURL + "/" + fileName})
}
