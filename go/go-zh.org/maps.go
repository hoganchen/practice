package main

import "fmt"

type Vertex struct {
	Lat, Long float64
}

var m map[string]Vertex

var mm = map[string]Vertex{
	"Bell Labs": Vertex{
		40.68433, -74.39967,
	},
	"Google": Vertex{
		37.42202, -122.08408,
	},
}

var mmm = map[string]Vertex{
	"Bell Labs": {40.68433, -74.39967},
	"Google":    {37.42202, -122.08408},
}

func main() {
	m = make(map[string]Vertex)
	m["Bell Labs"] = Vertex{
		40.68433, -74.39967,
	}
	fmt.Println(m["Bell Labs"])
	fmt.Println(mm)
	fmt.Println(mmm)

	/*
	修改映射
	在映射 m 中插入或修改元素：
	m[key] = elem

	获取元素：
	elem = m[key]

	删除元素：
	delete(m, key)

	通过双赋值检测某个键是否存在：
	elem, ok = m[key]

	若 key 在 m 中，ok 为 true ；否则，ok 为 false。
	若 key 不在映射中，那么 elem 是该映射元素类型的零值。
	同样的，当从映射中读取某个不存在的键时，结果是映射的元素类型的零值。
	注 ：若 elem 或 ok 还未声明，你可以使用短变量声明：
	elem, ok := m[key]
	*/
	mmmm := make(map[string]int)

	mmmm["Answer"] = 42
	fmt.Println("The value:", mmmm["Answer"])

	mmmm["Answer"] = 48
	fmt.Println("The value:", mmmm["Answer"])

	delete(mmmm, "Answer")
	fmt.Println("The value:", mmmm["Answer"])

	v, ok := mmmm["Answer"]
	fmt.Println("The value:", v, "Present?", ok)

}
