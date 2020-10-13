package main

import (
	"fmt"
	"time"
	"strconv"
)

func say(s string) {
	for i := 0; i < 5; i++ {
		time.Sleep(100 * time.Millisecond)
		fmt.Println(s)
	}
}

func say_goodbye() {
	time.Sleep(1000 * time.Millisecond)
	fmt.Println("say goodbye")
}

/*

Go 程

Go 程（goroutine）是由 Go 运行时管理的轻量级线程。

go f(x, y, z)

会启动一个新的 Go 程并执行

f(x, y, z)

f, x, y 和 z 的求值发生在当前的 Go 程中，而 f 的执行发生在新的 Go 程中。

Go 程在相同的地址空间中运行，因此在访问共享的内存时必须进行同步。sync 包提供了这种能力，不过在 Go 中并不经常用到，因为还有其它的办法（见下一页）。

*/
func main() {
	go say("world")
	say("hello")

	/*
	string(120)
	你期望返回的结果是什么？如果你有使用其他编程语言的经验，那么大多数人的猜测是“ 123”。
	相反，在Go中上面的类型转换会得到“ E”之类的值，那根本不是我们想要的。因为string()会直接把字节或者数字转换为字符的UTF-8表现形式。

	所以在Go中将byte或者int类型的值转换为数字的字符串表现形式的正确方法是使用strconv包中的方法，比如strconv.Itoa。
	strconv.Itoa(120)// 返回"120"
	*/
	// s := "test " + string(123)
	s := "test " + strconv.Itoa(123)
	fmt.Println("s =", s)

	for i := 0; i < 10; i++ {
		fmt.Println("i =", i)
		go say("test " + strconv.Itoa(i))
	}

	// 如果不添加如下两条语句中的任意一条，则不会打印如上"test i"的打印信息，因为当前的go程结束，所以新的go程的执行就异常了
	// say("test end")
	say_goodbye()

	fmt.Println("end routine")
}
