package main

import "fmt"

func main() {
	fmt.Println(sum())           // 0
	fmt.Println(sum(1))          // 1
	fmt.Println(sum(1, 2))       // 3
	fmt.Println(sum(1, 2, 3))    // 6
	fmt.Println(sum(1, 2, 3, 4)) // 10

	numbers := []int{1, 2, 3, 4}
	fmt.Println(sum(numbers...)) // 10
}

/*
参数数量可变的函数称为为可变参数函数。典型的例子就是fmt.Printf和类似函数。Printf首先接收一个的必备参数,之后接收任意个数的后续参数。

在声明可变参数函数时,需要在参数列表的最后一个参数类型之前加上省略符号“...”,这表示该函数会接收任意数量的该类型参数。
*/
func sum(vals ...int) int {
	total := 0
	for _, val := range vals {
		total += val
	}
	return total
}
