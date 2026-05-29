// ============================================================
// 知识点：math/rand/v2（Go 1.22+）
//
// math/rand/v2 是 math/rand 的重大升级版本，主要变化：
//   1. 默认使用更安全的 ChaCha8 随机数生成器（不再需要 seed）
//   2. API 更简洁清晰
//   3. 移除了已废弃的 Rand 类型的方法
//   4. 新增泛型函数
//
// 编译运行方法：
//   go run 01_rand_v2.go
// ============================================================

package main

import (
	"fmt"
	"math/rand/v2"
)

func main() {
	// -------- 基本随机数（不需要 seed）--------
	fmt.Println("=== 基本随机数 ===")
	fmt.Println("随机整数:", rand.IntN(100))   // [0, 100)
	fmt.Println("随机整数64:", rand.Int64N(1000))
	fmt.Println("随机浮点数:", rand.Float64()) // [0.0, 1.0)
	fmt.Println("随机浮点数32:", rand.Float32())

	// -------- 随机范围 --------
	fmt.Println("\n=== 随机范围 ===")
	fmt.Print("骰子摇5次: ")
	for range 5 {
		fmt.Printf("%d ", rand.IntN(6)+1) // [1, 6]
	}
	fmt.Println()

	// -------- 随机排列（Perm）--------
	fmt.Println("\n=== Shuffle ===")
	cards := []string{"A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"}
	rand.Shuffle(len(cards), func(i, j int) {
		cards[i], cards[j] = cards[j], cards[i]
	})
	fmt.Println("洗牌后:", cards[:5], "...")

	// -------- 可复现的随机序列（使用 PCG 生成器）--------
	fmt.Println("\n=== 可复现随机序列 ===")
	// 创建自定义随机数生成器（PCG，更快更好的统计特性）
	rng := rand.New(rand.NewPCG(42, 42)) // 固定种子
	fmt.Print("序列 A: ")
	for range 5 {
		fmt.Printf("%d ", rng.IntN(100))
	}
	fmt.Println()

	// 相同种子得到相同序列
	rng2 := rand.New(rand.NewPCG(42, 42))
	fmt.Print("序列 B: ")
	for range 5 {
		fmt.Printf("%d ", rng2.IntN(100))
	}
	fmt.Println()

	// -------- N 函数（泛型）--------
	fmt.Println("\n=== N 泛型函数 ===")
	fmt.Println("N(10):", rand.N(10))     // int, [0, 10)
	fmt.Println("N(100):", rand.N(100))   // int, [0, 100)
}
