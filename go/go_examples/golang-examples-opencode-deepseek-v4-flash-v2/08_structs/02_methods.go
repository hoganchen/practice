// ============================================================================
// 知识点: 方法 (Method)
//
// 说明:
// - 方法是在结构体(或其他类型)上定义的函数, 拥有接收者(receiver)
// - 接收者可以是值类型或指针类型
// - 值接收者: 方法内修改不影响原对象
// - 指针接收者: 方法内修改影响原对象, 避免大对象复制
// - Go会自动处理值/指针接收者的调用 (如 p.GetAge() 或 (&p).SetAge())
//
// 编译和运行:
//   go run 08_structs\02_methods.go
// ============================================================================

package main

import "fmt"

type Rectangle struct {
	Width  float64
	Height float64
}

// 值接收者方法
func (r Rectangle) Area() float64 {
	return r.Width * r.Height
}

// 值接收者方法 (不会修改原对象)
func (r Rectangle) Scale(factor float64) Rectangle {
	r.Width *= factor
	r.Height *= factor
	return r
}

// 指针接收者方法 (会修改原对象)
func (r *Rectangle) ScaleInPlace(factor float64) {
	r.Width *= factor
	r.Height *= factor
}

// 工厂函数 (构造函数模式)
func NewRectangle(width, height float64) *Rectangle {
	return &Rectangle{Width: width, Height: height}
}

func main() {
	rect := Rectangle{Width: 10, Height: 5}
	fmt.Printf("原始: %+v, 面积: %.2f\n", rect, rect.Area())

	// 值接收者, 不修改原对象
	scaled := rect.Scale(2)
	fmt.Printf("Scale后: %+v\n", scaled)
	fmt.Printf("原对象未变: %+v\n", rect)

	// 指针接收者, 修改原对象
	rect.ScaleInPlace(2)
	fmt.Printf("ScaleInPlace后: %+v\n", rect)

	// 工厂函数
	r := NewRectangle(3, 4)
	fmt.Printf("NewRectangle: %+v, 面积: %.2f\n", r, r.Area())
}
