/*
@Author:        hogan.chen@ymail.com
@Create Date:   2020-11-11
*/

package main

import (
	"fmt"
	"time"
)


func mapUsage() {
	const (
		codeDataTable      = "code_data"
		emCodeDataTable    = "em_code_data"
		etfCodeDataTable   = "etf_data"

		basicAllDataTable  = "basics_all_data"

		etfQfqDayDataTable   = "etf_qfq_day_data"
		etfQfqWeekDataTable  = "etf_qfq_week_data"
		etfQfqMonthDataTable = "etf_qfq_month_data"

		kQfqDayDataTable   = "k_qfq_day_data"
		kQfqWeekDataTable  = "k_qfq_week_data"
		kQfqMonthDataTable = "k_qfq_month_data"

		updateStatusTable  = "update_status_data"

		//sina服务器接受的参数值为20, 40, 80, 100，参数值超过100，也最多返回100条数据
		sinaStockNumPerPage = 80
		emStockNumPerPage   = 1000
		emETFNumPerPage     = 1000

		maxKLineNumPerPage  = 1000

		maxGoroutinePoolNum = 50
	)

	var (
		//stock k type map
		kTypeTableMap = map[string]map[string]string{
			"qfq": {"D": kQfqDayDataTable, "W": kQfqWeekDataTable, "M": kQfqMonthDataTable}}
		//etf k type map
		etfTypeTableMap = map[string]map[string]string{
			"qfq": {"D": etfQfqDayDataTable, "W": etfQfqWeekDataTable, "M": etfQfqMonthDataTable}}
		//stock && etf k type map
		typeTableMap = map[string]map[string]map[string]string{
			"etf": {"qfq": {"D": etfQfqDayDataTable, "W": etfQfqWeekDataTable, "M": etfQfqMonthDataTable}},
			"stock": {"qfq": {"D": kQfqDayDataTable, "W": kQfqWeekDataTable, "M": kQfqMonthDataTable}}}
	)

	for fqType, _ := range etfTypeTableMap {
		for kType, _ := range etfTypeTableMap[fqType] {
			fmt.Printf("fqType: %v, kType: %v, etfTypeTableMap[fqType][kType]: %v\n", fqType, kType, etfTypeTableMap[fqType][kType])
		}
	}

	fmt.Printf("\n\n################################################################################\n\n")

	for fqType, _ := range kTypeTableMap {
		for kType, _ := range kTypeTableMap[fqType] {
			fmt.Printf("fqType: %v, kType: %v, kTypeTableMap[fqType][kType]: %v\n", fqType, kType, kTypeTableMap[fqType][kType])
		}
	}

	fmt.Printf("\n\n################################################################################\n\n")

	for kind, _ := range typeTableMap {
		for fqType, _ := range typeTableMap[kind] {
			for kType, _ := range typeTableMap[kind][fqType] {
				fmt.Printf("kind: %v, fqType: %v, kType: %v, typeTableMap[kind][fqType][kType]: %v\n",
					kind, fqType, kType, typeTableMap[kind][fqType][kType])
			}
		}
	}
}

func main() {
	start := time.Now()
	fmt.Printf("Program start execution at %s\n\n", start.Format("2006-01-02 15:04:05"))

	mapUsage()

	elapsed := time.Since(start)
	fmt.Printf("\nProgram end execution at %s\n", time.Now().Format("2006-01-02 15:04:05"))
	fmt.Printf("Total elapsed time: %s\n", elapsed)
}
