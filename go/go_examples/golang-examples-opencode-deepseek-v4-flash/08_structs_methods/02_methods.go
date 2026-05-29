// ============================================================
// 知识点：方法（Method）
//
// Go 的方法是在结构体（或其他类型）上定义的函数。
// 方法的接收者（receiver）可以是值类型或指针类型。
// 值接收者：方法内修改不影响原值
// 指针接收者：方法内修改会影响原值
//
// 编译运行方法：
//   go run 02_methods.go
// ============================================================

package main

import "fmt"

// -------- 定义结构体 --------
type Rectangle struct {
	Width  float64
	Height float64
}

// -------- 值接收者方法 --------
// 使用值接收者，方法内对 rect 的修改不影响调用者
func (r Rectangle) Area() float64 {
	return r.Width * r.Height
}

// -------- 指针接收者方法 --------
// 使用指针接收者，可以修改结构体的字段
func (r *Rectangle) Scale(factor float64) {
	r.Width *= factor
	r.Height *= factor
}

// -------- 值接收者也可以被指针调用，反之亦然 --------
// Go 会自动处理值/指针的转换

// -------- 为非结构体类型定义方法 --------
// 不能为其他包的类型或基本类型定义方法
// 但可以为当前包的类型别名定义方法
type MyInt int

func (m MyInt) IsPositive() bool {
	return m > 0
}

func (m *MyInt) Double() {
	*m *= 2 // 通过指针修改原值
}

func main() {
	r := Rectangle{Width: 10, Height: 5}

	// 调用值接收者方法
	fmt.Println("面积:", r.Area())

	// 调用指针接收者方法
	r.Scale(2) // Go 自动转换为 (&r).Scale(2)
	fmt.Println("放大后:", r, "面积:", r.Area())

	// 指针也可以调用值接收者方法
	ptr := &r
	fmt.Println("通过指针调用:", ptr.Area()) // 自动解引用

	// 自定义类型的方法
	var num MyInt = 42
	fmt.Println("\n42 是正数吗?", num.IsPositive())

	num.Double()
	fmt.Println("翻倍后:", num)
}
