package api

import (
	"errors"
	"fmt"
	"github.com/golang-jwt/jwt/v5"
	"github.com/labstack/echo/v4"
	initdata "github.com/telegram-mini-apps/init-data-golang"
	"github.com/user/project/internal/contract"
	"github.com/user/project/internal/db"
	"github.com/user/project/internal/nanoid"
	"github.com/user/project/internal/terrors"
	"io"
	"log"
	"math/rand"
	"net/http"
	"time"
)

func (a API) TelegramAuth(c echo.Context) error {
	var req contract.AuthTelegramRequest
	if err := c.Bind(&req); err != nil {
		return terrors.BadRequest(err, "failed to bind request")
	}

	if err := req.Validate(); err != nil {
		return terrors.BadRequest(err, "failed to validate request")
	}

	space, err := a.storage.GetSpaceByHandle(req.Space)
	if err != nil && errors.Is(db.ErrNotFound, err) {
		return terrors.NotFound(err, "space not found")
	} else if err != nil {
		return terrors.InternalServer(err, "failed to get space")
	}

	log.Printf("AuthTelegram: %+v", req)

	expIn := 24 * time.Hour

	if err := initdata.ValidateThirdParty(req.Query, space.BotID, expIn); err != nil {
		return terrors.Unauthorized(err, "invalid init data from telegram")
	}

	fmt.Printf("Current space: %s", req.Space)

	data, err := initdata.Parse(req.Query)

	if err != nil {
		return terrors.Unauthorized(err, "cannot parse init data from telegram")
	}

	user, err := a.storage.GetUserByChatID(data.User.ID)
	if err != nil && errors.Is(err, db.ErrNotFound) {
		username := data.User.Username
		if username == "" {
			username = "user_" + fmt.Sprintf("%d", data.User.ID)
		}

		var first, last *string

		if data.User.FirstName != "" {
			first = &data.User.FirstName
		}

		if data.User.LastName != "" {
			last = &data.User.LastName
		}

		lang := "ru"

		if data.User.LanguageCode != "ru" {
			lang = "en"
		}

		imgUrl := fmt.Sprintf("%s/avatars/%d.svg", a.cfg.AssetsURL, rand.Intn(30)+1)

		create := db.User{
			ID:           nanoid.Must(),
			Username:     username,
			ChatID:       data.User.ID,
			FirstName:    first,
			LastName:     last,
			LanguageCode: lang,
			AvatarURL:    &imgUrl,
		}

		if err = a.storage.CreateUser(create); err != nil {
			return terrors.InternalServer(err, "failed to create user")
		}

		user, err = a.storage.GetUserByChatID(data.User.ID)
		if err != nil {
			return terrors.InternalServer(err, "failed to get user")
		}

		//if data.User.PhotoURL != "" {
		//	go func() {
		//		imgFile := fmt.Sprintf("fb/users/%s.jpg", nanoid.Must())
		//		imgUrl := fmt.Sprintf("%s/%s", s.cfg.AssetsURL, imgFile)
		//		if err = s.uploadImageToS3(data.User.PhotoURL, imgFile); err != nil {
		//			log.Printf("failed to upload user avatar to S3: %v", err)
		//		}
		//
		//		if err = s.storage.UpdateUserAvatarURL(context.Background(), data.User.ID, imgUrl); err != nil {
		//			log.Printf("failed to update user avatar URL: %v", err)
		//		}
		//	}()
		//}
	} else if err != nil {
		return terrors.InternalServer(err, "failed to get user")
	}

	token, err := generateJWT(user.ID, user.ChatID, a.cfg.JWTSecret)

	if err != nil {
		return terrors.InternalServer(err, "jwt library error")
	}

	resp := &contract.UserAuthResponse{
		Token: token,
		User:  user,
		Space: space,
	}

	return c.JSON(http.StatusOK, resp)
}

func generateJWT(userID string, chatID int64, secretKey string) (string, error) {
	claims := &contract.JWTClaims{
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(24 * time.Hour)),
		},
		UID:    userID,
		ChatID: chatID,
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)

	t, err := token.SignedString([]byte(secretKey))
	if err != nil {
		return "", err
	}

	return t, nil
}

func (a API) uploadImageToS3(imgURL string, fileName string) error {
	resp, err := http.Get(imgURL)

	if err != nil {
		return fmt.Errorf("failed to download file: %v", err)

	}

	defer resp.Body.Close()

	data, err := io.ReadAll(resp.Body)

	if err != nil {
		return fmt.Errorf("failed to read file: %v", err)
	}

	if _, err = a.s3Client.UploadFile(data, fileName); err != nil {
		return fmt.Errorf("failed to upload user avatar to S3: %v", err)
	}

	return nil
}
