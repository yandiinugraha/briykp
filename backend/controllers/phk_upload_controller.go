package controllers

import (
	"fmt"
	"strconv"
	"strings"
	"encoding/json"

	"briyjkp/database"
	"briyjkp/models"

	"github.com/gofiber/fiber/v2"
	"github.com/xuri/excelize/v2"
)

// UploadPhkFile handles uploading and parsing the PHK Excel file
func UploadPhkFile(c *fiber.Ctx) error {
	bulanStr := c.FormValue("bulan")
	tahunStr := c.FormValue("tahun")
	bulan, err := strconv.Atoi(bulanStr)
	tahun, err2 := strconv.Atoi(tahunStr)

	if err != nil || err2 != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Bulan dan Tahun tidak valid"})
	}

	file, err := c.FormFile("file")
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "File tidak ditemukan"})
	}

	// 1. Check if same month & year already exists
	var existing models.TPhkUpload
	if err := database.DB.Where("bulan = ? AND tahun = ?", bulan, tahun).First(&existing).Error; err == nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": fmt.Sprintf("Data PHK untuk periode %d/%d sudah pernah diupload.", bulan, tahun)})
	}

	f, err := file.Open()
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Gagal membuka file"})
	}
	defer f.Close()

	xlsx, err := excelize.OpenReader(f)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Format file bukan Excel yang valid (.xlsx)"})
	}

	sheetName := xlsx.GetSheetName(0)
	rows, err := xlsx.GetRows(sheetName)
	if err != nil || len(rows) < 2 {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Data Excel kosong atau tidak bisa dibaca"})
	}

	username, ok := c.Locals("username").(string)
	if !ok {
		username = "system"
	}

	upload := models.TPhkUpload{
		Bulan:          bulan,
		Tahun:          tahun,
		FileName:       file.Filename,
		TotalRows:      len(rows) - 1, // minus header
		UploadedBy:     username,
		StatusApproval: "UPLOADED",
	}

	if err := database.DB.Create(&upload).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Gagal menyimpan data upload PHK"})
	}

	// Dynamic column mapping
	var colNip, colPernr, colNama, colUpah, colJG, colPA, colPADesc, colPSA, colPSADesc int = -1, -1, -1, -1, -1, -1, -1, -1, -1
	var details []models.TPhkUploadDetail

	for i, row := range rows {
		if i == 0 {
			// Parse headers to find required columns dynamically
			for j, header := range row {
				upperHeader := strings.ToUpper(strings.TrimSpace(header))
				if upperHeader == "NIK_BRI" || upperHeader == "NIP" {
					colNip = j
				} else if upperHeader == "PN" || upperHeader == "PERNR" {
					colPernr = j
				} else if upperHeader == "COMPLETENAME" || upperHeader == "NAMA" || upperHeader == "NAMA PEGAWAI" {
					colNama = j
				} else if upperHeader == "UPAH POKOK" || upperHeader == "UPAH" {
					colUpah = j
				} else if upperHeader == "JG" {
					colJG = j
				} else if upperHeader == "PERSONNELAREA" {
					colPA = j
				} else if upperHeader == "PADESC" {
					colPADesc = j
				} else if upperHeader == "PERSONNELSUBAREA" {
					colPSA = j
				} else if upperHeader == "PSADESC" {
					colPSADesc = j
				}
			}

			// NIP/PERNR and NAMA are minimum requirements
			if (colNip == -1 && colPernr == -1) || colNama == -1 {
				database.DB.Delete(&upload)
				return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Format kolom Excel tidak sesuai (Min. NIP/PERNR dan COMPLETENAME)"})
			}
			continue
		}

		maxColIdx := colNip
		if colPernr > maxColIdx { maxColIdx = colPernr }
		if colNama > maxColIdx { maxColIdx = colNama }
		if colUpah > maxColIdx { maxColIdx = colUpah }
		if colJG > maxColIdx { maxColIdx = colJG }
		if colPA > maxColIdx { maxColIdx = colPA }
		if colPADesc > maxColIdx { maxColIdx = colPADesc }
		if colPSA > maxColIdx { maxColIdx = colPSA }
		if colPSADesc > maxColIdx { maxColIdx = colPSADesc }

		if len(row) <= maxColIdx && maxColIdx != -1 {
			continue
		}

		nikBri := ""
		if colNip != -1 && len(row) > colNip { nikBri = strings.TrimSpace(row[colNip]) }
		pernr := ""
		if colPernr != -1 && len(row) > colPernr { pernr = strings.TrimSpace(row[colPernr]) }
		nama := ""
		if colNama != -1 && len(row) > colNama { nama = strings.TrimSpace(row[colNama]) }
		
		upahStr := ""
		if colUpah != -1 && len(row) > colUpah { upahStr = strings.TrimSpace(row[colUpah]) }
		upahStr = strings.ReplaceAll(upahStr, ",", "")
		upahStr = strings.ReplaceAll(upahStr, ".", "")
		upahPokok, _ := strconv.ParseFloat(upahStr, 64)

		jg := ""
		if colJG != -1 && len(row) > colJG { jg = strings.TrimSpace(row[colJG]) }
		pa := ""
		if colPA != -1 && len(row) > colPA { pa = strings.TrimSpace(row[colPA]) }
		paDesc := ""
		if colPADesc != -1 && len(row) > colPADesc { paDesc = strings.TrimSpace(row[colPADesc]) }
		psa := ""
		if colPSA != -1 && len(row) > colPSA { psa = strings.TrimSpace(row[colPSA]) }
		psaDesc := ""
		if colPSADesc != -1 && len(row) > colPSADesc { psaDesc = strings.TrimSpace(row[colPSADesc]) }

		if (nikBri == "" && pernr == "") {
			continue
		}

		rawBytes, _ := json.Marshal(row)
		rawStr := string(rawBytes)

		details = append(details, models.TPhkUploadDetail{
			UploadID:         upload.ID,
			NikBri:           nikBri,
			Pernr:            pernr,
			NamaPeserta:      nama,
			UpahPokok:        upahPokok,
			JG:               jg,
			PersonnelArea:    pa,
			PADesc:           paDesc,
			PersonnelSubarea: psa,
			PSADesc:          psaDesc,
			RawData:          &rawStr,
		})
	}

	if len(details) > 0 {
		if err := database.DB.CreateInBatches(&details, 1000).Error; err != nil {
			database.DB.Delete(&upload) // Rollback if error
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Gagal menyimpan rincian data baris Excel"})
		}
	} else {
		database.DB.Delete(&upload)
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Tidak ada baris data valid yang ditemukan"})
	}

	// Update valid uploaded rows count
	upload.TotalRows = len(details)
	database.DB.Save(&upload)

	return c.JSON(fiber.Map{
		"message":   "File PHK berhasil diupload dan diproses",
		"file_name": file.Filename,
		"rows":      len(details),
		"upload_id": upload.ID,
	})
}

