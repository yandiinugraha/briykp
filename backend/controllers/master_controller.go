package controllers

import (
	"briyjkp/database"
	"briyjkp/models"

	"github.com/gofiber/fiber/v2"
)

func GetKelompokOptions(c *fiber.Ctx) error {
	var options []models.MKelompokProspens
	database.DB.Find(&options)
	return c.JSON(options)
}

func GetKelasOptions(c *fiber.Ctx) error {
	var options []models.MKelasProspens
	database.DB.Find(&options)
	return c.JSON(options)
}

func GetStatusBpjsOptions(c *fiber.Ctx) error {
	var options []models.MStatusBpjs
	database.DB.Find(&options)
	return c.JSON(options)
}

func GetStatusBrilifeOptions(c *fiber.Ctx) error {
	var options []models.MStatusBrilife
	database.DB.Find(&options)
	return c.JSON(options)
}
