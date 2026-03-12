package controllers

import (
	"log"

	"briyjkp/database"
	"briyjkp/models"

	"github.com/gofiber/fiber/v2"
)

// GetNotifications fetches notifications for a user based on their ID or Role
func GetNotifications(c *fiber.Ctx) error {
	userID := c.Locals("user_id")
	userRoleRaw := c.Locals("role")

	if userID == nil || userRoleRaw == nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "Unauthorized"})
	}

	roleStr := userRoleRaw.(string)
	userIDStr := userID.(string)

	var notifications []models.TNotification

	// Fetch notifications designated for this specific user OR their role
	if err := database.DB.Where("user_id = ? OR role = ?", userIDStr, roleStr).Order("created_at desc").Limit(20).Find(&notifications).Error; err != nil {
		log.Println("GetNotifications SQL Error:", err)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to fetch notifications"})
	}

	return c.JSON(notifications)
}

// MarkNotificationRead marks a specific notification as read
func MarkNotificationRead(c *fiber.Ctx) error {
	id := c.Params("id")

	if err := database.DB.Model(&models.TNotification{}).Where("id = ?", id).Update("is_read", true).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to update notification"})
	}

	return c.JSON(fiber.Map{"message": "Notification marked as read"})
}

// MarkAllNotificationsRead marks all notifications for a user as read
func MarkAllNotificationsRead(c *fiber.Ctx) error {
	userID := c.Locals("user_id")
	userRoleRaw := c.Locals("role")

	if userID == nil || userRoleRaw == nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "Unauthorized"})
	}

	roleStr := userRoleRaw.(string)
	userIDStr := userID.(string)

	if err := database.DB.Model(&models.TNotification{}).Where("user_id = ? OR role = ?", userIDStr, roleStr).Update("is_read", true).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to update notifications"})
	}

	return c.JSON(fiber.Map{"message": "All notifications marked as read"})
}
