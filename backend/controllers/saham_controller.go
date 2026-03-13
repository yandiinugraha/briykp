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

// --- MASTER DATA ---

func GetStocks(c *fiber.Ctx) error {
	var stocks []models.MSahamMaster
	database.DB.Find(&stocks)
	return c.JSON(stocks)
}

func CreateStock(c *fiber.Ctx) error {
	var stock models.MSahamMaster
	if err := c.BodyParser(&stock); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": err.Error()})
	}
	database.DB.Create(&stock)
	return c.JSON(stock)
}

func UpdateStock(c *fiber.Ctx) error {
	id := c.Params("id")
	var stock models.MSahamMaster
	if err := database.DB.First(&stock, id).Error; err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "Stock not found"})
	}
	if err := c.BodyParser(&stock); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": err.Error()})
	}
	database.DB.Save(&stock)
	return c.JSON(stock)
}

func DeleteStock(c *fiber.Ctx) error {
	id := c.Params("id")
	if err := database.DB.Delete(&models.MSahamMaster{}, id).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}
	return c.JSON(fiber.Map{"message": "Stock deleted"})
}

// --- PROPOSALS ---

func GetSahamProposals(c *fiber.Ctx) error {
	var proposals []models.TSahamProposal
	database.DB.Order("tgl_proposal desc").Find(&proposals)
	return c.JSON(proposals)
}

func CreateSahamProposal(c *fiber.Ctx) error {
	var proposal models.TSahamProposal
	if err := c.BodyParser(&proposal); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": err.Error()})
	}

	makerID, _ := c.Locals("user_id").(string)
	proposal.MakerID = makerID
	proposal.StatusApproval = "PENDING"
	if proposal.ProposalNo == "" {
		proposal.ProposalNo = fmt.Sprintf("PROP-SHM-%d", time.Now().UnixNano()/1e6)
	}

	if err := database.DB.Create(&proposal).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}
	return c.JSON(proposal)
}

func ApproveSahamProposal(c *fiber.Ctx) error {
	id := c.Params("id")
	action := c.Query("action") // APPROVE, REJECT, VERIFY
	var proposal models.TSahamProposal
	if err := database.DB.First(&proposal, id).Error; err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "Proposal not found"})
	}

	userRole, _ := c.Locals("user_role").(string)
	userID, _ := c.Locals("user_id").(string)

	switch action {
	case "APPROVE":
		if userRole != "Checker" && userRole != "Super Admin" {
			return c.Status(403).JSON(fiber.Map{"error": "Need Checker role"})
		}
		proposal.StatusApproval = "PENDING_SIGNER"
		proposal.CheckerID = &userID
	case "VERIFY":
		if userRole != "Signer" && userRole != "Super Admin" {
			return c.Status(403).JSON(fiber.Map{"error": "Need Signer role"})
		}
		proposal.StatusApproval = "APPROVED"
		proposal.SignerID = &userID
	case "REJECT":
		proposal.StatusApproval = "REJECTED"
	}

	database.DB.Save(&proposal)
	return c.JSON(proposal)
}

func UploadSahamProposal(c *fiber.Ctx) error {
	file, err := c.FormFile("file")
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "File is required"})
	}

	src, err := file.Open()
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}
	defer src.Close()

	reader := csv.NewReader(src)
	// Expect header: Tgl, KodeSaham, Tipe(BELI/JUAL), DKP, Book, Harga, Lembar
	if _, err := reader.Read(); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Failed to read header"})
	}

	makerID := c.Locals("user_id").(string)
	var count int

	for {
		record, err := reader.Read()
		if err == io.EOF {
			break
		}
		if err != nil {
			continue
		}

		tgl, _ := time.Parse("2006-01-02", record[0])
		harga, _ := strconv.ParseFloat(record[5], 64)
		lembar, _ := strconv.ParseInt(record[6], 10, 64)

		// Validate Universe
		var master models.MSahamMaster
		if err := database.DB.Where("kode_saham = ? AND is_universe = ?", record[1], true).First(&master).Error; err != nil {
			log.Printf("Stock %s is not in Universe or not found\n", record[1])
			continue
		}

		proposal := models.TSahamProposal{
			ProposalNo:     fmt.Sprintf("PROP-SHM-%d", time.Now().UnixNano()/1e6),
			TglProposal:    tgl,
			KodeSaham:      record[1],
			TipeTransaksi:  record[2],
			JenisDKP:       record[3],
			JenisBook:      record[4],
			JumlahLembar:   lembar,
			StatusApproval: "PENDING",
			MakerID:        makerID,
		}

		if record[2] == "BELI" {
			proposal.RangeHargaBeli = harga
		} else {
			proposal.RangeHargaJual = harga
		}

		database.DB.Create(&proposal)
		count++
	}

	return c.JSON(fiber.Map{"message": fmt.Sprintf("Processed %d proposals", count)})
}

