package models

import (
	"time"
)

// -------------------------------------------------------------------------
// 1. MASTER TABLES
// -------------------------------------------------------------------------

type MKelompokProspens struct {
	ID        uint      `gorm:"primaryKey;autoIncrement" json:"id"`
	Kode      string    `gorm:"type:varchar(10);unique;not null" json:"kode"`
	Nama      string    `gorm:"type:varchar(100);not null" json:"nama"`
	CreatedAt time.Time `gorm:"autoCreateTime" json:"created_at"`
}

type MStatusBpjs struct {
	ID        uint      `gorm:"primaryKey;autoIncrement" json:"id"`
	Kode      string    `gorm:"type:varchar(20);unique;not null" json:"kode"`
	Nama      string    `gorm:"type:varchar(100);not null" json:"nama"`
	CreatedAt time.Time `gorm:"autoCreateTime" json:"created_at"`
}

type MStatusBrilife struct {
	ID        uint      `gorm:"primaryKey;autoIncrement" json:"id"`
	Kode      string    `gorm:"type:varchar(20);unique;not null" json:"kode"`
	Nama      string    `gorm:"type:varchar(100);not null" json:"nama"`
	CreatedAt time.Time `gorm:"autoCreateTime" json:"created_at"`
}

type MAlasanNonaktifBpjs struct {
	ID        uint      `gorm:"primaryKey;autoIncrement" json:"id"`
	Alasan    string    `gorm:"type:varchar(150);not null" json:"alasan"`
	CreatedAt time.Time `gorm:"autoCreateTime" json:"created_at"`
}

type MAlasanNonaktifBrilife struct {
	ID        uint      `gorm:"primaryKey;autoIncrement" json:"id"`
	Alasan    string    `gorm:"type:varchar(150);not null" json:"alasan"`
	CreatedAt time.Time `gorm:"autoCreateTime" json:"created_at"`
}

type MKelasProspens struct {
	ID        uint      `gorm:"primaryKey;autoIncrement" json:"id"`
	Kode      string    `gorm:"type:varchar(10);unique;not null" json:"kode"`
	Nama      string    `gorm:"type:varchar(50);not null" json:"nama"`
	CreatedAt time.Time `gorm:"autoCreateTime" json:"created_at"`
}

// -------------------------------------------------------------------------
// 2. CORE KEPESERTAAN TABLES
// -------------------------------------------------------------------------

