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

type chan_info struct {
	id int
	wt int
}

func chan_use_01(id int, ch chan int) {
	fmt.Printf("&id: %v, id: %v, msg: hello world\n", &id, id)
	wait_time := rand.Intn(5) + 5
	time.Sleep(time.Duration(wait_time) * time.Second)
	ch <- id
}

// ch *chan int，ch是一个指针，指向类型为int的通道
func chan_use_02(id int, ch *chan int) {
	fmt.Printf("&id: %v, id: %v, msg: hello world\n", &id, id)
	wait_time := rand.Intn(5) + 5
	time.Sleep(time.Duration(wait_time) * time.Second)
	*ch <- id
}

// ch chan *int，ch是变量，指向类型为*int的通道
func chan_use_03(id int, ch chan *int) {
	fmt.Printf("&id: %v, id: %v, msg: hello world\n", &id, id)
	wait_time := rand.Intn(5) + 5
	time.Sleep(time.Duration(wait_time) * time.Second)
	ch <- &id
}

func chan_use_04(id int, ch chan chan_info) {
	wait_time := rand.Intn(5) + 5
	c_info := chan_info{id, wait_time}
	fmt.Printf("&c_info: %p, id: %v, msg: hello world\n", &c_info, id)
	time.Sleep(time.Duration(wait_time) * time.Second)
	ch <- c_info
}

func chan_use_05(id int, ch *chan chan_info) {
	wait_time := rand.Intn(5) + 5
	c_info := chan_info{id, wait_time}
	fmt.Printf("&c_info: %p, id: %v, msg: hello world\n", &c_info, id)
	time.Sleep(time.Duration(wait_time) * time.Second)
	*ch <- c_info
}

func chan_use_06(id int, ch chan *chan_info) {
	wait_time := rand.Intn(5) + 5
	c_info := chan_info{id, wait_time}
	fmt.Printf("&c_info: %p, id: %v, msg: hello world\n", &c_info, id)
	time.Sleep(time.Duration(wait_time) * time.Second)
	ch <- &c_info
}

// 结构体变量的赋值可参考gopl.io/ch04/10_struct.go的用法
func main() {
	start := time.Now()
	fmt.Printf("Program start execution at %s\n\n", start.Format("2006-01-02 15:04:05"))

	fmt.Printf("\n############################## chan_use_01 ##############################\n")
	ch_01 := make(chan int, 10)
	for i := 0; i < cap(ch_01); i++ {
		go chan_use_01(i, ch_01)
	}

	for i := 0; i < cap(ch_01); i++ {
		// fmt.Printf("<- ch_01: %v\n", <- ch_01)
		p := <- ch_01
		fmt.Printf("&p: %v, *p: %v\n", &p, p)
	}

	fmt.Printf("\n############################## chan_use_02 ##############################\n")
	ch_02 := make(chan int, 10)
	for i := 0; i < cap(ch_02); i++ {
		go chan_use_02(i, &ch_02)
	}

	for i := 0; i < cap(ch_02); i++ {
		// fmt.Printf("<- ch_02: %v\n", <- ch_02)
		p := <- ch_02
		fmt.Printf("&p: %v, *p: %v\n", &p, p)
	}

	fmt.Printf("\n############################## chan_use_03 ##############################\n")
	ch_03 := make(chan *int, 10)
	for i := 0; i < cap(ch_03); i++ {
		go chan_use_03(i, ch_03)
	}

	for i := 0; i < cap(ch_03); i++ {
		p := <- ch_03
		fmt.Printf("p: %v, *p: %v\n", p, *p)
	}

	fmt.Printf("\n############################## chan_use_04 ##############################\n")
	ch_04 := make(chan chan_info, 10)
	for i := 0; i < cap(ch_04); i++ {
		go chan_use_04(i, ch_04)
	}

	for i := 0; i < cap(ch_04); i++ {
		// fmt.Printf("<- ch_04: %v\n", <- ch_04)
		p := <- ch_04
		fmt.Printf("&p: %p, p: %v\n", &p, p)
	}

	fmt.Printf("\n############################## chan_use_05 ##############################\n")
	ch_05 := make(chan chan_info, 10)
	for i := 0; i < cap(ch_05); i++ {
		go chan_use_05(i, &ch_05)
	}

	for i := 0; i < cap(ch_05); i++ {
		// fmt.Printf("<- ch_05: %v\n", <- ch_05)
		p := <- ch_05
		fmt.Printf("&p: %p, p: %v\n", &p, p)
	}

	fmt.Printf("\n############################## chan_use_06 ##############################\n")
	ch_06 := make(chan *chan_info, 10)
	fmt.Printf("type(ch_06): %T\n", ch_06)
	for i := 0; i < cap(ch_06); i++ {
		go chan_use_06(i, ch_06)
	}

	for i := 0; i < cap(ch_06); i++ {
		// fmt.Printf("<- ch_06: %v\n", <- ch_06)
		p := <- ch_06
		fmt.Printf("p: %p, *p: %v\n", p, *p)
	}

	elapsed := time.Since(start)
	fmt.Printf("\nProgram end execution at %s\n", time.Now().Format("2006-01-02 15:04:05"))
	fmt.Printf("Total elapsed time: %s\n", elapsed)
}
