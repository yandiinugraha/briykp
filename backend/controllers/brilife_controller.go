package controllers

import (
	"briyjkp/database"
	"briyjkp/middlewares"
	"briyjkp/models"
	"encoding/json"
	"time"

	"github.com/gofiber/fiber/v2"
)

// GetBrilifeCandidates fetches participants ready to be registered to BRI Life
func GetBrilifeCandidates(c *fiber.Ctx) error {
	var candidates []models.TPeserta

	// We look for participants where status BRI Life is potentially empty/inactive/off 
	// and they need registration based on some Tmt Pertanggungan.
	// Assuming StatusBrilife Kode 'AKTIF' = 1, 'NONAKTIF' = 2
	// We want to fetch those where StatusBrilifeID != 1 or is NULL.
	
	query := database.DB.Preload("Kelompok").Preload("Kelas").
		Where("status_brilife_id != 1 OR status_brilife_id IS NULL")

	if tmt := c.Query("tmt_pertanggungan"); tmt != "" {
		query = query.Where("tmt_pertanggungan = ?", tmt)
	}

	if err := query.Find(&candidates).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to fetch BRI Life candidates"})
	}

	return c.JSON(candidates)
}

// SubmitBrilifeRegistration submit a batch of participants for BRI Life registration approval
func SubmitBrilifeRegistration(c *fiber.Ctx) error {
	type SubmitReq struct {
		IDPesertaList []string `json:"id_peserta_list"`
		FileSp        string   `json:"file_sp,omitempty"` 
	}

	var req SubmitReq
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid input"})
	}

	if len(req.IDPesertaList) == 0 {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "No participants selected"})
	}

	// Store the list as DataBaru JSON
	dataBaruBytes, _ := json.Marshal(req.IDPesertaList)
	dataBaruStr := string(dataBaruBytes)

	idPengajuan := "BRILIFE-" + time.Now().Format("20060102150405")

	pendaftaran := models.TPendaftaranManfaat{
		IDPengajuan:    idPengajuan,
		TglPengajuan:   time.Now(),
		JenisManfaat:   "DAFTAR_BRILIFE",
		DataBaru:       &dataBaruStr,
		StatusApproval: "PENDING_CHECKER",
	}

	if req.FileSp != "" {
		pendaftaran.FileSp = &req.FileSp
	}

	if err := database.DB.Create(&pendaftaran).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to submit registration"})
	}

	// Audit Log
	userIP := c.IP()
	msg := "Submit BRI Life Registration: " + idPengajuan
	middlewares.AuditChannel <- middlewares.AuditLogData{
		UserID:    c.Locals("username").(string),
		Modul:     "BRILIFE",
		Action:    "SUBMIT",
		NewValue:  &msg,
		IpAddress: &userIP,
	}

	return c.JSON(fiber.Map{
		"message":      "Successfully submitted for approval",
		"id_pengajuan": idPengajuan,
	})
}
