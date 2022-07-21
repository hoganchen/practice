/*
@Author:        hogan.chen@ymail.com
@Create Date:   2020-11-11
*/

package main

import (
	"fmt"
	"time"
)

type gridTradeInfoStruct struct {
	tradeFund      float64
	totalTradeFund float64
}

// https://www.cnblogs.com/snowInPluto/p/7477365.html
func main() {
	start := time.Now()
	fmt.Printf("Program start execution at %s\n\n", start.Format("2006-01-02 15:04:05"))

	var gridTradeInfoStructMap = map[string]gridTradeInfoStruct{}
	if _, ok := gridTradeInfoStructMap["000001"]; !ok {
		gridTradeInfoStructMap["000001"] = gridTradeInfoStruct{10000, 10000}
	}

	fmt.Printf("gridTradeInfoStructMap[\"000001\"]: %v\n", gridTradeInfoStructMap["000001"])
	fmt.Printf("gridTradeInfoStructMap[\"000001\"].tradeFund: %v\n", gridTradeInfoStructMap["000001"].tradeFund)
	fmt.Printf("gridTradeInfoStructMap[\"000001\"].totalTradeFund: %v\n", gridTradeInfoStructMap["000001"].totalTradeFund)

	var holdCodeSliceMap = map[string][]gridTradeInfoStruct{}
	if _, ok := holdCodeSliceMap["000001"]; !ok {
		holdCodeSliceMap["000001"] = []gridTradeInfoStruct{}
	}

	holdCodeSliceMap["000001"] = append(holdCodeSliceMap["000001"], gridTradeInfoStruct{10000, 10000})
	holdCodeSliceMap["000001"] = append(holdCodeSliceMap["000001"], gridTradeInfoStruct{20000, 20000})
	fmt.Printf("holdCodeSliceMap[\"000001\"]: %v\n", holdCodeSliceMap["000001"])

	elapsed := time.Since(start)
	fmt.Printf("\nProgram end execution at %s\n", time.Now().Format("2006-01-02 15:04:05"))
	fmt.Printf("Total elapsed time: %s\n", elapsed)
}
