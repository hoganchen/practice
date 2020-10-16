package main

import (
	"os"
	"fmt"
	"strconv"
)

/*
Go语言并不需要显式地在每一个case后写break,语言默认执行完case后的逻辑语句会自动退出。当然了,如果你想要相邻的几个case都执行同一逻辑的话,
需要自己显式地写上一个fallthrough语句来覆盖这种默认行为。不过fallthrough语句在一般的程序中很少用到。

Go语言里的switch还可以不带操作对象(译注:switch不带操作对象时默认用true值代替,然后将每个case的表达式和true值进行比较);
可以直接罗列多种条件,像其它语言里面的多个
if else一样,下面是一个例子:

这种形式叫做无tag switch(tagless switch);这和switch true是等价的。
*/
// go run 16_switch_use.go 1 2 3 4 5 -5 -4 -3 -2 -1 0 hello world 7 8 9
func main() {
	for _, arg := range os.Args[1:] {
		switch arg {
		case "-3":
			fallthrough
		case "-2":
			fallthrough
		case "-1":
			fallthrough
		case "0":
			fallthrough
		case "1":
			fallthrough
		case "2":
			fallthrough
		case "3":
			x, _ := strconv.Atoi(arg)
			fmt.Printf("Signum(%v): %v\n", arg, Signum(x))

			fmt.Printf("arg %v is one of the '1', '2', '3'\n", arg)
		case "hello":
			fmt.Printf("arg %v is 'hello'\n", arg)
		case "world":
			fmt.Printf("arg %v is 'world'\n", arg)
		default:
			fmt.Printf("use the default sentence to handle %v parameter\n", arg)
		}
	}
}

func Signum(x int) int {
    switch {
    case x > 0:
        return +1
    default:
        return 0
    case x < 0:
        return -1
    }
}
