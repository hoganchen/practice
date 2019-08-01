package main

import "fmt"

func main() {
	// 增加次数
	const value = 10
	iter := value
	// 我的变量
	sum := 0
	count := 0
	index := iter

	for i := 1; i <= iter; i++ {
		sum = sum + iter
		iter--
		count++
	}

	fmt.Printf("sum = %v, count = %v, iter = %v\n", sum, count, iter)

	iter, sum, count = value, 0, 0

	for i := 1; i <= iter; i++ {
		sum = sum + index
		index--
		count++
	}

	fmt.Printf("sum = %v, count = %v, iter = %v\n", sum, count, iter)

	iter, sum, count = value, 0, 0

	for i:= 1; i <= iter; i++ {
		sum = sum + i
		count++
	}

	fmt.Printf("sum = %v, count = %v, iter = %v\n", sum, count, iter)
}