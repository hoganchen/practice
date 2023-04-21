package main

import (
	"fmt"
	"math/rand"
	"sync"
	"time"
)

func worker(index int, linkChan chan string, wg *sync.WaitGroup) {
	// Decreasing internal counter for wait-group as soon as goroutine finishes
	defer wg.Done()

	for url := range linkChan {
		waitSec := rand.Intn(5)
		time.Sleep(time.Second * time.Duration(waitSec))

		fmt.Printf("Worker Index: %v, Done processing link #%s\n", index, url)
	}

}

/*
https://stackoverflow.com/questions/18267460/how-to-use-a-goroutine-pool
https://go.dev/play/p/fruJiGBWjn
*/
func main() {
	yourLinksSlice := make([]string, 50)
	for i := 0; i < 50; i++ {
		yourLinksSlice[i] = fmt.Sprintf("%d", i+1)
	}

	lCh := make(chan string)
	wg := new(sync.WaitGroup)

	// Adding routines to workgroup and running then
	for i := 0; i < 3; i++ {
		wg.Add(1)
		go worker(i, lCh, wg)
	}

	// Processing all links by spreading them to `free` goroutines
	for _, link := range yourLinksSlice {
		lCh <- link
	}

	// Closing channel (waiting in goroutines won't continue any more)
	close(lCh)

	// Waiting for all goroutines to finish (otherwise they die as main routine dies)
	wg.Wait()
}
