package controllers

import (
	"briyjkp/database"
	"briyjkp/models"

	"github.com/gofiber/fiber/v2"
	"gorm.io/gorm"
)

// GetAuditTrail fetches audit logs with optional filtering and pagination
func GetAuditTrail(c *fiber.Ctx) error {
	var logs []models.TAuditTrail

	// Optional Filters
	modul := c.Query("modul")
	action := c.Query("action")
	userID := c.Query("user_id")

	query := database.DB.Model(&models.TAuditTrail{})

	if modul != "" {
		query = query.Where("modul = ?", modul)
	}
	if action != "" {
		query = query.Where("action = ?", action)
	}
	if userID != "" {
		query = query.Where("user_id LIKE ?", "%"+userID+"%")
	}

	// Pagination Params
	limit := c.QueryInt("limit", 50)
	if limit <= 0 { limit = 50 }
	offset := c.QueryInt("offset", 0)

	// Count total records with filters
	var total int64
	query.Session(&gorm.Session{}).Count(&total)

	// Fetch data with pagination
	if err := query.Order("created_at desc").Limit(limit).Offset(offset).Find(&logs).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to fetch audit logs"})
	}

	return c.JSON(fiber.Map{
		"data":  logs,
		"total": total,
		"page":  (offset / limit) + 1,
		"limit": limit,
	})
}
