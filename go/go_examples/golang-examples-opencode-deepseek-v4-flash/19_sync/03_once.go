// ============================================================
// 知识点：sync.Once（一次性执行）
//
// Once 确保某个函数在程序的整个生命周期中只执行一次。
// 常用于单例模式、初始化操作等。
// 即使有多个 goroutine 同时调用，也只会执行一次。
//
// 编译运行方法：
//   go run 03_once.go
// ============================================================

package main

import (
	"fmt"
	"sync"
)

// -------- 单例模式 --------
var (
	instance *Config
	once     sync.Once
)

type Config struct {
	AppName string
	Version string
}

func GetConfig() *Config {
	once.Do(func() {
		fmt.Println("初始化配置...（只执行一次）")
		instance = &Config{
			AppName: "GoExampleApp",
			Version: "1.0.0",
		}
	})
	return instance
}

func main() {
	fmt.Println("=== sync.Once 示例 ===")

	var wg sync.WaitGroup

	// 启动 10 个 goroutine 并发获取配置
	for i := 0; i < 10; i++ {
		wg.Add(1)
		go func(id int) {
			defer wg.Done()
			cfg := GetConfig()
			fmt.Printf("Goroutine #%d 获取配置: %s v%s\n",
				id, cfg.AppName, cfg.Version)
		}(i)
	}

	wg.Wait()
	fmt.Println("所有 goroutine 完成，初始化只发生了一次！")
}