type TPeserta struct {
	IDPeserta        string     `gorm:"type:varchar(50);primaryKey" json:"id_peserta"`
	NamaPeserta      string     `gorm:"type:varchar(150);not null" json:"nama_peserta"`
	NikBri           string     `gorm:"type:varchar(50);unique;not null" json:"nik_bri"`
	Pernr            string     `gorm:"type:varchar(50);index" json:"pernr"`
	TglPhk           *time.Time `gorm:"type:date" json:"tgl_phk"`
	JenisMutasi      string     `gorm:"type:varchar(50)" json:"jenis_mutasi"`
	TglMutasi        *time.Time `gorm:"type:date" json:"tgl_mutasi"`
	IDKelompok       *uint      `gorm:"index" json:"id_kelompok"`
	IDKelas          *uint      `gorm:"index" json:"id_kelas"`
	TmtPertanggungan *time.Time `gorm:"type:date" json:"tmt_pertanggungan"`
	NoKartuBrilife   string     `gorm:"type:varchar(50)" json:"no_kartu_brilife"`
	StatusBpjsID     *uint      `gorm:"index" json:"status_bpjs_id"`
	StatusBrilifeID  *uint      `gorm:"index" json:"status_brilife_id"`

	NoKK         *string    `gorm:"type:varchar(50)" json:"no_kk"`
	Nik          *string    `gorm:"type:varchar(50)" json:"nik"`
	TempatLahir  *string    `gorm:"type:varchar(100)" json:"tempat_lahir"`
	TglLahir     *time.Time `gorm:"type:date" json:"tgl_lahir"`
	JnsKel       *string    `gorm:"type:varchar(10)" json:"jns_kel"`
	StKawin      *string    `gorm:"type:varchar(50)" json:"st_kawin"`
	Alamat       *string    `gorm:"type:text" json:"alamat"`
	Rt           *string    `gorm:"type:varchar(10)" json:"rt"`
	Rw           *string    `gorm:"type:varchar(10)" json:"rw"`
	KdPos        *string    `gorm:"type:varchar(10)" json:"kd_pos"`
	KdKec        *string    `gorm:"type:varchar(50)" json:"kd_kec"`
	AlKec        *string    `gorm:"type:varchar(100)" json:"al_kec"`
	KdDesa       *string    `gorm:"type:varchar(50)" json:"kd_desa"`
	AlDesa       *string    `gorm:"type:varchar(100)" json:"al_desa"`
	NoTelp       *string    `gorm:"type:varchar(20)" json:"no_telp"`
	Email        *string    `gorm:"type:varchar(100)" json:"email"`
	StWarga      *string    `gorm:"type:varchar(50)" json:"st_warga"`
	Npwp         *string    `gorm:"type:varchar(50)" json:"npwp"`
	NoPaspor     *string    `gorm:"type:varchar(50)" json:"no_paspor"`
	FaskesOpsi   *string    `gorm:"type:varchar(50)" json:"faskes_opsi"`
	NmFaskes1    *string    `gorm:"type:varchar(150)" json:"nm_faskes1"`
	NmFasgigi    *string    `gorm:"type:varchar(150)" json:"nm_fasgigi"`
	TambahInfo   *string    `gorm:"type:text" json:"tambah_info"`

	CreatedAt        time.Time  `gorm:"autoCreateTime" json:"created_at"`
	UpdatedAt        time.Time  `gorm:"autoUpdateTime" json:"updated_at"`

	Kelompok      MKelompokProspens  `gorm:"foreignKey:IDKelompok;references:ID;constraint:OnDelete:SET NULL;" json:"kelompok"`
	Kelas         MKelasProspens     `gorm:"foreignKey:IDKelas;references:ID;constraint:OnDelete:SET NULL;" json:"kelas"`
	StatusBpjs    MStatusBpjs        `gorm:"foreignKey:StatusBpjsID;references:ID;constraint:OnDelete:SET NULL;" json:"status_bpjs"`
	StatusBrilife MStatusBrilife     `gorm:"foreignKey:StatusBrilifeID;references:ID;constraint:OnDelete:SET NULL;" json:"status_brilife"`
}




// -------------------------------------------------------------------------
// 3. UPLOAD & DISCREPANCY TABLES
// -------------------------------------------------------------------------


type TIuranInput struct {
	ID           uint      `gorm:"primaryKey;autoIncrement" json:"id"`
	Bulan        int       `json:"bulan"`
	Tahun        int       `json:"tahun"`
	TanggalInput time.Time `json:"tanggal_input"`
	Status       string    `json:"status"`
	TotalPeserta int       `json:"total_peserta"`
	TotalIuran   float64   `json:"total_iuran"`
	CreatedAt    time.Time `gorm:"autoCreateTime" json:"created_at"`
	UpdatedAt    time.Time `gorm:"autoUpdateTime" json:"updated_at"`
}

type TIuranDetail struct {
	ID             uint      `gorm:"primaryKey;autoIncrement" json:"id"`
	IDIuran        uint      `json:"id_iuran"`
	IDPeserta      string    `json:"id_peserta"`
	NominalPemberi float64   `json:"nominal_pemberi"`
	NominalPeserta float64   `json:"nominal_peserta"`
	TotalIuran     float64   `json:"total_iuran"`
	CreatedAt      time.Time `gorm:"autoCreateTime" json:"created_at"`
	
	Peserta TPeserta `gorm:"foreignKey:IDPeserta;references:IDPeserta" json:"peserta"`
}

