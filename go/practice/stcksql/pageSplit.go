/*
@Author:        hogan.chen@ymail.com
@Create Date:   2020-11-11
*/

package main

import (
	"fmt"
	"time"
)

func pageSplit() {
	const pageSize = 100
	const itemNum = 4567

	pageNum := (itemNum - 1) / pageSize + 1

	startIndex := 0
	endIndex := 0

	for i := 0; i < pageNum; i++ {
		startIndex = i * pageSize
		if i < pageNum - 1 {
			endIndex = (i + 1) * pageSize
		} else {
			endIndex = itemNum
		}

		fmt.Printf("page: %d, startIndex: %d, endIndex: %d\n", i, startIndex, endIndex)
	}
}

func averageSplit() {
	const pageNum = 50
	const itemNum = 4567

	startIndex := 0
	endIndex := 0

	pageSize := itemNum / pageNum
	modValue := itemNum % pageNum

	for i := 0; i < pageNum; i++ {
		if i < modValue {
			startIndex = i * (pageSize + 1)
			endIndex = (i + 1) * (pageSize + 1)
		} else {
			startIndex = i * pageSize + modValue
			endIndex = (i + 1) * pageSize + modValue
		}

		fmt.Printf("page: %d, startIndex: %d, endIndex: %d, pageItemNum: %d\n",
			i, startIndex, endIndex, endIndex - startIndex)
	}
}

func main() {
	start := time.Now()
	fmt.Printf("Program start execution at %s\n\n", start.Format("2006-01-02 15:04:05"))

	pageSplit()
	fmt.Printf("\n\n################################################################################\n\n")
	averageSplit()

	elapsed := time.Since(start)
	fmt.Printf("\nProgram end execution at %s\n", time.Now().Format("2006-01-02 15:04:05"))
	fmt.Printf("Total elapsed time: %s\n", elapsed)
}
