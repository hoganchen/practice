package main

import "fmt"

/*
每个数组的大小都是固定的。而切片则为数组元素提供动态大小的、灵活的视角。在实践中，切片比数组更常用。
类型 []T 表示一个元素类型为 T 的切片。

切片通过两个下标来界定，即一个上界和一个下界，二者以冒号分隔：
a[low : high]

它会选择一个半开区间，包括第一个元素，但排除最后一个元素。
以下表达式创建了一个切片，它包含 a 中下标从 1 到 3 的元素：
a[1:4]
*/
func main() {
	var a [2]string
	a[0] = "Hello"
	a[1] = "World"
	fmt.Println(a[0], a[1])
	fmt.Println(a)

    //创建数组声明长度
    var aaa1 = [5]int{1,2,3,4}
    fmt.Println(aaa1)

    //创建数组不声明长度
    var aaa2 = [...]int{1111,2222,3333,4444,55555,6666}
	fmt.Println(aaa2)
	fmt.Println(aaa2[2:4])
	aaa2_copy := aaa2
	fmt.Printf("&aaa2 = %p, &aaa2_copy: %p\n", &aaa2, &aaa2_copy)
	aaa2_p := &aaa2
	fmt.Printf("aaa2_p = %p, aaa2_p[2] = %v\n", aaa2_p, aaa2_p[2])

	/*
	切片并不存储任何数据，它只是描述了底层数组中的一段。
	更改切片的元素会修改其底层数组中对应的元素。
	与它共享底层数组的切片都会观测到这些修改。

	从以下语句可以看出，切片可以看做一个指针，指向被切片的数组，并保存切片后的数组信息
	一个切片是一个数组片段的描述。它包含了指向数组的指针，片段的长度， 和容量（片段的最大长度）
	https://blog.go-zh.org/go-slices-usage-and-internals
	*/
	aaa2_slice := aaa2_p[3:6]
	fmt.Println(aaa2_slice)
	aaa2_slice[0] = 9999
	fmt.Println(aaa2_slice)
	fmt.Println(aaa2)
	var aaa2_sli []int = aaa2[0:4]
	fmt.Println(aaa2_sli)
	aaa2_sli[0] = 8888
	fmt.Println(aaa2)
	fmt.Printf("aaa2 = %p, aaa2_p = %p, &aaa2_p[0] = %p, &aaa2_p[1] = %p, &aaa2_p[2] = %p, aaa2_slice = %p, aaa2_sli = %p\n", &aaa2, aaa2_p, &aaa2_p[0], &aaa2_p[1], &aaa2_p[2], &aaa2_slice, &aaa2_sli)
	fmt.Printf("&aaa2_slice = %p, &aaa2_slice[0] = %p, &aaa2_slice[1] = %p, &aaa2_sli = %p, &aaa2_sli[0] = %p, &aaa2_sli[1] = %p\n", &aaa2_slice, &aaa2_slice[0], &aaa2_slice[1], &aaa2_sli, &aaa2_sli[0], &aaa2_sli[1])
	fmt.Printf("len(aaa2_slice) = %v, len(aaa2_sli) = %v\n", len(aaa2_slice), len(aaa2_sli))

    //创建数组并初始化其中部分
    var aaa3 = [5]string{1:"aaa",2:"bbb"}
	fmt.Println(aaa3)

	primes := [6]int{2, 3, 5, 7, 11, 13}
	fmt.Println(primes)

	for i := 0; i < len(primes); i++ {
		fmt.Printf("primes[%v] = %v\n", i, primes[i])
	}
}
