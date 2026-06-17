// ============================================================================
// 知识点: 类型别名 (Type Alias, Go 1.9+)
//
// 说明:
// - 类型别名: type T1 = T2, T1 和 T2 是完全相同的类型 (别名关系)
// - 类型定义: type T1 T2, T1 是基于 T2 的新类型 (不同类型)
// - 别名可以互相赋值, 无需类型转换
// - 定义的类型是不同类型, 需要显式转换
// - 类型别名主要用于大型代码库的渐进式重构
//
// 编译和运行:
//   go run 02_variables\05_type_alias.go
// ============================================================================

package main

import "fmt"

// 类型定义 (定义新类型)
type Celsius float64
type Fahrenheit float64

// 类型别名 (只是别名, 和原类型完全一样)
type Age = int

func main() {
	// 类型定义: 不同类型, 需要转换
	var c Celsius = 100.0
	var f Fahrenheit = 212.0

	// fmt.Println(c == f) // 编译错误: 类型不匹配
	fmt.Printf("Celsius: %.1f°C, Fahrenheit: %.1f°F\n", c, f)
	fmt.Printf("显式转换: %.1f°C = %.1f°F\n", c, Celsius(f))

	// 类型别名: 完全相同的类型
	var myAge Age = 30
	var normalAge int = 25
	fmt.Println("别名可以直接与原始类型比较:", myAge == normalAge)
	fmt.Println("别名可以直接与原始类型运算:", myAge+normalAge)

	// 别名方法: 别名可以使用原类型的所有方法
	_ = myAge
}
