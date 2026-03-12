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

// UploadIuranFile handles Excel file upload for THT or Prospens data
func UploadIuranFile(c *fiber.Ctx) error {
	jenisIuran := c.FormValue("jenis_iuran") // "THT" or "PROSPENS"
	bulanStr := c.FormValue("bulan")
	tahunStr := c.FormValue("tahun")

	if jenisIuran == "" || bulanStr == "" || tahunStr == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "jenis_iuran, bulan, dan tahun wajib diisi"})
	}

	bulan, _ := strconv.Atoi(bulanStr)
	tahun, _ := strconv.Atoi(tahunStr)

	file, err := c.FormFile("file")
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "File wajib diupload"})
	}

	// Open the uploaded file
	src, err := file.Open()
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Gagal membuka file"})
	}
	defer src.Close()

	f, err := excelize.OpenReader(src)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "File bukan format Excel yang valid"})
	}
	defer f.Close()

	// Read the first sheet
	sheetName := f.GetSheetName(0)
	rows, err := f.GetRows(sheetName)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Gagal membaca data Excel"})
	}

	if len(rows) < 2 {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "File Excel tidak memiliki data (minimal header + 1 baris)"})
	}

	username := c.Locals("username").(string)

	// Create upload record
	upload := models.TIuranUpload{
		Bulan:          bulan,
		Tahun:          tahun,
		JenisIuran:     strings.ToUpper(jenisIuran),
		FileName:       file.Filename,
		UploadedBy:     username,
		StatusApproval: "UPLOADED",
	}

	if err := database.DB.Create(&upload).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Gagal menyimpan data upload"})
	}

	// Dynamic column mapping based on headers
	var colNip, colPernr, colNama, colNominal, colKeterangan int = -1, -1, -1, -1, -1
	var details []models.TIuranUploadDetail
	var totalNominal float64

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
				} else if jenisIuran == "THT" && (upperHeader == "TOTAL THT" || upperHeader == "THT" || upperHeader == "NOMINAL") {
					colNominal = j
				} else if jenisIuran == "PROSPENS" && (upperHeader == "TOTAL PROSPENS" || upperHeader == "PROSPENS" || upperHeader == "NOMINAL") {
					colNominal = j
				} else if upperHeader == "KETERANGAN 1" || upperHeader == "KETERANGAN TMT_PT" || strings.HasPrefix(upperHeader, "KETERANGAN") {
					colKeterangan = j
				}
			}

			// If we couldn't find the necessary columns, abort
			if colNip == -1 || colNama == -1 || colNominal == -1 {
				// Delete the upload record since we abort
				database.DB.Delete(&upload)
				return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": fmt.Sprintf("Format kolom Excel tidak sesuai (NIP: %d, NAMA: %d, TOTAL: %d)", colNip, colNama, colNominal)})
			}
			continue // skip header
		}

		// Ensure the row has enough columns based on our found indexes
		maxColIdx := colNip
		if colPernr > maxColIdx { maxColIdx = colPernr }
		if colNama > maxColIdx { maxColIdx = colNama }
		if colNominal > maxColIdx { maxColIdx = colNominal }
		if colKeterangan > maxColIdx { maxColIdx = colKeterangan }

		if len(row) <= maxColIdx {
			continue
		}

		nikBri := ""
		if colNip != -1 { nikBri = strings.TrimSpace(row[colNip]) }
		pernr := ""
		if colPernr != -1 { pernr = strings.TrimSpace(row[colPernr]) }
		nama := ""
		if colNama != -1 { nama = strings.TrimSpace(row[colNama]) }
		nominalStr := ""
		if colNominal != -1 { nominalStr = strings.TrimSpace(row[colNominal]) }
		
		keterangan := ""
		if colKeterangan != -1 {
			keterangan = strings.TrimSpace(row[colKeterangan])
		}

		// Parse nominal (handle comma format)
		nominalStr = strings.ReplaceAll(nominalStr, ",", "")
		nominalStr = strings.ReplaceAll(nominalStr, ".", "")
		nominal, _ := strconv.ParseFloat(nominalStr, 64)

		if nikBri == "" || nominal == 0 {
			continue
		}

		rawBytes, _ := json.Marshal(row)
		rawStr := string(rawBytes)

		details = append(details, models.TIuranUploadDetail{
			UploadID:     upload.ID,
			NikBri:       nikBri,
			Pernr:        pernr,
			NamaPeserta:  nama,
			NominalIuran: nominal,
			Keterangan:   keterangan,
			RawData:      &rawStr,
		})
		totalNominal += nominal
	}

	// Batch insert details significantly faster
	if len(details) > 0 {
		if err := database.DB.CreateInBatches(&details, 1000).Error; err != nil {
			database.DB.Delete(&upload)
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Gagal menyimpan detail iuran ke database"})
		}
	} else {
		database.DB.Delete(&upload)
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Tidak ada data nominal valid yang ditemukan dalam Excel"})
	}

	// Update upload totals
	upload.TotalRows = len(details)
	upload.TotalNominal = totalNominal
	database.DB.Save(&upload)

	return c.JSON(fiber.Map{
		"message":       fmt.Sprintf("Berhasil upload %d baris data %s", len(details), jenisIuran),
		"upload":        upload,
		"total_rows":    len(details),
		"total_nominal": totalNominal,
	})
}

