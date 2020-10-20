package main

import (
	"flag"
	"fmt"
	"strings"
)

var n = flag.Bool("n", false, "omit trailing newline")
var sep = flag.String("s", " ", "separator")

// go run 04_echo4.go -h
// go run 04_echo4.go 1 2 3 4 5 hello world

/*
调用flag.Bool函数会创建一个新的对应布尔型标志参数的变量。它有三个属性:第一个是的命令行标志参数的名字“n”,
然后是该标志参数的默认值(这里是false),最后是该标志参数对应的描述信息。如果用户在命令行输入了一个无效的标志参数,
或者输入-h或-help参数,那么将打印所有标志参数的名字、默认值和描述信息。类似的,调用flag.String函数将于创建一个对应字符串类型的标志参数变量,
同样包含命令行标志参数对应的参数名、默认值、和描述信息。程序中的sep和n变量分别是指向对应命令行标志参数变量的指针,
因此必须用*sep和*n形式的指针语法间接引用它们。

$ go build gopl.io/ch2/echo4
$ ./echo4 a bc def
a bc def
$ ./echo4 -s / a bc def
a/bc/def
$ ./echo4 -n a bc def
a bc  def$
$ ./echo4 -help
Usage of ./echo4:
    -n omit trailing newline
    -s string
        separator (default " ")
*/
func main() {
	flag.Parse()
	fmt.Print(strings.Join(flag.Args(), *sep))
	if !*n {
		fmt.Println()
	}
}
