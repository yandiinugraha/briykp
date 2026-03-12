package main

import (
	"fmt"
	"io/ioutil"
	"strings"
)

func main() {
	b, err := ioutil.ReadFile("models/models.go")
	if err != nil {
		fmt.Println("Error reading", err)
		return
	}
	content := string(b)
	
	newPeserta := `type TPeserta struct {
	IDPeserta        string     ` + "`" + `gorm:"type:varchar(50);primaryKey" json:"id_peserta"` + "`" + `
	NamaPeserta      string     ` + "`" + `gorm:"type:varchar(150);not null" json:"nama_peserta"` + "`" + `
	NikBri           string     ` + "`" + `gorm:"type:varchar(50);unique;not null" json:"nik_bri"` + "`" + `
	Pernr            string     ` + "`" + `gorm:"type:varchar(50);index" json:"pernr"` + "`" + `
	TglPhk           *time.Time ` + "`" + `gorm:"type:date" json:"tgl_phk"` + "`" + `
	JenisMutasi      string     ` + "`" + `gorm:"type:varchar(50)" json:"jenis_mutasi"` + "`" + `
	TglMutasi        *time.Time ` + "`" + `gorm:"type:date" json:"tgl_mutasi"` + "`" + `
	IDKelompok       *uint      ` + "`" + `gorm:"index" json:"id_kelompok"` + "`" + `
	IDKelas          *uint      ` + "`" + `gorm:"index" json:"id_kelas"` + "`" + `
	TmtPertanggungan *time.Time ` + "`" + `gorm:"type:date" json:"tmt_pertanggungan"` + "`" + `
	NoKartuBrilife   string     ` + "`" + `gorm:"type:varchar(50)" json:"no_kartu_brilife"` + "`" + `
	StatusBpjsID     *uint      ` + "`" + `gorm:"index" json:"status_bpjs_id"` + "`" + `
	StatusBrilifeID  *uint      ` + "`" + `gorm:"index" json:"status_brilife_id"` + "`" + `

	NoKK         *string    ` + "`" + `gorm:"type:varchar(50)" json:"no_kk"` + "`" + `
	Nik          *string    ` + "`" + `gorm:"type:varchar(50)" json:"nik"` + "`" + `
	TempatLahir  *string    ` + "`" + `gorm:"type:varchar(100)" json:"tempat_lahir"` + "`" + `
	TglLahir     *time.Time ` + "`" + `gorm:"type:date" json:"tgl_lahir"` + "`" + `
	JnsKel       *string    ` + "`" + `gorm:"type:varchar(10)" json:"jns_kel"` + "`" + `
	StKawin      *string    ` + "`" + `gorm:"type:varchar(50)" json:"st_kawin"` + "`" + `
	Alamat       *string    ` + "`" + `gorm:"type:text" json:"alamat"` + "`" + `
	Rt           *string    ` + "`" + `gorm:"type:varchar(10)" json:"rt"` + "`" + `
	Rw           *string    ` + "`" + `gorm:"type:varchar(10)" json:"rw"` + "`" + `
	KdPos        *string    ` + "`" + `gorm:"type:varchar(10)" json:"kd_pos"` + "`" + `
	KdKec        *string    ` + "`" + `gorm:"type:varchar(50)" json:"kd_kec"` + "`" + `
	AlKec        *string    ` + "`" + `gorm:"type:varchar(100)" json:"al_kec"` + "`" + `
	KdDesa       *string    ` + "`" + `gorm:"type:varchar(50)" json:"kd_desa"` + "`" + `
	AlDesa       *string    ` + "`" + `gorm:"type:varchar(100)" json:"al_desa"` + "`" + `
	NoTelp       *string    ` + "`" + `gorm:"type:varchar(20)" json:"no_telp"` + "`" + `
	Email        *string    ` + "`" + `gorm:"type:varchar(100)" json:"email"` + "`" + `
	StWarga      *string    ` + "`" + `gorm:"type:varchar(50)" json:"st_warga"` + "`" + `
	Npwp         *string    ` + "`" + `gorm:"type:varchar(50)" json:"npwp"` + "`" + `
	NoPaspor     *string    ` + "`" + `gorm:"type:varchar(50)" json:"no_paspor"` + "`" + `
	FaskesOpsi   *string    ` + "`" + `gorm:"type:varchar(50)" json:"faskes_opsi"` + "`" + `
	NmFaskes1    *string    ` + "`" + `gorm:"type:varchar(150)" json:"nm_faskes1"` + "`" + `
	NmFasgigi    *string    ` + "`" + `gorm:"type:varchar(150)" json:"nm_fasgigi"` + "`" + `
	TambahInfo   *string    ` + "`" + `gorm:"type:text" json:"tambah_info"` + "`" + `

	CreatedAt        time.Time  ` + "`" + `gorm:"autoCreateTime" json:"created_at"` + "`" + `
	UpdatedAt        time.Time  ` + "`" + `gorm:"autoUpdateTime" json:"updated_at"` + "`" + `

	Kelompok      MKelompokProspens  ` + "`" + `gorm:"foreignKey:IDKelompok;references:ID;constraint:OnDelete:SET NULL;" json:"kelompok"` + "`" + `
	Kelas         MKelasProspens     ` + "`" + `gorm:"foreignKey:IDKelas;references:ID;constraint:OnDelete:SET NULL;" json:"kelas"` + "`" + `
	StatusBpjs    MStatusBpjs        ` + "`" + `gorm:"foreignKey:StatusBpjsID;references:ID;constraint:OnDelete:SET NULL;" json:"status_bpjs"` + "`" + `
	StatusBrilife MStatusBrilife     ` + "`" + `gorm:"foreignKey:StatusBrilifeID;references:ID;constraint:OnDelete:SET NULL;" json:"status_brilife"` + "`" + `
}`

	oldPeserta := `type TPeserta struct {
	IDPeserta        string            ` + "`" + `gorm:"type:varchar(50);primaryKey" json:"id_peserta"` + "`" + `
	NamaPeserta      string            ` + "`" + `gorm:"type:varchar(150);not null" json:"nama_peserta"` + "`" + `
	NikBri           string            ` + "`" + `gorm:"type:varchar(50);unique;not null" json:"nik_bri"` + "`" + `
	TglPhk           *time.Time        ` + "`" + `gorm:"type:date" json:"tgl_phk"` + "`" + `
	JenisMutasi      string            ` + "`" + `gorm:"type:varchar(50)" json:"jenis_mutasi"` + "`" + `
	TglMutasi        *time.Time        ` + "`" + `gorm:"type:date" json:"tgl_mutasi"` + "`" + `
	IDKelompok       *uint             ` + "`" + `gorm:"index" json:"id_kelompok"` + "`" + `
	IDKelas          *uint             ` + "`" + `gorm:"index" json:"id_kelas"` + "`" + `
	TmtPertanggungan *time.Time        ` + "`" + `gorm:"type:date" json:"tmt_pertanggungan"` + "`" + `
	NoKartuBrilife   string            ` + "`" + `gorm:"type:varchar(50)" json:"no_kartu_brilife"` + "`" + `
	StatusBpjsID     *uint             ` + "`" + `gorm:"index" json:"status_bpjs_id"` + "`" + `
	StatusBrilifeID  *uint             ` + "`" + `gorm:"index" json:"status_brilife_id"` + "`" + `
	CreatedAt        time.Time         ` + "`" + `gorm:"autoCreateTime" json:"created_at"` + "`" + `
	UpdatedAt        time.Time         ` + "`" + `gorm:"autoUpdateTime" json:"updated_at"` + "`" + `

	Kelompok      MKelompokProspens  ` + "`" + `gorm:"foreignKey:IDKelompok;references:ID;constraint:OnDelete:SET NULL;" json:"kelompok"` + "`" + `
	Kelas         MKelasProspens     ` + "`" + `gorm:"foreignKey:IDKelas;references:ID;constraint:OnDelete:SET NULL;" json:"kelas"` + "`" + `
	StatusBpjs    MStatusBpjs        ` + "`" + `gorm:"foreignKey:StatusBpjsID;references:ID;constraint:OnDelete:SET NULL;" json:"status_bpjs"` + "`" + `
	StatusBrilife MStatusBrilife     ` + "`" + `gorm:"foreignKey:StatusBrilifeID;references:ID;constraint:OnDelete:SET NULL;" json:"status_brilife"` + "`" + `
}`

	content = strings.Replace(content, oldPeserta, newPeserta, 1)

	newModels := `

// -------------------------------------------------------------------------
// 3. UPLOAD & DISCREPANCY TABLES
// -------------------------------------------------------------------------

type TIuranUpload struct {
	ID             uint      ` + "`" + `gorm:"primaryKey;autoIncrement" json:"id"` + "`" + `
	Bulan          int       ` + "`" + `gorm:"not null" json:"bulan"` + "`" + `
	Tahun          int       ` + "`" + `gorm:"not null" json:"tahun"` + "`" + `
	JenisIuran     string    ` + "`" + `gorm:"type:varchar(30);not null" json:"jenis_iuran"` + "`" + `
	FileName       string    ` + "`" + `gorm:"type:varchar(255);not null" json:"file_name"` + "`" + `
	TotalRows      int       ` + "`" + `gorm:"default:0" json:"total_rows"` + "`" + `
	TotalNominal   float64   ` + "`" + `gorm:"type:decimal(18,2);default:0" json:"total_nominal"` + "`" + `
	UploadedBy     string    ` + "`" + `gorm:"type:varchar(50);not null" json:"uploaded_by"` + "`" + `
	StatusApproval string    ` + "`" + `gorm:"type:varchar(30);default:'UPLOADED'" json:"status_approval"` + "`" + `
	CheckerID      *string   ` + "`" + `gorm:"type:varchar(50)" json:"checker_id"` + "`" + `
	SignerID       *string   ` + "`" + `gorm:"type:varchar(50)" json:"signer_id"` + "`" + `
	CatatanChecker *string   ` + "`" + `gorm:"type:text" json:"catatan_checker"` + "`" + `
	CatatanSigner  *string   ` + "`" + `gorm:"type:text" json:"catatan_signer"` + "`" + `
	CreatedAt      time.Time ` + "`" + `gorm:"autoCreateTime" json:"created_at"` + "`" + `
	UpdatedAt      time.Time ` + "`" + `gorm:"autoUpdateTime" json:"updated_at"` + "`" + `
}

type TIuranUploadDetail struct {
	ID           uint      ` + "`" + `gorm:"primaryKey;autoIncrement" json:"id"` + "`" + `
	UploadID     uint      ` + "`" + `gorm:"not null;index" json:"upload_id"` + "`" + `
	NikBri       string    ` + "`" + `gorm:"type:varchar(50);not null" json:"nik_bri"` + "`" + `
	Pernr        string    ` + "`" + `gorm:"type:varchar(50)" json:"pernr"` + "`" + `
	NamaPeserta  string    ` + "`" + `gorm:"type:varchar(150)" json:"nama_peserta"` + "`" + `
	NominalIuran float64   ` + "`" + `gorm:"type:decimal(15,2);not null" json:"nominal_iuran"` + "`" + `
	Keterangan   string    ` + "`" + `gorm:"type:text" json:"keterangan"` + "`" + `
	RawData      *string   ` + "`" + `gorm:"type:longtext" json:"raw_data"` + "`" + `
	CreatedAt    time.Time ` + "`" + `gorm:"autoCreateTime" json:"created_at"` + "`" + `
}

type TIuranDiscrepancy struct {
	ID              uint      ` + "`" + `gorm:"primaryKey;autoIncrement" json:"id"` + "`" + `
	Bulan           int       ` + "`" + `gorm:"not null" json:"bulan"` + "`" + `
	Tahun           int       ` + "`" + `gorm:"not null" json:"tahun"` + "`" + `
	NikBri          string    ` + "`" + `gorm:"type:varchar(50);not null" json:"nik_bri"` + "`" + `
	Pernr           string    ` + "`" + `gorm:"type:varchar(50)" json:"pernr"` + "`" + `
	NamaPeserta     string    ` + "`" + `gorm:"type:varchar(200)" json:"nama_peserta"` + "`" + `
	JenisSelisih    string    ` + "`" + `gorm:"type:varchar(50)" json:"jenis_selisih"` + "`" + `
	NominalTHT      float64   ` + "`" + `gorm:"type:decimal(15,2);default:0" json:"nominal_tht"` + "`" + `
	NominalProspens float64   ` + "`" + `gorm:"type:decimal(15,2);default:0" json:"nominal_prospens"` + "`" + `
	CreatedAt       time.Time ` + "`" + `gorm:"autoCreateTime" json:"created_at"` + "`" + `
}

type TIuranPenampungan struct {
	ID           uint      ` + "`" + `gorm:"primaryKey;autoIncrement" json:"id"` + "`" + `
	Bulan        int       ` + "`" + `gorm:"not null" json:"bulan"` + "`" + `
	Tahun        int       ` + "`" + `gorm:"not null" json:"tahun"` + "`" + `
	NikBri       string    ` + "`" + `gorm:"type:varchar(50);not null" json:"nik_bri"` + "`" + `
	NamaPeserta  string    ` + "`" + `gorm:"type:varchar(200)" json:"nama_peserta"` + "`" + `
	NominalIuran float64   ` + "`" + `gorm:"type:decimal(15,2);not null" json:"nominal_iuran"` + "`" + `
	Keterangan   string    ` + "`" + `gorm:"type:text" json:"keterangan"` + "`" + `
	CreatedAt    time.Time ` + "`" + `gorm:"autoCreateTime" json:"created_at"` + "`" + `
}

type TPhkUpload struct {
	ID             uint      ` + "`" + `gorm:"primaryKey;autoIncrement" json:"id"` + "`" + `
	Bulan          int       ` + "`" + `gorm:"not null" json:"bulan"` + "`" + `
	Tahun          int       ` + "`" + `gorm:"not null" json:"tahun"` + "`" + `
	FileName       string    ` + "`" + `gorm:"type:varchar(255);not null" json:"file_name"` + "`" + `
	TotalRows      int       ` + "`" + `gorm:"default:0" json:"total_rows"` + "`" + `
	UploadedBy     string    ` + "`" + `gorm:"type:varchar(50);not null" json:"uploaded_by"` + "`" + `
	StatusApproval string    ` + "`" + `gorm:"type:varchar(30);default:'UPLOADED'" json:"status_approval"` + "`" + `
	CheckerID      *string   ` + "`" + `gorm:"type:varchar(50)" json:"checker_id"` + "`" + `
	SignerID       *string   ` + "`" + `gorm:"type:varchar(50)" json:"signer_id"` + "`" + `
	CatatanChecker *string   ` + "`" + `gorm:"type:text" json:"catatan_checker"` + "`" + `
	CatatanSigner  *string   ` + "`" + `gorm:"type:text" json:"catatan_signer"` + "`" + `
	CreatedAt      time.Time ` + "`" + `gorm:"autoCreateTime" json:"created_at"` + "`" + `
	UpdatedAt      time.Time ` + "`" + `gorm:"autoUpdateTime" json:"updated_at"` + "`" + `
}

type TPhkUploadDetail struct {
	ID               uint      ` + "`" + `gorm:"primaryKey;autoIncrement" json:"id"` + "`" + `
	UploadID         uint      ` + "`" + `gorm:"not null;index" json:"upload_id"` + "`" + `
	NikBri           string    ` + "`" + `gorm:"type:varchar(50)" json:"nik_bri"` + "`" + `
	Pernr            string    ` + "`" + `gorm:"type:varchar(50)" json:"pernr"` + "`" + `
	NamaPeserta      string    ` + "`" + `gorm:"type:varchar(150)" json:"nama_peserta"` + "`" + `
	UpahPokok        float64   ` + "`" + `gorm:"type:decimal(15,2)" json:"upah_pokok"` + "`" + `
	JG               string    ` + "`" + `gorm:"type:varchar(50)" json:"jg"` + "`" + `
	PersonnelArea    string    ` + "`" + `gorm:"type:varchar(50)" json:"personnel_area"` + "`" + `
	PADesc           string    ` + "`" + `gorm:"type:varchar(150)" json:"pa_desc"` + "`" + `
	PersonnelSubarea string    ` + "`" + `gorm:"type:varchar(50)" json:"personnel_subarea"` + "`" + `
	PSADesc          string    ` + "`" + `gorm:"type:varchar(150)" json:"psa_desc"` + "`" + `
	RawData          *string   ` + "`" + `gorm:"type:longtext" json:"raw_data"` + "`" + `
	CreatedAt        time.Time ` + "`" + `gorm:"autoCreateTime" json:"created_at"` + "`" + `
}
`

	content = strings.Replace(content, "// -------------------------------------------------------------------------\n// 3. TRANSAKSI & WORKFLOW TABLES\n// -------------------------------------------------------------------------", newModels+"\n// -------------------------------------------------------------------------\n// 4. TRANSAKSI & WORKFLOW TABLES\n// -------------------------------------------------------------------------", 1)

	content = strings.Replace(content, "// 4. AUDIT TRAIL TABLE", "// 5. AUDIT TRAIL TABLE", 1)
	content = strings.Replace(content, "// 5. NOTIFICATION TABLE", "// 6. NOTIFICATION TABLE", 1)
	content = strings.Replace(content, "// 6. AUTH & RBAC TABLES", "// 7. AUTH & RBAC TABLES", 1)

	names := `
func (TIuranUpload) TableName() string { return "t_iuran_upload" }
func (TIuranUploadDetail) TableName() string { return "t_iuran_upload_detail" }
func (TIuranDiscrepancy) TableName() string { return "t_iuran_discrepancy" }
func (TIuranPenampungan) TableName() string { return "t_iuran_penampungan" }
func (TPhkUpload) TableName() string { return "t_phk_upload" }
func (TPhkUploadDetail) TableName() string { return "t_phk_upload_detail" }
`
	content = content + names

	ioutil.WriteFile("models/models.go", []byte(content), 0644)
	fmt.Println("Done rebuilding models.go")
}
