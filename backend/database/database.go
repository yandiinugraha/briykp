package database

import (
	"fmt"
	"log"
	"os"
	"time"

	"briyjkp/models"

	"golang.org/x/crypto/bcrypt"
	"gorm.io/driver/mysql"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

var DB *gorm.DB

func ConnectDB() {
	// Database connection string formatted for MySQL
	dsn := fmt.Sprintf("%s:%s@tcp(%s:%s)/%s?charset=utf8mb4&parseTime=True&loc=Local",
		os.Getenv("DB_USER"),
		os.Getenv("DB_PASSWORD"),
		os.Getenv("DB_HOST"),
		os.Getenv("DB_PORT"),
		os.Getenv("DB_NAME"),
	)

	var err error
	DB, err = gorm.Open(mysql.Open(dsn), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Info),
	})

	if err != nil {
		log.Fatal("Failed to connect to database: \n", err)
	}

	log.Println("Database connection successfully opened")

	// Run AutoMigration for all tables
	DB.AutoMigrate(
		&models.MRole{},
		&models.MPermission{},
		&models.MRolePermission{},
		&models.MUser{},
		&models.MKelompokProspens{},
		&models.MKelasProspens{},
		&models.MStatusBpjs{},
		&models.MStatusBrilife{},
		&models.TPeserta{},
		&models.TPendaftaranManfaat{},
		&models.TLampiran{},
		&models.TApprovalLog{},
		&models.TSkProspens{},
		&models.TAuditTrail{},
		&models.TNotification{},
	)

	seedData()
}

func seedData() {
	// 1. Seed Roles
	roles := []models.MRole{
		{ID: 1, RoleName: "Super Admin"},
		{ID: 2, RoleName: "Admin"},
		{ID: 3, RoleName: "Staff"},
		{ID: 4, RoleName: "Peserta"},
	}
	for _, r := range roles {
		DB.FirstOrCreate(&r, models.MRole{RoleName: r.RoleName})
	}

	// 2. Seed Master Data: Kelompok
	kelompoks := []models.MKelompokProspens{
		{Kode: "NORMAL", Nama: "Pensiunan Normal"},
		{Kode: "DINI", Nama: "Pensiunan Dipercepat"},
		{Kode: "JD", Nama: "Janda/Duda"},
	}
	for _, k := range kelompoks {
		DB.FirstOrCreate(&k, models.MKelompokProspens{Kode: k.Kode})
	}

	// 3. Seed Master Data: Kelas
	kelas := []models.MKelasProspens{
		{Kode: "A", Nama: "Kelas A"},
		{Kode: "B", Nama: "Kelas B"},
		{Kode: "C", Nama: "Kelas C"},
	}
	for _, kl := range kelas {
		DB.FirstOrCreate(&kl, models.MKelasProspens{Kode: kl.Kode})
	}

	// 4. Seed Status BPJS
	statusBpjs := []models.MStatusBpjs{
		{Kode: "AKTIF", Nama: "Aktif"},
		{Kode: "NONAKTIF", Nama: "Non-Aktif"},
		{Kode: "OFF", Nama: "Berhenti"},
	}
	for _, s := range statusBpjs {
		DB.FirstOrCreate(&s, models.MStatusBpjs{Kode: s.Kode})
	}

	// 5. Seed Status BRI Life
	statusBrilife := []models.MStatusBrilife{
		{Kode: "AKTIF", Nama: "Aktif"},
		{Kode: "NONAKTIF", Nama: "Non-Aktif"},
	}
	for _, s := range statusBrilife {
		DB.FirstOrCreate(&s, models.MStatusBrilife{Kode: s.Kode})
	}

	// 6. Seed Users
	var superAdminRole, adminRole, staffRole, pesertaRole models.MRole
	DB.Where("role_name = ?", "Super Admin").First(&superAdminRole)
	DB.Where("role_name = ?", "Admin").First(&adminRole)
	DB.Where("role_name = ?", "Staff").First(&staffRole)
	DB.Where("role_name = ?", "Peserta").First(&pesertaRole)

	users := []struct {
		username string
		password string
		roleID   uint
	}{
		{"admin", "admin123", superAdminRole.ID},
		{"ykpadmin", "admin123", adminRole.ID},
		{"staff", "staff123", staffRole.ID},
		{"peserta", "user123", pesertaRole.ID},
	}

	for _, u := range users {
		var count int64
		DB.Model(&models.MUser{}).Where("username = ?", u.username).Count(&count)
		if count == 0 {
			hashedPassword, _ := bcrypt.GenerateFromPassword([]byte(u.password), bcrypt.DefaultCost)
			newUser := models.MUser{
				Username: u.username,
				Password: string(hashedPassword),
				RoleID:   u.roleID,
			}
			DB.Create(&newUser)
			log.Printf("User '%s' created with password '%s'\n", u.username, u.password)
		}
	}

	// Seed 100 Participants for Proyeksi Testing
	var pCount int64
	DB.Model(&models.TPeserta{}).Count(&pCount)
	if pCount == 0 {
		log.Println("Seeding 100 dummy participants...")
		for i := 1; i <= 100; i++ {
			// Generate random PHK date between 1 Jan 2026 and 31 Dec 2026
			randomDays := i % 365 
			tglPhk := time.Date(2026, 1, 1, 0, 0, 0, 0, time.UTC).AddDate(0, 0, randomDays)
			
			// Mock data
			kelompokID := uint((i % 3) + 1) // 1=NORMAL, 2=DINI, 3=JD
			kelasID := uint((i % 3) + 1) // 1=A, 2=B, 3=C
			statusBpjs := uint(1) // AKTIF
			statusBrilife := uint(1) // AKTIF

			peserta := models.TPeserta{
				IDPeserta:        fmt.Sprintf("P-%05d", i),
				NamaPeserta:      fmt.Sprintf("Peserta Dummy %d", i),
				NikBri:           fmt.Sprintf("NIK%06d", i),
				TglPhk:           &tglPhk,
				JenisMutasi:      "PHK Normal",
				IDKelompok:       &kelompokID,
				IDKelas:          &kelasID,
				TmtPertanggungan: &tglPhk, // simplified for seeder
				NoKartuBrilife:   fmt.Sprintf("BL%08d", i),
				StatusBpjsID:     &statusBpjs,
				StatusBrilifeID:  &statusBrilife,
			}
			DB.Create(&peserta)
		}
		log.Println("100 participants seeded successfully.")
	}
}
