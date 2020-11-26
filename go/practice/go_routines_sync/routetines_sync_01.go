package main

import (
    "fmt"
    "sync"
    "time"
)

var wg sync.WaitGroup //定义一个同步等待的组

func task(i int){
    fmt.Println("task...",i)
    //耗时操作任务，网络请求，读取文件
    time.Sleep(time.Second)
    wg.Done() //减去一个计数
}

/*
sync.WaitGroup 是等待一组协程结束，sync.WaitGroup 只有 3 个方法，
Add() 添加一个计数，Done() 减去一个计数，Wait() 阻塞直到所有任务完成。
http://www.pangulab.com/post/84cc3ac0.html
*/
func main(){
    for i:= 0;i<10;i++{
        wg.Add(1) //添加一个计数
        go task(i)
    }
    wg.Wait() //阻塞直到所有任务完成
    fmt.Println("over")
}