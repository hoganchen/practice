// ============================================================================
// 知识点: sync.Once 一次性执行
//
// 说明:
// - sync.Once 确保某个函数只执行一次, 即使被多个 goroutine 同时调用
// - once.Do(f) 中的 f 只会被执行一次
// - 常用于: 单例模式、懒加载、一次性初始化
// - Once 执行完 f 后, 后续调用 Do 会立即返回(不执行 f)
// - 如果 f 中 panic, Once 会认为执行已完成
//
// 编译和运行:
//   go run 15_concurrency\06_once.go
// ============================================================================

package main

import (
	"fmt"
	"sync"
)

var (
	config     map[string]string
	configOnce sync.Once
)

func loadConfig() {
	fmt.Println("  [loadConfig] 加载配置...")
	config = map[string]string{
		"host": "localhost",
		"port": "8080",
	}
}

func getConfig(key string) string {
	configOnce.Do(loadConfig)
	return config[key]
}

// 单例模式示例
type Database struct {
	name string
}

var (
	db     *Database
	dbOnce sync.Once
)

func GetDatabase() *Database {
	dbOnce.Do(func() {
		fmt.Println("  [GetDatabase] 创建数据库连接")
		db = &Database{name: "main-db"}
	})
	return db
}

func main() {
	var wg sync.WaitGroup

	fmt.Println("多个 goroutine 同时获取配置:")
	for i := 0; i < 5; i++ {
		wg.Add(1)
		go func(id int) {
			defer wg.Done()
			host := getConfig("host")
			fmt.Printf("  goroutine %d: host=%s\n", id, host)
		}(i)
	}
	wg.Wait()

	fmt.Println("\n单例模式:")
	for i := 0; i < 3; i++ {
		wg.Add(1)
		go func(id int) {
			defer wg.Done()
			d := GetDatabase()
			fmt.Printf("  goroutine %d: %p\n", id, d)
		}(i)
	}
	wg.Wait()

	_ = fmt.Sprintf
}
