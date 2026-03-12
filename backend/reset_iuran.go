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

	fmt.Println("Clearing Iuran transaction data...")

	// Truncate tables to ensure a clean state
	tables := []string{
		"t_iuran_upload_detail",
		"t_iuran_upload",
		"t_iuran_discrepancy",
		"t_iuran_penampungan",
	}

	// Disable foreign key checks for truncation
	db.Exec("SET FOREIGN_KEY_CHECKS = 0")
	for _, table := range tables {
		if err := db.Exec(fmt.Sprintf("TRUNCATE TABLE %s", table)).Error; err != nil {
			fmt.Printf("Error clearing %s: %v\n", table, err)
		} else {
			fmt.Printf("✓ Table %s cleared\n", table)
		}
	}
	db.Exec("SET FOREIGN_KEY_CHECKS = 1")

	fmt.Println("Done. You can now re-upload THT and Prospens files.")
}
