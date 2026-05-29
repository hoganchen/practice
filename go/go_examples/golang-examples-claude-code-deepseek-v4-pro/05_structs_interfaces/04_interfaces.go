// ============================================================
// 知识点：接口（Interface）
//
// Go 的接口是隐式实现的（duck typing）：类型只需实现
// 接口所有方法即被认为实现了该接口，无需显式声明 implements。
// 接口是 Go 实现多态和依赖注入的核心。
// 空接口 interface{} / any 可以表示任意类型。
// ============================================================

package main

import (
	"fmt"
	"math"
)

// ---- 1. 定义接口 ----

// Shape 接口定义了所有形状必须实现的方法
type Shape interface {
	Area() float64
	Perimeter() float64
}

// ---- 2. 实现接口 ----
// Go 中接口是隐式实现的，无需写 `implements Shape`

type Circle struct {
	Radius float64
}

// 实现了 Shape 接口
func (c Circle) Area() float64 {
	return math.Pi * c.Radius * c.Radius
}

func (c Circle) Perimeter() float64 {
	return 2 * math.Pi * c.Radius
}

// Circle 自己的方法
func (c Circle) Diameter() float64 {
	return 2 * c.Radius
}

type Square struct {
	Side float64
}

// 同样实现了 Shape 接口
func (s Square) Area() float64 {
	return s.Side * s.Side
}

func (s Square) Perimeter() float64 {
	return 4 * s.Side
}

// ---- 3. 另一个接口 ----
type Stringer interface {
	String() string
}

// Circle 实现 Stringer 接口
func (c Circle) String() string {
	return fmt.Sprintf("圆(半径=%.2f)", c.Radius)
}

func (s Square) String() string {
	return fmt.Sprintf("正方形(边长=%.2f)", s.Side)
}

// ---- 4. 接口组合 ----
// 通过嵌入其他接口创建新接口
type Describer interface {
	Shape
	Stringer
}

func main() {
	// ---- 1. 多态使用 ----
	fmt.Println("--- 接口多态 ---")
	var s Shape

	s = Circle{Radius: 5}
	printShapeInfo(s)

	s = Square{Side: 4}
	printShapeInfo(s)

	// ---- 2. 类型断言 ----
	fmt.Println("\n--- 类型断言 ---")
	describe := func(s Shape) {
		// 尝试断言为 Circle
		if circle, ok := s.(Circle); ok {
			fmt.Printf("是圆形！直径=%.2f\n", circle.Diameter())
			return
		}
		// 尝试断言为 Square
		if square, ok := s.(Square); ok {
			fmt.Printf("是正方形！对角线=%.2f\n", math.Sqrt2*square.Side)
			return
		}
		fmt.Println("未知类型")
	}

	describe(Circle{Radius: 3})
	describe(Square{Side: 5})

	// ---- 3. 类型 switch ----
	fmt.Println("\n--- 类型 switch ---")
	identifyType := func(v interface{}) {
		switch val := v.(type) {
		case int:
			fmt.Printf("整数: %d\n", val)
		case string:
			fmt.Printf("字符串: %q, 长度=%d\n", val, len(val))
		case Circle:
			fmt.Printf("Circle: 半径=%.1f\n", val.Radius)
		case Shape:
			fmt.Printf("Shape: 面积=%.1f\n", val.Area())
		default:
			fmt.Printf("未知类型: %T\n", val)
		}
	}

	identifyType(42)
	identifyType("hello")
	identifyType(Circle{Radius: 2.5})
	identifyType(3.14)

	// ---- 4. 空接口 / any ----
	fmt.Println("\n--- 空接口 / any ---")
	// any 是 interface{} 的别名（Go 1.18+）
	var anything any

	anything = 42
	fmt.Printf("any = %d\n", anything)

	anything = "hello"
	fmt.Printf("any = %s\n", anything)

	anything = []int{1, 2, 3}
	fmt.Printf("any = %v\n", anything)

	// ---- 5. 接口组合 ----
	fmt.Println("\n--- 接口组合 ---")
	var d Describer = Circle{Radius: 7}
	fmt.Println(d.String())
	fmt.Printf("面积=%.2f, 周长=%.2f\n", d.Area(), d.Perimeter())

	// ---- 6. nil 接口 vs 含 nil 指针的接口 ----
	fmt.Println("\n--- 接口与 nil ---")
	var shape Shape
	fmt.Printf("nil 接口: %T, isNil=%v\n", shape, shape == nil)

	var c *Circle = nil
	shape = c                                             // 接口有具体类型和值
	fmt.Printf("nil 指针的接口: %T, isNil=%v\n", shape, shape == nil) // false!

	// 安全调用需要先检查
	if shape != nil {
		// shape.Area()  // 这会 panic，因为 c 是 nil 指针
		_ = shape
	}
}

// ---- 接受接口类型参数的函数 ----
func printShapeInfo(s Shape) {
	fmt.Printf("%T: 面积=%.2f, 周长=%.2f\n", s, s.Area(), s.Perimeter())
}

// 编译运行：go run 04_interfaces.go
