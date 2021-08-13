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

	/*

	*/
	fmt.Println("PID:", os.Getpid())  // Process ID
	fmt.Println("CPU core number:", runtime.NumCPU())  // CPU number
	time.Sleep(1000 * time.Second)

	elapsed := time.Since(start)
	fmt.Printf("\nProgram end execution at %s\n", time.Now().Format("2006-01-02 15:04:05"))
	fmt.Printf("Total elapsed time: %s\n", elapsed)
}
