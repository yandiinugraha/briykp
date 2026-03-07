package controllers

import (
	"fmt"
	"time"

	"briyjkp/database"
	"briyjkp/middlewares"
	"briyjkp/models"

	"github.com/gofiber/fiber/v2"
)

// CreatePembayaranPremi inserts a new payment record
// @Summary Record Pembayaran Premi
// @Description Endpoint untuk mencatat pembayaran premi/nota dinas.
// @Tags Keuangan
// @Accept json
// @Produce json
// @Param pembayaran body models.TPembayaranPremi true "Data Pembayaran"
// @Success 201 {object} models.TPembayaranPremi
// @Router /finance/pembayaran [post]
func CreatePembayaranPremi(c *fiber.Ctx) error {
	pembayaran := new(models.TPembayaranPremi)

	if err := c.BodyParser(pembayaran); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Cannot parse JSON"})
	}

	if pembayaran.NoNotaDinas == "" {
		pembayaran.NoNotaDinas = fmt.Sprintf("ND-%s", time.Now().Format("20060102150405"))
	}

	if err := database.DB.Create(&pembayaran).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to create pembayaran record"})
	}

	// Trigger Audit Log
	userIP := c.IP()
	newValStr := fmt.Sprintf("Pembayaran Premi %s recorded with total %v", pembayaran.NoNotaDinas, pembayaran.TotalPremi)
	middlewares.AuditChannel <- middlewares.AuditLogData{
		UserID:    c.Locals("username").(string),
		Modul:     "Keuangan - Pembayaran",
		Action:    "INSERT",
		OldValue:  nil,
		NewValue:  &newValStr,
		IpAddress: &userIP,
	}

	return c.Status(fiber.StatusCreated).JSON(pembayaran)
}

// CreateRefundPremi records a new refund activity
// @Summary Record Refund Premi
// @Description Endpoint untuk pencatatan Refund Premi.
// @Tags Keuangan
// @Accept json
// @Produce json
// @Param refund body models.TRefundPremi true "Data Refund"
// @Success 201 {object} models.TRefundPremi
// @Router /finance/refund [post]
func CreateRefundPremi(c *fiber.Ctx) error {
	refund := new(models.TRefundPremi)

	if err := c.BodyParser(refund); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Cannot parse JSON"})
	}

	if refund.IDRefund == "" {
		refund.IDRefund = fmt.Sprintf("REF-%s", time.Now().Format("20060102150405"))
	}

	if err := database.DB.Create(&refund).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to create refund record"})
	}

	// Trigger Audit Log
	userIP := c.IP()
	newValStr := fmt.Sprintf("Refund Premi %s recorded with total %v", refund.IDRefund, refund.NominalRefund)
	middlewares.AuditChannel <- middlewares.AuditLogData{
		UserID:    c.Locals("username").(string),
		Modul:     "Keuangan - Refund",
		Action:    "INSERT",
		OldValue:  nil,
		NewValue:  &newValStr,
		IpAddress: &userIP,
	}

	return c.Status(fiber.StatusCreated).JSON(refund)
}

// GetAllPembayaran fetches all payments history
// @Summary Get All Pembayaran
// @Description Fetches full payment database logs for finance preview.
// @Tags Keuangan
// @Accept json
// @Produce json
// @Success 200 {array} models.TPembayaranPremi
// @Router /finance/pembayaran [get]
func GetAllPembayaran(c *fiber.Ctx) error {
	var results []models.TPembayaranPremi
	if err := database.DB.Find(&results).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to fetch data"})
	}
	return c.JSON(results)
}
