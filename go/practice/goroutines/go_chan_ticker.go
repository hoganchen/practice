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

var wg sync.WaitGroup

// https://colobu.com/2016/04/14/Golang-Channels/
func main() {
	start := time.Now()
	fmt.Printf("Program start execution at %s\n\n", start.Format("2006-01-02 15:04:05"))

	/*
	ticker是一个定时触发的计时器，它会以一个间隔(interval)往Channel发送一个事件(当前时间)，
	而Channel的接收者可以以固定的时间间隔从Channel中读取事件。下面的例子中ticker每500毫秒触发一次，你可以观察输出的时间。

	类似timer, ticker也可以通过Stop方法来停止。一旦它停止，接收者不再会从channel中接收数据了。
	*/
	ticker := time.NewTicker(time.Millisecond * 500)
	wg.Add(1)
	go func() {
		for t := range ticker.C {
			fmt.Println("Tick at", t)
		}
		wg.Done()
	}()

	wg.Wait()

	elapsed := time.Since(start)
	fmt.Printf("\nProgram end execution at %s\n", time.Now().Format("2006-01-02 15:04:05"))
	fmt.Printf("Total elapsed time: %s\n", elapsed)
}
