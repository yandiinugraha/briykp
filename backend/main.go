package main

import (
	"log"
	"os"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/gofiber/fiber/v2/middleware/logger"
	"github.com/joho/godotenv"

	"briyjkp/database"
	"briyjkp/middlewares"
	"briyjkp/routes"

	_ "briyjkp/docs"
)

// @title YKP BRI Prospens API
// @version 1.0
// @description Backend API Service for YKP BRI Prospens System Maker-Checker-Signer
// @host localhost:3000
// @BasePath /api
func main() {
	// Load environment variables
	err := godotenv.Load()
	if err != nil {
		log.Println("Error loading .env file, relying on system environment variables")
	}

	// Connect to database
	database.ConnectDB()

	// Start Audit Log Worker (Background)
	middlewares.StartAuditWorker()

	// Initialize Fiber app
	app := fiber.New()

	// Logger Middleware
	app.Use(logger.New())

	// Setup CORS
	app.Use(cors.New(cors.Config{
		AllowOrigins: "*",
		AllowHeaders: "Origin, Content-Type, Accept, Authorization",
	}))

	// Serve static files
	app.Static("/uploads", "./uploads")

	// Setup Routes
	routes.Setup(app)

	// Start Server
	port := os.Getenv("PORT")
	if port == "" {
		port = "3000"
	}

	log.Printf("Server is running on port %s", port)
	log.Fatal(app.Listen(":" + port))
}