type TPesertaStaging struct {
	ID             uint      `gorm:"primaryKey;autoIncrement" json:"id"`
	IDPeserta      *string   `gorm:"type:varchar(50)" json:"id_peserta"`
	JenisPengajuan string    `gorm:"type:varchar(50)" json:"jenis_pengajuan"`
	DataJson       string    `gorm:"type:longtext" json:"data_json"`
	StatusApproval string    `gorm:"type:varchar(50)" json:"status_approval"`
	MakerID        *string   `gorm:"type:varchar(50)" json:"maker_id"`
	CheckerID      *string   `gorm:"type:varchar(50)" json:"checker_id"`
	SignerID       *string   `gorm:"type:varchar(50)" json:"signer_id"`
	CatatanChecker *string   `gorm:"type:text" json:"catatan_checker"`
	CatatanSigner  *string   `gorm:"type:text" json:"catatan_signer"`
	CreatedAt      time.Time `gorm:"autoCreateTime" json:"created_at"`
}



type TIuranUpload struct {
	ID             uint      `gorm:"primaryKey;autoIncrement" json:"id"`
	Bulan          int       `gorm:"not null" json:"bulan"`
	Tahun          int       `gorm:"not null" json:"tahun"`
	JenisIuran     string    `gorm:"type:varchar(30);not null" json:"jenis_iuran"`
	FileName       string    `gorm:"type:varchar(255);not null" json:"file_name"`
	TotalRows      int       `gorm:"default:0" json:"total_rows"`
	TotalNominal   float64   `gorm:"type:decimal(18,2);default:0" json:"total_nominal"`
	UploadedBy     string    `gorm:"type:varchar(50);not null" json:"uploaded_by"`
	StatusApproval string    `gorm:"type:varchar(30);default:'UPLOADED'" json:"status_approval"`
	CheckerID      *string   `gorm:"type:varchar(50)" json:"checker_id"`
	SignerID       *string   `gorm:"type:varchar(50)" json:"signer_id"`
	CatatanChecker *string   `gorm:"type:text" json:"catatan_checker"`
	CatatanSigner  *string   `gorm:"type:text" json:"catatan_signer"`
	CreatedAt      time.Time `gorm:"autoCreateTime" json:"created_at"`
	UpdatedAt      time.Time `gorm:"autoUpdateTime" json:"updated_at"`
}

type TIuranUploadDetail struct {
	ID           uint      `gorm:"primaryKey;autoIncrement" json:"id"`
	UploadID     uint      `gorm:"not null;index" json:"upload_id"`
	NikBri       string    `gorm:"type:varchar(50);not null" json:"nik_bri"`
	Pernr        string    `gorm:"type:varchar(50)" json:"pernr"`
	NamaPeserta  string    `gorm:"type:varchar(150)" json:"nama_peserta"`
	NominalIuran float64   `gorm:"type:decimal(15,2);not null" json:"nominal_iuran"`
	Keterangan   string    `gorm:"type:text" json:"keterangan"`
	RawData      *string   `gorm:"type:longtext" json:"raw_data"`
	CreatedAt    time.Time `gorm:"autoCreateTime" json:"created_at"`
}

type TIuranDiscrepancy struct {
	ID              uint      `gorm:"primaryKey;autoIncrement" json:"id"`
	Bulan           int       `gorm:"not null" json:"bulan"`
	Tahun           int       `gorm:"not null" json:"tahun"`
	NikBri          string    `gorm:"type:varchar(50);not null" json:"nik_bri"`
	Pernr           string    `gorm:"type:varchar(50)" json:"pernr"`
	NamaPeserta     string    `gorm:"type:varchar(200)" json:"nama_peserta"`
	JenisSelisih    string    `gorm:"type:varchar(50)" json:"jenis_selisih"`
	NominalTHT      float64   `gorm:"type:decimal(15,2);default:0" json:"nominal_tht"`
	NominalProspens float64   `gorm:"type:decimal(15,2);default:0" json:"nominal_prospens"`
	CreatedAt       time.Time `gorm:"autoCreateTime" json:"created_at"`
}

