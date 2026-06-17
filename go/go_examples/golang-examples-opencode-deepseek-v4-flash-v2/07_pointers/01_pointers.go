// ============================================================================
// 知识点: 指针 (Pointer)
//
// 说明:
// - & 取地址运算符, * 解引用运算符
// - Go的指针不能进行指针运算(不支持p++这种操作), 保证内存安全
// - 零值指针为 nil
// - 指针常用于: 修改变量、节省大结构体拷贝
// - Go中有自动垃圾回收, 不会出现悬挂指针
//
// 编译和运行:
//   go run 07_pointers\01_pointers.go
// ============================================================================

package main

import "fmt"

func zeroVal(val int) {
	val = 0
}

func zeroPtr(ptr *int) {
	*ptr = 0
}

func main() {
	// 基本指针操作
	x := 42
	p := &x
	fmt.Println("x 的值:", x)
	fmt.Println("p (x的地址):", p)
	fmt.Println("*p (解引用):", *p)

	// 通过指针修改值
	*p = 100
	fmt.Println("通过指针修改后, x =", x)

	// 值传递 vs 指针传递
	a := 5
	zeroVal(a)
	fmt.Println("zeroVal 后 a =", a) // 5 (未修改)

	zeroPtr(&a)
	fmt.Println("zeroPtr 后 a =", a) // 0 (已修改)

	// new 函数创建指针
	ptr := new(int)
	*ptr = 42
	fmt.Println("new(int) 指针值:", *ptr)

	// 指针比较
	var p1, p2 *int
	fmt.Println("nil 指针比较:", p1 == p2) // true

	p1 = &a
	p2 = &a
	fmt.Println("指向同一地址:", p1 == p2) // true
}
