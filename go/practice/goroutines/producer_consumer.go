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
