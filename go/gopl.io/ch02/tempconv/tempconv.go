// Package tempconv performs Celsius and Fahrenheit conversions.
package tempconv

import "fmt"

type Celsius float64
type Fahrenheit float64
type Kelvin float64

const (
	AbsoluteZeroC Celsius = -273.15
	FreezingC     Celsius = 0
	BoilingC      Celsius = 100
)

/*
Go语言中的包和其他语言的库或模块的概念类似,目的都是为了支持模块化、封装、单独编译和代码重用。
一个包的源代码保存在一个或多个以.go为文件后缀名的源文件中,通常一个包所在目录路径的后缀是包的导入路径

包还可以让我们通过控制哪些名字是外部可见的来隐藏内部实现信息。在Go语言中,一个简单的规则是:如果一个名字是大写字母开头的,
那么该名字是导出的

每个源文件都是以包的声明语句开始,用来指名包的名字。当包被导入的时候,包内的成员将通过类似tempconv.CToF的形式访问。
而包级别的名字,例如在一个文件声明的类型和常量,在同一个包的其他源文件也是可以直接访问的,就好像所有代码都在一个文件一样。
要注意的是tempconv.go源文件导入了fmt包,但是conv.go源文件并没有,因为这个源文件中的代码并没有用到fmt包。

因为包级别的常量名都是以大写字母开头,它们可以像tempconv.AbsoluteZeroC这样被外部代码访问

在每个源文件的包声明前仅跟着的注释是包注释(§10.7.4)。通常,包注释的第一句应该先是包的功能概要说明。
一个包通常只有一个源文件有包注释(译注:如果有多个包注释,目前的文档工具会根据源文件名的先后顺序将它们链接为一个包注释)。
如果包注释很大,通常会放到一个独立的doc.go文件中。
*/

func (c Celsius) String() string    { return fmt.Sprintf("%g°C", c) }
func (f Fahrenheit) String() string { return fmt.Sprintf("%g°F", f) }
func (k Kelvin) String() string     { return fmt.Sprintf("%g°K", k) }
