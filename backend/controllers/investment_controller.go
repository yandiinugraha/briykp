package controllers

import (
	"encoding/csv"
	"fmt"
	"io"
	"log"
	"strconv"
	"strings"
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

	// Read a small chunk to detect separator
	peekBuf := make([]byte, 1024)
	n, _ := src.Read(peekBuf)
	src.Seek(0, 0) // Reset to beginning
	
	reader := csv.NewReader(src)
	if n > 0 {
		content := string(peekBuf[:n])
		if !strings.Contains(content, ",") && strings.Contains(content, ";") {
			reader.Comma = ';'
			log.Println("Detected semicolon separator in CSV")
		}
	}

	// Skip header
	if _, err := reader.Read(); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Failed to read CSV header or file is empty"})
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

		log.Printf("Raw CSV Record: %v (len: %d)", record, len(record))

		// If len(record) is 1, it might mean the separator was wrong
		if len(record) == 1 && strings.Contains(record[0], ";") {
			// Fallback: try manual split if semicolon detected
			record = strings.Split(record[0], ";")
		}

		log.Printf("Processing record: %v (len: %d)", record, len(record))

		// Flexible CSV Handling
		var jenis, kode, emiten, tipeTx, rangeHarga, rangeYield, keterangan string
		var nominal float64

		if len(record) >= 8 {
			// Original 8-column format
			jenis = strings.ToUpper(record[0])
			kode = record[1]
			emiten = record[2]
			tipeTx = strings.ToUpper(record[3])
			nominal, _ = strconv.ParseFloat(record[4], 64)
			rangeHarga = record[5]
			rangeYield = record[6]
			keterangan = record[7]
		} else if len(record) >= 4 {
			// Simpler 4-column format (Jenis, Emiten/Kode, Nominal, Keterangan)
			jenis = strings.ToUpper(record[0])
			kode = record[1]   // Use as both Kode and Emiten for simplicity if only one is provided
			emiten = record[1]
			tipeTx = "BELI"    // Default
			valNominal := strings.ReplaceAll(record[2], ",", "")
			nominal, _ = strconv.ParseFloat(valNominal, 64)
			keterangan = record[3]
			log.Printf("Parsed 4-column: jenis=%s, kode=%s, nominal=%f", jenis, kode, nominal)
		} else {
			log.Printf("Skipping invalid record length: %d", len(record))
			continue
		}

		proposal := models.TInvestmentProposal{
			ProposalNo:     fmt.Sprintf("PROP-%s-%d", jenis, time.Now().UnixNano()/1e6),
			JenisInvestasi: jenis,
			KodeEfek:       kode,
			NamaEmiten:     emiten,
			TipeTransaksi:  tipeTx,
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

	if count == 0 {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "No valid proposals found in CSV. Please check formatting.",
		})
	}

	return c.JSON(fiber.Map{
		"message": fmt.Sprintf("Successfully processed %d proposals", count),
	})
}

// ApproveInvestmentProposal handles tiered approval (Checker -> Signer)
func ApproveInvestmentProposal(c *fiber.Ctx) error {
	id := c.Params("id")
	userRole, _ := c.Locals("role").(string)
	userID, _ := c.Locals("user_id").(string)

	var proposal models.TInvestmentProposal
	if err := database.DB.First(&proposal, id).Error; err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "Proposal not found"})
	}

	action := c.Query("action") // APPROVE / REJECT

	if strings.EqualFold(userRole, "Admin") || strings.EqualFold(userRole, "Super Admin") { 
		// Checker logic
		if proposal.StatusApproval == "PENDING" {
			if action == "APPROVE" {
				proposal.StatusApproval = "PENDING_SIGNER"
			} else {
				proposal.StatusApproval = "REJECTED"
			}
			proposal.CheckerID = &userID
			catatan := c.Query("catatan")
			proposal.CatatanChecker = &catatan
		} else if proposal.StatusApproval == "PENDING_SIGNER" && strings.EqualFold(userRole, "Super Admin") {
			// Signer logic
			if action == "APPROVE" {
				proposal.StatusApproval = "APPROVED"
			} else {
				proposal.StatusApproval = "REJECTED"
			}
			proposal.SignerID = &userID
			catatan := c.Query("catatan")
			proposal.CatatanSigner = &catatan
		} else {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid approval state or role"})
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
// GetInvestmentTransactions fetches all investment transactions
func GetInvestmentTransactions(c *fiber.Ctx) error {
	var transactions []models.TInvestmentTransaction
	if err := database.DB.Order("tgl_transaksi desc").Find(&transactions).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}
	return c.JSON(transactions)
}


// SettleInvestmentTransaction updates transaction status to SETTLED (Settlement Module)
func SettleInvestmentTransaction(c *fiber.Ctx) error {
	id := c.Params("id")
	var tx models.TInvestmentTransaction
	if err := database.DB.First(&tx, id).Error; err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "Transaction not found"})
	}

	tx.Status = "SETTLED"
	if err := database.DB.Save(&tx).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}

	return c.JSON(tx)
}

