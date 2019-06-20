package main

import "fmt"

type Vertex struct {
	X int
	Y int
}

var (
	v1 = Vertex{1, 2}  // 创建一个 Vertex 类型的结构体
	v2 = Vertex{X: 1}  // Y:0 被隐式地赋予
	v3 = Vertex{}      // X:0 Y:0
	p  = &Vertex{1, 2} // 创建一个 *Vertex 类型的结构体（指针）
)

func main() {
	fmt.Println(Vertex{1, 2})
	v := Vertex{1, 2}
	v.X = 4
	fmt.Println(v)

	ps := &v
	ps.X = 1e9
	fmt.Println(v)

	fmt.Println(v1, p, v2, v3)
	fmt.Printf("v1 = %v, p address: %p, p point address = %p, p = %v, v2 = %v, v3 = %v\n", v1, p, p, v2, v3)
}
