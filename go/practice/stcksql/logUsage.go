/*
@Author:        hogan.chen@ymail.com
@Create Date:   2020-11-11
*/

package main

import (
	"fmt"
	"log"
	"time"
)

type User struct {
	Name string
	Age  int
}

func init() {
	log.SetFlags(log.Ldate | log.Ltime | log.Lshortfile)
}

/*
https://darjun.github.io/2020/02/07/godailylib/log/

log默认输出到标准错误（stderr），每条日志前会自动加上日期和时间。如果日志不是以换行符结尾的，那么log会自动加上换行符。即每条日志会在新行中输出。

log提供了三组函数：

    Print/Printf/Println：正常输出日志；
    Panic/Panicf/Panicln：输出日志后，以拼装好的字符串为参数调用panic；
    Fatal/Fatalf/Fatalln：输出日志后，调用os.Exit(1)退出程序。

命名比较容易辨别，带f后缀的有格式化功能，带ln后缀的会在日志后增加一个换行符。

注意，上面的程序中由于调用log.Panicf会panic，所以log.Fatalf并不会调用。

前缀

调用log.SetPrefix为每条日志文本前增加一个前缀。例如，在上面的程序中设置Login:前缀：
log.SetPrefix("Login: ")

选项

设置选项可在每条输出的文本前增加一些额外信息，如日期时间、文件名等。

log库提供了 6 个选项：

// src/log/log.go
const (
  Ldate         = 1 << iota
  Ltime
  Lmicroseconds
  Llongfile
  Lshortfile
  LUTC
)

    Ldate：输出当地时区的日期，如2020/02/07；
    Ltime：输出当地时区的时间，如11:45:45；
    Lmicroseconds：输出的时间精确到微秒，设置了该选项就不用设置Ltime了。如11:45:45.123123；
    Llongfile：输出长文件名+行号，含包名，如github.com/darjun/go-daily-lib/log/flag/main.go:50；
    Lshortfile：输出短文件名+行号，不含包名，如main.go:50；
    LUTC：如果设置了Ldate或Ltime，将输出 UTC 时间，而非当地时区。

调用log.SetFlag设置选项，可以一次设置多个：
log.SetFlags(log.Lshortfile | log.Ldate | log.Lmicroseconds)
 */
func main() {
	start := time.Now()
	fmt.Printf("Program start execution at %s\n\n", start.Format("2006-01-02 15:04:05"))

	u := User{
		Name: "dj",
		Age:  18,
	}

	log.Printf("%s login, age:%d", u.Name, u.Age)
	log.Panicf("Oh, system error when %s login", u.Name)
	log.Fatalf("Danger! hacker %s login", u.Name)

	elapsed := time.Since(start)
	fmt.Printf("\nProgram end execution at %s\n", time.Now().Format("2006-01-02 15:04:05"))
	fmt.Printf("Total elapsed time: %s\n", elapsed)
}