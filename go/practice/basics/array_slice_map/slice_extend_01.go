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

	s := []int{5}
	fmt.Printf("s address: %p, s: %v, len(s): %v, cap(s): %v\n", s, s, len(s), cap(s))

	s = append(s, 7)
	fmt.Printf("s address: %p, s: %v, len(s): %v, cap(s): %v\n", s, s, len(s), cap(s))

	s = append(s, 9)
	fmt.Printf("s address: %p, s: %v, len(s): %v, cap(s): %v\n", s, s, len(s), cap(s))

	x := append(s, 11)
	fmt.Printf("s address: %p, s: %v, len(s): %v, cap(s): %v\n", s, s, len(s), cap(s))
	fmt.Printf("x address: %p, x: %v, len(x): %v, cap(x): %v\n", x, x, len(x), cap(x))

	y := append(s, 12)
	fmt.Printf("s address: %p, s: %v, len(s): %v, cap(s): %v\n", s, s, len(s), cap(s))
	fmt.Printf("x address: %p, x: %v, len(x): %v, cap(x): %v\n", x, x, len(x), cap(x))
	fmt.Printf("y address: %p, y: %v, len(y): %v, cap(y): %v\n", y, y, len(y), cap(y))

	fmt.Printf("s: %v, x: %v, y: %v\n", s, x, y)

	elapsed := time.Since(start)
	fmt.Printf("\nProgram end execution at %s\n", time.Now().Format("2006-01-02 15:04:05"))
	fmt.Printf("Total elapsed time: %s\n", elapsed)
}
