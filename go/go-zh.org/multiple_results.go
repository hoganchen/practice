package main

import "fmt"

func swap(x, y string) (string, string) {
	return y, x
}

func swap_string(x, y string) {
	// 使用:格式声明一个变量并赋值，这时候不需要声明变量的类型
	temp := x
	x = y
	y = temp

	// Printf是格式化的打印，Println会在变量的两端都补上空格
	fmt.Println("In swap_string function: x =", x, ", y =", y, ", temp =", temp)
	fmt.Printf("In swap_string function: x = %v, y = %v, temp = %v\n", x, y, temp)
}

func swap_int(x, y *int) {
	fmt.Printf("x = %p, y = %p\n", x, y)
	// *x, *y = *y, *x
	x, y = y, x
	fmt.Printf("x = %p, y = %p\n", x, y)

}

func main() {
	a, b := swap("hello", "world")
	fmt.Println(a, b)

	x, y := "hello", "world"
	swap_string(x, y)
	fmt.Println(x, y)

	i, j := 12, 13
	fmt.Printf("&i = %p, &j = %p\n", &i, &j)
	swap_int(&i, &j)
	fmt.Printf("&i = %p, &j = %p\n", &i, &j)
	fmt.Println(i, j)
}
