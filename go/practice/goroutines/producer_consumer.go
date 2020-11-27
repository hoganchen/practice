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

const (
	CONSUMER_NUM = 5
	PRODUCER_NUM = 20
)

var producer_wg sync.WaitGroup
var consumer_wg sync.WaitGroup

type Port struct {id int; value int}

func producer(id int, ch chan Port) {
	for i := 0; i < 20; i++ {
		ch <- Port{id, i}
		time.Sleep(time.Duration(rand.Intn(5)) * time.Second)
	}

	producer_wg.Done()
}

func consumer(id int, ch chan Port) {
	for {
		 value, ok := <-ch

		 if ok {
			 fmt.Printf("consumer id: %v, producer id: %v, value: %v\n", id, value.id, value.value)
		 } else {
			 break
		 }
	}
	consumer_wg.Done()
}

/*
WaitGroup 内部实现了一个计数器，用来记录未完成的操作个数，它提供了三个方法：

Add() 用来添加计数
Done() 用来在操作结束时调用，使计数减一 【我不会告诉你 Done() 方法的实现其实就是调用 Add(-1)】
Wait() 用来等待所有的操作结束，即计数变为 0，该函数会在计数不为 0 时等待，在计数为 0 时立即返回

https://juejin.cn/post/6883077325169098765
*/
func main() {
	start := time.Now()
	fmt.Printf("Start execution at %s\n", start.Format("2006-01-02 15:04:05"))

	ch := make(chan Port, 10)

	for i := 0; i < PRODUCER_NUM; i++ {
		producer_wg.Add(1)
		go producer(i, ch)
	}

	for i := 0; i < CONSUMER_NUM; i++ {
		consumer_wg.Add(1)
		go consumer(i, ch)
	}

	producer_wg.Wait()
	close(ch)

	consumer_wg.Wait()

	elapsed := time.Since(start)
	fmt.Printf("\nTotal elapsed time: %s\n", elapsed)
}
