package main

import (
	"log"
	"runtime"
	"time"

	"./workerpool"
)

/*
https://medium.com/code-chasm/go-concurrency-pattern-worker-pool-a437117025b1
https://github.com/syafdia/go-exercise/tree/master/src/concurrency/workerpool

Go Concurrency Pattern: Worker Pool
*/
func main() {
	log.SetFlags(log.Ltime)

	// For monitoring purpose.
	waitC := make(chan bool)
	go func() {
		for {
			log.Printf("[main] Total current goroutine: %d", runtime.NumGoroutine())
			time.Sleep(1 * time.Second)
		}
	}()

	// Start Worker Pool.
	totalWorker := 5
	wp := workerpool.NewWorkerPool(totalWorker)
	wp.Run()

	type result struct {
		id    int
		value int
	}

	totalTask := 100
	resultC := make(chan result, totalTask)

	for i := 0; i < totalTask; i++ {
		id := i + 1
		wp.AddTask(func() {
			log.Printf("[main] Starting task %d", id)
			time.Sleep(5 * time.Second)
			resultC <- result{id, id * 2}
		})
	}

	for i := 0; i < totalTask; i++ {
		res := <-resultC
		log.Printf("[main] Task %d has been finished with result %d", res.id, res.value)
	}

	<-waitC
}