/*
@Author:        hogan.chen@ymail.com
@Create Date:   2020-11-11
*/

package main

import (
	"fmt"
	"time"
)

// 展开slice
// https://melonshell.github.io/2020/03/27/go11_3dot/
func main() {
	start := time.Now()
	fmt.Printf("Start execution at %s\n", start.Format("2006-01-02 15:04:05"))

	stooges := []string{"Moe", "Larry", "Curly"}
	lang := []string{"php", "golang", "java"}
	// 如上例中将names打散展开，还有种情况就是通过append合并两个slice
	stooges = append(stooges, lang...)
	fmt.Printf("stooges: %v\n", stooges)

	elapsed := time.Since(start)
	fmt.Printf("\nTotal elapsed time: %s\n", elapsed)
}
