// ============================================================
// 知识点：指针（Pointer）
//
// 指针存储变量的内存地址。
// & 运算符获取变量地址，* 运算符解引用获取指针指向的值。
// Go 的指针不支持指针运算（不像 C/C++），更安全。
//
// 主要用途：
// 1. 通过函数参数修改原值
// 2. 避免大结构体的复制
// 3. 标识可选值（nil 表示没有值）
//
// 编译运行方法：
//   go run 01_pointers.go
// ============================================================

package main

import "fmt"

// -------- 值传递：不会修改原值 --------
func zeroVal(val int) {
	val = 0
}

// -------- 指针传递：会修改原值 --------
func zeroPtr(ptr *int) {
	*ptr = 0 // 通过指针修改原值
}

// -------- 返回局部变量的指针（安全，Go 会进行逃逸分析）--------
func newInt() *int {
	v := 42
	return &v // 返回局部变量的指针，在 Go 中安全
}

func main() {
	// -------- & 和 * 运算符 --------
	x := 10
	p := &x // p 是指向 x 的指针

	fmt.Println("x 的值:", x)
	fmt.Println("p 的地址:", p)   // 内存地址
	fmt.Println("*p 解引用:", *p) // 输出 10

	// 通过指针修改值
	*p = 20
	fmt.Println("修改后 x:", x) // 20

	// -------- 指针作为函数参数 --------
	fmt.Println("\n=== 指针参数 ===")
	a := 100
	zeroVal(a)
	fmt.Println("值传递后 a:", a) // 100（没变）

	zeroPtr(&a)
	fmt.Println("指针传递后 a:", a) // 0（被修改）

	// -------- 返回指针 --------
	fmt.Println("\n=== 返回指针 ===")
	ptr := newInt()
	fmt.Println("*ptr:", *ptr)

	// -------- 结构体指针 --------
	type Person struct {
		Name string
		Age  int
	}
	p1 := Person{Name: "张三", Age: 30}
	p2 := &p1              // p2 是指向 p1 的指针
	p2.Age = 31             // 自动解引用：(*p2).Age = 31
	fmt.Println("\np1.Age:", p1.Age) // 31（被修改）

	// -------- nil 指针检查 --------
	var nilPtr *int // 指针零值是 nil
	if nilPtr != nil {
		fmt.Println(*nilPtr)
	} else {
		fmt.Println("\nnilPtr 是 nil，不能解引用")
	}
}
