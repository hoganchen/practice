package main

import "golang.org/x/tour/pic"
import "fmt"

func Pic(dx, dy int) [][]uint8 {
	var ret [][]uint8
	for y := 0; y < dy; y++ {
		sl := make([]uint8, 0, dx)
		for x := 0; x < dx; x++ {
			value := uint8((x + y) / 2)
			// fmt.Printf("y = %v, x = %v, value = %v\n", y, x, value)
			sl = append(sl, value)
		}
		ret = append(ret, sl)
	}

	fmt.Println(ret)
	return ret
}

func main() {
	// xx := Pic(1, 2)
	// fmt.Println(xx)
	// dy := 2
	// dx := 5
	pic.Show(Pic)
}