// --- TRANSACTIONS ---

func GetSahamTransactions(c *fiber.Ctx) error {
	var txs []models.TSahamTransaction
	database.DB.Order("tgl_transaksi desc").Find(&txs)
	return c.JSON(txs)
}

func CreateSahamTransaction(c *fiber.Ctx) error {
	log.Printf("CreateSahamTransaction payload: %s", string(c.Body()))
	var tx models.TInvestmentTransaction
	if err := c.BodyParser(&tx); err != nil {
		log.Printf("BodyParser error: %v", err)
		return c.Status(400).JSON(fiber.Map{"error": "Invalid data format: " + err.Error()})
	}

	log.Printf("Parsed Transaction: %+v", tx)

	if tx.TransactionNo == "" {
		tx.TransactionNo = fmt.Sprintf("TX-GEN-%d", time.Now().UnixNano()/1e6)
	}

	// Calculate total nominal if only Qty and Price are provided
	if tx.Nominal == 0 && tx.JumlahLembar > 0 && tx.HargaTransaksi > 0 {
		tx.Nominal = tx.JumlahLembar * tx.HargaTransaksi
	}

	if err := database.DB.Create(&tx).Error; err != nil {
		log.Printf("DB Create error: %v", err)
		return c.Status(500).JSON(fiber.Map{"error": "Database error: " + err.Error()})
	}
	
	// If it has a proposal ID, update proposal status
	if tx.ProposalID != 0 {
		database.DB.Model(&models.TInvestmentProposal{}).Where("id = ?", tx.ProposalID).Updates(map[string]interface{}{
			"status_approval": "EXECUTED",
		})
	}

	return c.JSON(tx)
}

func UploadSahamTransaction(c *fiber.Ctx) error {
	file, err := c.FormFile("file")
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "File is required"})
	}

	src, err := file.Open()
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}
	defer src.Close()

	reader := csv.NewReader(src)
	// Header: ProposalNo, Tgl, KodeSaham, Tipe, Lembar, Harga, Fee, Sekuritas, DKP, Book
	if _, err := reader.Read(); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Failed to read header"})
	}

	for {
		record, err := reader.Read()
		if err == io.EOF {
			break
		}
		if err != nil {
			continue
		}

		tgl, _ := time.Parse("2006-01-02", record[1])
		lembar, _ := strconv.ParseInt(record[4], 10, 64)
		harga, _ := strconv.ParseFloat(record[5], 64)
		fee, _ := strconv.ParseFloat(record[6], 64)

		var proposal models.TSahamProposal
		database.DB.Where("proposal_no = ?", record[0]).First(&proposal)

		totalNominal := (float64(lembar) * harga) + fee
		if record[3] == "JUAL" {
			totalNominal = (float64(lembar) * harga) - fee
		}

		// Calculate HPP (Dummy Logic: simple avg cost would need previous state)
		// For now we just record it. Full calculation would involve gathering all previous 'BELI'
		hpp := harga // Placeholder

		tx := models.TSahamTransaction{
			TransactionNo:  fmt.Sprintf("TX-SHM-%d", time.Now().UnixNano()/1e6),
			ProposalID:     &proposal.ID,
			TglTransaksi:   tgl,
			KodeSaham:      record[2],
			TipeTransaksi:  record[3],
			JumlahLembar:   lembar,
			HargaTransaksi: harga,
			FeeBroker:      fee,
			TotalNominal:   totalNominal,
			Hpp:            hpp,
			Sekuritas:      record[7],
			JenisDKP:       record[8],
			JenisBook:      record[9],
		}

		database.DB.Create(&tx)
	}

	return c.JSON(fiber.Map{"message": "Transactions uploaded successfully"})
}

// --- CORPORATE ACTION ---

func CreateCorporateAction(c *fiber.Ctx) error {
	var action models.TSahamCorporateAction
	if err := c.BodyParser(&action); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": err.Error()})
	}
	database.DB.Create(&action)
	return c.JSON(action)
}

// --- DASHBOARD & REPORTS ---

