package main

import "fmt"

func main() {
	a := make([]int, 5)
	printSlice("a", a)

	b := make([]int, 0, 5)
	printSlice("b", b)
	b = append(b, 1)
	printSlice("b", b)

	c := b[:2]
	printSlice("c", c)

	d := c[2:5]
	printSlice("d", d)

	var e []int
	printSlice("e", e)
	e = append(e, 10)
	printSlice("e", e)
	e = append(e, 20, 30, 40)
	printSlice("e", e)

	var numbers []int
    for i := 0; i < 100; i++ {
        numbers = append(numbers, i)
        // fmt.Printf("numbers: %v, len: %d, cap: %d, pointer: %p\n", numbers, len(numbers), cap(numbers), numbers)
        fmt.Printf("len: %3d, cap: %3d, pointer: %p\n", len(numbers), cap(numbers), numbers)
	}

	var num [10][]int
    for i := 0; i < 10; i++ {
		for j := 0; j < 10; j++ {
			num[i] = append(num[i], i * j)
			fmt.Printf("len: %3d, cap: %3d, pointer: %p, num: %v\n", len(num), cap(num), num[i], num)
		}
    }
}

func printSlice(s string, x []int) {
	fmt.Printf("index = %s, len = %d, cap = %d, x pointer: %12p, x = %v\n",
		s, len(x), cap(x), x, x)
}
