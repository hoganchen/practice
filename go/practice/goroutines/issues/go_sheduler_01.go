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

/*
https://txiner.top/post/%E4%B8%80%E9%81%93%E9%97%AE%E9%A2%98%E5%BC%95%E5%8F%91%E7%9A%84golang%E8%B0%83%E5%BA%A6/

看着似乎没有什么问题：main被阻塞，直到协程中写入数据。

协程中写入数据的同时会打印结果，然后阻塞，等main中写入数据。

可是，我们运行这段函数10000次，看看结果

中间偶尔出现了这么几个结果

1a2bc3d4e5

从goroutine的实现来讲，多个goroutine执行中，有可能是并行的，而题目又要求顺序打印，即可使用锁来实现，参考schedulerExample实现
*/
func scheduler() {
	ch1 := make(chan int)
	ch2 := make(chan string)
	str := [5]string{"a", "b", "c", "d", "e"}
	go func() {
		for i := 0; i < 5; i++ {
			ch1 <- i
			fmt.Print(i + 1)
			<-ch2
		}
	}()

	for _, v := range str {
		<-ch1
		fmt.Print(v)
		ch2 <- v
	}
}

/*
在g1中，先加锁，然后再往ch1中发送数据，如果这时还没有完成向ch1中发送数据，则g2从ch1中获取数据会被阻塞，如果完成向ch1中发送数据，
则g2会被阻塞在获取锁，等g1完成打印并释放锁，并阻塞在从ch2中获取数据，这时g2才能获取锁，完成打印，释放锁，并向ch2中发送数据。

这时g2又会被阻塞在从ch1中获取数据，而g1从ch2中获取到数据，又开始下一轮的循环。

值得注意的是，在使用锁或者chan的时候，必须要保证至少一个goroutine在运行，
不然会得到"fatal error: all goroutines are asleep - deadlock!"错误
*/
func schedulerExample() {
	var mux sync.Mutex
	ch1 := make(chan int)
	ch2 := make(chan string)
	str := [5]string{"a", "b", "c", "d", "e"}
	// g1
	go func() {
		for i := 0; i < 5; i++ {
			mux.Lock()
			ch1 <- i
			fmt.Print(i + 1)
			mux.Unlock()
			<-ch2
		}
	}()

	// g2
	for _, v := range str {
		<-ch1
		mux.Lock()
		fmt.Print(v)
		mux.Unlock()
		ch2 <- v
	}
}

func main() {
	start := time.Now()
	fmt.Printf("Program start execution at %s\n\n", start.Format("2006-01-02 15:04:05"))

	for i := 0; i < 100000; i++ {
		// scheduler()
		schedulerExample()
		fmt.Println()
	}

	elapsed := time.Since(start)
	fmt.Printf("\nProgram end execution at %s\n", time.Now().Format("2006-01-02 15:04:05"))
	fmt.Printf("Total elapsed time: %s\n", elapsed)
}
