/*
@Author:        hogan.chen@ymail.com
@Create Date:   2020-11-11
*/

package main

import (
	"fmt"
	"time"
)

func aGoroutine(msg *string, ch chan bool) {
	*msg = "hello world"
	close(ch)
}

func main() {
	start := time.Now()
	fmt.Printf("Program start execution at %s\n\n", start.Format("2006-01-02 15:04:05"))

	var done = make(chan bool)
	var msg string
	b := false

	go aGoroutine(&msg, done)
	// <- done
	for {
		select {
		case <- done:
			b = true
			// break
		}

		if b {
			break
		}
	}
	fmt.Printf("msg: %v\n", msg)

	elapsed := time.Since(start)
	fmt.Printf("\nProgram end execution at %s\n", time.Now().Format("2006-01-02 15:04:05"))
	fmt.Printf("Total elapsed time: %s\n", elapsed)
}
