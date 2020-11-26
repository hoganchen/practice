package main

import (
    "fmt"
    "time"
)

var ch = make(chan int)

func task(i int){
    fmt.Println("task...", i)
    time.Sleep(time.Second)
    <- ch
}

/*
利用无缓冲的信道 channel 协程之间通讯，其阻塞等待功能实现等待一组协程结束，保证了其 goroutine 按照顺序执行
http://www.pangulab.com/post/84cc3ac0.html
*/
func main(){
    for i:= 0;i<10;i++{
        go task(i)
        ch <- i
    }
    fmt.Println("over")
}