/*
@Author:        hogan.chen@ymail.com
@Create Date:   2020-11-11
*/

package main

import (
	"C"
	"fmt"
	"time"
)

/*
extern int helloFromC();
*/

func HelloFromGo() {
	fmt.Printf("Hello from Go!\n")
}

func main() {
	start := time.Now()
	fmt.Printf("Program start execution at %s\n\n", start.Format("2006-01-02 15:04:05"))

	C.helloFromC()

	elapsed := time.Since(start)
	fmt.Printf("\nTotal elapsed time: %s\n", elapsed)
}
