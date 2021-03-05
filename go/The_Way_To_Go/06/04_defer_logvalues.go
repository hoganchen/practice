/*
@Author:        hogan.chen@ymail.com
@Create Date:   2020-11-11
*/

package main

import (
	"io"
	"fmt"
	"log"
	"time"
)

func deferFunc(s string) (n int, err error) {
	defer func() {
		log.Printf("deferFunc(%q) = %d, %v", s, n, err)
	}()

	return 7, io.EOF
}

func main() {
	start := time.Now()
	fmt.Printf("Program start execution at %s\n\n", start.Format("2006-01-02 15:04:05"))

	deferFunc("golang")

	elapsed := time.Since(start)
	fmt.Printf("\nProgram end execution at %s\n", time.Now().Format("2006-01-02 15:04:05"))
	fmt.Printf("Total elapsed time: %s\n", elapsed)
}
