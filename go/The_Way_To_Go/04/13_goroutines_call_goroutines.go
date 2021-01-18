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

func go_routines(id int, wg *sync.WaitGroup) {
	fmt.Printf("go routine id: %v\n", id)

	if id < 10 {
		var new_wg sync.WaitGroup
		new_wg.Add(1)

		id += 1
		go go_routines(id, &new_wg)

		new_wg.Wait()
	}

	wg.Done()
}

func main() {
	start := time.Now()
	fmt.Printf("Program start execution at %s\n\n", start.Format("2006-01-02 15:04:05"))

	var wg sync.WaitGroup
	wg.Add(1)
	go go_routines(1, &wg)

	wg.Wait()

	elapsed := time.Since(start)
	fmt.Printf("\nProgram end execution at %s\n", time.Now().Format("2006-01-02 15:04:05"))
	fmt.Printf("Total elapsed time: %s\n", elapsed)
}
