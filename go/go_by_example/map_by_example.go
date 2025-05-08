package main

import "fmt"

func main() {

	m := make(map[string]int)

	m["k1"] = 7
	m["k2"] = 13

	fmt.Println("map:", m)

	v1 := m["k1"]
	fmt.Println("v1: ", v1)

	fmt.Println("len:", len(m))

	delete(m, "k2")
	fmt.Println("map:", m)

	_, prs := m["k2"]
	fmt.Println("prs:", prs)

	n := map[string]int{"foo": 1, "bar": 2}
	fmt.Println("map:", n)

	var m1 map[string]int // nil map
	fmt.Println("m1: ", m1, ", m1 == nil ? :", m1 == nil)

	var m2 = make(map[string]int) // 空map
	fmt.Println("m2: ", m2, ", m2 == nil ? :", m2 == nil)
}
