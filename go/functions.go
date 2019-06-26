package main

import "fmt"

func add(x int, y int) int {
	return x + y
}


func add_1 (x, y int) (z int) {
	z = x + y
	return
}

func add_2 (x int, y int) int {
	z := x + y
	return z
}

func add_3 (x int, y int) int {
	return x + y
}

func add_4(x, y int) (z int) {
	z = x + y
	return
}

func add_5(x int, y int) int {
	z := x + y
	return z
}

func add_6(x int, y int) int {
	return x + y
}

func main() {
	fmt.Println(add(42, 13))

	fmt.Println(add_1(42, 13))
	fmt.Println(add_2(42, 13))
	fmt.Println(add_3(42, 13))
	fmt.Println(add_4(42, 13))
	fmt.Println(add_5(42, 13))
	fmt.Println(add_6(42, 13))
}
