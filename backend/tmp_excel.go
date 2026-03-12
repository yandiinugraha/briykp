package main

import (
	"encoding/json"
	"fmt"
	"log"

	"github.com/xuri/excelize/v2"
)

func main() {
	f, err := excelize.OpenFile("../dt_peserta 02012024.xlsx")
	if err != nil {
		log.Fatal(err)
	}
	defer f.Close()

	sheets := f.GetSheetList()
	if len(sheets) == 0 {
		log.Fatal("No sheets found")
	}

	sheetName := sheets[0]
	rows, err := f.GetRows(sheetName)
	if err != nil {
		log.Fatal(err)
	}

	// Just print first 5 rows
	limit := 5
	if len(rows) < limit {
		limit = len(rows)
	}

	out, _ := json.MarshalIndent(rows[:limit], "", "  ")
	fmt.Println(string(out))
}