// GetIuranUploads lists all upload batches
func GetIuranUploads(c *fiber.Ctx) error {
	var uploads []models.TIuranUpload
	if err := database.DB.Order("created_at DESC").Find(&uploads).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Gagal mengambil data upload"})
	}
	return c.JSON(uploads)
}

// GetIuranUploadDetails returns rows for a specific upload
func GetIuranUploadDetails(c *fiber.Ctx) error {
	uploadID := c.Params("id")
	var details []models.TIuranUploadDetail
	if err := database.DB.Where("upload_id = ?", uploadID).Find(&details).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Gagal mengambil detail upload"})
	}
	return c.JSON(details)
}

// CompareIuranData compares THT vs Prospens uploads for a given month/year
// and also compares against the existing t_peserta database
func CompareIuranData(c *fiber.Ctx) error {
	bulanStr := c.Params("bulan")
	tahunStr := c.Params("tahun")
	bulan, _ := strconv.Atoi(bulanStr)
	tahun, _ := strconv.Atoi(tahunStr)

	// Find THT and Prospens uploads for this period
	var thtUpload models.TIuranUpload
	var prospensUpload models.TIuranUpload

	thtErr := database.DB.Where("bulan = ? AND tahun = ? AND jenis_iuran = 'THT'", bulan, tahun).
		Order("created_at DESC").First(&thtUpload).Error
	prospensErr := database.DB.Where("bulan = ? AND tahun = ? AND jenis_iuran = 'PROSPENS'", bulan, tahun).
		Order("created_at DESC").First(&prospensUpload).Error

	if thtErr != nil || prospensErr != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Data THT dan Prospens untuk periode ini belum lengkap. Upload keduanya terlebih dahulu.",
		})
	}

	// Load details
	var thtDetails []models.TIuranUploadDetail
	var prospensDetails []models.TIuranUploadDetail
	database.DB.Where("upload_id = ?", thtUpload.ID).Find(&thtDetails)
	database.DB.Where("upload_id = ?", prospensUpload.ID).Find(&prospensDetails)

	// Build maps keyed by NikBri
	thtMap := make(map[string]models.TIuranUploadDetail)
	for _, d := range thtDetails {
		thtMap[d.NikBri] = d
	}
	prospensMap := make(map[string]models.TIuranUploadDetail)
	for _, d := range prospensDetails {
		prospensMap[d.NikBri] = d
	}

	// Clear old discrepancies for this period
	database.DB.Where("bulan = ? AND tahun = ?", bulan, tahun).Delete(&models.TIuranDiscrepancy{})
	database.DB.Where("bulan = ? AND tahun = ?", bulan, tahun).Delete(&models.TIuranPenampungan{})

	var discrepancies []models.TIuranDiscrepancy

	// 1. Compare THT vs Prospens (Key: PN/NikBri)
	allPNs := make(map[string]bool)
	for pn := range thtMap {
		allPNs[pn] = true
	}
	for pn := range prospensMap {
		allPNs[pn] = true
	}

	for pn := range allPNs {
		tht, hasTHT := thtMap[pn]
		pros, hasPros := prospensMap[pn]

		if hasTHT && hasPros && tht.NominalIuran != pros.NominalIuran {
			nama := tht.NamaPeserta
			if nama == "" {
				nama = pros.NamaPeserta
			}
			discrepancies = append(discrepancies, models.TIuranDiscrepancy{
				Bulan:           bulan,
				Tahun:           tahun,
				NikBri:          pn,
				Pernr:           tht.Pernr,
				NamaPeserta:     nama,
				JenisSelisih:    "THT_PROSPENS_DIFF",
				NominalTHT:      tht.NominalIuran,
				NominalProspens: pros.NominalIuran,
			})
		}
	}

	// 2. Compare against existing database (t_peserta)
	var existingPeserta []models.TPeserta
	database.DB.Find(&existingPeserta)
	existingMap := make(map[string]models.TPeserta)
	for _, p := range existingPeserta {
		existingMap[p.NikBri] = p
	}

	// 2a. New members (in upload but not in DB)
	for pn := range allPNs {
		if _, exists := existingMap[pn]; !exists {
			nama := ""
			pernr := ""
			if t, ok := thtMap[pn]; ok {
				nama = t.NamaPeserta
				pernr = t.Pernr
			} else if p, ok := prospensMap[pn]; ok {
				nama = p.NamaPeserta
				pernr = p.Pernr
			}
			discrepancies = append(discrepancies, models.TIuranDiscrepancy{
				Bulan:        bulan,
				Tahun:        tahun,
				NikBri:       pn,
				Pernr:        pernr,
				NamaPeserta:  nama,
				JenisSelisih: "NEW_MEMBER",
			})
		}
	}

	// 2b. Removed members (in DB but not in upload)
	for pn, peserta := range existingMap {
		if _, inUpload := allPNs[pn]; !inUpload {
			// Goes to penampungan
			database.DB.Create(&models.TIuranPenampungan{
				NikBri:      pn,
				NamaPeserta: peserta.NamaPeserta,
				Bulan:       bulan,
				Tahun:       tahun,
				Keterangan:  "Peserta ada di database tapi tidak ada di data iuran upload",
			})
			discrepancies = append(discrepancies, models.TIuranDiscrepancy{
				Bulan:        bulan,
				Tahun:        tahun,
				NikBri:       pn,
				NamaPeserta:  peserta.NamaPeserta,
				JenisSelisih: "REMOVED_MEMBER",
			})
		}
	}

	// Save discrepancies
	if len(discrepancies) > 0 {
		database.DB.CreateInBatches(&discrepancies, 100)
	}

	// Update both uploads to COMPARED status
	database.DB.Model(&thtUpload).Update("status_approval", "COMPARED")
	database.DB.Model(&prospensUpload).Update("status_approval", "COMPARED")

	return c.JSON(fiber.Map{
		"message":            fmt.Sprintf("Perbandingan selesai untuk %d/%d", bulan, tahun),
		"total_discrepancies": len(discrepancies),
		"discrepancies":       discrepancies,
	})
}

