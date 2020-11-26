/*
@Author:        hogan.chen@ymail.com
@Create Date:   2020-11-11
*/

package main

import (
	"fmt"
	"time"
)

func f1(in chan int) {
	fmt.Println(<-in)
}

// https://www.runoob.com/go/go-concurrent.html
// https://www.jianshu.com/p/7a761e82ef84
func main() {
	start := time.Now()
	fmt.Printf("Start execution at %s\n", start.Format("2006-01-02 15:04:05"))

	out := make(chan int)

	/*
	fatal error: all goroutines are asleep - deadlock!
	通信是同步且无缓冲的：在有接受者接收数据之前，发送不会结束。
	可以想象一个无缓冲的通道在没有空间来保存数据的时候：
	必须要一个接收者准备好接收通道的数据然后发送者可以直接把数据发送给接收者。
	所以通道的发送/接收操作在对方准备好之前是阻塞的

	带缓冲区的通道允许发送端的数据发送和接收端的数据获取处于异步状态，
	就是说发送端发送的数据可以放在缓冲区里面，可以等待接收端去获取数据，而不是立刻需要接收端去获取数据。
	不过由于缓冲区的大小是有限的，所以还是必须有接收端来接收数据的，否则缓冲区一满，数据发送端就无法再发送数据了。

	注意：如果通道不带缓冲，发送方会阻塞直到接收方从通道中接收了值。
	如果通道带缓冲，发送方则会阻塞直到发送的值被拷贝到缓冲区内；
	如果缓冲区已满，则意味着需要等待直到某个接收方获取到一个值。接收方在有值可以接收之前会一直阻塞。

	综上所述，无缓冲的通道，在发送端发送数据之前，接收端必须准备好接收数据，不然发送端就会阻塞，所以交换如下两行代码即可正确运行
	*/
	out <- 2
	go f1(out)

	elapsed := time.Since(start)
	fmt.Printf("\nTotal elapsed time: %s\n", elapsed)
}
