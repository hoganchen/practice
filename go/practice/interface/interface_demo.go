package main

import (
	"fmt"
	"math"
)

type Abser interface {
	Set(float64, float64)
	Abs() float64
}

func main() {
	var a Abser
	f := MyFloat(-math.Sqrt2)
	v := Vertex{3, 4}

	a = f         // a MyFloat 实现了 Abser
	a.Set(10, 20) // 该修改不能生效，因为go语言是值传递，除非把interface的receiver修改为*f类型
	fmt.Println(a.Abs())
	a = &v // a *Vertex 实现了 Abser

	// 下面一行，v 是一个 Vertex（而不是 *Vertex）
	// 所以没有实现 Abser。
	// a = v
	a.Set(30, 40)

	fmt.Println(a.Abs())
}

type MyFloat float64

func (f MyFloat) Set(x, y float64) {
	f = MyFloat(x)
}

func (f MyFloat) Abs() float64 {
	if f < 0 {
		return float64(-f)
	}
	return float64(f)
}

type Vertex struct {
	X, Y float64
}

func (v *Vertex) Set(x, y float64) {
	v.X = x
	v.Y = y
}

func (v *Vertex) Abs() float64 {
	return math.Sqrt(v.X*v.X + v.Y*v.Y)
}
