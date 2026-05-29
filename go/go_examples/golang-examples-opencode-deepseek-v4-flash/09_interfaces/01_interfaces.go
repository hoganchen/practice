// ============================================================
// 知识点：接口（Interface）
//
// 接口是 Go 实现多态和抽象的核心机制。
// 接口定义了一组方法签名，实现是隐式的（Duck Typing）。
// 只要类型实现了接口的所有方法，就自动满足该接口。
//
// 重要特性：
// 1. 隐式实现：无需显式声明 implements
// 2. 接口值：(值, 具体类型) 二元组
// 3. 空接口 interface{} 可表示任何类型
//
// 编译运行方法：
//   go run 01_interfaces.go
// ============================================================

package main

import (
	"fmt"
	"math"
)

// -------- 定义接口 --------
type Shape interface {
	Area() float64
	Perimeter() float64
}

// -------- 实现接口 —— 无需显式声明 --------
type Circle struct {
	Radius float64
}

// Circle 实现了 Shape 接口
func (c Circle) Area() float64 {
	return math.Pi * c.Radius * c.Radius
}

func (c Circle) Perimeter() float64 {
	return 2 * math.Pi * c.Radius
}

type Rectangle struct {
	Width, Height float64
}

// Rectangle 也实现了 Shape 接口
func (r Rectangle) Area() float64 {
	return r.Width * r.Height
}

func (r Rectangle) Perimeter() float64 {
	return 2 * (r.Width + r.Height)
}

// -------- 接口作为参数（多态）--------
func printShapeInfo(s Shape) {
	fmt.Printf("类型: %T, 面积: %.2f, 周长: %.2f\n",
		s, s.Area(), s.Perimeter())
}

func main() {
	// -------- 接口变量可以持有任何实现该接口的类型 --------
	var s Shape

	s = Circle{Radius: 5}
	fmt.Println("圆形面积:", s.Area())
	fmt.Println("圆形周长:", s.Perimeter())

	s = Rectangle{Width: 3, Height: 4}
	fmt.Println("矩形面积:", s.Area())
	fmt.Println("矩形周长:", s.Perimeter())

	// -------- 接口多态 --------
	fmt.Println("\n=== 多态 ===")
	shapes := []Shape{
		Circle{Radius: 3},
		Rectangle{Width: 4, Height: 5},
		Circle{Radius: 2.5},
	}

	for _, shape := range shapes {
		printShapeInfo(shape)
	}
}
