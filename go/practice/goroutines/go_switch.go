/*
@Author:        hogan.chen@ymail.com
@Create Date:   2020-11-11
*/

package main

import (
	"fmt"
	"time"
)

func goroutine(msg *string, ch chan bool) {
	time.Sleep(5 * time.Second)
	*msg = "hello world"
	close(ch)
}

func main() {
	start := time.Now()
	fmt.Printf("Program start execution at %s\n\n", start.Format("2006-01-02 15:04:05"))

	var done = make(chan bool)
	var msg string

	// var ch = make(chan int)

	// go func() {
	// 	ch <- 0
	// 	ch <- 1
	// 	ch <- 2
	// 	close(ch)
	// }()

	// go func() {
	// 	for i := 10; i >= 0; i-- {
	// 		ch <- i
	// 	}
	// 	close(ch)
	// }()

	/*
	带缓冲区的chan，可以在同一个go程中往chan中放数据，而阻塞的chan，则必须在别的go程中往chan放数据
	即chan满发生阻塞时，如果没有go程从chan中获取数据，则出现fatal error: all goroutines are asleep - deadlock!

	若在关闭Channel后继续从中接收数据,接收者就会收到该Channel返回的零值。因此在这个例子中,用close(c)关闭管道代替done <-false依然能保证该程序产生相同的行为。
	对于从无缓冲Channel进行的接收,发生在对该Channel进行的发送完成之前。

	对于带缓冲的Channel,对于Channel的第K个接收完成操作发生在第K+C个发送操作完成之前,其中C是Channel的缓存大小。
	如果将C设置为0自然就对应无缓存的Channel,也即使第K个接收完成在第K个发送完成之前。
	因为无缓存的Channel只能同步发1个,也就简化为前面无缓存Channel的规则:对于从无缓冲Channel进行的接收,发生在对该Channel进行的发送完成之前。
	*/
	var ch = make(chan int, 10)
	for i := 5; i >= 0; i-- {
		ch <- i
	}
	ch <- 0
	ch <- 1
	ch <- 2
	close(ch)

	for i := 0; i < 10; i++ {
		xx := <- ch
		fmt.Printf("xx: %v\n", xx)
	}

	go goroutine(&msg, done)
	fmt.Printf("At %v, after goroutine...\n", time.Now())

	switch {
	// case start.Hour() < 12:
	// 	fmt.Println("Good morning!")
	// case start.Hour() < 17:
	// 	fmt.Println("Good afternoon.")
	case 0 == <- ch:
		fmt.Printf("At %v, in ch chan...\n", time.Now())
	case false == <- done:
		fmt.Printf("At %v, in done chan...\n", time.Now())
	default:
		fmt.Printf("At %v, in default...\n", time.Now())
	}
	fmt.Printf("At %v, after switch condition...\n", time.Now())
	fmt.Printf("At %v, msg: %v\n", time.Now(), msg)

	elapsed := time.Since(start)
	fmt.Printf("\nProgram end execution at %s\n", time.Now().Format("2006-01-02 15:04:05"))
	fmt.Printf("Total elapsed time: %s\n", elapsed)
}
