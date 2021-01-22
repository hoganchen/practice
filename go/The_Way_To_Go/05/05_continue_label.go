/*
@Author:        hogan.chen@ymail.com
@Create Date:   2020-11-11
*/

package main

import (
	"fmt"
	"time"
)

func main() {
	start := time.Now()
	fmt.Printf("Program start execution at %s\n\n", start.Format("2006-01-02 15:04:05"))

	LABEL:
	for i := 0; i <= 5; i++ {
		for j := 0; j <= 5; j++ {
			if 3 == i && 2 == j {
				continue LABEL
			}
			fmt.Printf("i = %d, j = %d\n", i, j)
		}
	}

	elapsed := time.Since(start)
	fmt.Printf("\nProgram end execution at %s\n", time.Now().Format("2006-01-02 15:04:05"))
	fmt.Printf("Total elapsed time: %s\n", elapsed)
}
