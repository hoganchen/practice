/*
@Author:        hogan.chen@ymail.com
@Create Date:   2020-11-11
*/

package main

import (
	"fmt"
	"time"
	"sync"
	"math/rand"
)

type s_routines struct {
	id int
	wt int
}

func gorouteine(id int, ch *chan int) {
	fmt.Printf("id: %v, msg: hello world\n", id)
	time.Sleep(time.Duration(rand.Intn(5) + 5) * time.Second)
	*ch <- id
}

func main() {
	start := time.Now()
	fmt.Printf("Program start execution at %s\n\n", start.Format("2006-01-02 15:04:05"))

	var wg sync.WaitGroup
	done := make(chan int, 10)

	for i := 0; i < cap(done); i++ {
		wg.Add(1)

		go func() {
			fmt.Printf("msg: hello world\n")
			done <- 1
			wg.Done()
		}()
	}

	wg.Wait()
	close(done)

	// 循环 for i := range c 会不断从信道接收值，直到它被关闭。如不关闭信道，则出现错误fatal error: all goroutines are asleep - deadlock!
	for x := range done {
		fmt.Printf("x: %v\n", x)
	}

	ch := make(chan int, 10)
	for i := 0; i < cap(ch); i++ {
		go gorouteine(i, &ch)
	}

	for i := 0; i < cap(ch); i++ {
		fmt.Printf("<- ch: %v\n", <- ch)
	}

	new_ch := make(chan s_routines, 10)
	for i := 0; i < cap(new_ch); i++ {
		go func(id int) {
			fmt.Printf("id: %v, msg: hello world\n", id)
			wait_time := rand.Intn(5) + 5
			time.Sleep(time.Duration(wait_time) * time.Second)
			sr := s_routines{id: id, wt: wait_time}
			new_ch <- sr
		}(i)
	}

	for i := 0; i < cap(new_ch); i++ {
		fmt.Printf("<- new_ch: %v\n", <- new_ch)
	}

	elapsed := time.Since(start)
	fmt.Printf("\nProgram end execution at %s\n", time.Now().Format("2006-01-02 15:04:05"))
	fmt.Printf("Total elapsed time: %s\n", elapsed)
}
