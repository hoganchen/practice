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

// sync.Mutex作为函数参数，会有问题，原因待查
var l sync.Mutex
var wg sync.WaitGroup
var incr_wg sync.WaitGroup
var shareCnt uint64 = 0

// sync.Mutex作为函数参数，因为go的函数是值传递，所以传递指针就可以了
func increaseShareCntWithParameter(lock *sync.Mutex) {
	for i := 0; i < 100000; i++ {
		lock.Lock()
		shareCnt++
		lock.Unlock()
	}

	wg.Done()
}

func increaseShareCnt() {
	for i := 0; i < 100000; i++ {
		// l.Lock()
		shareCnt++
		// l.Unlock()
	}

	wg.Done()
}

func increaseShareCntWithLock() {
	for i := 0; i < 100000; i++ {
		l.Lock()
		shareCnt++
		l.Unlock()
	}

	wg.Done()
}

func addDataToChannel(ch chan int) {
	for i := 0; i < 100000; i++ {
		ch <- 1
	}

	wg.Done()
}

func increaseShareCntWithChannel(ch chan int) {
	for {
		data, ok := <-ch

		if ok {
			l.Lock()
			shareCnt += uint64(data)
			l.Unlock()
		} else {
			break
		}
	}

	incr_wg.Done()
}

func main() {
	start := time.Now()
	fmt.Printf("Program start execution at %s\n\n", start.Format("2006-01-02 15:04:05"))

	var ll sync.Mutex
	fmt.Printf("\n############################## Increase With Lock As Paramter ##############################\n")
	start_time := time.Now()
	shareCnt = 0
	fmt.Printf("shareCnt: %v\n", shareCnt)
	for i := 0; i < 10; i++ {
		go increaseShareCntWithParameter(&ll)
		wg.Add(1)
	}

	// time.Sleep(2 * time.Second)
	wg.Wait()
	fmt.Printf("shareCnt: %v, elapsed time: %s\n\n", shareCnt, time.Since(start_time))

	fmt.Printf("\n############################## Increase Without Lock ##############################\n")
	start_time = time.Now()
	shareCnt = 0
	fmt.Printf("shareCnt: %v\n", shareCnt)
	for i := 0; i < 10; i++ {
		go increaseShareCnt()
		wg.Add(1)
	}

	// time.Sleep(2 * time.Second)
	wg.Wait()
	fmt.Printf("shareCnt: %v, elapsed time: %s\n\n", shareCnt, time.Since(start_time))

	fmt.Printf("\n############################## Increase With Lock ##############################\n")
	start_time = time.Now()
	shareCnt = 0
	fmt.Printf("shareCnt: %v\n", shareCnt)
	for i := 0; i < 10; i++ {
		go increaseShareCntWithLock()
		wg.Add(1)
	}

	// time.Sleep(2 * time.Second)
	wg.Wait()
	fmt.Printf("shareCnt: %v, elapsed time: %s\n\n", shareCnt, time.Since(start_time))

	fmt.Printf("\n############################## Increase With Channel(10 producer/consumer) ##############################\n")
	start_time = time.Now()
	shareCnt = 0
	fmt.Printf("shareCnt: %v\n", shareCnt)
	ch := make(chan int, 100)
	for i := 0; i < 10; i++ {
		go addDataToChannel(ch)
		wg.Add(1)
	}

	for i := 0; i < 10; i++ {
		go increaseShareCntWithChannel(ch)
		incr_wg.Add(1)
	}

	wg.Wait()
	close(ch)
	incr_wg.Wait()
	fmt.Printf("shareCnt: %v, elapsed time: %s\n\n", shareCnt, time.Since(start_time))

	fmt.Printf("\n############################## Increase With Channel(1 producer/consumer) ##############################\n")
	start_time = time.Now()
	shareCnt = 0
	fmt.Printf("shareCnt: %v\n", shareCnt)
	ch = make(chan int, 100)
	for i := 0; i < 10; i++ {
		go addDataToChannel(ch)
		wg.Add(1)
	}

	for i := 0; i < 1; i++ {
		go increaseShareCntWithChannel(ch)
		incr_wg.Add(1)
	}

	wg.Wait()
	close(ch)
	incr_wg.Wait()
	fmt.Printf("shareCnt: %v, elapsed time: %s\n\n", shareCnt, time.Since(start_time))

	elapsed := time.Since(start)
	fmt.Printf("\nProgram end execution at %s\n", time.Now().Format("2006-01-02 15:04:05"))
	fmt.Printf("Total elapsed time: %s\n", elapsed)
}