// GetIuranDiscrepancies returns discrepancies for a given period
func GetIuranDiscrepancies(c *fiber.Ctx) error {
	bulanStr := c.Params("bulan")
	tahunStr := c.Params("tahun")
	bulan, _ := strconv.Atoi(bulanStr)
	tahun, _ := strconv.Atoi(tahunStr)

	var discrepancies []models.TIuranDiscrepancy
	database.DB.Where("bulan = ? AND tahun = ?", bulan, tahun).Find(&discrepancies)
	return c.JSON(fiber.Map{
		"discrepancies": discrepancies,
	})
}

// GetIuranPenampungan returns penampungan data for a given period
func GetIuranPenampungan(c *fiber.Ctx) error {
	bulanStr := c.Params("bulan")
	tahunStr := c.Params("tahun")
	bulan, _ := strconv.Atoi(bulanStr)
	tahun, _ := strconv.Atoi(tahunStr)

	var penampungan []models.TIuranPenampungan
	database.DB.Where("bulan = ? AND tahun = ?", bulan, tahun).Find(&penampungan)
	return c.JSON(penampungan)
}

// SubmitIuranForApproval moves upload to PENDING_CHECKER
func SubmitIuranForApproval(c *fiber.Ctx) error {
	id := c.Params("id")
	var upload models.TIuranUpload
	if err := database.DB.First(&upload, id).Error; err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "Upload tidak ditemukan"})
	}

	if upload.StatusApproval != "COMPARED" && upload.StatusApproval != "UPLOADED" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Status upload tidak valid untuk submit"})
	}

	upload.StatusApproval = "PENDING_CHECKER"
	database.DB.Save(&upload)
	return c.JSON(fiber.Map{"message": "Upload disubmit ke Checker", "upload": upload})
}

