/*
@Author:        hogan.chen@ymail.com
@Create Date:   2020-11-11
*/

package main

import (
	"fmt"
	"math/rand"
	"time"
)

func hello(ch chan int) {
	fmt.Printf("I am in hello goroutine...\n")
	time.Sleep(time.Duration(rand.Intn(5) + 5) * time.Second)
	ch <- 1
}

func main() {
	start := time.Now()
	fmt.Printf("Program start execution at %s\n\n", start.Format("2006-01-02 15:04:05"))

	ch := make(chan int, 10)
	go hello(ch)
	<- ch
	fmt.Printf("I am in main goroutine...\n")

	elapsed := time.Since(start)
	fmt.Printf("\nProgram end execution at %s\n", time.Now().Format("2006-01-02 15:04:05"))
	fmt.Printf("Total elapsed time: %s\n", elapsed)
}

