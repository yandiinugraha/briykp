package controllers

import (
	"briyjkp/database"
	"briyjkp/models"
	"time"

	"github.com/gofiber/fiber/v2"
)

// GetIuranPeriods retrieves all contribution periods
func GetIuranPeriods(c *fiber.Ctx) error {
	var results []models.TIuranInput
	if err := database.DB.Order("tahun DESC, bulan DESC").Find(&results).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to fetch iuran list"})
	}
	return c.JSON(results)
}

// CreateIuranPeriod initializes a new contribution period
func CreateIuranPeriod(c *fiber.Ctx) error {
	type Request struct {
		Bulan int `json:"bulan"`
		Tahun int `json:"tahun"`
	}

	var req Request
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid input"})
	}

	// Check if already exists
	var existing models.TIuranInput
	if err := database.DB.Where("bulan = ? AND tahun = ?", req.Bulan, req.Tahun).First(&existing).Error; err == nil {
		return c.Status(fiber.StatusConflict).JSON(fiber.Map{"error": "Periode iuran sudah ada"})
	}

	newIuran := models.TIuranInput{
		Bulan:        req.Bulan,
		Tahun:        req.Tahun,
		TanggalInput: time.Now(),
		Status:       "DRAFT",
	}

	if err := database.DB.Create(&newIuran).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to create iuran period"})
	}

	return c.JSON(newIuran)
}

// GetIuranDetails retrieves member details for a specific period
func GetIuranDetails(c *fiber.Ctx) error {
	id := c.Params("id")
	var details []models.TIuranDetail
	if err := database.DB.Preload("Peserta").Where("id_iuran = ?", id).Find(&details).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to fetch iuran details"})
	}
	return c.JSON(details)
}

// TODO: Implement ImportIuranData (Excel/CSV)
