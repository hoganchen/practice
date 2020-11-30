package main

import (
	"fmt"
	"sync"
)

var wg sync.WaitGroup

type Once struct {
	m    sync.Mutex
	done uint32
}

func (o *Once) Do(f func()) {
	defer wg.Done()

	if o.done == 1 {
		return
	}
	o.m.Lock()
	defer o.m.Unlock()
	if o.done == 0 {
		o.done = 1
		f()
	}
}

func helloPrintf() {
	fmt.Printf("Hello world!\n")
}

func main() {
	// oc := Once{}
	oc := new(Once)

	for i := 0; i < 10; i++ {
		wg.Add(1)
		go oc.Do(helloPrintf)
	}

	wg.Wait()
}