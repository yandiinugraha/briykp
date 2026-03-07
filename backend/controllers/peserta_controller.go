package controllers

import (
	"log"
	"time"

	"briyjkp/database"
	"briyjkp/middlewares"
	"briyjkp/models"

	"github.com/gofiber/fiber/v2"
)

// GetAllPeserta handles fetching all participant data
// @Summary Get all peserta
// @Description Fetches all active and inactive participant data
// @Tags Peserta
// @Accept json
// @Produce json
// @Success 200 {array} models.TPeserta
// @Router /peserta [get]
func GetAllPeserta(c *fiber.Ctx) error {
	var peserta []models.TPeserta

	if err := database.DB.Preload("Kelompok").Preload("Kelas").Preload("StatusBpjs").Preload("StatusBrilife").Find(&peserta).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to fetch data"})
	}

	return c.JSON(peserta)
}

// GetProyeksiPendaftaran fetches participants filtered by TglPhk >= today
func GetProyeksiPendaftaran(c *fiber.Ctx) error {
	var peserta []models.TPeserta

	tglStr := c.Query("tanggal") // Filter Date Query String

	query := database.DB.Preload("Kelompok").Preload("Kelas").Preload("StatusBpjs").Preload("StatusBrilife")
	
	if tglStr != "" {
		query = query.Where("tgl_phk >= ?", tglStr)
	}

	if err := query.Find(&peserta).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to fetch proyeksi data"})
	}

	return c.JSON(peserta)
}

// CreatePeserta manually inserts a new participant record
// @Summary Create new peserta
// @Description Creates a new participant record for YKP manual input
// @Tags Peserta
// @Accept json
// @Produce json
// @Param peserta body models.TPeserta true "Data Peserta"
// @Success 201 {object} models.TPeserta
// @Router /peserta [post]
func CreatePeserta(c *fiber.Ctx) error {
	peserta := new(models.TPeserta)

	if err := c.BodyParser(peserta); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Cannot parse JSON"})
	}

	// Manual ID generation for demo purposes, typical use case involves HC mapping logic
	peserta.IDPeserta = "P-" + time.Now().Format("20060102150405")

	if err := database.DB.Create(&peserta).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to create participant"})
	}

	// Trigger Audit Log
	userIP := c.IP()
	newValStr := "New Participant Created" // Simplify JSON serialization for Audit Log demo
	middlewares.AuditChannel <- middlewares.AuditLogData{
		UserID:    c.Locals("username").(string), // JWT Username
		Modul:     "Peserta",
		Action:    "INSERT",
		OldValue:  nil,
		NewValue:  &newValStr,
		IpAddress: &userIP,
	}

	return c.Status(fiber.StatusCreated).JSON(peserta)
}

// UpdatePeserta updates existing participant details
// @Summary Update peserta
// @Description Update participant details by ID
// @Tags Peserta
// @Accept json
// @Produce json
// @Param id path string true "ID Peserta"
// @Param peserta body models.TPeserta true "Update Data Peserta"
// @Success 200 {object} models.TPeserta
// @Router /peserta/{id} [put]
func UpdatePeserta(c *fiber.Ctx) error {
	id := c.Params("id")

	var peserta models.TPeserta
	if err := database.DB.First(&peserta, "id_peserta = ?", id).Error; err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "Participant not found"})
	}

	if err := c.BodyParser(&peserta); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Cannot parse JSON"})
	}

	if err := database.DB.Save(&peserta).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to update participant"})
	}

	// Trigger Audit Log
	userIP := c.IP()
	newValStr := "Participant Updated" // Simplify JSON serialization for Audit Log demo
	middlewares.AuditChannel <- middlewares.AuditLogData{
		UserID:    c.Locals("username").(string), // JWT Username
		Modul:     "Peserta",
		Action:    "UPDATE",
		OldValue:  nil,
		NewValue:  &newValStr,
		IpAddress: &userIP,
	}

	return c.JSON(peserta)
}

// GetPesertaByID fetches single detail
// @Summary Get peserta by ID
// @Description Fetch comprehensive details of a specific participant
// @Tags Peserta
// @Accept json
// @Produce json
// @Param id path string true "ID Peserta"
// @Success 200 {object} models.TPeserta
// @Router /peserta/{id} [get]
func GetPesertaByID(c *fiber.Ctx) error {
	id := c.Params("id")
	var peserta models.TPeserta

	if err := database.DB.Preload("Kelompok").Preload("Kelas").Preload("StatusBpjs").Preload("StatusBrilife").First(&peserta, "id_peserta = ?", id).Error; err != nil {
		log.Println("Error fetching data:", err)
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "Not Found"})
	}

	return c.JSON(peserta)
}

// DeletePeserta removes a participant
func DeletePeserta(c *fiber.Ctx) error {
	id := c.Params("id")
	if err := database.DB.Delete(&models.TPeserta{}, "id_peserta = ?", id).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to delete participant"})
	}

	// Trigger Audit Log
	userIP := c.IP()
	msg := "Participant Deleted"
	middlewares.AuditChannel <- middlewares.AuditLogData{
		UserID:    c.Locals("username").(string),
		Modul:     "Peserta",
		Action:    "DELETE",
		OldValue:  &id,
		NewValue:  &msg,
		IpAddress: &userIP,
	}

	return c.SendStatus(fiber.StatusNoContent)
}
