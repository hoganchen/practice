package main

import (
	"fmt"
	"math"
)

// 这是一个几何体的基本接口。
type geometry interface {
	area() float64
	perim() float64
}

// 在这个例子中，我们将为 rect 和 circle 实现该接口。
type rect struct {
	width, height float64
}
type circle struct {
	radius float64
}

// 要在 Go 中实现一个接口，我们只需要实现接口中的所有方法。 这里我们为 rect 实现了 geometry 接口。
func (r rect) area() float64 {
	return r.width * r.height
}
func (r rect) perim() float64 {
	return 2*r.width + 2*r.height
}

// circle 的实现(实现了 geometry 接口)。
func (c circle) area() float64 {
	return math.Pi * c.radius * c.radius
}
func (c circle) perim() float64 {
	return 2 * math.Pi * c.radius
}

// 如果一个变量实现了某个接口，我们就可以调用指定接口中的方法。 这儿有一个通用的 measure 函数，我们可以通过它来使用所有的 geometry。
func measure(g geometry) {
	fmt.Println(g)
	fmt.Println(g.area())
	fmt.Println(g.perim())
}

// 空接口，接受任意类型参数的函数
func printAnything(v interface{}) {
	fmt.Printf("Received value: %v, Type: %T\n", v, v)
}

// 空接口，接受任意类型参数的函数
func processValue(i interface{}) {
	// // 类型断言
	// if s, ok := i.(string); ok {
	// 	fmt.Println("It's a string:", s)
	// } else if n, ok := i.(int); ok {
	// 	fmt.Println("It's an int:", n)
	// } else {
	// 	fmt.Printf("Unhandled type: %T\n", i)
	// }

	// 或者使用类型选择（更清晰）
	switch v := i.(type) {
	case string:
		fmt.Printf("String: %s\n", v)
	case int:
		fmt.Printf("Int: %d\n", v)
	case float64:
		fmt.Printf("Float64: %f\n", v)
	case []int:
		fmt.Printf("Slice of int: %v\n", v)
	case rect:
		fmt.Printf("Rectangle: width=%f, height=%f\n", v.width, v.height)
	case circle:
		fmt.Printf("Circle: radius=%f\n", v.radius)
	default:
		fmt.Printf("Unexpected type: %T\n", v)
	}
}

func mainPrint() {
	// 这条语句的作用是创建了一个名为 iSlice的空接口类型变量，并用一个切片来初始化它。
	// 这个切片的特殊之处在于，它的每个元素也是空接口类型，并且被赋予了不同类型的值，从而形成了一个可以容纳任意类型数据的 ​​“异构容器”
	var iSlice interface{} = []interface{}{42, "hello", 3.14, []int{1, 2, 3}, rect{width: 5, height: 10}, circle{radius: 7}}

	for _, v := range iSlice.([]interface{}) {
		processValue(v)
		printAnything(v)
	}

	// printAnything(42)                          // int
	// printAnything(42.12)                       // float64
	// printAnything("hello")                     // string
	// printAnything([]int{1, 2, 3})              // slice
	// printAnything(rect{width: 10, height: 10}) // slice
}

func main() {
	r := rect{width: 3, height: 4}
	c := circle{radius: 5}

	// 结构体类型 circle 和 rect 都实现了 geometry 接口， 所以我们可以将其实例作为 measure 的参数。
	measure(r)
	measure(c)

	var i geometry
	i = r
	measure(i)
	i = c
	measure(i)

	mainPrint()
}
