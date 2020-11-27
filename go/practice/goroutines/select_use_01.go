/*
@Author:        hogan.chen@ymail.com
@Create Date:   2020-11-11
*/

package main

import (
	"fmt"
	"time"
)

/*
select 语句使一个 Go 程可以等待多个通信操作。
select 会阻塞到某个分支可以继续执行为止，这时就会执行该分支。当多个分支都准备好时会随机选择一个执行。

select 的出现是为了解决当我们有多个 channels 时，选择使用那个 channels
https://learnku.com/articles/25219
*/
func main() {
	start := time.Now()
	fmt.Printf("Program start execution at %s\n\n", start.Format("2006-01-02 15:04:05"))

	ch := make(chan int)
    ch1 := make(chan int)
    o := make(chan bool)
    go func (){
        for {
            select { // ch/ch1 通道都没有数据的时候 select 会阻塞起来等待数据，两个同时有数据时候随机选一个
            case v := <- ch:
                fmt.Println("v:", v)
            case a := <- ch1:
                fmt.Println("a:", a)
            case <- time.After(2*time.Second):  // 如果前面的所有通道都阻塞了2s就执行这里
                fmt.Println("time out")
                o <- true
                break
            }
        }
    }()
    // 模拟向通道写数据
    go func () {
        for i := 0; i < 5; i++ {
            ch <- i + 1
        }
    }()

    go func () {
        for i := 0; i < 5; i++ {
            ch1 <- i + 1
        }
    }()
    // 会阻塞起来等待 o 中的数据
    <- o

	elapsed := time.Since(start)
	fmt.Printf("\nTotal elapsed time: %s\n", elapsed)
}
