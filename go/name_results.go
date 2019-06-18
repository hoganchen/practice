package main

import "fmt"

func split(sum int) (x, y int) {
	x = sum * 4 / 9
	y = sum - x
	return
}

func split_float(sum int) (x, y float32) {
	x = float32(sum) * 4 / 9
	y = float32(sum) - x
	return
}

func main() {
	fmt.Println(split(17))
	fmt.Println(split_float(17))
}
