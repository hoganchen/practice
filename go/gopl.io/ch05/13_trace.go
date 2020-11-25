package main

import (
	"log"
	"time"
)

func main() {
	bigSlowOperation()
}

/*
调试复杂程序时,defer机制也常被用于记录何时进入和退出函数。下例中的bigSlowOperation函数,直接调用trace记录函数的被调情况。
bigSlowOperation被调时,trace会返回一个函数值,该函数值会在bigSlowOperation退出时被调用。
通过这种方式,我们可以只通过一条语句控制函数的入口和所有的出口,甚至可以记录函数的运行时间,如例子中的start。
需要注意一点:不要忘记defer语句后的圆括号,否则本该在进入时执行的操作会在退出时执行,而本该在退出时执行的,永远不会被执行。
*/
func bigSlowOperation() {
	// 注意区分defer后的函数加括号与未加括号的区别
	defer trace("bigSlowOperation")() // don't forget the extra parentheses
	log.Printf("In bigSlowOperation function...")
	// ...lots of work...
	time.Sleep(10 * time.Second) // simulate slow operation by sleeping
}

func trace(msg string) func() {
	start := time.Now()
	log.Printf("In trace function, enter %s", msg)
	return func() { log.Printf("In trace function, exit %s (%s)", msg, time.Since(start)) }
}
