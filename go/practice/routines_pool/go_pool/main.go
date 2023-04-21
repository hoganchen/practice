package main

import (
	"log"
	"time"

	"./gopool"
)

/*
https://www.zhihu.com/question/486002075
https://medium.com/free-code-camp/million-websockets-and-go-cc58418460bb

A Million WebSockets and Go
*/
func main() {
	pool := gopool.NewPool(1024, 1024, 1024) // 限制1024个协程
	for i := 0; i < 10; i++ {
		id := i + 1
		pool.Schedule(func() {
			log.Printf("[main] Starting task %d", id)
			time.Sleep(5 * time.Second)
		})
	}
}