package main

import (
	"fmt"
)

func main() {
	var hs int

	for hs = 0; hs <= 300; hs = hs + 20 {
		a := float32((hs - 32)) * 5 / 9
		x := (float32(hs) - 32) * 5 / 9
		y := float32((hs - 32) * 5 / 9)
		z := (hs - 32) * 5 / 9

		// fmt.Printf("%v.....%5.2f\n", hs, float32((hs - 32) * 5 / 9))
		fmt.Printf("%v......%5.2f......%5.2f......%5.2f......%v\n", hs, a, x, y, z)
		fmt.Printf("type(a) = %T, type(x) = %T, type(y) = %T, type(z) = %T\n", a, x, y, z)
	}
}