package controllers

import (
	"fmt"
	"os"
	"time"

	"briyjkp/database"
	"briyjkp/models"

	"github.com/gofiber/fiber/v2"
	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"
)

type LoginRequest struct {
	Username string `json:"username"`
	Password string `json:"password"`
}

// Login handles user authentication and returns a JWT token.
func Login(c *fiber.Ctx) error {
	var req LoginRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid request body"})
	}

	var user models.MUser
	var isPesertaNative bool
	var finalUserID string
	var finalRole string
	var finalUsername string

	// 1. Try finding in `m_user` for Admins, Staff, super admins
	if err := database.DB.Preload("Role").Where("username = ?", req.Username).First(&user).Error; err != nil {
		
		// 2. If not found, try finding in `t_peserta` using NIK_BRI
		var nativePeserta models.TPeserta
		if errPeserta := database.DB.Where("nik_bri = ?", req.Username).First(&nativePeserta).Error; errPeserta != nil {
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "Invalid username or password"})
		}

		// Validate Peserta Password (using TglLahir strings formatted YYYY-MM-DD, or fallback '123456')
		var expectedPassword string = "123456"
		if nativePeserta.TglLahir != nil {
			expectedPassword = nativePeserta.TglLahir.Format("2006-01-02")
		}

		if req.Password != expectedPassword && req.Password != "123456" {
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "Invalid username or password"})
		}

		isPesertaNative = true
		finalUserID = nativePeserta.IDPeserta
		finalRole = "Peserta"
		finalUsername = nativePeserta.NamaPeserta // Using their real name as username token
	} else {
		// Validating standard hashed password
		if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(req.Password)); err != nil {
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "Invalid username or password"})
		}
		
		// Map generic MUser data to standard tokens
		// Safely convert user.ID (uint) to string if needed by front-end, else keep integer
		finalUserID = fmt.Sprintf("%d", user.ID) 
		finalRole = user.Role.RoleName
		finalUsername = user.Username
	}

	// Generate JWT Token
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"user_id":  finalUserID,
		"username": finalUsername,
		"role":     finalRole,
		"exp":      time.Now().Add(time.Hour * 24).Unix(), // 24 hours
	})

	secret := os.Getenv("JWT_SECRET")
	tokenString, err := token.SignedString([]byte(secret))
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Could not generate token"})
	}

	return c.JSON(fiber.Map{
		"token": tokenString,
		"user": fiber.Map{
			"id":       finalUserID,
			"username": finalUsername,
			"role":     finalRole,
			"is_native": isPesertaNative,
		},
	})
}

func GetMe(c *fiber.Ctx) error {
	username := c.Locals("username")
	role := c.Locals("role")

	return c.JSON(fiber.Map{
		"username": username,
		"role":     role,
	})
}
