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

// --- PROPOSALS ---

func GetSahamProposals(c *fiber.Ctx) error {
	var proposals []models.TSahamProposal
	database.DB.Order("tgl_proposal desc").Find(&proposals)
	return c.JSON(proposals)
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
	// Group transactions to get current holdings
	type Portfolio struct {
		KodeSaham      string  `json:"kode_saham"`
		NamaEmiten     string  `json:"nama_emiten"`
		TotalLembar    int64   `json:"total_lembar"`
		AvgPrice       float64 `json:"avg_price"`
		LastPrice      float64 `json:"last_price"`
		MarketValue    float64 `json:"market_value"`
		FloatingProfit float64 `json:"floating_profit"`
	}

	var results []Portfolio
	query := `
		SELECT 
			t.kode_saham,
			m.nama_emiten,
			SUM(CASE WHEN t.tipe_transaksi = 'BELI' THEN t.jumlah_lembar ELSE -t.jumlah_lembar END) as total_lembar,
			AVG(t.harga_transaksi) as avg_price,
			m.last_price
		FROM t_saham_transaction t
		JOIN m_saham_master m ON t.kode_saham = m.kode_saham
		GROUP BY t.kode_saham
		HAVING total_lembar > 0
	`
	database.DB.Raw(query).Scan(&results)

	for i := range results {
		results[i].MarketValue = float64(results[i].TotalLembar) * results[i].LastPrice
		results[i].FloatingProfit = results[i].MarketValue - (float64(results[i].TotalLembar) * results[i].AvgPrice)
	}

	return c.JSON(results)
}
