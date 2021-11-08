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

	defer func() {
		if err := recover(); err != nil {
			fmt.Println("4. error:", err)
		}
	}()

	defer func() {
		if err := recover(); err != nil {
			fmt.Println("3. 再次panic")
			panic(err)
		}
	}()

	defer func() {
		if err := recover(); err != nil {
			fmt.Println("2. 再次panic")
			panic(err)
		}
	}()

	defer func() {
		if err := recover(); err != nil {
			fmt.Println("1. 再次panic")
			panic(err)
		}
	}()

	fmt.Println("start")
	panic("Big Error")
	fmt.Println("stop")

	elapsed := time.Since(start)
	fmt.Printf("\nProgram end execution at %s\n", time.Now().Format("2006-01-02 15:04:05"))
	fmt.Printf("Total elapsed time: %s\n", elapsed)
}
