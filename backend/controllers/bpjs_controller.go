package controllers

import (
	"briyjkp/database"
	"briyjkp/middlewares"
	"briyjkp/models"
	"encoding/json"
	"time"

	"github.com/gofiber/fiber/v2"
)

// GetBpjsCandidates fetches participants ready to be registered to BPJS
func GetBpjsCandidates(c *fiber.Ctx) error {
	var candidates []models.TPeserta

	// We look for participants where status BPJS is potentially empty/inactive/off 
	// and they need registration based on some Tgl Mutasi.
	// For now, let's fetch those who are not AKTIF in BPJS.
	
	// Assuming StatusBPJS Kode 'AKTIF' = 1, 'NONAKTIF' = 2, 'OFF' = 3
	// We want to fetch those where StatusBpjsID != 1 or is NULL.
	
	query := database.DB.Preload("Kelompok").Preload("Kelas").
		Where("status_bpjs_id != 1 OR status_bpjs_id IS NULL")

	if tglMutasi := c.Query("tgl_mutasi"); tglMutasi != "" {
		query = query.Where("tgl_mutasi = ?", tglMutasi)
	}

	if err := query.Find(&candidates).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to fetch candidates"})
	}

	return c.JSON(candidates)
}

// SubmitBpjsRegistration submit a batch of participants for BPJS registration approval
func SubmitBpjsRegistration(c *fiber.Ctx) error {
	type SubmitReq struct {
		IDPesertaList []string `json:"id_peserta_list"`
		FileSp        string   `json:"file_sp,omitempty"` // Base64 or path
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

	idPengajuan := "BPJS-" + time.Now().Format("20060102150405")

	pendaftaran := models.TPendaftaranManfaat{
		IDPengajuan:    idPengajuan,
		TglPengajuan:   time.Now(),
		JenisManfaat:   "DAFTAR_BPJS",
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
	msg := "Submit BPJS Registration: " + idPengajuan
	middlewares.AuditChannel <- middlewares.AuditLogData{
		UserID:    c.Locals("username").(string),
		Modul:     "BPJS",
		Action:    "SUBMIT",
		NewValue:  &msg,
		IpAddress: &userIP,
	}

	return c.JSON(fiber.Map{
		"message":      "Successfully submitted for approval",
		"id_pengajuan": idPengajuan,
	})
}

// UploadBpjsFeedback handles the staging of BPJS Feedback Excel/CSV file to the approval workflow
func UploadBpjsFeedback(c *fiber.Ctx) error {
	file, err := c.FormFile("file")
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "File is required"})
	}

	// In a real app we'd save the file or parse it. For MVP, we'll store basic file info in DataBaru
	// and trigger the Maker->Checker->Signer flow.
	fileInfo := map[string]interface{}{
		"filename": file.Filename,
		"size":     file.Size,
		"status":   "STAGED_FOR_APPROVAL",
	}

	dataBaruBytes, _ := json.Marshal(fileInfo)
	dataBaruStr := string(dataBaruBytes)

	idPengajuan := "FB-BPJS-" + time.Now().Format("20060102150405")

	pendaftaran := models.TPendaftaranManfaat{
		IDPengajuan:    idPengajuan,
		TglPengajuan:   time.Now(),
		JenisManfaat:   "FEEDBACK_BPJS",
		DataBaru:       &dataBaruStr,
		StatusApproval: "PENDING_CHECKER",
	}

	if err := database.DB.Create(&pendaftaran).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to submit feedback file for approval"})
	}

	// Audit Log
	userIP := c.IP()
	msg := "Uploaded BPJS Feedback: " + file.Filename
	middlewares.AuditChannel <- middlewares.AuditLogData{
		UserID:    c.Locals("username").(string),
		Modul:     "BPJS",
		Action:    "UPLOAD_FEEDBACK",
		NewValue:  &msg,
		IpAddress: &userIP,
	}

	return c.JSON(fiber.Map{
		"message":      "Feedback file submitted for approval",
		"id_pengajuan": idPengajuan,
	})
}
