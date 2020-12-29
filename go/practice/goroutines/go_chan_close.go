/*
@Author:        hogan.chen@ymail.com
@Create Date:   2020-11-11
*/

package main

import (
	"fmt"
	"time"
)

func main() {
	start := time.Now()
	fmt.Printf("Program start execution at %s\n\n", start.Format("2006-01-02 15:04:05"))

	go func() {
		time.Sleep(time.Hour)
		fmt.Println("1 hour expired")
	}()

	/*
	内建的close方法可以用来关闭channel。

	总结一下channel关闭后sender的receiver操作。
	如果channel c已经被关闭,继续往它发送数据会导致panic: send on closed channel:
	*/
	fmt.Printf("\n############################## test 01 ##############################\n")
	c := make(chan int, 10)
	c <- 1
	c <- 2
	// close(c)
	c <- 3 // 向关闭的channel中发送数据，会导致错误panic: send on closed channel

	// 但是从这个关闭的channel中不但可以读取出已发送的数据，还可以不断的读取零值
	fmt.Printf("\n############################## test 02 ##############################\n")
	ch := make(chan int, 10)
	ch <- 1
	ch <- 2
	close(ch)
	fmt.Println(<-ch) //1
	fmt.Println(<-ch) //2
	fmt.Println(<-ch) //0
	fmt.Println(<-ch) //0

	// 但是如果通过range读取，channel关闭后for循环会跳出：
	fmt.Printf("\n############################## test 03 ##############################\n")
	cc := make(chan int, 10)
	cc <- 1
	cc <- 2
	close(cc)
	for i := range cc {
		fmt.Println(i)
	}

	// 通过i, ok := <-c可以查看Channel的状态，判断值是零值还是正常读取的值。
	fmt.Printf("\n############################## test 04 ##############################\n")
	ccc := make(chan int, 10)
	ccc <- 1
	ccc <- 2
	close(ccc)

	for j:= 0; j < 10; j++ {
		i, ok := <-ccc
		fmt.Printf("%d, %t\n", i, ok) //0, false
	}

	elapsed := time.Since(start)
	fmt.Printf("\nProgram end execution at %s\n", time.Now().Format("2006-01-02 15:04:05"))
	fmt.Printf("Total elapsed time: %s\n", elapsed)
}
