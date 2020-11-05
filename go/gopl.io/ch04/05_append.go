package main

import "fmt"

/*
每次调用appendInt函数,必须先检测slice底层数组是否有足够的容量来保存新添加的元素。
如果有足够空间的话,直接扩展slice(依然在原有的底层数组之上),将新添加的y元素复制到新扩展的空间,并返回slice。
因此,输入的x和输出的z共享相同的底层数组。

如果没有足够的增长空间的话,appendInt函数则会先分配一个足够大的slice用于保存新的结果,先将输入的x复制到新的空间,然后添加y元素。
结果z和输入的x引用的将是不同的底层数组。

虽然通过循环复制元素更直接,不过内置的copy函数可以方便地将一个slice复制另一个相同类型的slice。
copy函数的第一个参数是要复制的目标slice,第二个参数是源slice,目标和源的位置顺序和 dst = src 赋值语句是一致的。
两个slice可以共享同一个底层数组,甚至有重叠也没有问题。copy函数将返回成功复制的元素的个数(我们这里没有用到),
等于两个slice中较小的长度,所以我们不用担心覆盖会超出目标slice的范围。

为了提高内存使用效率,新分配的数组一般略大于保存x和y所需要的最低大小。通过在每次扩展数组时直接将长度翻倍从而避免了多次内存分配,
也确保了添加单个元素操的平均时间是一个常数时间。
*/
func main() {
	var x, y []int
	for i := 0; i < 10; i++ {
		y = appendInt(x, i)
		fmt.Printf("%d  len=%d\tcap=%d\t%v\n", i, len(y), cap(y), y)
		x = y
	}
}

func appendInt(x []int, y int) []int {
	var z []int
	zlen := len(x) + 1
	if zlen <= cap(x) {
		// There is room to grow.  Extend the slice.
		z = x[:zlen]
	} else {
		// There is insufficient space.  Allocate a new array.
		// Grow by doubling, for amortized linear complexity.
		zcap := zlen
		if zcap < 2*len(x) {
			zcap = 2 * len(x)
		}
		z = make([]int, zlen, zcap)
		copy(z, x) // a built-in function; see text
	}
	z[len(x)] = y
	return z
}
