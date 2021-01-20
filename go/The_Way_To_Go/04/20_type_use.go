/*
@Author:        hogan.chen@ymail.com
@Create Date:   2020-11-11
*/

package main

import (
	"fmt"
	"time"
)

type TZ int

/*
当你在使用某个类型时,你可以给它起另一个名字,然后你就可以在你的代码中使用新的名字(用于简化名称或解决名称冲突)。
在type TZ int中,TZ就是int类型的新名称(用于表示程序中的时区),然后就可以使用TZ来操作int类型的数据。

实际上,类型别名得到的新类型并非和原类型完全相同,新类型不会拥有原类型所附带的方法(第10章);
TZ可以自定义一个方法用来输出更加人性化的时区信息。
*/
func main() {
	start := time.Now()
	fmt.Printf("Program start execution at %s\n\n", start.Format("2006-01-02 15:04:05"))

	var a, b TZ = 3, 4
	c := a + b

	fmt.Printf("c type: %T, c value: %v\n", c, c)

	elapsed := time.Since(start)
	fmt.Printf("\nProgram end execution at %s\n", time.Now().Format("2006-01-02 15:04:05"))
	fmt.Printf("Total elapsed time: %s\n", elapsed)
}
