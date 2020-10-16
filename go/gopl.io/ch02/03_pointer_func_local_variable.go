// Ftoc prints two Fahrenheit-to-Celsius conversions.
package main

import "fmt"

func main() {
	x, y := pointerFunc(), pointerFunc()
	fmt.Printf("x = %v, y = %v\n", x, y)
	fmt.Printf("*x = %v, *y = %v\n", *x, *y)
	fmt.Printf("x == y ? %v\n", x == y)

	*x, *y = 10, 20
	fmt.Printf("x = %v, y = %v\n", x, y)
	fmt.Printf("*x = %v, *y = %v\n", *x, *y)
	fmt.Printf("x == y ? %v\n", x == y)
}

func pointerFunc() *int {
	v := 1
	return &v
}
