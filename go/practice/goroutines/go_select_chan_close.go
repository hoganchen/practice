/*
@Author:        hogan.chen@ymail.com
@Create Date:   2020-11-11
*/

package main

import (
	"fmt"
	"time"
	"math/rand"
)

type ChanInfo struct {
	id int
	value int
}

func send_data_to_chan(id int, ch chan ChanInfo) {
	for i := 0; i < 10; i++ {
		ch <- ChanInfo{id, i}
		time.Sleep(time.Duration(rand.Intn(5)) * time.Second)
	}

	close(ch)
}

func recv_data_from_chan_by_select(ch1, ch2 chan ChanInfo) {
	var ok1 = true
	var ok2 = true
	var c1, c2 ChanInfo

	for {
		select {
		case c1, ok1 = <- ch1:
			if ok1 {
				fmt.Printf("c1.id = %v, c1.value = %v, ok1 = %v\n", c1.id, c1.value, ok1)
			}
		case c2, ok2 = <- ch2:
			if ok2 {
				fmt.Printf("c2.id = %v, c2.value = %v, ok2 = %v\n", c2.id, c2.value, ok2)
			}
		}

		// fmt.Printf("ok1 = %v, ok2 = %v\n", ok1, ok2)
		if false == ok1 && false == ok2 {
			fmt.Printf("ok1 = %v, ok2 = %v\n", ok1, ok2)
			break
		}
	}
}

func recv_data_from_chan_by_range(ch chan ChanInfo) {
	for v := range ch {
		fmt.Printf("v.id = %v, v.value = %v\n", v.id, v.value)
	}
}

func main() {
	start := time.Now()
	fmt.Printf("Program start execution at %s\n\n", start.Format("2006-01-02 15:04:05"))

	ch1 := make(chan ChanInfo, 5)
	ch2 := make(chan ChanInfo, 5)

	go send_data_to_chan(1, ch1)
	go send_data_to_chan(2, ch2)

	recv_data_from_chan_by_select(ch1, ch2)

	ch01 := make(chan ChanInfo, 5)
	ch02 := make(chan ChanInfo, 5)

	go send_data_to_chan(1, ch01)
	go send_data_to_chan(2, ch02)

	recv_data_from_chan_by_range(ch01)
	recv_data_from_chan_by_range(ch02)

	elapsed := time.Since(start)
	fmt.Printf("\nProgram end execution at %s\n", time.Now().Format("2006-01-02 15:04:05"))
	fmt.Printf("Total elapsed time: %s\n", elapsed)
}
