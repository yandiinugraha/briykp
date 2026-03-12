package main

import (
	"fmt"
	"gorm.io/driver/mysql"
	"gorm.io/gorm"
	"log"
)

type TIuranDiscrepancy struct {
    ID          uint
    Bulan       int
    Tahun       int
    NikBri      string
    NamaPeserta string
    JenisSelisih string
}

func main() {
	dsn := "root:root@tcp(127.0.0.1:3306)/db_ykpbri?charset=utf8mb4&parseTime=True&loc=Local"
	db, err := gorm.Open(mysql.Open(dsn), &gorm.Config{})
	if err != nil {
		log.Fatal("Failed to connect to database:", err)
	}

    var total int64
    db.Table("t_iuran_discrepancy").Count(&total)
    fmt.Println("Total discrepancies:", total)

    var items []TIuranDiscrepancy
    db.Table("t_iuran_discrepancy").Find(&items)
    for _, item := range items {
        fmt.Printf("- %d/%d: %s (NIK: %s, Selisih: %s)\n", item.Bulan, item.Tahun, item.NamaPeserta, item.NikBri, item.JenisSelisih)
    }
}
