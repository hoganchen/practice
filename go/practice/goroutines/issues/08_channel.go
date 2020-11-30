package main
import "fmt"

// panic: close of nil channel
func main() {
	var ch chan int
	// ch = make(chan int)
	var count int
	go func() {
		ch <- 1
	}()
	go func() {
		count++
		close(ch)
	}()
	<-ch
	fmt.Println(count)
}