package main

import "fmt"
import "golang.org/x/tour/pic"

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

/*

练习：切片

实现 Pic。它应当返回一个长度为 dy 的切片，其中每个元素是一个长度为 dx，元素类型为 uint8 的切片。当你运行此程序时，它会将每个整数解释为灰度值（好吧，其实是蓝度值）并显示它所对应的图像。

图像的选择由你来定。几个有趣的函数包括 (x+y)/2, x*y, x^y, x*log(y) 和 x%(y+1)。

（提示：需要使用循环来分配 [][]uint8 中的每个 []uint8；请使用 uint8(intValue) 在类型之间转换；你可能会用到 math 包中的函数。）


cannot find package "golang.org/x/tour/pic"错误解决(https://blog.csdn.net/wsliangjian/article/details/97253595)

mkdir -p $GOPATH/src/golang.org/x
cd $GOPATH/src/golang.org/x
git clone https://github.com/golang/tour.git

*/
func main() {
	pic.Show(Pic)
}
