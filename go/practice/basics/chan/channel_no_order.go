/*
@Author:        hogan.chen@ymail.com
@Create Date:   2020-11-11
*/

package main

import (
	"fmt"
	"time"
	"sync"
	"math/rand"
)

// handle 处理请求，耗时随机模拟
func handleWithChan(wg *sync.WaitGroup, a int, outs chan int) {
	go func() {
		// time.Sleep(time.Duration(rand.Intn(3)) * time.Second)
		time.Sleep(time.Duration(rand.Intn(5)) * time.Microsecond)
		outs <- a
		wg.Done()
	}()
}

func noOrderTest() {
	reqs := []int{1, 2, 3, 4, 5, 6, 7, 8, 9}

	// 存放结果的channel的channel
	outs := make(chan int, len(reqs))
	var wg sync.WaitGroup
	wg.Add(len(reqs))

	for _, x := range reqs {
		handleWithChan(&wg, x, outs)
	}

	go func() {
		wg.Wait()
		close(outs)
	}()

	// 读取结果，结果有序
	for o := range outs {
		fmt.Printf("%v ", o)
	}
}

func main() {
	start := time.Now()
	fmt.Printf("Program start execution at %s\n\n", start.Format("2006-01-02 15:04:05"))

	for i := 0; i < 10000; i++ {
		noOrderTest()
		fmt.Println()
	}

	elapsed := time.Since(start)
	fmt.Printf("\nProgram end execution at %s\n", time.Now().Format("2006-01-02 15:04:05"))
	fmt.Printf("Total elapsed time: %s\n", elapsed)
}
