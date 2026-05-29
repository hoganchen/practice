// ============================================================
// 知识点：结构体嵌入（Embedding）
//
// Go 不支持类继承，但通过结构体嵌入实现了"组合优于继承"。
// 嵌入的类型会将其字段和方法"提升"到外层结构体。
// 注意这不是继承，而是组合的语法糖。
//
// 编译运行方法：
//   go run 03_struct_embedding.go
// ============================================================

package main

import "fmt"

// -------- 基础结构体 --------
type Animal struct {
	Name string
}

func (a Animal) Speak() string {
	return "..." // 动物的通用叫声
}

func (a Animal) Move() string {
	return a.Name + " 在移动"
}

// -------- 嵌入 Animal --------
type Dog struct {
	Animal          // 嵌入 Animal（匿名嵌入）
	Breed string    // Dog 自己的字段
}

// Dog "覆盖"（override）了 Animal 的 Speak 方法
func (d Dog) Speak() string {
	return "汪汪！"
}

// -------- 嵌入多个结构体 --------
type Swimmer interface {
	Swim() string
}

type Fish struct {
	Animal
}

func (f Fish) Swim() string {
	return f.Name + " 在游泳"
}

// -------- 既可以嵌入结构体，也可以嵌入接口 --------
type Duck struct {
	Animal
	// 嵌入结构体后，Duck 自动拥有了 Animal 的所有字段和方法
}

func main() {
	// -------- 嵌入结构体的字段提升 --------
	dog := Dog{
		Animal: Animal{Name: "旺财"},
		Breed:  "金毛",
	}

	// 可以直接访问 Animal 的字段（提升）
	fmt.Println("名字:", dog.Name)       // 等价于 dog.Animal.Name
	fmt.Println("品种:", dog.Breed)
	fmt.Println("叫声:", dog.Speak())    // 调用 Dog 自己的 Speak
	fmt.Println("移动:", dog.Move())     // 调用 Animal 的 Move

	// -------- 多态行为 --------
	animals := []Animal{
		{Name: "通用动物"},
		// Dog 不能直接放入 []Animal（不是继承）
	}

	// 但可以通过接口实现多态
	fmt.Println("\n=== 接口方式 ===")
	fmt.Println("动物名:", animals[0].Name)

	// 直接访问嵌入字段
	fmt.Println("\n直接访问嵌入字段:")
	fmt.Println("dog.Animal.Name:", dog.Animal.Name)
}
