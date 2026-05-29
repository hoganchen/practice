// ============================================================
// 知识点：互斥锁（sync.Mutex）和读写锁（sync.RWMutex）
//
// 多个 goroutine 同时访问共享变量可能导致数据竞争。
// sync.Mutex 提供互斥访问（Lock/Unlock）。
// sync.RWMutex 区分读锁（RLock）和写锁（Lock），读可以并发。
// 推荐使用 defer 解锁，用 go race detector 检测数据竞争。
// ============================================================

package main

import (
	"fmt"
	"sync"
	"time"
)

// ---- 1. 数据竞争演示 ----
// 不加锁的计数器
type Counter struct {
	value int
}

func (c *Counter) Increment() {
	c.value++ // 非原子操作！存在数据竞争
}

// ---- 2. Mutex 保护 ----
type SafeCounter struct {
	mu    sync.Mutex
	value int
}

func (c *SafeCounter) Increment() {
	c.mu.Lock()
	c.value++
	c.mu.Unlock()
}

func (c *SafeCounter) Value() int {
	c.mu.Lock()
	defer c.mu.Unlock()
	return c.value
}

// ---- 3. RWMutex 读写锁 ----
// 读多写少的场景使用 RWMutex 提高性能
type Config struct {
	mu    sync.RWMutex
	data  map[string]string
}

func NewConfig() *Config {
	return &Config{
		data: make(map[string]string),
	}
}

// 读操作使用 RLock（可并发）
func (c *Config) Get(key string) (string, bool) {
	c.mu.RLock()
	defer c.mu.RUnlock()
	val, ok := c.data[key]
	return val, ok
}

// 写操作使用 Lock（互斥）
func (c *Config) Set(key, value string) {
	c.mu.Lock()
	defer c.mu.Unlock()
	c.data[key] = value
}

// ---- 4. 带锁的 Bank 账户 ----
type BankAccount struct {
	mu      sync.Mutex
	balance float64
	owner   string
}

func NewBankAccount(owner string) *BankAccount {
	return &BankAccount{owner: owner}
}

func (a *BankAccount) Deposit(amount float64) {
	a.mu.Lock()
	defer a.mu.Unlock()
	if amount <= 0 {
		return
	}
	a.balance += amount
	fmt.Printf("  %s 存入 %.2f，余额: %.2f\n", a.owner, amount, a.balance)
}

func (a *BankAccount) Withdraw(amount float64) bool {
	a.mu.Lock()
	defer a.mu.Unlock()
	if amount <= 0 || amount > a.balance {
		return false
	}
	a.balance -= amount
	fmt.Printf("  %s 取出 %.2f，余额: %.2f\n", a.owner, amount, a.balance)
	return true
}

func (a *BankAccount) Balance() float64 {
	a.mu.Lock()
	defer a.mu.Unlock()
	return a.balance
}

func main() {
	// ---- 1. 不加锁的计数器（数据竞争） ----
	fmt.Println("--- 数据竞争（不加锁）---")
	counter := &Counter{}

	var wg sync.WaitGroup
	for i := 0; i < 1000; i++ {
		wg.Add(1)
		go func() {
			defer wg.Done()
			counter.Increment()
		}()
	}
	wg.Wait()
	fmt.Printf("  期望: 1000，结果: %d（可能小于 1000）\n", counter.value)

	// 使用 -race 标志检测数据竞争：
	// go run -race 06_mutex.go

	// ---- 2. 加锁后的安全计数器 ----
	fmt.Println("\n--- Mutex 安全计数器 ---")
	safeCounter := &SafeCounter{}

	for i := 0; i < 1000; i++ {
		wg.Add(1)
		go func() {
			defer wg.Done()
			safeCounter.Increment()
		}()
	}
	wg.Wait()
	fmt.Printf("  期望: 1000，结果: %d（加锁后 100%% 正确）\n", safeCounter.Value())

	// ---- 3. 银行账户 ----
	fmt.Println("\n--- 银行账户 ---")
	account := NewBankAccount("Alice")

	var wg2 sync.WaitGroup
	operations := []struct {
		op     string
		amount float64
	}{
		{"deposit", 1000},
		{"deposit", 500},
		{"withdraw", 200},
		{"withdraw", 100},
		{"deposit", 300},
	}

	for _, o := range operations {
		wg2.Add(1)
		go func(op string, amount float64) {
			defer wg2.Done()
			switch op {
			case "deposit":
				account.Deposit(amount)
			case "withdraw":
				account.Withdraw(amount)
			}
		}(o.op, o.amount)
	}

	wg2.Wait()
	fmt.Printf("  最终余额: %.2f\n", account.Balance())

	// ---- 4. RWMutex 示例 ----
	fmt.Println("\n--- RWMutex 读写锁 ---")
	config := NewConfig()

	// 设置初始值
	config.Set("host", "localhost")
	config.Set("port", "8080")

	// 并发读取（RLock 可共享）
	var readWg sync.WaitGroup
	for i := 0; i < 5; i++ {
		readWg.Add(1)
		go func(id int) {
			defer readWg.Done()
			for j := 0; j < 3; j++ {
				if host, ok := config.Get("host"); ok {
					fmt.Printf("  读取者 %d: host=%s\n", id, host)
				}
				time.Sleep(10 * time.Millisecond)
			}
		}(i)
	}

	// 并发写入（写锁互斥）
	config.Set("host", "192.168.1.1")
	config.Set("port", "9090")

	readWg.Wait()
	fmt.Println("  读取完成")

	// ---- 5. Lock/Unlock 注意事项 ----
	fmt.Println("\n--- 注意事项 ---")
	fmt.Println("  1. 每次 Lock 后必须 Unlock（使用 defer 确保）")
	fmt.Println("  2. Mutex 不可复制（传递需用指针）")
	fmt.Println("  3. 同一 goroutine 不能两次 Lock 相同 Mutex（会死锁）")
	fmt.Println("  4. 使用 go run -race 检测数据竞争")

	// ---- 6. Once 保证单次执行 ----
	fmt.Println("\n--- sync.Once ---")
	var once sync.Once
	initFunc := func() {
		fmt.Println("  初始化执行一次")
	}

	for i := 0; i < 5; i++ {
		go once.Do(initFunc)
	}
	time.Sleep(10 * time.Millisecond)
	fmt.Println("  initFunc 只执行了一次")
}

// 编译运行：go run 06_mutex.go
// 检查数据竞争：go run -race 06_mutex.go
