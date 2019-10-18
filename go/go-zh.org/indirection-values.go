package main

import (
	"fmt"
	"math"
)

type Vertex struct {
	X, Y float64
}

func (v Vertex) Abs() float64 {
	return math.Sqrt(v.X*v.X + v.Y*v.Y)
}

func (v Vertex) Scale(f float64) {
	v.X = v.X * f
	v.Y = v.Y * f
}

func (v *Vertex) Scale_pointer(f float64) {
	v.X = v.X * f
	v.Y = v.Y * f
}

func ScaleFunc(v Vertex, f float64) {
	v.X = v.X * f
	v.Y = v.Y * f
}

func ScalePointerFunc(v *Vertex, f float64) {
	v.X = v.X * f
	v.Y = v.Y * f
}

func AbsFunc(v Vertex) float64 {
	return math.Sqrt(v.X*v.X + v.Y*v.Y)
}

func main() {
	v := Vertex{3, 4}
	fmt.Println("v.Abs() =", v.Abs())
	fmt.Println("AbsFunc(v) =", AbsFunc(v))

	fmt.Println("v =", v)
	v.Scale(10)
	fmt.Println("v =", v)
	v.Scale_pointer(10)
	fmt.Println("v =", v)
	ScaleFunc(v, 10)
	fmt.Println("v =", v)
	ScalePointerFunc(&v, 10)
	fmt.Println("v =", v)

	p := &Vertex{4, 3}
	fmt.Println("p.Abs() =", p.Abs())
	fmt.Println("AbsFunc(*p) =", AbsFunc(*p))

	fmt.Println("*p =", *p, ", p =", p)
	p.Scale(10)
	fmt.Println("*p =", *p, ", p =", p)
	p.Scale_pointer(10)
	fmt.Println("*p =", *p, ", p =", p)
	ScaleFunc(*p, 10)
	fmt.Println("*p =", *p, ", p =", p)
	ScalePointerFunc(p, 10)
	fmt.Println("*p =", *p, ", p =", p)
}
