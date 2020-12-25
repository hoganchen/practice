/*
@Author:        hogan.chen@ymail.com
@Create Date:   2020-11-11
*/

package main

import (
	"fmt"
	"time"
)

func go_chan_01() {
	fmt.Printf("\n############################## go_chan_01 ##############################\n")

	done := make(chan int) // 非缓存的管道
	go func() {
		fmt.Println("go_chan_01: 你好, 世界")
		<- done
	}()

	done <- 1
}

func go_chan_02() {
	fmt.Printf("\n############################## go_chan_02 ##############################\n")

	done := make(chan int, 5) // 带缓存的管道
	go func() {
		fmt.Println("go_chan_02: 你好, 世界")
		<- done
	}()

	done <- 1
}

func go_chan_03() {
	fmt.Printf("\n############################## go_chan_03 ##############################\n")

	done := make(chan int, 5) // 带缓存的管道
	go func() {
		fmt.Println("go_chan_03: 你好, 世界")
		done <- 1
	}()

	<- done
}

func go_chan_04() {
	fmt.Printf("\n############################## go_chan_04 ##############################\n")

	done := make(chan int, 5) // 带缓存的管道
	go func() {
		fmt.Println("go_chan_04: 你好, 世界")
		time.Sleep(2 * time.Second)
		done <- 1
	}()

	// 若在关闭Channel后继续从中接收数据,接收者就会收到该Channel返回的零值。而且不会被阻塞
	close(done)
	<- done
}

func main() {
	start := time.Now()
	fmt.Printf("Program start execution at %s\n\n", start.Format("2006-01-02 15:04:05"))

	go_chan_01()
	go_chan_02()
	go_chan_03()
	go_chan_04()

	// 在go_chan_04()中，由于在main goroutine中close了通道，而go程中还准备往通道中发送数据，所以如下time sleep执行后，会出现panic: send on closed channel错误
	time.Sleep(3 * time.Second)

	elapsed := time.Since(start)
	fmt.Printf("\nProgram end execution at %s\n", time.Now().Format("2006-01-02 15:04:05"))
	fmt.Printf("Total elapsed time: %s\n", elapsed)
}
