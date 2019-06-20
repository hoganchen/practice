package main

import "fmt"

var c, python, java bool
var x float32
var y, z float32 = 1.1, 2.2

func main() {
	var i int
	fmt.Println(i, x, c, python, java)
	fmt.Printf("i = %v, x = %v, y = %v, z = %v, c = %v, python = %v, java = %v\n", i, x, y, z, c, python, java)
}
