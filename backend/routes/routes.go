package routes

import (
	"briyjkp/controllers"
	"briyjkp/middlewares"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/swagger"
)

func Setup(app *fiber.App) {
	app.Get("/swagger/*", swagger.HandlerDefault)

	api := app.Group("/api")

	api.Get("/health", func(c *fiber.Ctx) error {
		return c.JSON(fiber.Map{"status": "ok", "message": "YKP BRI API is running smoothly"})
	})

	// AUTH (Public)
	api.Post("/login", controllers.Login)

	// PROTECTED
	protected := api.Group("/", middlewares.AuthMiddleware)
	protected.Get("/me", controllers.GetMe)

	// Peserta Management (Staff, Admin, Super Admin)
	peserta := protected.Group("/peserta", middlewares.RoleMiddleware("Staff", "Admin"))
	peserta.Get("/", controllers.GetAllPeserta)
	peserta.Post("/", controllers.CreatePeserta)
	peserta.Put("/:id", controllers.UpdatePeserta)
	peserta.Get("/:id", controllers.GetPesertaByID)
	peserta.Delete("/:id", controllers.DeletePeserta)

	// Proyeksi (Staff, Admin, Super Admin)
	protected.Get("/proyeksi", middlewares.RoleMiddleware("Staff", "Admin"), controllers.GetProyeksiPendaftaran)

	// Upload & Sinkronisasi (Admin, Super Admin)
	upload := protected.Group("/upload", middlewares.RoleMiddleware("Admin"))
	upload.Post("/peserta", controllers.UploadPesertaExcel)

	// Keuangan (Admin, Super Admin)
	finance := protected.Group("/finance", middlewares.RoleMiddleware("Admin"))
	finance.Post("/pembayaran", controllers.CreatePembayaranPremi)
	finance.Get("/pembayaran", controllers.GetAllPembayaran)
	finance.Post("/refund", controllers.CreateRefundPremi)

	// Approval (Staff, Admin, Super Admin)
	protected.Post("/approval", controllers.ProcessApproval)
	protected.Post("/approval/submit", controllers.SubmitPendaftaran)
	protected.Get("/approval/pendaftaran", controllers.GetAllPendaftaran)
	protected.Get("/approval/pendaftaran/:id", controllers.GetPendaftaranByID)

	// Lampiran (Attachments)
	protected.Post("/approval/lampiran", controllers.UploadLampiran)
	protected.Delete("/approval/lampiran/:id", controllers.DeleteLampiran)

	// SK Prospens (Staff, Admin, Super Admin)
	protected.Get("/sk", controllers.GetSkProspens)

	// Notifications
	protected.Get("/notifications", controllers.GetNotifications)
	protected.Put("/notifications/:id/read", controllers.MarkNotificationRead)
	protected.Put("/notifications/read-all", controllers.MarkAllNotificationsRead)

	// Audit Trail (Super Admin / Admin)
	protected.Get("/audit", middlewares.RoleMiddleware("Admin", "Super Admin"), controllers.GetAuditTrail)

	// BPJS Kesehatan
	protected.Get("/bpjs/candidates", controllers.GetBpjsCandidates)
	protected.Post("/bpjs/submit", controllers.SubmitBpjsRegistration)
	protected.Post("/bpjs/feedback", controllers.UploadBpjsFeedback)

	// BRI Life
	protected.Get("/brilife/candidates", controllers.GetBrilifeCandidates)
	protected.Post("/brilife/submit", controllers.SubmitBrilifeRegistration)

	// Master Data (Helper for Front-end)
	master := protected.Group("/master")
	master.Get("/kelompok", controllers.GetKelompokOptions)
	master.Get("/kelas", controllers.GetKelasOptions)
	master.Get("/status-bpjs", controllers.GetStatusBpjsOptions)
	master.Get("/status-brilife", controllers.GetStatusBrilifeOptions)
}
