package controllers

import (
	"encoding/csv"
	"fmt"
	"io"
	"log"
	"strconv"
	"time"

	"briyjkp/database"
	"briyjkp/models"

	"github.com/gofiber/fiber/v2"
)

// GetInvestmentProposals fetches all investment proposals
func GetInvestmentProposals(c *fiber.Ctx) error {
	var proposals []models.TInvestmentProposal
	if err := database.DB.Order("created_at desc").Find(&proposals).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}
	return c.JSON(proposals)
}

// UploadInvestmentProposal handles CSV upload for investment proposals (Maker/Dealer)
func UploadInvestmentProposal(c *fiber.Ctx) error {
	file, err := c.FormFile("file")
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "File is required"})
	}

	src, err := file.Open()
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}
	defer src.Close()

	reader := csv.NewReader(src)
	// Skip header
	if _, err := reader.Read(); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Failed to read CSV header"})
	}

	makerID := c.Locals("user_id").(string)
	var count int

	for {
		record, err := reader.Read()
		if err == io.EOF {
			break
		}
		if err != nil {
			log.Println("Error reading CSV record:", err)
			continue
		}

		// Expected CSV: Jenis, KodeEfek, NamaEmiten, TipeTransaksi, Nominal, RangeHarga, RangeYield, Keterangan
		if len(record) < 5 {
			continue
		}

		nominal, _ := strconv.ParseFloat(record[4], 64)
		rangeHarga := ""
		if len(record) > 5 {
			rangeHarga = record[5]
		}
		rangeYield := ""
		if len(record) > 6 {
			rangeYield = record[6]
		}
		keterangan := ""
		if len(record) > 7 {
			keterangan = record[7]
		}

		proposal := models.TInvestmentProposal{
			ProposalNo:     fmt.Sprintf("PROP-%d-%s", time.Now().UnixNano()/1e6, record[1]),
			JenisInvestasi: record[0],
			KodeEfek:       record[1],
			NamaEmiten:     record[2],
			TipeTransaksi:  record[3],
			NominalUsulan:  nominal,
			RangeHarga:     rangeHarga,
			RangeYield:     rangeYield,
			Keterangan:     keterangan,
			StatusApproval: "PENDING",
			MakerID:        makerID,
		}

		if err := database.DB.Create(&proposal).Error; err != nil {
			log.Println("Error creating proposal:", err)
			continue
		}
		count++
	}

	return c.JSON(fiber.Map{
		"message": fmt.Sprintf("Successfully processed %d proposals", count),
	})
}

// ApproveInvestmentProposal handles tiered approval (Checker -> Signer)
func ApproveInvestmentProposal(c *fiber.Ctx) error {
	id := c.Params("id")
	userRole := c.Locals("role").(string)
	userID := c.Locals("user_id").(string)

	var proposal models.TInvestmentProposal
	if err := database.DB.First(&proposal, id).Error; err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "Proposal not found"})
	}

	var req struct {
		Status  string `json:"status"` // APPROVED / REJECTED
		Catatan string `json:"catatan"`
	}
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid request body"})
	}

	if userRole == "Admin" { // Div Head / Checker
		proposal.CheckerID = &userID
		proposal.CatatanChecker = &req.Catatan
		if req.Status == "APPROVED" {
			proposal.StatusApproval = "CHECKED"
		} else {
			proposal.StatusApproval = "REJECTED"
		}
	} else if userRole == "Super Admin" { // Pengurus / Signer
		proposal.SignerID = &userID
		proposal.CatatanSigner = &req.Catatan
		if req.Status == "APPROVED" {
			proposal.StatusApproval = "FINAL_APPROVED"
		} else {
			proposal.StatusApproval = "REJECTED"
		}
	} else {
		return c.Status(fiber.StatusForbidden).JSON(fiber.Map{"error": "Unauthorized role for approval"})
	}

	if err := database.DB.Save(&proposal).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}

	return c.JSON(proposal)
}

// UploadInvestmentTransaction handles CSV upload for real transactions based on approved proposals
func UploadInvestmentTransaction(c *fiber.Ctx) error {
	file, err := c.FormFile("file")
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "File is required"})
	}

	src, err := file.Open()
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}
	defer src.Close()

	reader := csv.NewReader(src)
	if _, err := reader.Read(); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Failed to read CSV header"})
	}

	var count int
	for {
		record, err := reader.Read()
		if err == io.EOF {
			break
		}
		if err != nil {
			continue
		}

		// Expected: KodeProposal, KodeEfek, NamaEmiten, TipeTransaksi, Nominal, HargaPercent, Yield, Sekuritas, TglTransaksi
		if len(record) < 7 {
			continue
		}

		var proposal models.TInvestmentProposal
		if err := database.DB.Where("proposal_no = ?", record[0]).First(&proposal).Error; err != nil {
			log.Printf("Proposal %s not found for transaction\n", record[0])
			continue
		}

		if proposal.StatusApproval != "FINAL_APPROVED" {
			log.Printf("Proposal %s is not fully approved yet\n", record[0])
			continue
		}

		nominal, _ := strconv.ParseFloat(record[4], 64)
		harga, _ := strconv.ParseFloat(record[5], 64)
		yield, _ := strconv.ParseFloat(record[6], 64)
		sekuritas := ""
		if len(record) > 7 {
			sekuritas = record[7]
		}
		tglStr := time.Now().Format("2006-01-02")
		if len(record) > 8 {
			tglStr = record[8]
		}
		tgl, _ := time.Parse("2006-01-02", tglStr)

		tx := models.TInvestmentTransaction{
			ProposalID:     proposal.ID,
			TransactionNo:  fmt.Sprintf("TRANS-%d-%s", time.Now().UnixNano()/1e6, record[1]),
			JenisTransaksi: record[3],
			KodeEfek:       record[1],
			NamaEmiten:     record[2],
			Nominal:        nominal,
			HargaPercent:   harga,
			Yield:          yield,
			Sekuritas:      sekuritas,
			TglTransaksi:   tgl,
			Status:         "SETTLED",
		}

		if err := database.DB.Create(&tx).Error; err != nil {
			log.Println("Error creating transaction:", err)
			continue
		}
		count++
	}

	return c.JSON(fiber.Map{
		"message": fmt.Sprintf("Successfully processed %d transactions", count),
	})
}

// GetInvestmentTransactions fetches all settled transactions
func GetInvestmentTransactions(c *fiber.Ctx) error {
	var txs []models.TInvestmentTransaction
	if err := database.DB.Order("tgl_transaksi desc").Find(&txs).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}
	return c.JSON(txs)
}