type TIuranPenampungan struct {
	ID           uint      `gorm:"primaryKey;autoIncrement" json:"id"`
	Bulan        int       `gorm:"not null" json:"bulan"`
	Tahun        int       `gorm:"not null" json:"tahun"`
	NikBri       string    `gorm:"type:varchar(50);not null" json:"nik_bri"`
	NamaPeserta  string    `gorm:"type:varchar(200)" json:"nama_peserta"`
	NominalIuran float64   `gorm:"type:decimal(15,2);not null" json:"nominal_iuran"`
	Keterangan   string    `gorm:"type:text" json:"keterangan"`
	CreatedAt    time.Time `gorm:"autoCreateTime" json:"created_at"`
}

type TPhkUpload struct {
	ID             uint      `gorm:"primaryKey;autoIncrement" json:"id"`
	Bulan          int       `gorm:"not null" json:"bulan"`
	Tahun          int       `gorm:"not null" json:"tahun"`
	FileName       string    `gorm:"type:varchar(255);not null" json:"file_name"`
	TotalRows      int       `gorm:"default:0" json:"total_rows"`
	UploadedBy     string    `gorm:"type:varchar(50);not null" json:"uploaded_by"`
	StatusApproval string    `gorm:"type:varchar(30);default:'UPLOADED'" json:"status_approval"`
	CheckerID      *string   `gorm:"type:varchar(50)" json:"checker_id"`
	SignerID       *string   `gorm:"type:varchar(50)" json:"signer_id"`
	CatatanChecker *string   `gorm:"type:text" json:"catatan_checker"`
	CatatanSigner  *string   `gorm:"type:text" json:"catatan_signer"`
	CreatedAt      time.Time `gorm:"autoCreateTime" json:"created_at"`
	UpdatedAt      time.Time `gorm:"autoUpdateTime" json:"updated_at"`
}

type TPhkUploadDetail struct {
	ID               uint      `gorm:"primaryKey;autoIncrement" json:"id"`
	UploadID         uint      `gorm:"not null;index" json:"upload_id"`
	NikBri           string    `gorm:"type:varchar(50)" json:"nik_bri"`
	Pernr            string    `gorm:"type:varchar(50)" json:"pernr"`
	NamaPeserta      string    `gorm:"type:varchar(150)" json:"nama_peserta"`
	UpahPokok        float64   `gorm:"type:decimal(15,2)" json:"upah_pokok"`
	JG               string    `gorm:"type:varchar(50)" json:"jg"`
	PersonnelArea    string    `gorm:"type:varchar(50)" json:"personnel_area"`
	PADesc           string    `gorm:"type:varchar(150)" json:"pa_desc"`
	PersonnelSubarea string    `gorm:"type:varchar(50)" json:"personnel_subarea"`
	PSADesc          string    `gorm:"type:varchar(150)" json:"psa_desc"`
	RawData          *string   `gorm:"type:longtext" json:"raw_data"`
	CreatedAt        time.Time `gorm:"autoCreateTime" json:"created_at"`
}

// -------------------------------------------------------------------------
// 4. TRANSAKSI & WORKFLOW TABLES
// -------------------------------------------------------------------------

