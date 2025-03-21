package main

import "fmt"

var pow = []int{1, 2, 4, 8, 16, 32, 64, 128}

/*
for 循环的 range 形式可遍历切片或映射。
当使用 for 循环遍历切片时，每次迭代都会返回两个值。第一个值为当前元素的下标，第二个值为该下标所对应元素的一份副本。

可以将下标或值赋予 _ 来忽略它。
for i, _ := range pow
for _, value := range pow

若你只需要索引，忽略第二个变量即可。
for i := range pow
*/
func main() {
	for i, v := range pow {
		fmt.Printf("2**%d = %d\n", i, v)
	}

	pow := make([]int, 10)
	for i := range pow {
		pow[i] = 1 << uint(i) // == 2**i
	}
	for _, value := range pow {
		fmt.Printf("%d\n", value)
	}
}
