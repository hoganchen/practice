// ============================================================
// 知识点：sync.OnceFunc / OnceValue / OnceValues（Go 1.21+）
//
// Go 1.21 为 sync 包新增了三个便捷函数，用于创建只执行一次的包装器：
//   OnceFunc(f)      — 返回一个函数，首次调用时执行 f，后续调用 no-op
//   OnceValue(f)     — 类似 OnceFunc，但 f 返回一个值
//   OnceValues(f)    — 类似 OnceFunc，但 f 返回两个值（常用于 (T, error)）
//
// 这些函数比手动 sync.Once 更简洁且线程安全。
//
// 编译运行方法：
//   go run 01_sync_once_func.go
// ============================================================

package main

import (
	"errors"
	"fmt"
	"sync"
)

var loadCount int

// -------- 模拟耗时的初始化操作 --------
func loadConfig() (map[string]string, error) {
	loadCount++
	fmt.Println("  加载配置中... (只应执行一次)")
	return map[string]string{
		"app_name": "GoExample",
		"version":  "1.0.0",
	}, nil
}

// -------- 模拟可能失败的初始化 --------
func initDB() (*string, error) {
	return nil, errors.New("数据库连接失败")
}

func main() {
	// -------- sync.OnceFunc：无返回值只执行一次 --------
	fmt.Println("=== sync.OnceFunc ===")
	var count int
	onceFn := sync.OnceFunc(func() {
		count++
		fmt.Println("  初始化只执行一次")
	})

	for i := 0; i < 5; i++ {
		onceFn()
	}
	fmt.Printf("  count = %d (应为 1)\n", count)

	// -------- sync.OnceValues：缓存 (T, error) 模式 --------
	fmt.Println("\n=== sync.OnceValues ===")
	getConfig := sync.OnceValues(loadConfig)

	for i := 0; i < 3; i++ {
		cfg, err := getConfig()
		fmt.Printf("  第 %d 次: config=%v, err=%v\n", i+1, cfg, err)
	}
	fmt.Printf("  loadConfig 实际被调用了 %d 次\n", loadCount)

	// -------- 失败不会重试 --------
	fmt.Println("\n=== 首次失败不再重试 ===")
	getFailed := sync.OnceValues(initDB)
	v, err := getFailed()
	if err != nil {
		fmt.Printf("  第一次: v=%v, err=%v (不再重试)\n", v, err)
	}
	v, err = getFailed() // 返回同样的错误，不会重试
	fmt.Printf("  第二次: v=%v, err=%v\n", v, err)
}
