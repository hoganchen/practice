package main

import (
	"fmt"
	"time"
)

var ch = make(chan int, 10)

func task(i int) {
	fmt.Println("task...", i)
	time.Sleep(time.Second)
    ch <- i
}

/*
利用缓冲信道 channel 协程之间通讯，其阻塞等待功能实现等待一组协程结束，不能保证其 goroutine 按照顺序执行
http://www.pangulab.com/post/84cc3ac0.html
*/
func main() {
    for i := 0; i < 10; i++ {
        go task(i)
    }
    for i := 0; i < 10; i++ {
        <- ch
    }
    fmt.Println("over")
}