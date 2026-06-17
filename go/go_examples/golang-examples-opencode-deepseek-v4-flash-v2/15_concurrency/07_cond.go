// ============================================================================
// 知识点: sync.Cond 条件变量
//
// 说明:
// - sync.Cond 用于 goroutine 等待特定条件满足后再继续
// - Wait(): 自动解锁并等待, 被唤醒后重新加锁
// - Signal(): 唤醒一个等待的 goroutine
// - Broadcast(): 唤醒所有等待的 goroutine
// - Cond 必须与 Mutex 或 RWMutex 配合使用
//
// 编译和运行:
//   go run 15_concurrency\07_cond.go
// ============================================================================

package main

import (
	"fmt"
	"sync"
	"time"
)

type Queue struct {
	items []int
	cond  *sync.Cond
}

func NewQueue() *Queue {
	return &Queue{
		cond: sync.NewCond(&sync.Mutex{}),
	}
}

func (q *Queue) Put(item int) {
	q.cond.L.Lock()
	defer q.cond.L.Unlock()

	q.items = append(q.items, item)
	fmt.Printf("  生产者: 放入 %d (队列: %v)\n", item, q.items)
	q.cond.Signal() // 唤醒一个等待的消费者
}

func (q *Queue) Get() int {
	q.cond.L.Lock()
	defer q.cond.L.Unlock()

	for len(q.items) == 0 {
		q.cond.Wait() // 等待直到有数据
	}
	item := q.items[0]
	q.items = q.items[1:]
	fmt.Printf("  消费者: 取出 %d (队列: %v)\n", item, q.items)
	return item
}

func main() {
	queue := NewQueue()

	// 消费者 goroutine
	go func() {
		for i := 0; i < 5; i++ {
			queue.Get()
			time.Sleep(50 * time.Millisecond)
		}
	}()

	// 生产者 goroutine
	go func() {
		for i := 1; i <= 5; i++ {
			queue.Put(i)
			time.Sleep(30 * time.Millisecond)
		}
	}()

	time.Sleep(500 * time.Millisecond)
	fmt.Println("所有操作完成")
}
