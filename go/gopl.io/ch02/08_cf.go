// Cf converts its numeric argument to Celsius and Fahrenheit.
package main

import (
	"fmt"
	"os"
	"strconv"

	"./tempconv"
)

/*
在Go语言程序中,每个包都是有一个全局唯一的导入路径。导入语句中类似"gopl.io/ch2/tempconv"的字符串对应包的导入路径。
Go语言的规范并没有定义这些字符串的具体含义或包来自哪里,它们是由构建工具来解释的。当使用Go语言自带的go工具箱时(第十章),
一个导入路径代表一个目录中的一个或多个Go源文件。

除了包的导入路径,每个包还有一个包名,包名一般是短小的名字(并不要求包名是唯一的),包名在包的声明处指定。按照惯例,
一个包的名字和包的导入路径的最后一个字段相同
*/
/*
go run 08_cf.go 32 212 -40
*/
func main() {
	for _, arg := range os.Args[1:] {
		t, err := strconv.ParseFloat(arg, 64)
		if err != nil {
			fmt.Fprintf(os.Stderr, "cf: %v\n", err)
		}
		f := tempconv.Fahrenheit(t)
		c := tempconv.Celsius(t)
		fmt.Printf("%s = %s, %s = %s\n",
			f, tempconv.FToC(f), c, tempconv.CToF(c))
	}
}