// ProcessIuranApproval handles Checker/Signer approval
func ProcessIuranApproval(c *fiber.Ctx) error {
	id := c.Params("id")
	req := new(ApprovalRequest) // reuse the struct from peserta_controller

	if err := c.BodyParser(req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Cannot parse JSON"})
	}

	var upload models.TIuranUpload
	if err := database.DB.First(&upload, id).Error; err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "Upload tidak ditemukan"})
	}

	role := c.Locals("role")
	roleStr, ok := role.(string)
	if !ok {
		roleStr = ""
	}
	username := c.Locals("username").(string)

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
		database.DB.Save(&upload)
		return c.JSON(fiber.Map{"message": "Upload ditolak", "upload": upload})
	}

	if req.Action == "APPROVE" {
		if upload.StatusApproval == "PENDING_CHECKER" {
			if !strings.EqualFold(roleStr, "admin") && !strings.EqualFold(roleStr, "super admin") {
				return c.Status(fiber.StatusForbidden).JSON(fiber.Map{"error": "Unauthorized as Checker"})
			}
			upload.StatusApproval = "PENDING_SIGNER"
			upload.CatatanChecker = &req.Catatan
			upload.CheckerID = &username
			database.DB.Save(&upload)
			return c.JSON(fiber.Map{"message": "Upload diteruskan ke Signer", "upload": upload})
		} else if upload.StatusApproval == "PENDING_SIGNER" {
			if !strings.EqualFold(roleStr, "super admin") {
				return c.Status(fiber.StatusForbidden).JSON(fiber.Map{"error": "Unauthorized as Signer"})
			}
			upload.StatusApproval = "APPROVED"
			upload.CatatanSigner = &req.Catatan
			upload.SignerID = &username
			database.DB.Save(&upload)
			
			// ─── OTOMATISASI PENGECEKAN NEW_MEMBER & MISSING ───
			var details []models.TIuranUploadDetail
			database.DB.Where("upload_id = ?", upload.ID).Find(&details)
			
			var existingPeserta []models.TPeserta
			database.DB.Find(&existingPeserta)
			
			existingMap := make(map[string]models.TPeserta)
			for _, p := range existingPeserta {
				existingMap[p.NikBri] = p
			}
			
			detailsMap := make(map[string]models.TIuranUploadDetail)
			
			for _, d := range details {
				detailsMap[d.NikBri] = d
				if _, exists := existingMap[d.NikBri]; !exists {
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
			
			for _, p := range existingPeserta {
				if _, exists := detailsMap[p.NikBri]; !exists {
					var count int64
					database.DB.Model(&models.TIuranDiscrepancy{}).
						Where("bulan = ? AND tahun = ? AND nik_bri = ? AND jenis_selisih = 'REMOVED_MEMBER'", upload.Bulan, upload.Tahun, p.NikBri).
						Count(&count)
						
					if count == 0 {
						database.DB.Create(&models.TIuranDiscrepancy{
							Bulan:       upload.Bulan,
							Tahun:       upload.Tahun,
							NikBri:      p.NikBri,
							Pernr:       p.Pernr,
							NamaPeserta: p.NamaPeserta,
							JenisSelisih: "REMOVED_MEMBER",
						})
					}
				}
			}

			// Removed direct insert mapping logic since it is done directly in mapping page
			return c.JSON(fiber.Map{"message": "Upload disetujui dan data iuran tersimpan", "upload": upload})
		}
	}

	return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Aksi tidak valid"})
}

// ApproveNewMember receives an array of TIuranDiscrepancy IDs to resolve
func ApproveNewMember(c *fiber.Ctx) error {
	var req struct {
		IDs []uint `json:"ids"`
	}

	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid request"})
	}

	for _, id := range req.IDs {
		var diff models.TIuranDiscrepancy
		if err := database.DB.First(&diff, id).Error; err != nil {
			continue
		}

		if diff.JenisSelisih != "NEW_MEMBER" {
			continue
		}

		// Temukan RawData dari Detail Iuran pada Bulan dan Tahun terkait
		var upload models.TIuranUpload
		database.DB.Where("bulan = ? AND tahun = ?", diff.Bulan, diff.Tahun).First(&upload)

		var detail models.TIuranUploadDetail
		database.DB.Where("upload_id = ? AND nik_bri = ?", upload.ID, diff.NikBri).First(&detail)

		// Create struct pesertanya
		newP := models.TPeserta{
			IDPeserta:   diff.NikBri,
			NikBri:      diff.NikBri,
			NamaPeserta: diff.NamaPeserta,
			Pernr:       diff.Pernr,
		}

		if detail.RawData != nil {
			// Extract more info from original Row JSON array if needed!
			// For simplicity:
			var row []string
			if err := json.Unmarshal([]byte(*detail.RawData), &row); err == nil {
				// Fallback loop mapping, e.g KD_POS is somewhere there
			}
		}

		// Insert
		if err := database.DB.Create(&newP).Error; err == nil {
			database.DB.Delete(&diff) // Resolve discrepancy
		}
	}

	return c.JSON(fiber.Map{"message": "Peserta baru berhasil di-approve & ditambahkan ke database master."})
}

