/*
@Author:        hogan.chen@ymail.com
@Create Date:   2020-11-11
*/

package main

import (
	"fmt"
	"time"
)

func worker(done chan bool) {
	time.Sleep(time.Second)
	// 通知任务已完成
	fmt.Printf("worker: send done signal...\n")
	done <- true
}

// https://colobu.com/2016/04/14/Golang-Channels/
func main() {
	start := time.Now()
	fmt.Printf("Program start execution at %s\n\n", start.Format("2006-01-02 15:04:05"))

	done := make(chan bool, 10)
	go worker(done)
	// 等待任务完成
	<-done
	fmt.Printf("main: received done signal...\n")

	elapsed := time.Since(start)
	fmt.Printf("\nProgram end execution at %s\n", time.Now().Format("2006-01-02 15:04:05"))
	fmt.Printf("Total elapsed time: %s\n", elapsed)
}
