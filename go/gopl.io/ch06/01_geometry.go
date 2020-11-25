/*
@Author:        hogan.chen@ymail.com
@Create Date:   2020-11-11
*/

package main

import (
	"fmt"
	"./geometry"
)

func main() {
	fmt.Printf("Hello world!\n")
	xx := geometry.Point{X:1, Y:2}
	yy := geometry.Point{X:3, Y:4}
	fmt.Printf("Distance: %v\n", geometry.Distance(xx, yy))
	fmt.Printf("Distance: %v\n", yy.Distance(xx))

	pp := geometry.Path{geometry.Point{X:1, Y:2}, geometry.Point{X:3, Y:4}, geometry.Point{X:5, Y:6}}
	fmt.Printf("Distance: %v\n", pp.Distance())
}
