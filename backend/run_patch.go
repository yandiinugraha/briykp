package main

import (
	"briyjkp/database"
	"log"
	"os"
	"strings"
	"github.com/joho/godotenv"
)

func main() {
	err := godotenv.Load()
	if err != nil {
		log.Println("Error loading .env file")
	}

	database.ConnectDB()

	sqlBytes, err := os.ReadFile("patch.sql")
	if err != nil {
		log.Fatal("Error reading patch.sql:", err)
	}

	queries := strings.Split(string(sqlBytes), ";")
	
	db, err := database.DB.DB()
	if err != nil {
		log.Fatal(err)
	}

	for _, query := range queries {
		query = strings.TrimSpace(query)
		if query == "" {
			continue
		}
		
		_, err = db.Exec(query)
		if err != nil {
			log.Printf("Error executing query: %s\nError: %v\n", query, err)
			os.Exit(1) // fail fast
		}
	}
	
	log.Println("All queries applied successfully.")
}