// GetPhkUploads returns the history of PHK uploads
func GetPhkUploads(c *fiber.Ctx) error {
	var uploads []models.TPhkUpload
	database.DB.Order("created_at DESC").Find(&uploads)
	return c.JSON(uploads)
}

// GetPhkUploadDetails returns rows for a specific PHK upload
func GetPhkUploadDetails(c *fiber.Ctx) error {
	id := c.Params("id")
	var details []models.TPhkUploadDetail
	database.DB.Where("upload_id = ?", id).Find(&details)
	return c.JSON(details)
}

// SubmitPhkForApproval moves upload to PENDING_CHECKER and logs notification
func SubmitPhkForApproval(c *fiber.Ctx) error {
	id := c.Params("id")
	var upload models.TPhkUpload
	if err := database.DB.First(&upload, id).Error; err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "Upload tidak ditemukan"})
	}

	if upload.StatusApproval != "UPLOADED" && upload.StatusApproval != "COMPARED" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Status upload tidak valid untuk disubmit"})
	}

	upload.StatusApproval = "PENDING_CHECKER"
	database.DB.Save(&upload)

	username := c.Locals("username").(string)

	// Audit Trail
	oldVal := "UPLOADED/COMPARED"
	newVal := "PENDING_CHECKER"
	database.DB.Create(&models.TAuditTrail{
		UserID:   username,
		Modul:    "Upload PHK",
		Action:   "SUBMIT",
		OldValue: &oldVal,
		NewValue: &newVal,
	})

	// Notification
	role := "Admin" // notify Checker (Admin)
	msg := fmt.Sprintf("Data PHK untuk %s telah disubmit. Menunggu persetujuan Checker.", upload.FileName)
	link := "/kepesertaan/phk/upload" // Assuming approval is on the same page initially
	database.DB.Create(&models.TNotification{
		Role:    &role,
		Title:   "Menunggu Persetujuan PHK (Checker)",
		Message: msg,
		LinkURL: &link,
	})

	return c.JSON(fiber.Map{"message": "Upload PHK disubmit ke Checker", "upload": upload})
}

