// ============================================================
// 知识点：reflect.TypeAssert + hash.Cloner（Go 1.25+）
//
// reflect.TypeAssert[T](v Value) (T, bool) — Go 1.25
//   在反射场景下进行安全的类型断言，等价于：
//     x, ok := v.Interface().(T)
//   但更高效，支持更多场景。
//
// hash.Cloner — Go 1.25
//   让 hash.Hash 可以被克隆（保存/恢复中间状态）。
//   适用于：增量哈希、检查点（checkpoint）等场景。
//
// 编译运行方法：
//   go run 01_reflect_hash.go
// ============================================================

package main

import (
	"crypto/sha256"
	"fmt"
	"hash"
	"reflect"
)

// -------- hash.Cloner 接口使用 --------
func demonstrateHashCloner() {
	fmt.Println("=== hash.Cloner ===")

	h := sha256.New()
	h.Write([]byte("Hello "))

	// 检查是否实现了 Cloner 接口
	if cloner, ok := h.(hash.Cloner); ok {
		// 克隆当前哈希状态（返回 (Cloner, error)）
		clone, err := cloner.Clone()
		if err != nil {
			fmt.Println("克隆失败:", err)
			return
		}

		// 原哈希继续写入
		h.Write([]byte("World"))
		fmt.Printf("原哈希(Hello World): %x\n", h.Sum(nil))

		// 克隆从"Hello "状态继续写入
		clone.Write([]byte("Go!"))
		fmt.Printf("克隆(Hello Go!):   %x\n", clone.Sum(nil))
	} else {
		fmt.Println("sha256 不支持 Cloner")
	}
}

// -------- reflect.TypeAssert 使用 --------
func demonstrateReflectTypeAssert() {
	fmt.Println("\n=== reflect.TypeAssert ===")

	var values []any = []any{
		42,
		"hello",
		3.14,
		[]int{1, 2, 3},
	}

	for _, v := range values {
		rv := reflect.ValueOf(v)

		// 使用 reflect.TypeAssert 安全断言
		if s, ok := reflect.TypeAssert[string](rv); ok {
			fmt.Printf("字符串: %q (长度 %d)\n", s, len(s))
		} else if i, ok := reflect.TypeAssert[int](rv); ok {
			fmt.Printf("整数: %d (平方: %d)\n", i, i*i)
		} else if f, ok := reflect.TypeAssert[float64](rv); ok {
			fmt.Printf("浮点数: %.2f\n", f)
		} else if slice, ok := reflect.TypeAssert[[]int](rv); ok {
			fmt.Printf("整数切片: %v (元素数: %d)\n", slice, len(slice))
		} else {
			fmt.Printf("未知类型: %T\n", v)
		}
	}
}

func main() {
	demonstrateReflectTypeAssert()
	demonstrateHashCloner()
}
