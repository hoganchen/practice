package main

import "fmt"

func main() {
	names := [4]string{
		"John",
		"Paul",
		"George",
		"Ringo",
	}
	fmt.Println(names)

	a := names[0:2]
	b := names[1:3]
	fmt.Println(a, b)

	b[0] = "XXX"
	fmt.Println(a, b)
	fmt.Println(names)

	/*
	在进行切片时，你可以利用它的默认行为来忽略上下界。
	切片下界的默认值为 0，上界则是该切片的长度。

	对于数组
	var a [10]int

	来说，以下切片是等价的：
	a[0:10]
	a[:10]
	a[0:]
	a[:]
	*/
	s := []int{2, 3, 5, 7, 11, 13}
	fmt.Println("s =", s,  "len(s):", len(s))

	s = s[1:4]
	fmt.Println("s =", s,  "len(s):", len(s))

	s = s[:2]
	fmt.Println("s =", s, "len(s):", len(s))

	s = s[1:]
	fmt.Println("s =", s,  "len(s):", len(s))
}