// ProcessPhkApproval handles Checker/Signer approval with audit and notifications
func ProcessPhkApproval(c *fiber.Ctx) error {
	id := c.Params("id")
	req := new(ApprovalRequest) // Ensure ApprovalRequest struct is accessible or define it local

	if err := c.BodyParser(req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Cannot parse JSON"})
	}

	var upload models.TPhkUpload
	if err := database.DB.First(&upload, id).Error; err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "Upload tidak ditemukan"})
	}

	role := c.Locals("role")
	roleStr, ok := role.(string)
	if !ok {
		roleStr = ""
	}
	username := c.Locals("username").(string)
	oldStatus := upload.StatusApproval
	var newVal string
	var notifMsg string
	var notifRole string

	if req.Action == "REJECT" {
		if upload.StatusApproval == "PENDING_CHECKER" {
			if !strings.EqualFold(roleStr, "admin") && !strings.EqualFold(roleStr, "super admin") {
				return c.Status(fiber.StatusForbidden).JSON(fiber.Map{"error": "Unauthorized as Checker"})
			}
			upload.StatusApproval = "REJECTED"
			upload.CatatanChecker = &req.Catatan
			upload.CheckerID = &username
		} else if upload.StatusApproval == "PENDING_SIGNER" {
			if !strings.EqualFold(roleStr, "super admin") {
				return c.Status(fiber.StatusForbidden).JSON(fiber.Map{"error": "Unauthorized as Signer"})
			}
			upload.StatusApproval = "REJECTED"
			upload.CatatanSigner = &req.Catatan
			upload.SignerID = &username
		}
		newVal = "REJECTED"
		notifMsg = fmt.Sprintf("Data PHK %s telah ditolak.", upload.FileName)
		notifRole = "Maker"
	} else if req.Action == "APPROVE" {
		if upload.StatusApproval == "PENDING_CHECKER" {
			if !strings.EqualFold(roleStr, "admin") && !strings.EqualFold(roleStr, "super admin") {
				return c.Status(fiber.StatusForbidden).JSON(fiber.Map{"error": "Unauthorized as Checker"})
			}
			upload.StatusApproval = "PENDING_SIGNER"
			upload.CatatanChecker = &req.Catatan
			upload.CheckerID = &username
			newVal = "PENDING_SIGNER"
			notifMsg = fmt.Sprintf("Data PHK %s diteruskan ke Signer.", upload.FileName)
			notifRole = "Super Admin"
		} else if upload.StatusApproval == "PENDING_SIGNER" {
			if !strings.EqualFold(roleStr, "super admin") {
				return c.Status(fiber.StatusForbidden).JSON(fiber.Map{"error": "Unauthorized as Signer"})
			}
			upload.StatusApproval = "APPROVED"
			upload.CatatanSigner = &req.Catatan
			upload.SignerID = &username
			newVal = "APPROVED"
			notifMsg = fmt.Sprintf("Data PHK %s telah disetujui (Approved).", upload.FileName)
			notifRole = "Maker"
			// ─── PENDING OTOMATISASI SAMPAI DIPROSES VIA "PROSES ANGGOTA BARU" ───
			var details []models.TPhkUploadDetail
			database.DB.Where("upload_id = ?", upload.ID).Find(&details)
			
			for _, d := range details {
				// Check if already in discrepancy
				var count int64
				database.DB.Model(&models.TIuranDiscrepancy{}).
					Where("bulan = ? AND tahun = ? AND nik_bri = ? AND jenis_selisih = 'NEW_MEMBER'", upload.Bulan, upload.Tahun, d.NikBri).
					Count(&count)
					
				if count == 0 {
					database.DB.Create(&models.TIuranDiscrepancy{
						Bulan:       upload.Bulan,
						Tahun:       upload.Tahun,
						NikBri:      d.NikBri,
						Pernr:       d.Pernr,
						NamaPeserta: d.NamaPeserta,
						JenisSelisih: "NEW_MEMBER",
					})
				}
			}
		}
	} else {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Aksi tidak valid"})
	}

	database.DB.Save(&upload)

	// Audit Trail
	database.DB.Create(&models.TAuditTrail{
		UserID:   username,
		Modul:    "Upload PHK",
		Action:   req.Action,
		OldValue: &oldStatus,
		NewValue: &newVal,
	})

	// Notification
	link := "/kepesertaan/phk/upload"
	database.DB.Create(&models.TNotification{
		Role:    &notifRole, // "Maker" doesn't strictly exist as a string role, might want to assign to Staff or null to notify user directly (not fully mapped here)
		Title:   "Pembaruan Status PHK",
		Message: notifMsg,
		LinkURL: &link,
	})

	return c.JSON(fiber.Map{"message": "Berhasil memproses", "upload": upload})
}
