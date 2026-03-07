package controllers

import (
	"fmt"
	"time"

	"briyjkp/database"
	"briyjkp/middlewares"
	"briyjkp/models"

	"github.com/gofiber/fiber/v2"
	"github.com/xuri/excelize/v2"
)

// UploadPesertaExcel handles bulk insertion from an Excel file
// @Summary Upload Excel Data Kepesertaan (HC BRI)
// @Description Mengunggah dan mem-parsing file XLSX berisi data peserta secara massal.
// @Tags Peserta
// @Accept multipart/form-data
// @Produce json
// @Param file formData file true "Excel file (.xlsx)"
// @Success 200 {object} map[string]interface{}
// @Router /upload/peserta [post]
func UploadPesertaExcel(c *fiber.Ctx) error {
	// Parse the multipart form
	file, err := c.FormFile("file")
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Failed to upload file. Pastikan parameter berupa 'file'.",
		})
	}

	// Open the uploaded file directly in memory
	openedFile, err := file.Open()
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Cannot open uploaded file.",
		})
	}
	defer openedFile.Close()

	// Read via Excelize
	f, err := excelize.OpenReader(openedFile)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Gagal membaca format Excel. Pastikan file adalah .xlsx yang valid.",
		})
	}
	defer f.Close()

	// We assume data is on "Sheet1"
	// For production, you can iterate over sheets or configure specific names
	sheetName := f.GetSheetName(0)
	rows, err := f.GetRows(sheetName)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Gagal membaca baris data di sheet.",
		})
	}

	var insertedCount int
	var errCount int

	// Loop rows (Skip Header at index 0)
	for i, row := range rows {
		if i == 0 {
			continue // Skip Header: NIK, Nama, Tanggal, dll
		}

		// Ensure we have enough columns to prevent panic (Assumed: NIK[0], NAMA[1])
		if len(row) < 2 {
			errCount++
			continue
		}

		nik := row[0]
		nama := row[1]

		if nik == "" || nama == "" {
			errCount++
			continue
		}

		// Simulate Group 1 (Pensiun Normal) IDKelompok
		defaultKelompokID := uint(1)

		peserta := models.TPeserta{
			IDPeserta:   fmt.Sprintf("BLK-%s-%d", time.Now().Format("060102150405"), i),
			NikBri:      nik,
			NamaPeserta: nama,
			IDKelompok:  &defaultKelompokID,
		}

		// Attempt to insert. If NIK exists, it will throw an error and we skip.
		if dbErr := database.DB.Create(&peserta).Error; dbErr != nil {
			errCount++
		} else {
			insertedCount++
		}
	}

	// Trigger Audit Log
	userIP := c.IP()
	newValStr := fmt.Sprintf("Bulk Upload %d Rows Processed, %d Success, %d Failed", len(rows)-1, insertedCount, errCount)
	middlewares.AuditChannel <- middlewares.AuditLogData{
		UserID:    c.Locals("username").(string),
		Modul:     "Bulk Upload Peserta",
		Action:    "UPLOAD",
		OldValue:  nil,
		NewValue:  &newValStr,
		IpAddress: &userIP,
	}

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"message":   "Proses Upload Selesai",
		"total_row": len(rows) - 1,
		"inserted":  insertedCount,
		"failed":    errCount, // Could fail due to duplicate NIK or missing fields
	})
}
