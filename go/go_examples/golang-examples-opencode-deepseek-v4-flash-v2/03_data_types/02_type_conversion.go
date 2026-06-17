// ============================================================================
// 知识点: 类型转换
//
// 说明:
// - Go不支持隐式类型转换, 必须显式转换: T(表达式)
// - 数值类型之间可以转换, 但可能导致精度损失或溢出
// - 字符串与整型的转换需要使用 strconv 包
// - 接口类型转换使用类型断言 (详见接口章节)
//
// 编译和运行:
//   go run 03_data_types\02_type_conversion.go
// ============================================================================

package main

import (
	"fmt"
	"strconv"
)

func main() {
	// 数值类型转换
	var i int = 42
	var f float64 = float64(i)
	var u uint = uint(f)
	fmt.Printf("int %d -> float64 %f -> uint %d\n", i, f, u)

	// 精度损失
	var big int64 = 1000
	var small int8 = int8(big) // 超出范围, 截断
	fmt.Printf("int64 %d -> int8 %d (值被截断)\n", big, small)

	// 字符串和整型互转
	num := 123
	str := strconv.Itoa(num) // 整型转字符串
	fmt.Printf("int %d -> string %q\n", num, str)

	parsed, _ := strconv.Atoi("456")
	fmt.Printf("string \"456\" -> int %d\n", parsed)

	// 字符串和浮点数互转
	f64, _ := strconv.ParseFloat("3.14159", 64)
	fmt.Printf("string \"3.14159\" -> float64 %f\n", f64)

	s := strconv.FormatFloat(2.71828, 'f', 2, 64)
	fmt.Printf("float64 2.71828 -> string %q\n", s)
}
