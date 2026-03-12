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

	kepesertaan := protected.Group("/kepesertaan")
	
	// Iuran Peserta (Upload & Discrepancies)
	kepesertaan.Post("/iuran/upload", controllers.UploadIuranFile)
	kepesertaan.Get("/iuran/uploads", controllers.GetIuranUploads)
	kepesertaan.Get("/iuran/upload/:id/details", controllers.GetIuranUploadDetails)
	kepesertaan.Post("/iuran/upload/:id/submit", controllers.SubmitIuranForApproval)
	kepesertaan.Post("/iuran/upload/:id/process", controllers.ProcessIuranApproval)
	kepesertaan.Post("/iuran/new-member/approve", controllers.ApproveNewMember)
	
	kepesertaan.Post("/iuran/compare/:bulan/:tahun", controllers.CompareIuranData)
	kepesertaan.Get("/iuran/discrepancies/:bulan/:tahun", controllers.GetIuranDiscrepancies)
	kepesertaan.Get("/iuran/discrepancy/:bulan/:tahun", controllers.GetIuranDiscrepancies)
	kepesertaan.Get("/iuran/penampungan/:bulan/:tahun", controllers.GetIuranPenampungan)
	kepesertaan.Get("/iuran/settlement", controllers.GetIuranSettlement)

	// PHK Upload
	kepesertaan.Post("/phk/upload", controllers.UploadPhkFile)
	kepesertaan.Get("/phk/uploads", controllers.GetPhkUploads)
	kepesertaan.Get("/phk/upload/:id/details", controllers.GetPhkUploadDetails)
	kepesertaan.Post("/phk/upload/:id/submit", controllers.SubmitPhkForApproval)
	kepesertaan.Post("/phk/upload/:id/process", controllers.ProcessPhkApproval)

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

	// Investasi (Staff, Admin, Super Admin)
	investasi := protected.Group("/investasi")
	investasi.Get("/proposals", controllers.GetInvestmentProposals)
	investasi.Post("/proposals/upload", controllers.UploadInvestmentProposal)
	investasi.Post("/proposals/:id/approve", controllers.ApproveInvestmentProposal)
	investasi.Get("/transactions", controllers.GetInvestmentTransactions)
	investasi.Post("/transactions/upload", controllers.UploadInvestmentTransaction)

	// Master Data (Helper for Front-end)
	master := protected.Group("/master")
	master.Get("/kelompok", controllers.GetKelompokOptions)
	master.Get("/kelas", controllers.GetKelasOptions)
	master.Get("/status-bpjs", controllers.GetStatusBpjsOptions)
	master.Get("/status-brilife", controllers.GetStatusBrilifeOptions)
}