type TPendaftaranManfaat struct {
	IDPengajuan    string    `gorm:"type:varchar(50);primaryKey" json:"id_pengajuan"`
	IDPeserta      *string   `gorm:"type:varchar(50);index" json:"id_peserta"` // Optional for NEW participants
	TglPengajuan   time.Time `gorm:"type:date;not null" json:"tgl_pengajuan"`
	JenisManfaat   string    `gorm:"type:varchar(50);not null" json:"jenis_manfaat"`
	DataBaru       *string   `gorm:"type:longtext" json:"data_baru"` // JSON payload of the form
	FileSp         *string   `gorm:"type:varchar(255)" json:"file_sp"`
	StatusApproval string    `gorm:"type:varchar(30);default:'DRAFT'" json:"status_approval"`
	CreatedAt      time.Time `gorm:"autoCreateTime" json:"created_at"`
	
	Peserta *TPeserta `gorm:"foreignKey:IDPeserta;references:IDPeserta;constraint:OnDelete:CASCADE;" json:"peserta,omitempty"`
	Lampirans []TLampiran `gorm:"foreignKey:IDPengajuan;references:IDPengajuan;constraint:OnDelete:CASCADE;" json:"lampirans,omitempty"`
	ApprovalLogs []TApprovalLog `gorm:"foreignKey:IDTransaksi;references:IDPengajuan;constraint:OnDelete:CASCADE;" json:"approval_logs,omitempty"`
}

type TLampiran struct {
	ID          uint      `gorm:"primaryKey;autoIncrement" json:"id"`
	IDPengajuan string    `gorm:"type:varchar(50);not null;index" json:"id_pengajuan"`
	FileName    string    `gorm:"type:varchar(255);not null" json:"file_name"`
	FileSize    int64     `gorm:"type:bigint;not null" json:"file_size"`
	FileURL     string    `gorm:"type:varchar(255);not null" json:"file_url"`
	UploadedBy  string    `gorm:"type:varchar(50);not null" json:"uploaded_by"`
	CreatedAt   time.Time `gorm:"autoCreateTime" json:"created_at"`
}

type TSkProspens struct {
	IDSk         string    `gorm:"type:varchar(50);primaryKey" json:"id_sk"`
	IDPengajuan  string    `gorm:"type:varchar(50);unique;not null" json:"id_pengajuan"`
	TglDiterbitkan time.Time `gorm:"type:date;not null" json:"tgl_diterbitkan"`
	FileSk       *string   `gorm:"type:varchar(255)" json:"file_sk"`
	CreatedAt    time.Time `gorm:"autoCreateTime" json:"created_at"`

	Pendaftaran TPendaftaranManfaat `gorm:"foreignKey:IDPengajuan;references:IDPengajuan;constraint:OnDelete:CASCADE;" json:"pendaftaran"`
}

type TApprovalLog struct {
	ID          uint      `gorm:"primaryKey;autoIncrement" json:"id"`
	IDTransaksi string    `gorm:"type:varchar(50);not null" json:"id_transaksi"`
	Role        string    `gorm:"type:varchar(30);not null" json:"role"`
	Status      string    `gorm:"type:varchar(30);not null" json:"status"`
	Catatan     *string   `gorm:"type:text" json:"catatan"`
	Timestamp   time.Time `gorm:"autoCreateTime" json:"timestamp"`
}

type TPembayaranPremi struct {
	NoNotaDinas        string    `gorm:"type:varchar(100);primaryKey" json:"no_nota_dinas"`
	Tanggal            time.Time `gorm:"type:date;not null" json:"tanggal"`
	TotalPremi         float64   `gorm:"type:decimal(15,2);not null" json:"total_premi"`
	IDStatusPembayaran *string   `gorm:"type:varchar(50)" json:"id_status_pembayaran"`
	FileBuktiBayar     *string   `gorm:"type:varchar(255)" json:"file_bukti_bayar"`
	CreatedAt          time.Time `gorm:"autoCreateTime" json:"created_at"`
}

type TRefundPremi struct {
	IDRefund           string    `gorm:"type:varchar(50);primaryKey" json:"id_refund"`
	Tanggal            time.Time `gorm:"type:date;not null" json:"tanggal"`
	NominalRefund      float64   `gorm:"type:decimal(15,2);not null" json:"nominal_refund"`
	FileInvoiceRefund  *string   `gorm:"type:varchar(255)" json:"file_invoice_refund"`
	StatusJurnal       string    `gorm:"type:varchar(50);default:'PENDING'" json:"status_jurnal"`
	CreatedAt          time.Time `gorm:"autoCreateTime" json:"created_at"`
}

