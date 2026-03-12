package controllers

import (
	"briyjkp/database"
	"briyjkp/middlewares"
	"briyjkp/models"
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"time"
	
	"github.com/gofiber/fiber/v2"
	"gorm.io/gorm"
)

// SubmitPendaftaran creating a new ticket for Checker/Signer
func SubmitPendaftaran(c *fiber.Ctx) error {
	var pendaftaran models.TPendaftaranManfaat
	if err := c.BodyParser(&pendaftaran); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid input"})
	}

	// Generate ID if empty
	if pendaftaran.IDPengajuan == "" {
		pendaftaran.IDPengajuan = "PGJ-" + time.Now().Format("20060102150405")
	}
	pendaftaran.TglPengajuan = time.Now()
	pendaftaran.StatusApproval = "PENDING_CHECKER" // Default after Maker submits

	if err := database.DB.Create(&pendaftaran).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to submit pendaftaran"})
	}

	// Audit Log
	userIP := c.IP()
	msg := "New Approval Request: " + pendaftaran.IDPengajuan
	middlewares.AuditChannel <- middlewares.AuditLogData{
		UserID:    c.Locals("username").(string),
		Modul:     "Approval",
		Action:    "SUBMIT",
		NewValue:  &msg,
		IpAddress: &userIP,
	}

	// Trigger Notification for Admin (Checker)
	adminRole := "Admin"
	approvalLink := "/approval"
	database.DB.Create(&models.TNotification{
		Role:    &adminRole,
		Title:   "Pendaftaran Baru Menunggu Validasi",
		Message: "Terdapat pengajuan " + pendaftaran.IDPengajuan + " yang menunggu validasi Checker.",
		LinkURL: &approvalLink,
	})

	return c.JSON(pendaftaran)
}

// ProcessApproval represents Maker-Checker-Signer workflow
func ProcessApproval(c *fiber.Ctx) error {
	type ApprovalReq struct {
		IDTransaksi string `json:"id_transaksi"`
		Action      string `json:"action"` // APPROVE, REJECT
		Catatan     string `json:"catatan"`
	}

	var req ApprovalReq
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid input"})
	}

	// Get user role from JWT
	userRoleRaw := c.Locals("role")
	var role string
	if userRoleRaw != nil {
		userRoleStr := userRoleRaw.(string)
		if userRoleStr == "Super Admin" {
			role = "SIGNER"
		} else if userRoleStr == "Admin" {
			role = "CHECKER"
		} else {
			role = "MAKER"
		}
	} else {
		role = "CHECKER"
	}

	// Database Transaction
	errTx := database.DB.Transaction(func(tx *gorm.DB) error {
		var pendaftaran models.TPendaftaranManfaat
		if err := tx.First(&pendaftaran, "id_pengajuan = ?", req.IDTransaksi).Error; err != nil {
			return err
		}

		var nextStatus string
		if req.Action == "APPROVE" {
			// Logic Maker -> Checker -> Signer
			if pendaftaran.StatusApproval == "PENDING_CHECKER" && role == "CHECKER" {
				nextStatus = "PENDING_SIGNER"
			} else if pendaftaran.StatusApproval == "PENDING_SIGNER" && role == "SIGNER" {
				nextStatus = "APPROVED"

				// APPLY DATA CHANGES UPON FINAL APPROVAL
				if pendaftaran.JenisManfaat == "DAFTAR_BPJS" {
					if pendaftaran.DataBaru != nil {
						var participantIDs []string
						if err := json.Unmarshal([]byte(*pendaftaran.DataBaru), &participantIDs); err == nil && len(participantIDs) > 0 {
							tx.Model(&models.TPeserta{}).Where("id_peserta IN ?", participantIDs).Update("status_bpjs_id", 1)
						}
					}
				} else if pendaftaran.JenisManfaat == "DAFTAR_BRILIFE" {
					if pendaftaran.DataBaru != nil {
						var participantIDs []string
						if err := json.Unmarshal([]byte(*pendaftaran.DataBaru), &participantIDs); err == nil && len(participantIDs) > 0 {
							tx.Model(&models.TPeserta{}).Where("id_peserta IN ?", participantIDs).Update("status_brilife_id", 1)
						}
					}
				} else if pendaftaran.JenisManfaat == "FEEDBACK_BPJS" {
					tx.Model(&models.TPeserta{}).Where("status_bpjs_id != ? OR status_bpjs_id IS NULL", 1).Update("status_bpjs_id", 1)
				} else if pendaftaran.JenisManfaat == "PENDAFTARAN_PESERTA_BARU" || pendaftaran.JenisManfaat == "PEMBARUAN_PESERTA" {
					if pendaftaran.DataBaru != nil {
						var updateData models.TPeserta
						if err := json.Unmarshal([]byte(*pendaftaran.DataBaru), &updateData); err == nil {
							if pendaftaran.IDPeserta != nil {
								tx.Model(&models.TPeserta{}).Where("id_peserta = ?", *pendaftaran.IDPeserta).Updates(updateData)
							} else {
								// Fix ID generation for new peserta
								if updateData.IDPeserta == "" {
									updateData.IDPeserta = "PST-" + time.Now().Format("20060102150405")
								}
								tx.Create(&updateData)
								pendaftaran.IDPeserta = &updateData.IDPeserta
							}
						}
					}

					// Generate SK Prospens
					sk := models.TSkProspens{
						IDSk: "SK-" + time.Now().Format("20060102150405"),
						IDPengajuan: pendaftaran.IDPengajuan,
						TglDiterbitkan: time.Now(),
					}
					tx.Create(&sk)
				}
			} else if pendaftaran.StatusApproval == "DRAFT" && role == "MAKER" {
				nextStatus = "PENDING_CHECKER"
			} else {
				// Prevent invalid transitions or unauthorized approvals
				return fmt.Errorf("invalid approval sequence or unauthorized role")
			}
		} else {
			nextStatus = "REJECTED"
		}

		pendaftaran.StatusApproval = nextStatus
		if err := tx.Save(&pendaftaran).Error; err != nil {
			return err
		}

		// Insert Log
		logEntry := models.TApprovalLog{
			IDTransaksi: pendaftaran.IDPengajuan,
			Role:        role,
			Status:      req.Action,
			Catatan:     &req.Catatan,
		}
		if err := tx.Create(&logEntry).Error; err != nil {
			return err
		}

		return nil
	})

	if errTx != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": errTx.Error()})
	}

	// Trigger Audit Log
	userIP := c.IP()
	newValStr := "Approval Status: " + req.Action
	userID := "System"
	if u := c.Locals("username"); u != nil {
		userID = u.(string)
	}
	middlewares.AuditChannel <- middlewares.AuditLogData{
		UserID:    userID,
		Modul:     "Approval",
		Action:    "UPDATE",
		NewValue:  &newValStr,
		IpAddress: &userIP,
	}

	// Trigger Notification based on Action and Role
	approvalLink := "/approval"
	if req.Action == "APPROVE" {
		if role == "MAKER" {
			adminRole := "Admin"
			database.DB.Create(&models.TNotification{
				Role:    &adminRole,
				Title:   "Pendaftaran Baru Menunggu Validasi",
				Message: "Ada pengajuan " + req.IDTransaksi + " dari Maker.",
				LinkURL: &approvalLink,
			})
		} else if role == "CHECKER" {
			signerRole := "Super Admin"
			database.DB.Create(&models.TNotification{
				Role:    &signerRole,
				Title:   "Pendaftaran Baru Menunggu Persetujuan",
				Message: "Ada pengajuan " + req.IDTransaksi + " menunggu persetujuan Signer/Reviewer.",
				LinkURL: &approvalLink,
			})
		} else if role == "SIGNER" {
			staffRole := "Staff"
			database.DB.Create(&models.TNotification{
				Role:    &staffRole,
				Title:   "Pendaftaran Disetujui",
				Message: "Pengajuan " + req.IDTransaksi + " telah disetujui sepenuhnya.",
				LinkURL: &approvalLink,
			})
		}
	} else {
		staffRole := "Staff"
		database.DB.Create(&models.TNotification{
			Role:    &staffRole,
			Title:   "Pengajuan Ditolak",
			Message: "Pengajuan " + req.IDTransaksi + " ditolak. Cek Workspace.",
			LinkURL: &approvalLink,
		})
	}

	return c.JSON(fiber.Map{"message": "Approval processed successfully", "status": "ok"})
}

