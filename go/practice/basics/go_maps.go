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

	var mm map[int]string
	fmt.Printf("&mm = %p, type(mm) = %T, mm = %p, mm = %v, mm == nil? %v\n", &mm, mm, mm, mm, nil == mm)

	m := make(map[int]string)
	fmt.Printf("&m = %p, type(m) = %T, m = %p, m = %v\n", &m, m, m, m)

	m[1] = "aa"
	m[2] = "bb"
	m[3] = "cc"
	fmt.Printf("&m = %p, type(m) = %T, m = %p, m = %v\n", &m, m, m, m)

	delete(m, 3)
	fmt.Printf("&m = %p, type(m) = %T, m = %p, m = %v\n", &m, m, m, m)

	elapsed := time.Since(start)
	fmt.Printf("\nProgram end execution at %s\n", time.Now().Format("2006-01-02 15:04:05"))
	fmt.Printf("Total elapsed time: %s\n", elapsed)
}
