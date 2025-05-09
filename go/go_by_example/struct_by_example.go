package main

import "fmt"

type person struct {
	name string
	age  int
}

func newPerson(name string) *person {
	// 编译器判定 p 需在堆上分配，避免函数返回后指针失效
	p := person{name: name}
	p.age = 42
	return &p
}

/*
golang的变量逃逸分析
通过 go build 或 go run 的 -gcflags 参数，输出逃逸分析结果
go build -gcflags="-m -l"  # -m 显示逃逸信息，-l 禁用内联优化以简化输出

	-l	disable inlining
	-m	print optimization decisions

go run -gcflags="-m -l" struct_by_example.go
*/
func main() {

	fmt.Println(person{"Bob", 20})

	fmt.Println(person{name: "Alice", age: 30})

	fmt.Println(person{name: "Fred"})

	fmt.Println(&person{name: "Ann", age: 40})

	fmt.Println(newPerson("Jon"))

	s := person{name: "Sean", age: 50}
	fmt.Println(s.name)

	sp := &s
	fmt.Println(sp.age)

	sp.age = 51
	fmt.Println(sp.age)
}
