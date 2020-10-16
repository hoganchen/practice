package main

import "fmt"

const boilingF = 212.0

func main() {
	var f = boilingF
	// f := boilingF

	if true {
		var x, y, z int
		x, y, z = 1, 2, 3
		fmt.Printf("x = %v, y = %v, z = %v\n", x, y, z)

		var i, j, k = "test", 25, false
		fmt.Printf("i = %v, j = %v, k = %v\n", i, j, k)
	} else {
		x, y, z := 3, 2, 1
		fmt.Printf("x = %v, y = %v, z = %v\n", x, y, z)

		var i, j, k = true, 2.5, "four"
		fmt.Printf("i = %v, j = %v, k = %v\n", i, j, k)
	}

	var c = (f - 32) * 5 / 9
	fmt.Printf("boiling point = %g°F or %g°C\n", f, c)
	// Output:
	// boiling point = 212°F or 100°C
}
