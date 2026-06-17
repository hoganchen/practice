// ============================================================================
// 知识点: math/rand 随机数
//
// 说明:
// - math/rand/v2 是Go 1.22+ 推荐的随机数包 (避免了全局锁)
// - rand.IntN(n) 返回 [0, n) 的随机整数
// - rand.Float64() 返回 [0.0, 1.0) 的随机浮点数
// - crypto/rand 提供密码学安全的随机数
// - 默认随机数生成器是确定的, 多次运行结果相同
//
// 编译和运行:
//   go run 13_random\01_random_numbers.go
// ============================================================================

package main

import (
	"crypto/rand"
	"fmt"
	"math/big"
	mrand "math/rand/v2"
)

func main() {
	// 随机整数 [0, 100)
	fmt.Println("随机整数:")
	for i := 0; i < 5; i++ {
		fmt.Printf("  %d ", mrand.IntN(100))
	}
	fmt.Println()

	// 随机浮点数 [0.0, 1.0)
	fmt.Println("随机浮点数:")
	for i := 0; i < 3; i++ {
		fmt.Printf("  %.4f ", mrand.Float64())
	}
	fmt.Println()

	// 随机排列
	nums := []int{1, 2, 3, 4, 5}
	mrand.Shuffle(len(nums), func(i, j int) { nums[i], nums[j] = nums[j], nums[i] })
	fmt.Println("随机排列:", nums)

	// 密码学安全的随机数
	secureNum, _ := rand.Int(rand.Reader, big.NewInt(1000))
	fmt.Println("安全随机数:", secureNum)

	// 生成随机字节 (使用 crypto/rand)
	token := make([]byte, 16)
	rand.Read(token)
	fmt.Printf("随机Token: %x\n", token)
}