// -------------------------------------------------------------------------
// 5. INVESTASI TABLES
// -------------------------------------------------------------------------

type TInvestmentProposal struct {
	ID             uint      `gorm:"primaryKey;autoIncrement" json:"id"`
	ProposalNo     string    `gorm:"type:varchar(50);unique;not null" json:"proposal_no"`
	JenisInvestasi string    `gorm:"type:varchar(50);not null" json:"jenis_investasi"` // OBLIGASI, SAHAM, REKSADANA
	NamaEmiten     string    `gorm:"type:varchar(150);not null" json:"nama_emiten"`
	NominalUsulan  float64   `gorm:"type:decimal(18,2);not null" json:"nominal_usulan"`
	Keterangan     string    `gorm:"type:text" json:"keterangan"`
	StatusApproval string    `gorm:"type:varchar(30);default:'DRAFT'" json:"status_approval"`
	MakerID        string    `gorm:"type:varchar(50)" json:"maker_id"`
	CheckerID      *string   `gorm:"type:varchar(50)" json:"checker_id"`
	SignerID       *string   `gorm:"type:varchar(50)" json:"signer_id"`
	CatatanChecker *string   `gorm:"type:text" json:"catatan_checker"`
	CatatanSigner  *string   `gorm:"type:text" json:"catatan_signer"`
	CreatedAt      time.Time `gorm:"autoCreateTime" json:"created_at"`
	UpdatedAt      time.Time `gorm:"autoUpdateTime" json:"updated_at"`
}

type TInvestmentTransaction struct {
	ID             uint      `gorm:"primaryKey;autoIncrement" json:"id"`
	ProposalID     uint      `gorm:"index" json:"proposal_id"`
	TransactionNo  string    `gorm:"type:varchar(50);unique;not null" json:"transaction_no"`
	JenisTransaksi string    `gorm:"type:varchar(20)" json:"jenis_transaksi"` // BUY, SELL
	NamaEmiten     string    `gorm:"type:varchar(150)" json:"nama_emiten"`
	Nominal        float64   `gorm:"type:decimal(18,2)" json:"nominal"`
	Harga          float64   `gorm:"type:decimal(18,2)" json:"harga"`
	TglTransaksi   time.Time `gorm:"type:date" json:"tgl_transaksi"`
	Status         string    `gorm:"type:varchar(30);default:'SETTLED'" json:"status"`
	CreatedAt      time.Time `gorm:"autoCreateTime" json:"created_at"`
}

// -------------------------------------------------------------------------
// 6. AUDIT TRAIL TABLE
// -------------------------------------------------------------------------

type TAuditTrail struct {
	IDAudit   uint      `gorm:"primaryKey;autoIncrement" json:"id_audit"`
	UserID    string    `gorm:"type:varchar(50);not null" json:"user_id"`
	Modul     string    `gorm:"type:varchar(100);not null" json:"modul"`
	Action    string    `gorm:"type:varchar(20);not null" json:"action"`
	OldValue  *string   `gorm:"type:json" json:"old_value"`
	NewValue  *string   `gorm:"type:json" json:"new_value"`
	IpAddress *string   `gorm:"type:varchar(45)" json:"ip_address"`
	CreatedAt time.Time `gorm:"autoCreateTime" json:"created_at"`
}

// -------------------------------------------------------------------------
// 7. NOTIFICATION TABLE
// -------------------------------------------------------------------------

type TNotification struct {
	ID        uint      `gorm:"primaryKey;autoIncrement" json:"id"`
	UserID    *string   `gorm:"type:varchar(50);index" json:"user_id"` // Jika null, berarti untuk ROLE tertentu
	Role      *string   `gorm:"type:varchar(50);index" json:"role"`    // Misal: "Admin", "Super Admin"
	Title     string    `gorm:"type:varchar(150);not null" json:"title"`
	Message   string    `gorm:"type:text;not null" json:"message"`
	IsRead    bool      `gorm:"default:false" json:"is_read"`
	LinkURL   *string   `gorm:"type:varchar(255)" json:"link_url"`
	CreatedAt time.Time `gorm:"autoCreateTime" json:"created_at"`
}

