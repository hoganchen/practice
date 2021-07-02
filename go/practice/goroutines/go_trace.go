package main

import (
    "os"
    "fmt"
    "runtime/trace"
)

/*
(5) 可视化 GMP 编程

有 2 种方式可以查看一个程序的 GMP 的数据。

方式 1：go tool trace

trace 记录了运行时的信息，能提供可视化的 Web 页面。

简单测试代码：main 函数创建 trace，trace 会运行在单独的 goroutine 中，然后 main 打印”Hello World” 退出。

运行程序

$ go run go_trace.go
Hello World

会得到一个 trace.out 文件，然后我们可以用一个工具打开，来分析这个文件。

$ go tool trace trace.out
2020/02/23 10:44:11 Parsing trace...
2020/02/23 10:44:11 Splitting trace...
2020/02/23 10:44:11 Opening browser. Trace viewer is listening on http://127.0.0.1:33479

我们可以通过浏览器打开 http://127.0.0.1:33479 网址，点击 view trace 能够看见可视化的调度流程。
*/
func main() {

    //创建trace文件
    f, err := os.Create("trace.out")
    if err != nil {
        panic(err)
    }

    defer f.Close()

    //启动trace goroutine
    err = trace.Start(f)
    if err != nil {
        panic(err)
    }
    defer trace.Stop()

    //main
    fmt.Println("Hello World")
}
