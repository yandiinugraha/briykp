package controllers

import (
	"encoding/json"
	"log"
	"strings"
	"time"

	"briyjkp/database"
	"briyjkp/middlewares"
	"briyjkp/models"

	"github.com/gofiber/fiber/v2"
)

// GetMyPesertaProfile fetches the logged-in participant's own data from t_peserta
// Uses the JWT user_id claim which stores id_peserta for native Peserta logins
func GetMyPesertaProfile(c *fiber.Ctx) error {
	userID := c.Locals("user_id").(string)
	
	var peserta models.TPeserta
	// Try finding by id_peserta first (native peserta login stores id_peserta in user_id)
	if err := database.DB.Preload("Kelompok").Preload("Kelas").Preload("StatusBpjs").Preload("StatusBrilife").Where("id_peserta = ?", userID).First(&peserta).Error; err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "Peserta profile not found"})
	}

	return c.JSON(peserta)
}

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

	peserta.IDPeserta = "P-" + time.Now().Format("20060102150405")

	// Convert to JSON for staging
	jsonData, err := json.Marshal(peserta)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to serialize data"})
	}
	
	username := c.Locals("username").(string)

	staging := models.TPesertaStaging{
		IDPeserta:      &peserta.IDPeserta,
		JenisPengajuan: "BARU",
		DataJson:       string(jsonData),
		StatusApproval: "PENDING_CHECKER",
		MakerID:        &username,
	}

	if err := database.DB.Create(&staging).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to create staging record"})
	}

	// Trigger Audit Log
	userIP := c.IP()
	newValStr := "New Participant Created in Staging"
	middlewares.AuditChannel <- middlewares.AuditLogData{
		UserID:    username,
		Modul:     "Peserta Staging",
		Action:    "INSERT",
		OldValue:  nil,
		NewValue:  &newValStr,
		IpAddress: &userIP,
	}

	return c.Status(fiber.StatusCreated).JSON(fiber.Map{
		"message": "Data saved to staging pending checker approval",
		"staging": staging,
	})
}

// UpdatePeserta updates existing participant details
// @Summary Update peserta
// @Description Update participant details by ID via Staging
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
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "Participant not found in database"})
	}

	if err := c.BodyParser(&peserta); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Cannot parse JSON"})
	}

	jsonData, err := json.Marshal(peserta)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to serialize data"})
	}

	username := c.Locals("username").(string)

	staging := models.TPesertaStaging{
		IDPeserta:      &id,
		JenisPengajuan: "UBAH",
		DataJson:       string(jsonData),
		StatusApproval: "PENDING_CHECKER",
		MakerID:        &username,
	}

	if err := database.DB.Create(&staging).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to create staging record"})
	}

	// Trigger Audit Log
	userIP := c.IP()
	newValStr := "Participant Edit requested in Staging"
	middlewares.AuditChannel <- middlewares.AuditLogData{
		UserID:    username,
		Modul:     "Peserta Staging",
		Action:    "INSERT",
		OldValue:  nil,
		NewValue:  &newValStr,
		IpAddress: &userIP,
	}

	return c.JSON(fiber.Map{
		"message": "Edit request saved to staging pending checker approval",
		"staging": staging,
	})
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

// --- MAKER-CHECKER STAGING APIS ---

// GetPendingPesertaRequests fetches all pending approvals
func GetPendingPesertaRequests(c *fiber.Ctx) error {
	var staging []models.TPesertaStaging

	if err := database.DB.Where("status_approval IN (?, ?)", "PENDING_CHECKER", "PENDING_SIGNER").Find(&staging).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to fetch staging requests"})
	}

	return c.JSON(staging)
}

type ApprovalRequest struct {
	Action  string `json:"action"` // APPROVE, REJECT
	Catatan string `json:"catatan"`
}

// ProcessPesertaRequest handles Checker/Signer approval logic
func ProcessPesertaRequest(c *fiber.Ctx) error {
	id := c.Params("id")
	req := new(ApprovalRequest)

	if err := c.BodyParser(req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Cannot parse JSON"})
	}

	var staging models.TPesertaStaging
	if err := database.DB.First(&staging, id).Error; err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "Staging record not found"})
	}

	role := c.Locals("role")
	roleStr, ok := role.(string)
	if !ok {
		roleStr = ""
	}
	
	username := c.Locals("username").(string)

	if req.Action == "REJECT" {
		if staging.StatusApproval == "PENDING_CHECKER" {
			if !strings.EqualFold(roleStr, "admin") && !strings.EqualFold(roleStr, "super admin") {
				return c.Status(fiber.StatusForbidden).JSON(fiber.Map{"error": "Unauthorized as Checker"})
			}
			staging.StatusApproval = "REJECTED"
			staging.CatatanChecker = &req.Catatan
			staging.CheckerID = &username
		} else if staging.StatusApproval == "PENDING_SIGNER" {
			if !strings.EqualFold(roleStr, "super admin") {
				return c.Status(fiber.StatusForbidden).JSON(fiber.Map{"error": "Unauthorized as Signer"})
			}
			staging.StatusApproval = "REJECTED"
			staging.CatatanSigner = &req.Catatan
			staging.SignerID = &username
		} else {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid staging state"})
		}
		
		database.DB.Save(&staging)
		return c.JSON(fiber.Map{"message": "Request rejected", "staging": staging})
	}

	if req.Action == "APPROVE" {
		if staging.StatusApproval == "PENDING_CHECKER" {
			if !strings.EqualFold(roleStr, "admin") && !strings.EqualFold(roleStr, "super admin") {
				return c.Status(fiber.StatusForbidden).JSON(fiber.Map{"error": "Unauthorized as Checker"})
			}
			staging.StatusApproval = "PENDING_SIGNER"
			staging.CatatanChecker = &req.Catatan
			staging.CheckerID = &username
			database.DB.Save(&staging)
			return c.JSON(fiber.Map{"message": "Request passed to Signer", "staging": staging})
		} else if staging.StatusApproval == "PENDING_SIGNER" {
			if !strings.EqualFold(roleStr, "super admin") {
				return c.Status(fiber.StatusForbidden).JSON(fiber.Map{"error": "Unauthorized as Signer"})
			}
			// SIGNER APPROVAL -> Commit to main table!
			staging.StatusApproval = "APPROVED"
			staging.CatatanSigner = &req.Catatan
			staging.SignerID = &username

			var peserta models.TPeserta
			if err := json.Unmarshal([]byte(staging.DataJson), &peserta); err != nil {
				return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to unmarshal JSON data"})
			}
			
			if staging.JenisPengajuan == "BARU" {
				if err := database.DB.Create(&peserta).Error; err != nil {
					return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to insert approved participant"})
				}
			} else { // UBAH
				if err := database.DB.Save(&peserta).Error; err != nil {
					return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to update approved participant"})
				}
			}
			database.DB.Save(&staging)
			
			// Trigger Audit Log
			userIP := c.IP()
			newValStr := "Participant " + staging.JenisPengajuan + " Approved and Applied"
			middlewares.AuditChannel <- middlewares.AuditLogData{
				UserID:    username,
				Modul:     "Peserta Staging Commit",
				Action:    "UPDATE",
				OldValue:  nil,
				NewValue:  &newValStr,
				IpAddress: &userIP,
			}

			return c.JSON(fiber.Map{"message": "Request APPROVED and applied to database", "staging": staging})
		}
	}
	
	return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid action or flow state"})
}
