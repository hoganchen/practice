/*
@Author:        hogan.chen@ymail.com
@Create Date:   2020-11-11
*/

package main

import (
	"fmt"
	"time"
	"sync"
)

var l sync.Mutex
var shareCnt uint64 = 0

func incrShareCnt() {
	for i := 0; i < 100000; i++ {
		shareCnt++
	}
}

func putDataToChannel(ch chan int) {
	for i := 0; i < 100000; i++ {
		ch <- 1
	}
}

// go协程中涉及对共享变量的处理，只有加锁才能解决，虽然通道保证了数据的个数，但是存在前一个协程正在处理+1，后一个协程也完成从通道中取出数据，也开始处理+1，从而竞态
func getDataToChannel(ch chan int) {
	for {
		data, ok := <-ch

		if ok {
			l.Lock()
			shareCnt = shareCnt + uint64(data)
			l.Unlock()
		} else {
			break
		}
	}
}

func main() {
	start := time.Now()
	fmt.Printf("Program start execution at %s\n\n", start.Format("2006-01-02 15:04:05"))

	fmt.Printf("shareCnt: %v\n", shareCnt)
	for i := 0; i < 2; i++ {
		go incrShareCnt()
	}

	time.Sleep(2 * time.Second)
	fmt.Printf("shareCnt: %v\n", shareCnt)

	shareCnt = 0
	ch := make(chan int, 100)

	for i := 0; i < 10; i++ {
		go getDataToChannel(ch)
	}

	for i := 0; i < 10; i++ {
		go putDataToChannel(ch)
	}

	time.Sleep(5 * time.Second)
	close(ch)

	time.Sleep(1 * time.Second)
	fmt.Printf("shareCnt: %v\n", shareCnt)

	elapsed := time.Since(start)
	fmt.Printf("\nTotal elapsed time: %s\n", elapsed)
}
