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

/*
select语句选择一组可能的send操作和receive操作去处理。它类似switch,但是只是用来处理通讯(communication)操作。
它的case可以是send语句，也可以是receive语句，亦或者default。

receive语句可以将值赋值给一个或者两个变量。它必须是一个receive操作。

最多允许有一个default case,它可以放在case列表的任何位置，尽管我们大部分会将它放在最后。

如果有同时多个case去处理,比如同时有多个channel可以接收数据，那么Go会伪随机的选择一个case处理(pseudo-random)。
如果没有case需要处理，则会选择default去处理，如果default case存在的情况下。
如果没有default case，则select语句会阻塞，直到某个case需要处理。

需要注意的是，nil channel上的操作会一直被阻塞，如果没有default case,只有nil channel的select会一直被阻塞。

select语句和switch语句一样，它不是循环，它只会选择一个case来处理，如果想一直处理channel，你可以在外面加一个无限的for循环：
https://colobu.com/2016/04/14/Golang-Channels/
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
