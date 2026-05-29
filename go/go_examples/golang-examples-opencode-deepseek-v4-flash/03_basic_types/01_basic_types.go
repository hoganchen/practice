// ============================================================
// 知识点：基本数据类型
//
// Go 内置了丰富的基本数据类型，包括：
//   - 布尔型：bool
//   - 数值型：int/uint 系列、float 系列、complex 系列
//   - 字符串型：string
//   - 字节/字符型：byte（=uint8）、rune（=int32）
//
// 编译运行方法：
//   go run 01_basic_types.go
// ============================================================

package main

import (
	"fmt"
	"math"
)

func main() {
	// -------- 布尔类型 --------
	var isActive bool = true
	var isDone bool   // 默认 false
	fmt.Println("布尔:", isActive, isDone)

	// -------- 整数类型 --------
	// 有符号：int, int8, int16, int32(int), int64
	// 无符号：uint, uint8(byte), uint16, uint32, uint64
	var a int8   = 127          // -128 ~ 127
	var b uint8 = 255           // 0 ~ 255（byte 的别名）
	var c int   = -2147483648   // 平台相关，32位或64位
	fmt.Println("整数:", a, b, c)

	// -------- 浮点类型 --------
	// float32（约7位精度），float64（约15位精度）
	var f32 float32 = 3.1415926535  // 精度损失
	var f64 float64 = math.Pi       // 高精度
	fmt.Println("浮点:", f32, f64)

	// -------- 复数类型 --------
	var c1 complex64  = 1 + 2i
	var c2 complex128 = 3 + 4i
	fmt.Println("复数:", c1, c2)
	fmt.Println("实部:", real(c1), "虚部:", imag(c1))

	// -------- 字符串类型 --------
	// 字符串是不可变的字节序列
	var s1 string = "Go语言"
	s2 := "Hello"
	fmt.Println("字符串:", s1, s2)
	fmt.Println("长度:", len(s1)) // 注意：len 返回字节数，不是字符数

	// -------- byte 和 rune --------
	// byte = uint8，表示 ASCII 字符
	// rune = int32，表示 Unicode 码点（支持中文等）
	var ch1 byte = 'A'              // ASCII 字符
	var ch2 rune = '中'             // Unicode 字符
	fmt.Println("byte:", ch1, "rune:", ch2)
	fmt.Printf("byte=%c rune=%c\n", ch1, ch2)

	// -------- 类型转换 --------
	// Go 不支持隐式类型转换，必须显式转换
	var i int = 42
	var f float64 = float64(i)    // int → float64
	var u uint = uint(f)           // float64 → uint
	var s string = string(rune(65)) // int → rune → string ("A")
	fmt.Println("转换:", i, f, u, s)

	// -------- 数值范围常量 --------
	fmt.Println("int8范围:", math.MinInt8, "~", math.MaxInt8)
	fmt.Println("uint8范围:", 0, "~", math.MaxUint8)
	fmt.Println("int64范围:", math.MinInt64, "~", math.MaxInt64)
	fmt.Println("float64最大:", math.MaxFloat64)
}
