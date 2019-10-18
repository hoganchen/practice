package main

import (
	"fmt"
	"time"
	"math/rand"
)

/*
select 语句
select 语句使一个 Go 程可以等待多个通信操作。

select 会阻塞到某个分支可以继续执行为止，这时就会执行该分支。当多个分支都准备好时会随机选择一个执行。
*/
func fibonacci(c, quit chan int) {
	x, y := 0, 1
	for {
		select {
		case c <- x:
			x, y = y, x+y
		case <-quit:
			fmt.Println("quit")
			return
		}
	}
}

func fibonacci_print(iter int, c, quit chan int) {
	rand.Seed(time.Now().UnixNano())
	rand_int := rand.Intn(iter)

	for i := 0; i < iter; i++ {
		fmt.Println(<-c)

		if i == rand_int {
			quit <- 0
		}
	}
}

/*
select 语句

select 语句使一个 Go 程可以等待多个通信操作。

select 会阻塞到某个分支可以继续执行为止，这时就会执行该分支。当多个分支都准备好时会随机选择一个执行。
*/
func main() {
	const iter = 20

	c := make(chan int)
	quit := make(chan int)
	go func() {
		for i := 0; i < iter; i++ {
			fmt.Println(<-c)
		}
		quit <- 0
	}()
	fibonacci(c, quit)

	fmt.Println("################################################################################")

	go fibonacci_print(iter, c, quit)
	fibonacci(c, quit)
}
