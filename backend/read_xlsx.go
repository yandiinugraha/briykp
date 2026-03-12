package main

import (
	"fmt"
	"github.com/xuri/excelize/v2"
)

func main() {
	f, err := excelize.OpenFile("../THT_November 2025.xlsx")
	if err != nil {
		fmt.Println("Error:", err)
		return
	}
	defer f.Close()

	sheet := f.GetSheetName(0)
	rows, err := f.GetRows(sheet)
	if len(rows) > 0 {
		fmt.Println("Headers THT:", rows[4]) // usually headers are on row 4 or something
	}
	if len(rows) > 5 {
		fmt.Println("Row 5:", rows[5])
	}
}
