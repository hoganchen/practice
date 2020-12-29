/*
@Author:        hogan.chen@ymail.com
@Create Date:   2020-11-11
*/

package main

import (
	"fmt"
	"time"
	"math/rand"
)

// https://colobu.com/2016/04/14/Golang-Channels/
func main() {
	start := time.Now()
	fmt.Printf("Program start execution at %s\n\n", start.Format("2006-01-02 15:04:05"))

	go func() {
		time.Sleep(1 * time.Hour)
		fmt.Println("1 hour expired")
	}()

	c := make(chan int)
	go func() {
		for i := 0; i < 10; i = i + 1 {
			c <- i
			time.Sleep(time.Duration(rand.Intn(5)) * time.Second)
		}
		close(c)
	}()

	/*
	for …… range语句可以处理Channel。
	range c产生的迭代值为Channel中发送的值，它会一直迭代直到channel被关闭。
	上面的例子中如果把close(c)注释掉，程序会一直阻塞在for …… range那一行。
	*/
	for i := range c {
		fmt.Println(i)
	}
	fmt.Println("Finished")

	elapsed := time.Since(start)
	fmt.Printf("\nProgram end execution at %s\n", time.Now().Format("2006-01-02 15:04:05"))
	fmt.Printf("Total elapsed time: %s\n", elapsed)
}
