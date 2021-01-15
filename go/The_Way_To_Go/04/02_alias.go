/*
@Author:        hogan.chen@ymail.com
@Create Date:   2020-11-11
*/

package main

// import fm "fmt"

import (
	fm "fmt"
	"time"
)

/*
因此包也可以作为命名空间使用,帮助避免命名冲突(名称冲突):两个包中的同名变量的区别在于他们的包名,例
如pack1.Thing和pack2.Thing。
你可以通过使用包的别名来解决包名之间的名称冲突,或者说根据你的个人喜好对包名进行重新设置,如:
import fm "fmt"。下面的代码展示了如何使用包的别名
*/
func main() {
	start := time.Now()
	fm.Printf("Program start execution at %s\n\n", start.Format("2006-01-02 15:04:05"))

	elapsed := time.Since(start)
	fm.Printf("\nProgram end execution at %s\n", time.Now().Format("2006-01-02 15:04:05"))
	fm.Printf("Total elapsed time: %s\n", elapsed)
}
