package main

import (
	"fmt"
	"github.com/xuri/excelize/v2"
)

func main() {
	f, err := excelize.OpenFile("../THT_November 2025.xlsx")
	if err != nil {
		fmt.Println("Error opening THT:", err)
		return
	}
	defer f.Close()

	sheet := f.GetSheetName(0)
	rows, _ := f.GetRows(sheet)
	for i, row := range rows {
		if i > 5 {
			break
		}
		fmt.Printf("Row %d: %v\n", i, row)
	}
}
