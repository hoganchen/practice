// ============================================================
// 知识点：数据类型
//
// Go 内置丰富的数据类型：布尔型、数值型（整型/浮点/复数）、
// 字符串、字节/符文。类型转换需要显式进行。
// ============================================================

package main

import (
	"fmt"
	"math"
	"unicode/utf8"
)

func main() {
	// ---- 1. 布尔型 ----
	var isReady bool = true
	var isDone bool = false
	fmt.Printf("布尔值: %t, %t\n", isReady, isDone)
	fmt.Printf("布尔运算: AND=%t, OR=%t, NOT=%t\n", isReady && isDone, isReady || isDone, !isDone)

	// ---- 2. 整型 ----
	// 有符号：int, int8, int16, int32(int), int64
	// 无符号：uint, uint8(byte), uint16, uint32, uint64
	// int 在 64 位系统上是 64 位
	var (
		i   int   = -100    // 平台相关（32/64 位）
		ui  uint  = 200     // 无符号整数
		b   byte  = 255     // byte = uint8 的别名
		r   rune  = '中'     // rune = int32 的别名，表示 Unicode 码点
		i8  int8  = 127     // 取值范围: -128 ~ 127
		u64 uint64 = 1 << 63 // 大整数
	)
	fmt.Printf("int=%d, uint=%d, byte=%d, rune=%c(%d), int8=%d, uint64=%d\n",
		i, ui, b, r, r, i8, u64)

	// ---- 3. 浮点型 ----
	// float32（~6位精度）, float64（~15位精度）
	var f32 float32 = 3.1415926535
	var f64 float64 = math.Pi
	fmt.Printf("float32: %.10f（精度丢失）\n", f32)
	fmt.Printf("float64: %.15f（高精度）\n", f64)

	// 特殊浮点值
	fmt.Printf("正无穷: %v\n", math.Inf(1))
	fmt.Printf("负无穷: %v\n", math.Inf(-1))
	fmt.Printf("NaN(非数值): %v\n", math.NaN())

	// ---- 4. 复数 ----
	// complex64 和 complex128
	c := 3 + 4i
	fmt.Printf("复数: %v, 实部: %.0f, 虚部: %.0f\n", c, real(c), imag(c))
	fmt.Printf("模长: %.2f\n", math.Sqrt(real(c)*real(c)+imag(c)*imag(c)))

	// ---- 5. 字符串 ----
	// 双引号字符串支持转义，反引号字符串为原始字符串
	str1 := "Hello\nGo"   // 包含换行符
	str2 := `原始字符串
可以换行，\n不会被转义`
	fmt.Println("双引号:", str1)
	fmt.Println("反引号:", str2)

	// 字符串长度（字节数） vs 符文数
	s := "Hello, 世界"
	fmt.Printf("字符串: %q\n", s)
	fmt.Printf("字节长度: %d\n", len(s))           // 13 字节（ASCII 5+1+1+6=13）
	fmt.Printf("符文数量: %d\n", utf8.RuneCountInString(s)) // 9 个字符

	// ---- 6. 显式类型转换 ----
	// Go 没有隐式类型转换，必须显式转换
	var intVal int = 42
	var floatVal float64 = float64(intVal) // int → float64
	var uintVal uint = uint(floatVal)      // float64 → uint
	fmt.Printf("类型转换: int=%d → float64=%.1f → uint=%d\n", intVal, floatVal, uintVal)

	// 字符串与整数转换（需要 strconv 包）
	// str := string(65)     // 错误！这得到 'A'，不是 "65"
	// 正取转换用 strconv.Itoa(65) → "65"

	// ---- 7. 零值再说明 ----
	var (
		defaultBool   bool
		defaultInt    int
		defaultFloat  float64
		defaultString string
		defaultPtr    *int
	)
	fmt.Printf("零值汇总: bool=%t, int=%d, float=%.0f, string=%q, ptr=%v\n",
		defaultBool, defaultInt, defaultFloat, defaultString, defaultPtr)
}

// 编译运行：go run 04_data_types.go
