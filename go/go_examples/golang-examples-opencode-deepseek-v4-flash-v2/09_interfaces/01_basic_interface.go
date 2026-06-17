// ============================================================================
// 知识点: 接口 (Interface) 基础
//
// 说明:
// - 接口定义了一组方法签名, 是Go实现多态的方式
// - Go的接口是隐式实现: 类型只要实现了接口的所有方法, 即视为实现了该接口
// - 这种"鸭子类型"设计让代码更灵活, 不需要显式声明 implements
// - 接口值可以赋值为任何实现了该接口的类型
//
// 编译和运行:
//   go run 09_interfaces\01_basic_interface.go
// ============================================================================

package main

import "fmt"

// 定义接口
type Animal interface {
	Speak() string
	Move() string
}

// Dog 实现 Animal 接口
type Dog struct{ Name string }

func (d Dog) Speak() string { return "汪汪!" }
func (d Dog) Move() string  { return "奔跑" }

// Cat 实现 Animal 接口
type Cat struct{ Name string }

func (c Cat) Speak() string { return "喵喵!" }
func (c Cat) Move() string  { return "悄悄走" }

// Bird 实现 Animal 接口
type Bird struct{ Name string }

func (b Bird) Speak() string { return "叽叽!" }
func (b Bird) Move() string  { return "飞翔" }

func describe(a Animal) {
	fmt.Printf("  %T %v: 叫 %s, 移动方式: %s\n", a, a, a.Speak(), a.Move())
}

func main() {
	animals := []Animal{
		Dog{Name: "旺财"},
		Cat{Name: "小花"},
		Bird{Name: "小翠"},
	}

	fmt.Println("动物们的技能:")
	for _, a := range animals {
		describe(a)
	}
}
