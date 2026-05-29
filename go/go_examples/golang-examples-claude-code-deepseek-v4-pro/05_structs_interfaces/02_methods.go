// ============================================================
// 知识点：方法（Methods）
//
// Go 方法是在类型上定义的函数，通过接收者（receiver）实现。
// 接收者可以是值类型或指针类型。
// 值接收者不会修改原值，指针接收者会修改原值。
// 可以为任何自定义类型定义方法（不仅是结构体）。
// ============================================================

package main

import (
	"fmt"
	"math"
)

// ---- 1. 定义带方法的类型 ----

type Rectangle struct {
	Width  float64
	Height float64
}

// 值接收者方法：不会修改原对象
func (r Rectangle) Area() float64 {
	return r.Width * r.Height
}

// 值接收者方法
func (r Rectangle) Perimeter() float64 {
	return 2 * (r.Width + r.Height)
}

// 指针接收者方法：可以修改原对象
func (r *Rectangle) Scale(factor float64) {
	r.Width *= factor
	r.Height *= factor
}

// 指针接收者方法：避免大结构体的拷贝
func (r *Rectangle) Info() string {
	return fmt.Sprintf("矩形: %.1f×%.1f, 面积=%.1f, 周长=%.1f",
		r.Width, r.Height, r.Area(), r.Perimeter())
}

// ---- 2. 为非结构体类型定义方法 ----

// 基于 int 定义新的数值类型
type Celsius float64
type Fahrenheit float64

func (c Celsius) ToFahrenheit() Fahrenheit {
	return Fahrenheit(c*9/5 + 32)
}

func (f Fahrenheit) ToCelsius() Celsius {
	return Celsius((f - 32) * 5 / 9)
}

// ---- 3. 方法带命名的返回值 ----
type Point struct {
	X, Y float64
}

func (p Point) DistanceToOrigin() float64 {
	return math.Sqrt(p.X*p.X + p.Y*p.Y)
}

// String 方法实现了 fmt.Stringer 接口
func (p Point) String() string {
	return fmt.Sprintf("(%.1f, %.1f)", p.X, p.Y)
}

func main() {
	// ---- 1. 值接收者 vs 指针接收者 ----
	fmt.Println("--- 值接收者 vs 指针接收者 ---")
	rect := Rectangle{Width: 10, Height: 5}

	// 值接收者方法
	fmt.Printf("面积: %.1f\n", rect.Area())
	fmt.Printf("周长: %.1f\n", rect.Perimeter())

	// 指针接收者方法
	rect.Scale(2) // 语法糖：(&rect).Scale(2)
	fmt.Printf("缩放后: %.1f×%.1f\n", rect.Width, rect.Height)
	fmt.Println(rect.Info())

	// ---- 2. 通过指针调用值方法 ----
	pRect := &Rectangle{Width: 3, Height: 4}
	fmt.Printf("面积(指针): %.1f\n", pRect.Area()) // 自动解引用

	// ---- 3. 非结构体类型的方法 ----
	fmt.Println("\n--- 自定义类型方法 ---")
	temp := Celsius(100)
	fmt.Printf("100°C = %.1f°F\n", temp.ToFahrenheit())

	boiling := Fahrenheit(212)
	fmt.Printf("212°F = %.1f°C\n", boiling.ToCelsius())

	// ---- 4. 方法链式调用 ----
	fmt.Println("\n--- 方法表达式 ---")
	// 方法可以像普通函数一样使用（方法表达式）
	areaFunc := Rectangle.Area          // 类型方法（接收者为第一个参数）
	r := Rectangle{Width: 6, Height: 8}
	fmt.Printf("方法表达式调用: %.1f\n", areaFunc(r))

	// ---- 5. 自动转换规则 ----
	fmt.Println("\n--- 自动转换规则 ---")
	// Go 自动处理值/指针方法的调用
	var r1 Rectangle = Rectangle{Width: 2, Height: 3}
	var r2 *Rectangle = &Rectangle{Width: 4, Height: 5}

	// 值类型调用指针方法——自动取地址
	r1.Scale(2) // 等价于 (&r1).Scale(2)
	fmt.Println("r1:", r1.Width, r1.Height) // 4, 6

	// 指针类型调用值方法——自动解引用
	fmt.Println("r2 面积:", r2.Area()) // 等价于 (*r2).Area()

	// ---- 6. String() 方法 ----
	fmt.Println("\n--- String() 方法 ---")
	p := Point{X: 3, Y: 4}
	fmt.Println("点:", p)                                     // 自动调用 String()
	fmt.Printf("到原点距离: %.2f\n", p.DistanceToOrigin())
}

// 编译运行：go run 02_methods.go