// GetInvestmentIncome fetches all income records (Dividen/Kupon/Bunga)
func GetInvestmentIncome(c *fiber.Ctx) error {
	var results []models.TInvestmentIncome
	if err := database.DB.Order("tanggal_cair desc").Find(&results).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}
	return c.JSON(results)
}

// CreateInvestmentIncome records a new investment income entry (Accounting/Tax)
func CreateInvestmentIncome(c *fiber.Ctx) error {
	var income models.TInvestmentIncome
	if err := c.BodyParser(&income); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid request body"})
	}

	// Calculate net if not provided
	if income.NominalNet == 0 && income.NominalGross > 0 {
		income.NominalNet = income.NominalGross - income.PajakPPh
	}

	if err := database.DB.Create(&income).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}

	return c.JSON(income)
}
// GetAccountingSummary aggregates financial performance metrics
func GetAccountingSummary(c *fiber.Ctx) error {
	var summary struct {
		RealizedPnL   float64 `json:"realized_pnl"`
		UnrealizedPnL float64 `json:"unrealized_pnl"`
		TotalIncome   float64 `json:"total_income"`
		TotalTax      float64 `json:"total_tax"`
		NetIncome     float64 `json:"net_income"`
	}

	// 1. Total Income from Dividends/Interest
	var inc struct {
		Gross float64
		Tax   float64
		Net   float64
	}
	database.DB.Table("t_investment_incomes").Select("SUM(nominal_gross) as gross, SUM(pajak_pph) as tax, SUM(nominal_net) as net").Scan(&inc)
	summary.TotalIncome = inc.Gross
	summary.TotalTax = inc.Tax
	summary.NetIncome = inc.Net

	// 2. Unrealized PnL (Floating Gain/Loss)
	// We use the same logic as SahamPortfolio but aggregate it
	type StockHolding struct {
		TotalLembar float64
		Hpp         float64
		LastPrice   float64
	}
	var holdings []StockHolding
	holdingsQuery := `
		SELECT 
			SUM(CASE WHEN t.jenis_transaksi = 'BUY' THEN t.jumlah_lembar ELSE -t.jumlah_lembar END) as total_lembar,
			SUM(CASE WHEN t.jenis_transaksi = 'BUY' THEN t.jumlah_lembar * t.harga_transaksi ELSE 0 END) / NULLIF(SUM(CASE WHEN t.jenis_transaksi = 'BUY' THEN t.jumlah_lembar ELSE 0 END), 0) as hpp,
			MAX(m.last_price) as last_price
		FROM t_investment_transaction t
		LEFT JOIN m_saham_master m ON t.kode_efek = m.kode_saham
		GROUP BY t.kode_efek
		HAVING total_lembar > 0
	`
	database.DB.Raw(holdingsQuery).Scan(&holdings)
	for _, h := range holdings {
		price := h.LastPrice
		if price == 0 { price = h.Hpp }
		summary.UnrealizedPnL += (price - h.Hpp) * h.TotalLembar
	}

	// 3. Realized PnL (Simplified: Total Sell Value - (Unit Sold * Global HPP))
	// In a real system we'd track lots, but for summary we'll use weighted avg HPP
	var realized struct {
		TotalPnL float64
	}
	// Simplified Realized PnL calculation for Stocks
	realizedQuery := `
		SELECT SUM((t.harga_transaksi - hpp_table.hpp) * t.jumlah_lembar) as total_pnl
		FROM t_investment_transaction t
		JOIN (
			SELECT kode_efek, 
				SUM(CASE WHEN jenis_transaksi = 'BUY' THEN jumlah_lembar * harga_transaksi ELSE 0 END) / NULLIF(SUM(CASE WHEN jenis_transaksi = 'BUY' THEN jumlah_lembar ELSE 0 END), 0) as hpp
			FROM t_investment_transaction
			GROUP BY kode_efek
		) hpp_table ON t.kode_efek = hpp_table.kode_efek
		WHERE t.jenis_transaksi = 'SELL'
	`
	database.DB.Raw(realizedQuery).Scan(&realized)
	summary.RealizedPnL = realized.TotalPnL

	return c.JSON(summary)
}
