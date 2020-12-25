/*
@Author:        hogan.chen@ymail.com
@Create Date:   2020-11-11
*/

package main

import (
	"fmt"
	"time"
)

func increase_cnt(val int) {
	fmt.Printf("increase_cnt function: &val = %p, val = %v\n", &val, val)
	val += 1
}

func increase_cnt_with_pointer(val *int) {
	fmt.Printf("increase_cnt_with_pointer function: &val = %p, val = %p, val = %v\n", &val, val, *val)
	*val += 1
}

/*
main function: &val = 0xc82000a2e8, val = 10
increase_cnt function: &val = 0xc82000a308, val = 10
main function: &val = 0xc82000a2e8, val = 10
increase_cnt_with_pointer function: &val = 0xc820032028, val = 0xc82000a2e8, val = 10
main function: &val = 0xc82000a2e8, val = 11
main function: &p = 0xc820032030, p = 0xc82000a2e8, p = 11
increase_cnt_with_pointer function: &val = 0xc820032038, val = 0xc82000a2e8, val = 11
main function: &val = 0xc82000a2e8, val = 12

由如上打印看出，go函数的参数传递都是值传递，在调用函数前，在内存中创建实参的拷贝，然后传递给函数，并在函数调用完成后销毁
在main函数中，指针p的地址为0xc820032030，而在函数中，该地址则为0xc820032038，但是这两个地址的值都是val的地址，即0xc82000a2e8
可得出在函数调用前，创建了p变量的拷贝，值一样，然后在函数调用中，传递的是原始值的拷贝
*/
func main() {
	start := time.Now()
	fmt.Printf("Program start execution at %s\n\n", start.Format("2006-01-02 15:04:05"))

	val := 10
	fmt.Printf("main function: &val = %p, val = %v\n", &val, val)

	increase_cnt(val)
	fmt.Printf("main function: &val = %p, val = %v\n", &val, val)

	increase_cnt_with_pointer(&val)
	fmt.Printf("main function: &val = %p, val = %v\n", &val, val)

	var p *int
	p = &val
	fmt.Printf("main function: &p = %p, p = %p, p = %v\n", &p, p, *p)
	increase_cnt_with_pointer(p)
	fmt.Printf("main function: &val = %p, val = %v\n", &val, val)

	elapsed := time.Since(start)
	fmt.Printf("\nProgram end execution at %s\n", time.Now().Format("2006-01-02 15:04:05"))
	fmt.Printf("Total elapsed time: %s\n", elapsed)
}
