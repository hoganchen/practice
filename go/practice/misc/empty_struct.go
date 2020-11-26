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
	fmt.Printf("Start execution at %s\n", start.Format("2006-01-02 15:04:05"))

	xx := struct{}{}
	fmt.Printf("xx: %v\n", xx)

	yy := struct{
		x int
		y int}{x:1, y:2}
	fmt.Printf("yy: %v\n", yy)

	zz := struct{x int; y int; z int}{x:1, y:2, z:3}
	fmt.Printf("yy: %v\n", zz)

	elapsed := time.Since(start)
	fmt.Printf("\nTotal elapsed time: %s\n", elapsed)
}
