/*
@Author:        hogan.chen@ymail.com
@Create Date:   2020-11-11
*/

package pkg_01

import (
	"fmt"
	"time"
)

func init() {
	fmt.Println("In init function of pkg_01 package...")
}

func PrintHello() {
	fmt.Println("Hello from pkg_01 package...")
}

func main() {
	start := time.Now()
	fmt.Printf("Program start execution at %s\n\n", start.Format("2006-01-02 15:04:05"))

	fmt.Println("In main function of pkg_01 package...")

	elapsed := time.Since(start)
	fmt.Printf("\nProgram end execution at %s\n", time.Now().Format("2006-01-02 15:04:05"))
	fmt.Printf("Total elapsed time: %s\n", elapsed)
}
