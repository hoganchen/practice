// ============================================================================
// 知识点: 结构体嵌入 (Embedding)
//
// 说明:
// - Go通过结构体嵌入实现组合而非继承, 是实现代码复用的主要方式
// - 嵌入的字段会"提升"其方法和字段到外部结构体
// - 如果外部和内部有同名字段, 需要显式指定
// - 嵌入接口也可以将接口方法提升
//
// 编译和运行:
//   go run 08_structs\03_embedded_struct.go
// ============================================================================

package main

import "fmt"

type Engine struct {
	Horsepower int
	Type       string
}

func (e Engine) Start() {
	fmt.Printf("引擎启动 (%d HP, %s)\n", e.Horsepower, e.Type)
}

func (e Engine) Stop() {
	fmt.Println("引擎关闭")
}

type Car struct {
	Brand string
	Model string
	Engine           // 嵌入 Engine 结构体
	Sunroof bool
}

func main() {
	car := Car{
		Brand:   "Tesla",
		Model:   "Model 3",
		Engine:  Engine{Horsepower: 283, Type: "电动"},
		Sunroof: true,
	}

	// 直接访问嵌入类型的方法和字段 (提升)
	car.Start()
	car.Stop()

	fmt.Printf("品牌: %s, 型号: %s, 马力: %d\n", car.Brand, car.Model, car.Horsepower)

	// 通过全路径访问
	fmt.Println("引擎类型:", car.Engine.Type)
}
