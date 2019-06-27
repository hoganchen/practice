package main

import (
    "context"
    "time"
    "sync"
    "fmt"
)

func main() {
    ctx, cancel := context.WithTimeout(context.Background(), 5 * time.Second)
    defer cancel()
    var wg sync.WaitGroup
    wg.Add(1)

    go func() {
        defer wg.Done()
        select {
        case <-ctx.Done():
            fmt.Println(ctx.Err()) // prints "context deadline exceeded"
            return
        case <- time.NewTicker(10 * time.Second).C:
            //time.Sleep(10 * time.Second)
            fmt.Println("Done after 10 seconds")
        }
    }()
    wg.Wait()
}