func GetSahamPortfolio(c *fiber.Ctx) error {
	type Portfolio struct {
		KodeEfek       string  `json:"kode_saham"` // Keep alias for frontend compatibility
		NamaEmiten     string  `json:"nama_emiten"`
		TotalLembar    float64 `json:"total_lembar"`
		Hpp            float64 `json:"hpp"`         // Average Cost per unit
		LastPrice      float64 `json:"last_price"`  // Current Market Price
		MarketValue    float64 `json:"market_value"` // MTM Value
		FloatingProfit float64 `json:"floating_profit"`
		ROI            float64 `json:"roi"`
	}

	var results []Portfolio
	// Querying from generic t_investment_transaction
	query := `
		SELECT 
			t.kode_efek as kode_efek,
			MAX(t.nama_emiten) as nama_emiten,
			SUM(CASE WHEN t.jenis_transaksi = 'BUY' THEN t.jumlah_lembar ELSE -t.jumlah_lembar END) as total_lembar,
			SUM(CASE WHEN t.jenis_transaksi = 'BUY' THEN t.jumlah_lembar * t.harga_transaksi ELSE 0 END) / NULLIF(SUM(CASE WHEN t.jenis_transaksi = 'BUY' THEN t.jumlah_lembar ELSE 0 END), 0) as hpp,
			MAX(m.last_price) as last_price
		FROM t_investment_transaction t
		LEFT JOIN m_saham_master m ON t.kode_efek = m.kode_saham
		GROUP BY t.kode_efek
		HAVING total_lembar > 0
	`
	database.DB.Raw(query).Scan(&results)

	for i := range results {
		// If last_price is 0 (e.g. for non-stock or not updated), fallback to HPP
		if results[i].LastPrice == 0 {
			results[i].LastPrice = results[i].Hpp
		}
		
		// 1. Mark-to-Market Calculation: Market Value = Price * Qty
		results[i].MarketValue = results[i].TotalLembar * results[i].LastPrice
		
		// 3. Realized/Floating Gain: MarketValue - (HPP * Qty)
		results[i].FloatingProfit = results[i].MarketValue - (results[i].TotalLembar * results[i].Hpp)
		
		// 4. ROI Calculation (Simple version: Floating Profit / Total Cost)
		totalCost := results[i].TotalLembar * results[i].Hpp
		if totalCost > 0 {
			results[i].ROI = (results[i].FloatingProfit / totalCost) * 100
		}
	}

	return c.JSON(results)
}

func GetSahamReports(c *fiber.Ctx) error {
	period := c.Query("period", "daily") // daily, monthly, yearly
	
	type ReportResult struct {
		Label        string  `json:"label"`
		TotalBeli    float64 `json:"total_beli"`
		TotalJual    float64 `json:"total_jual"`
		CountBeli    int64   `json:"count_beli"`
		CountJual    int64   `json:"count_jual"`
	}

	var results []ReportResult
	var query string

	switch period {
	case "monthly":
		query = `SELECT DATE_FORMAT(tgl_transaksi, '%Y-%m') as label, 
				 SUM(CASE WHEN jenis_transaksi = 'BUY' THEN (CASE WHEN harga_percent > 0 THEN nominal * harga_percent / 100 ELSE nominal END) ELSE 0 END) as total_beli,
				 SUM(CASE WHEN jenis_transaksi = 'SELL' THEN (CASE WHEN harga_percent > 0 THEN nominal * harga_percent / 100 ELSE nominal END) ELSE 0 END) as total_jual,
				 COUNT(CASE WHEN jenis_transaksi = 'BUY' THEN 1 END) as count_beli,
				 COUNT(CASE WHEN jenis_transaksi = 'SELL' THEN 1 END) as count_jual
				 FROM t_investment_transaction GROUP BY label ORDER BY label DESC`
	case "yearly":
		query = `SELECT DATE_FORMAT(tgl_transaksi, '%Y') as label, 
				 SUM(CASE WHEN jenis_transaksi = 'BUY' THEN (CASE WHEN harga_percent > 0 THEN nominal * harga_percent / 100 ELSE nominal END) ELSE 0 END) as total_beli,
				 SUM(CASE WHEN jenis_transaksi = 'SELL' THEN (CASE WHEN harga_percent > 0 THEN nominal * harga_percent / 100 ELSE nominal END) ELSE 0 END) as total_jual,
				 COUNT(CASE WHEN jenis_transaksi = 'BUY' THEN 1 END) as count_beli,
				 COUNT(CASE WHEN jenis_transaksi = 'SELL' THEN 1 END) as count_jual
				 FROM t_investment_transaction GROUP BY label ORDER BY label DESC`
	default: // daily
		query = `SELECT DATE_FORMAT(tgl_transaksi, '%Y-%m-%d') as label, 
				 SUM(CASE WHEN jenis_transaksi = 'BUY' THEN (CASE WHEN harga_percent > 0 THEN nominal * harga_percent / 100 ELSE nominal END) ELSE 0 END) as total_beli,
				 SUM(CASE WHEN jenis_transaksi = 'SELL' THEN (CASE WHEN harga_percent > 0 THEN nominal * harga_percent / 100 ELSE nominal END) ELSE 0 END) as total_jual,
				 COUNT(CASE WHEN jenis_transaksi = 'BUY' THEN 1 END) as count_beli,
				 COUNT(CASE WHEN jenis_transaksi = 'SELL' THEN 1 END) as count_jual
				 FROM t_investment_transaction GROUP BY label ORDER BY label DESC LIMIT 30`
	}

	database.DB.Raw(query).Scan(&results)
	return c.JSON(results)
}
