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
	
	newModels := `
type TIuranInput struct {
	ID             string    ` + "`" + `gorm:"type:varchar(50);primaryKey" json:"id"` + "`" + `
	PeriodeBulan   int       ` + "`" + `gorm:"type:int;not null" json:"periode_bulan"` + "`" + `
	PeriodeTahun   int       ` + "`" + `gorm:"type:int;not null" json:"periode_tahun"` + "`" + `
	StatusApproval string    ` + "`" + `gorm:"type:varchar(30);default:'DRAFT'" json:"status_approval"` + "`" + `
	TotalPeserta   int       ` + "`" + `gorm:"type:int;default:0" json:"total_peserta"` + "`" + `
	TotalIuran     float64   ` + "`" + `gorm:"type:decimal(15,2);default:0" json:"total_iuran"` + "`" + `
	MakerID        string    ` + "`" + `gorm:"type:varchar(50)" json:"maker_id"` + "`" + `
	CheckerID      *string   ` + "`" + `gorm:"type:varchar(50)" json:"checker_id"` + "`" + `
	SignerID       *string   ` + "`" + `gorm:"type:varchar(50)" json:"signer_id"` + "`" + `
	CreatedAt      time.Time ` + "`" + `gorm:"autoCreateTime" json:"created_at"` + "`" + `
	UpdatedAt      time.Time ` + "`" + `gorm:"autoUpdateTime" json:"updated_at"` + "`" + `
}

type TIuranDetail struct {
	ID            uint      ` + "`" + `gorm:"primaryKey;autoIncrement" json:"id"` + "`" + `
	IuranInputID  string    ` + "`" + `gorm:"type:varchar(50);not null" json:"iuran_input_id"` + "`" + `
	IDPeserta     string    ` + "`" + `gorm:"type:varchar(50);not null" json:"id_peserta"` + "`" + `
	NominalPemberi float64   ` + "`" + `gorm:"type:decimal(15,2);default:0" json:"nominal_pemberi"` + "`" + `
	NominalPeserta float64   ` + "`" + `gorm:"type:decimal(15,2);default:0" json:"nominal_peserta"` + "`" + `
	TotalIuran    float64   ` + "`" + `gorm:"type:decimal(15,2);default:0" json:"total_iuran"` + "`" + `
	CreatedAt     time.Time ` + "`" + `gorm:"autoCreateTime" json:"created_at"` + "`" + `
}
`

	content = strings.Replace(content, "type TIuranUpload struct {", newModels+"\ntype TIuranUpload struct {", 1)

	names := `
func (TIuranInput) TableName() string { return "t_iuran_input" }
func (TIuranDetail) TableName() string { return "t_iuran_detail" }
`
	content = content + names

	ioutil.WriteFile("models/models.go", []byte(content), 0644)
	fmt.Println("Done rebuilding models.go part 2")
}
