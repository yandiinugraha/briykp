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

// UploadInvestmentProposal handles CSV upload for investment proposals
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

		// Expected CSV: Jenis, Nama Emiten, Nominal, Keterangan
		if len(record) < 3 {
			continue
		}

		nominal, _ := strconv.ParseFloat(record[2], 64)
		keterangan := ""
		if len(record) > 3 {
			keterangan = record[3]
		}

		proposal := models.TInvestmentProposal{
			ProposalNo:     fmt.Sprintf("INV-%d-%s", time.Now().UnixNano(), record[0]),
			JenisInvestasi: record[0],
			NamaEmiten:     record[1],
			NominalUsulan:  nominal,
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

// ApproveInvestmentProposal handles checker/signer approval
func ApproveInvestmentProposal(c *fiber.Ctx) error {
	id := c.Params("id")
	userRole := c.Locals("role").(string)
	userID := c.Locals("user_id").(string)

	var proposal models.TInvestmentProposal
	if err := database.DB.First(&proposal, id).Error; err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "Proposal not found"})
	}

	status := c.FormValue("status") // APPROVED or REJECTED
	catatan := c.FormValue("catatan")

	if userRole == "Admin" { // Checker
		proposal.CheckerID = &userID
		proposal.CatatanChecker = &catatan
		if status == "APPROVED" {
			proposal.StatusApproval = "CHECKED"
		} else {
			proposal.StatusApproval = "REJECTED_CHECKER"
		}
	} else if userRole == "Super Admin" { // Signer
		proposal.SignerID = &userID
		proposal.CatatanSigner = &catatan
		if status == "APPROVED" {
			proposal.StatusApproval = "FINAL_APPROVED"
			// Auto create transaction if final approved
			createTransactionFromProposal(proposal)
		} else {
			proposal.StatusApproval = "REJECTED_SIGNER"
		}
	}

	if err := database.DB.Save(&proposal).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}

	return c.JSON(proposal)
}

func createTransactionFromProposal(p models.TInvestmentProposal) {
	tx := models.TInvestmentTransaction{
		ProposalID:     p.ID,
		TransactionNo:  fmt.Sprintf("TX-%s", p.ProposalNo),
		JenisTransaksi: "BUY",
		NamaEmiten:     p.NamaEmiten,
		Nominal:        p.NominalUsulan,
		Harga:          100.0, // Default for demo
		TglTransaksi:   time.Now(),
		Status:         "SETTLED",
	}
	database.DB.Create(&tx)
}

// GetInvestmentTransactions fetches all settled transactions
func GetInvestmentTransactions(c *fiber.Ctx) error {
	var txs []models.TInvestmentTransaction
	if err := database.DB.Find(&txs).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}
	return c.JSON(txs)
}