// GetAllPendaftaran retrieves all submitted requests
func GetAllPendaftaran(c *fiber.Ctx) error {
	var results []models.TPendaftaranManfaat
	if err := database.DB.Preload("Peserta").Preload("Lampirans").Preload("ApprovalLogs").Find(&results).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to fetch pendaftaran list"})
	}
	return c.JSON(results)
}

// GetPendaftaranByID retrieves a single request
func GetPendaftaranByID(c *fiber.Ctx) error {
	id := c.Params("id")
	var result models.TPendaftaranManfaat
	if err := database.DB.Preload("Peserta").Preload("Lampirans").Preload("ApprovalLogs").First(&result, "id_pengajuan = ?", id).Error; err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "Pendaftaran not found"})
	}
	return c.JSON(result)
}
// GetSkProspens retrieves all generated SK records
func GetSkProspens(c *fiber.Ctx) error {
	var results []models.TSkProspens
	if err := database.DB.Preload("Pendaftaran").Preload("Pendaftaran.Peserta").Find(&results).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to fetch SK Prospens list"})
	}
	return c.JSON(results)
}

// UploadLampiran handles file uploads for a specific ticket
func UploadLampiran(c *fiber.Ctx) error {
	idPengajuan := c.FormValue("id_pengajuan")
	if idPengajuan == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "id_pengajuan is required"})
	}

	file, err := c.FormFile("file")
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "file is required"})
	}

	// Create uploads directory if it doesn't exist
	uploadDir := "./uploads/lampiran"
	if err := os.MkdirAll(uploadDir, 0755); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to create upload directory"})
	}

	// Generate safe filename
	fileName := fmt.Sprintf("%d_%s", time.Now().Unix(), file.Filename)
	filePath := filepath.Join(uploadDir, fileName)

	// Save file to disk
	if err := c.SaveFile(file, filePath); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to save file"})
	}

	// Save metadata to database
	userID := "System" // Fallback
	if uid := c.Locals("username"); uid != nil {
		userID = uid.(string)
	}

	lampiran := models.TLampiran{
		IDPengajuan: idPengajuan,
		FileName:    file.Filename,
		FileSize:    file.Size,
		FileURL:     "/uploads/lampiran/" + fileName,
		UploadedBy:  userID,
	}

	if err := database.DB.Create(&lampiran).Error; err != nil {
		os.Remove(filePath) // Rollback file save
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to save lampiran record"})
	}

	return c.JSON(fiber.Map{
		"message": "File uploaded successfully",
		"data":    lampiran,
	})
}

// DeleteLampiran removes an attachment
func DeleteLampiran(c *fiber.Ctx) error {
	id := c.Params("id")
	var lampiran models.TLampiran

	if err := database.DB.First(&lampiran, id).Error; err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "Lampiran not found"})
	}

	// Remove from disk
	os.Remove("." + lampiran.FileURL)

	// Remove from DB
	if err := database.DB.Delete(&lampiran).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to delete lampiran record"})
	}

	return c.JSON(fiber.Map{"message": "Lampiran deleted successfully"})
}
