package main

import (
	"fmt"
	"gorm.io/driver/mysql"
	"gorm.io/gorm"
	"log"
)

func main() {
	dsn := "root:root@tcp(127.0.0.1:3306)/db_ykpbri?charset=utf8mb4&parseTime=True&loc=Local"
	db, err := gorm.Open(mysql.Open(dsn), &gorm.Config{})
	if err != nil {
		log.Fatal("Failed to connect to database:", err)
	}

	tables := []string{
		"t_peserta",
		"t_iuran_upload",
		"t_iuran_upload_detail",
		"t_iuran_discrepancy",
		"t_phk_upload",
		"t_phk_upload_detail",
        "t_iuran_penampungan",
        "t_peserta_staging",
        "t_iuran_detail",
        "t_iuran_input",
		"t_pendaftaran_manfaat",
		"t_approval_log",
		"t_pembayaran_premi",
		"t_refund_premi",
		"t_notification",
		"t_investment_proposal",
		"t_investment_transaction",
		"t_audit_trail",
	}

	db.Exec("SET FOREIGN_KEY_CHECKS = 0;")
	for _, table := range tables {
		err := db.Exec(fmt.Sprintf("TRUNCATE TABLE %s", table)).Error
		if err != nil {
			fmt.Println("Error truncating", table, ":", err)
		} else {
			fmt.Println("Truncated", table)
		}
	}
	db.Exec("SET FOREIGN_KEY_CHECKS = 1;")
	fmt.Println("Cleanup done!")
}