// GetIuranSettlement returns summary of approved iuran batches for dashboard/settlement menu
func GetIuranSettlement(c *fiber.Ctx) error {
	var results []struct {
		Bulan          int     `json:"bulan"`
		Tahun          int     `json:"tahun"`
		TotalTht       float64 `json:"total_tht"`
		TotalProspens float64 `json:"total_prospens"`
		CountTht       int     `json:"count_tht"`
		CountProspens int     `json:"count_prospens"`
		Status         string  `json:"status"`
	}

	// Subquery to get approved THT
	thtQuery := database.DB.Table("t_iuran_upload").
		Select("bulan, tahun, SUM(total_nominal) as total_tht, SUM(total_rows) as count_tht").
		Where("jenis_iuran = 'THT' AND status_approval = 'APPROVED'").
		Group("bulan, tahun")

	// Subquery to get approved PROSPENS
	prosQuery := database.DB.Table("t_iuran_upload").
		Select("bulan, tahun, SUM(total_nominal) as total_prospens, SUM(total_rows) as count_prospens").
		Where("jenis_iuran = 'PROSPENS' AND status_approval = 'APPROVED'").
		Group("bulan, tahun")

	// Join them
	err := database.DB.Table("(?) as tht", thtQuery).
		Select("tht.bulan, tht.tahun, tht.total_tht, pros.total_prospens, tht.count_tht, pros.count_prospens, 'APPROVED' as status").
		Joins("JOIN (?) as pros ON tht.bulan = pros.bulan AND tht.tahun = pros.tahun", prosQuery).
		Order("tht.tahun DESC, tht.bulan DESC").
		Scan(&results).Error

	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Gagal mengambil data settlement"})
	}

	return c.JSON(results)
}
