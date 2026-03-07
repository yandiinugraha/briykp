package middlewares

import (
	"log"

	"briyjkp/database"
	"briyjkp/models"

	"github.com/gofiber/fiber/v2"
)

// AuditLogData is the payload structure for the channel
type AuditLogData struct {
	UserID    string
	Modul     string
	Action    string
	OldValue  *string
	NewValue  *string
	IpAddress *string
}

// AuditChannel for processing logs concurrently
var AuditChannel = make(chan AuditLogData, 100)

// StartAuditWorker runs in a separate goroutine to process audit logs
func StartAuditWorker() {
	go func() {
		for auditData := range AuditChannel {
			auditTrail := models.TAuditTrail{
				UserID:    auditData.UserID,
				Modul:     auditData.Modul,
				Action:    auditData.Action,
				OldValue:  auditData.OldValue,
				NewValue:  auditData.NewValue,
				IpAddress: auditData.IpAddress,
			}

			if err := database.DB.Create(&auditTrail).Error; err != nil {
				log.Printf("Failed to insert audit log: %v", err)
			} else {
				log.Printf("Audit log recorded: %s - %s", auditData.Modul, auditData.Action)
			}
		}
	}()
}

// AuditMiddleware injects user IP and provides context to fiber app
func AuditMiddleware() fiber.Handler {
	return func(c *fiber.Ctx) error {
		// Proceed to next middleware or route handler first
		err := c.Next()

		// Logic to trigger Audit can be used within handlers by sending to AuditChannel
		// Example:
		// middlewares.AuditChannel <- middlewares.AuditLogData{...}

		return err
	}
}
