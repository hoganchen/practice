// ============================================================
// 知识点：指针（Pointers）
//
// Go 有指针，但不支持指针运算（与 C 不同）。
// & 取地址，* 解引用。
// 指针主要用于：修改传入的值、避免大结构体拷贝。
// nil 指针是安全的（但解引用 nil 会 panic）。
// ============================================================

package main

import "fmt"

// ---- 1. 基本用法 ----

func main() {
	// ---- 1. & 和 * ----
	fmt.Println("--- & 和 * ---")

	x := 42
	p := &x // p 是指向 x 的指针（*int）

	fmt.Printf("x 的值: %d\n", x)
	fmt.Printf("x 的地址: %p\n", &x)
	fmt.Printf("p 的值（即 x 的地址）: %p\n", p)
	fmt.Printf("*p 的值（即 x 的值）: %d\n", *p)

	// 通过指针修改变量的值
	*p = 100
	fmt.Printf("修改后 x 的值: %d\n", x) // 100

	// ---- 2. 指针与函数参数 ----
	fmt.Println("\n--- 指针参数 ---")

	// 值传递：不会修改原值
	zeroVal := func(v int) {
		v = 0
	}

	// 指针传递：会修改原值
	zeroPtr := func(v *int) {
		*v = 0
	}

	val := 42
	zeroVal(val)
	fmt.Println("zeroVal 后 val =", val) // 42（未变）

	zeroPtr(&val)
	fmt.Println("zeroPtr 后 val =", val) // 0（已变）

	// ---- 3. new 函数 ----
	fmt.Println("\n--- new 函数 ---")
	// new(T) 创建 T 类型的零值，返回 *T
	ptr := new(int)
	fmt.Printf("*ptr = %d\n", *ptr) // 0
	*ptr = 10
	fmt.Printf("*ptr = %d\n", *ptr) // 10

	// new 对比 make：
	// new(T) 返回 *T（零值指针）
	// make(T) 返回 T（初始化后的引用类型：slice/map/channel）

	// ---- 4. 结构体指针 ----
	fmt.Println("\n--- 结构体指针 ---")
	type Person struct {
		Name string
		Age  int
	}

	// 方式1：& 取地址
	alice := Person{"Alice", 30}
	ap := &alice
	ap.Age = 31 // 等价于 (*ap).Age = 31，Go 语法糖
	fmt.Println("alice.Age:", alice.Age) // 31

	// 方式2：直接取地址创建
	bob := &Person{Name: "Bob", Age: 25}
	fmt.Printf("bob: %+v\n", bob)

	// 方式3：new
	carol := new(Person)
	carol.Name = "Carol"
	carol.Age = 28
	fmt.Printf("carol: %+v\n", carol)

	// ---- 5. 指向 slice/map 的指针 ----
	fmt.Println("\n--- 指向 slice/map 的指针 ---")
	// 注意：slice 和 map 本身是引用类型，通常不需要指针

	slice := []int{1, 2, 3}
	modifySlice := func(s []int) {
		s[0] = 999 // 可以修改！slice 是引用
	}
	modifySlice(slice)
	fmt.Println("slice[0]:", slice[0]) // 999（已变）

	// 但如果要改变 slice 本身（如 append 改变了指针），需要用指针
	addElement := func(s *[]int) {
		*s = append(*s, 4)
	}
	addElement(&slice)
	fmt.Println("添加后:", slice) // [999 2 3 4]

	// ---- 6. 指针的零值是 nil ----
	fmt.Println("\n--- nil 指针 ---")
	var nilPtr *int
	fmt.Printf("nil 指针: %v\n", nilPtr)

	// 检查指针是否为 nil 再解引用
	if nilPtr != nil {
		fmt.Println(*nilPtr) // 不会执行
	} else {
		fmt.Println("指针为 nil，安全跳过")
	}

	// 函数返回指针的惯用模式
	toPtr := func(v int) *int {
		return &v
	}
	result := toPtr(42)
	fmt.Println("函数返回指针:", *result)
}

// 编译运行：go run 01_pointers.go
