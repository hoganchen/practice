// ============================================================================
// 知识点: 基本数据类型
//
// 说明:
// - Go内置了丰富的基本数据类型:
//   - 布尔型: bool
//   - 整型: int, int8, int16, int32, int64, uint, uint8(byte), uint16, uint32, uint64
//   - 浮点型: float32, float64
//   - 复数型: complex64, complex128
//   - 字符串: string
//   - 字符型: rune (int32别名, 表示Unicode码点), byte (uint8别名)
// - int/uint 在64位系统上是64位, 32位系统上是32位
//
// 编译和运行:
//   go run 03_data_types\01_basic_types.go
// ============================================================================

package main

import (
	"fmt"
	"math"
	"unsafe"
)

func main() {
	var a int8 = 127          // 最大 int8 值
	var b uint8 = 255          // 最大 uint8 值 (byte)
	var c int64 = math.MaxInt64 // 最大 int64 值
	var d float64 = math.Pi
	var e complex128 = 1 + 2i
	var f rune = '中' // Unicode 码点
	var g string = "Go语言"
	var h bool = true

	fmt.Printf("int8: %d (类型: %T, 字节大小: %d)\n", a, a, unsafe.Sizeof(a))
	fmt.Printf("uint8(byte): %d (类型: %T)\n", b, b)
	fmt.Printf("int64: %d (类型: %T)\n", c, c)
	fmt.Printf("float64: %f (类型: %T)\n", d, d)
	fmt.Printf("complex128: %v (类型: %T)\n", e, e)
	fmt.Printf("rune: %c (Unicode: %U, 类型: %T)\n", f, f, f)
	fmt.Printf("string: %s (类型: %T, 长度: %d字节)\n", g, g, len(g))
	fmt.Printf("bool: %v (类型: %T)\n", h, h)
}