// -------------------------------------------------------------------------
// 8. AUTH & RBAC TABLES
// -------------------------------------------------------------------------

type MRole struct {
	ID        uint      `gorm:"primaryKey;autoIncrement" json:"id"`
	RoleName  string    `gorm:"type:varchar(50);unique;not null" json:"role_name"`
	CreatedAt time.Time `gorm:"autoCreateTime" json:"created_at"`
}

type MPermission struct {
	ID             int32     `gorm:"primaryKey;autoIncrement" json:"id"`
	PermissionName string    `gorm:"type:varchar(100);unique;not null" json:"permission_name"`
	CreatedAt      time.Time `gorm:"autoCreateTime" json:"created_at"`
}

type MRolePermission struct {
	RoleID       int32 `gorm:"primaryKey" json:"role_id"`
	PermissionID int32 `gorm:"primaryKey" json:"permission_id"`
}

type MUser struct {
	ID        uint      `gorm:"primaryKey;autoIncrement" json:"id"`
	Username  string    `gorm:"type:varchar(50);unique;not null" json:"username"`
	Password  string    `gorm:"type:varchar(255);not null" json:"-"`
	RoleID    uint      `gorm:"not null" json:"role_id"`
	CreatedAt time.Time `gorm:"autoCreateTime" json:"created_at"`
	UpdatedAt time.Time `gorm:"autoUpdateTime" json:"updated_at"`

	Role MRole `gorm:"foreignKey:RoleID;references:ID" json:"role"`
}

// Ensure table names match SQL scheme exactly
func (MKelompokProspens) TableName() string { return "m_kelompok_prospens" }
func (MStatusBpjs) TableName() string { return "m_status_bpjs" }
func (MStatusBrilife) TableName() string { return "m_status_brilife" }
func (MAlasanNonaktifBpjs) TableName() string { return "m_alasan_nonaktif_bpjs" }
func (MAlasanNonaktifBrilife) TableName() string { return "m_alasan_nonaktif_brilife" }
func (MKelasProspens) TableName() string { return "m_kelas_prospens" }

func (TPeserta) TableName() string { return "t_peserta" }

func (TPendaftaranManfaat) TableName() string { return "t_pendaftaran_manfaat" }
func (TApprovalLog) TableName() string { return "t_approval_log" }
func (TPembayaranPremi) TableName() string { return "t_pembayaran_premi" }
func (TRefundPremi) TableName() string { return "t_refund_premi" }

func (TAuditTrail) TableName() string { return "t_audit_trail" }

func (MUser) TableName() string           { return "m_user" }
func (MRole) TableName() string           { return "m_role" }
func (MPermission) TableName() string     { return "m_permission" }
func (MRolePermission) TableName() string { return "m_role_permission" }

func (TPesertaStaging) TableName() string { return "t_peserta_staging" }
func (TIuranUpload) TableName() string { return "t_iuran_upload" }
func (TIuranUploadDetail) TableName() string { return "t_iuran_upload_detail" }
func (TIuranDiscrepancy) TableName() string { return "t_iuran_discrepancy" }
func (TIuranPenampungan) TableName() string { return "t_iuran_penampungan" }
func (TPhkUpload) TableName() string { return "t_phk_upload" }
func (TPhkUploadDetail) TableName() string { return "t_phk_upload_detail" }

func (TIuranInput) TableName() string { return "t_iuran_input" }
func (TIuranDetail) TableName() string { return "t_iuran_detail" }
func (TNotification) TableName() string { return "t_notification" }

func (TInvestmentProposal) TableName() string    { return "t_investment_proposal" }
func (TInvestmentTransaction) TableName() string { return "t_investment_transaction" }
