package main

import (
	"log"
	"briyjkp/database"
	
	"github.com/joho/godotenv"
)

func main() {
	godotenv.Load()
	database.ConnectDB()

	err := database.DB.Exec("ALTER TABLE t_audit_trail MODIFY old_value LONGTEXT, MODIFY new_value LONGTEXT").Error
	if err != nil {
		log.Printf("Alter error: %v", err)
	} else {
		log.Printf("Successfully modified t_audit_trail")
	}
}
