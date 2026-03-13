package controllers

import (
	"briyjkp/database"
	"briyjkp/models"
	"time"

	"github.com/gofiber/fiber/v2"
)

// GetLiquidityStatus returns the current liquidity/idle cash status based on real data
func GetLiquidityStatus(c *fiber.Ctx) error {
	var totalTHT float64
	var totalProspen float64
	var totalSahamBeli float64
	var totalSahamJual float64
	var totalIncome float64

	// Use COALESCE to handle empty tables
	database.DB.Table("t_iuran_upload").
		Where("status_approval = 'APPROVED' AND jenis_iuran = 'THT'").
		Select("COALESCE(SUM(total_nominal), 0)").
		Row().Scan(&totalTHT)

	database.DB.Table("t_iuran_upload").
		Where("status_approval = 'APPROVED' AND jenis_iuran = 'PROSPENS'").
		Select("COALESCE(SUM(total_nominal), 0)").
		Row().Scan(&totalProspen)

	// Stock specific (Legacy - if any) + Generic Investasi
	database.DB.Table("t_saham_transaction").
		Where("tipe_transaksi = 'BELI'").
		Select("COALESCE(SUM(total_nominal), 0)").
		Row().Scan(&totalSahamBeli)
	
	database.DB.Table("t_saham_transaction").
		Where("tipe_transaksi = 'JUAL'").
		Select("COALESCE(SUM(total_nominal), 0)").
		Row().Scan(&totalSahamJual)

	// Generic Investment Tables (New) - All types inclusive
	var totalGenericBuy float64
	var totalGenericSell float64
	database.DB.Table("t_investment_transaction").
		Where("jenis_transaksi = 'BUY'").
		Select("COALESCE(SUM(nominal), 0)").
		Row().Scan(&totalGenericBuy)
	
	database.DB.Table("t_investment_transaction").
		Where("jenis_transaksi = 'SELL'").
		Select("COALESCE(SUM(nominal), 0)").
		Row().Scan(&totalGenericSell)

	database.DB.Table("t_investment_income").
		Select("COALESCE(SUM(nominal_net), 0)").
		Row().Scan(&totalIncome)

	totalIuran := totalTHT + totalProspen
	// Final Saldo Kas = Iuran + Jual + Income - Beli
	totalBeli := totalSahamBeli + totalGenericBuy
	totalJual := totalSahamJual + totalGenericSell
	
	saldoKas := totalIuran + totalJual + totalIncome - totalBeli
	danaTerpakai := totalBeli - totalJual
	if danaTerpakai < 0 {
		danaTerpakai = 0
	}

	var totalPeserta int64
	database.DB.Table("t_peserta").Count(&totalPeserta)

	result := fiber.Map{
		"tgl_posisi":     time.Now(),
		"saldo_kas":      saldoKas,
		"dana_terpakai":  danaTerpakai,
		"dana_idle":      saldoKas - danaTerpakai,
		"total_tht":      totalTHT,
		"total_prospen":  totalProspen,
		"total_iuran":    totalIuran,
		"total_peserta":  totalPeserta,
		"keterangan":     "Kalkulasi Real-time",
	}

	return c.JSON([]fiber.Map{result})
}

// UpdateLiquidityPosition adds or updates a liquidity record
func UpdateLiquidityPosition(c *fiber.Ctx) error {
	var req models.TLiquidityPosition
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid input"})
	}

	if req.TglPosisi.IsZero() {
		req.TglPosisi = time.Now()
	}

	req.DanaIdle = req.SaldoKas - req.DanaTerpakai

	if err := database.DB.Save(&req).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}

	return c.JSON(req)
}
