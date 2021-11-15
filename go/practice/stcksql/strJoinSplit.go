/*
@Author:        hogan.chen@ymail.com
@Create Date:   2020-11-11
*/

package main

import (
	"fmt"
	"strings"
	"time"
)

func stringJoin() {
	fieldMap := map[string]string{
		"f2": "price", "f3": "p_change", "f5": "volume", "f6": "amount", "f9": "dynamic_pe",
		"f12": "code", "f14": "name", "f20": "totalMarketCap", "f21": "marketCap", "f23": "pb",
		"f24": "60days_p_change", "f25": "year_p_change", "f26": "timeToMarket", "f36": "per_holdings",
		"f37": "roe", "f38": "totals", "f39": "outstanding", "f40": "revenue", "f41": "revenueRatio",
		"f45": "profit", "f46": "profitRatio", "f47": "undp", "f48": "perundp", "f49": "gpr",
		"f50": "totalAssets", "f51": "liquidAssets", "f52": "fixedAssets", "f53": "intangibleAssets",
		"f54": "totalLiability", "f55": "currentLiability", "f56": "noncurrentLiability",
		"f57": "debtAssetRatio", "f58": "shareholdersEquity", "f59": "equityRatio", "f60": "reserved",
		"f61": "reservedPerShare", "f100": "industry", "f102": "area", "f109": "5days_p_change",
		"f110": "20days_p_change", "f112": "esp", "f113": "bvps", "f114": "static_pe",
		"f115": "rolling_pe", "f129": "npr", "f160": "10days_p_change",
		"f377": "52weeks_low", "f378": "52weeks_high"}

	var fieldKeySlice []string
	var fieldValueSlice []string
	fieldMapLen := len(fieldMap)

	for key, value := range fieldMap {
		fieldKeySlice = append(fieldKeySlice, key)
		fieldValueSlice = append(fieldValueSlice, value)
	}

	//join是将字符串切片转换为字符串
	fieldKeyStr := strings.Join(fieldKeySlice, ",")
	fieldValueStr := strings.Join(fieldValueSlice, ",")

	fmt.Printf("fieldMapLen: %d\n", fieldMapLen)
	fmt.Printf("fieldKeyStr: %s\n", fieldKeyStr)
	fmt.Printf("fieldValueStr: %s\n", fieldValueStr)
}

func stringSplit() {
	itemStr := "2021-11-12,110.00,108.37,110.48,107.90,20073,218595091.00,2.33,-2.03,-2.24,0.44"
	itemSlice := strings.Split(itemStr, ",") //split是将字符串转换为字符串切片
	columnNameSlice := []string{"date", "open", "close", "high", "low", "volume", "amount"}

	fmt.Printf("itemSlice: %v\n", itemSlice)
	fmt.Printf("itemSlice[:7]: %v\n", itemSlice[:7])
	fmt.Printf("itemStr: %v\n", strings.Join(itemSlice[:len(columnNameSlice)], ","))
}

func stringAddQuote() {
	fieldStr := "2021-07-23,0.977,0.961,0.978,0.956,303394,29199789.000"
	fieldSlice := strings.Split(fieldStr, ",")
	fieldNewStr := strings.Join(fieldSlice, ", ")
	commaSep := "\"" + strings.Join(fieldSlice, "\", \"") + "\""

	fmt.Printf("fieldNewStr: %v\ncommaSep: %v\n", fieldNewStr, commaSep)
}

func main() {
	start := time.Now()
	fmt.Printf("Program start execution at %s\n\n", start.Format("2006-01-02 15:04:05"))

	stringJoin()
	fmt.Printf("\n\n################################################################################\n\n")
	stringSplit()
	fmt.Printf("\n\n################################################################################\n\n")
	stringAddQuote()

	elapsed := time.Since(start)
	fmt.Printf("\nProgram end execution at %s\n", time.Now().Format("2006-01-02 15:04:05"))
	fmt.Printf("Total elapsed time: %s\n", elapsed)
}
