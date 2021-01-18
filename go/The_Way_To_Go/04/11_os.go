/*
@Author:        hogan.chen@ymail.com
@Create Date:   2020-11-11
*/

package main

import (
	"os"
	"fmt"
	"time"
	"runtime"
)

func main() {
	start := time.Now()
	fmt.Printf("Program start execution at %s\n\n", start.Format("2006-01-02 15:04:05"))

	var (
		HOME = os.Getenv("HOME")
		USER = os.Getenv("USER")
		GOROOT = os.Getenv("GOROOT")
		PATH = os.Getenv("PATH")
	)

	fmt.Printf("Home: %v, User: %v, GoRoot: %v, Path: %v\n", HOME, USER, GOROOT, PATH)
	fmt.Printf("The operation system is: %v\n", runtime.GOOS)

	elapsed := time.Since(start)
	fmt.Printf("\nProgram end execution at %s\n", time.Now().Format("2006-01-02 15:04:05"))
	fmt.Printf("Total elapsed time: %s\n", elapsed)
}
