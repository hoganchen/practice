/*
@Author:        hogan.chen@ymail.com
@Create Date:   2020-11-11
*/

package main

import (
	"fmt"
	"time"
)

func longestCommonPrefix(strs []string) string {
	commonPrefix := ""

	if 0 == len(strs) {
		return ""
	}

	for i := 0; i < len(strs[0]); i++ {
		commonPrefix = strs[0][:i + 1]
		fmt.Printf("commonPrefix: %v\n", commonPrefix)

		for j := 1; j < len(strs); j++ {
			if i == len(strs[j]) || commonPrefix[i] != strs[j][i] {
				return commonPrefix[:len(commonPrefix) - 1]
			}
		}
	}

	return strs[0]
}

func main() {
	start := time.Now()
	fmt.Printf("Program start execution at %s\n\n", start.Format("2006-01-02 15:04:05"))

	strs := []string{"flower", "flow", "flight"}
	commonPrefix := longestCommonPrefix(strs)
	fmt.Printf("commonPrefix: %v\n", commonPrefix)

	newStrs := []string{"flower", "gflow", "hflight"}
	commonPrefix = longestCommonPrefix(newStrs)
	fmt.Printf("commonPrefix: %v\n", commonPrefix)

	elapsed := time.Since(start)
	fmt.Printf("\nProgram end execution at %s\n", time.Now().Format("2006-01-02 15:04:05"))
	fmt.Printf("Total elapsed time: %s\n", elapsed)
}
