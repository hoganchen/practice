/*
@Author:        hogan.chen@ymail.com
@Create Date:   2020-11-11
*/

package main

import (
	"fmt"
	"math/rand"
	"sync"
	"time"
)

const workers = 10
const numJobs = 500

var lock sync.Mutex

func worker(id int, jobs <-chan int, results chan<- int) {
	for j := range jobs {
		lock.Lock()
		fmt.Println("worker", id, "started  job", j)
		lock.Unlock()

		waitSec := rand.Intn(5)
		time.Sleep(time.Second * time.Duration(waitSec))

		lock.Lock()
		fmt.Println("worker", id, "finished job", j, "time", waitSec)
		lock.Unlock()

		results <- j * 2
	}
}

/*
https://gobyexample.com/worker-pools

Go by Example: Worker Pools
In this example we’ll look at how to implement a worker pool using goroutines and channels.
*/
func main() {
	start := time.Now()
	fmt.Printf("Program start execution at %s\n\n", start.Format("2006-01-02 15:04:05"))

	jobs := make(chan int, numJobs)
	results := make(chan int, numJobs)

	for w := 1; w <= workers; w++ {
		go worker(w, jobs, results)
	}

	var wg sync.WaitGroup
	wg.Add(1)

	go func() {
		defer wg.Done()

		for j := 1; j <= numJobs; j++ {
			jobs <- j
			// time.Sleep(time.Second * time.Duration(rand.Intn(5)))
		}
	}()

	wg.Wait()
	close(jobs)

	for a := 1; a <= numJobs; a++ {
		// lock.Lock()
		// fmt.Printf("result: %v", <-results)
		// lock.Unlock()

		<-results
	}

	elapsed := time.Since(start)
	fmt.Printf("\nProgram end execution at %s\n", time.Now().Format("2006-01-02 15:04:05"))
	fmt.Printf("Total elapsed time: %s\n", elapsed)
}
