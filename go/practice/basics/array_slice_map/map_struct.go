/*
@Author:        hogan.chen@ymail.com
@Create Date:   2020-11-11
*/

package main

import (
	"fmt"
	"time"
)

type gridTradeInfoStruct struct {
	tradeFund      float64
	totalTradeFund float64
}

type newGridTradeInfoStruct struct {
	tradeFund      float64
	totalTradeFund float64
	count          int
}

func map_struct_op_01() {
	var newGridTradeInfoStructSliceMap = map[string][]newGridTradeInfoStruct{}
	code := "000001"
	count := 10

	newGridTradeInfoStructSlice := [...]newGridTradeInfoStruct{
		{tradeFund: 1000, totalTradeFund: 1000},
		{tradeFund: 2000, totalTradeFund: 2000},
		{tradeFund: 3000, totalTradeFund: 3000},
	}

	for _, newGridTradeInfo := range newGridTradeInfoStructSlice {
		newGridTradeInfo.count = count
		count += 10

		newGridTradeInfoStructSliceMap[code] = append(newGridTradeInfoStructSliceMap[code], newGridTradeInfo)
	}

	for k, v := range newGridTradeInfoStructSliceMap {
		for _, newGridTradeInfoStruct := range v {
			fmt.Printf("code: %v, newGridTradeInfoStruct: %v\n", k, newGridTradeInfoStruct)
		}
	}
}

// https://www.cnblogs.com/snowInPluto/p/7477365.html
// 结构体作为map的元素，不能直接赋值，需要结构体指针作为元素，才能对结构体成员单独赋值，详见：https://studygolang.com/articles/31024
/*
	1. 问题的产生

	这个问题在github上可以追溯到2012年提交的一个issue，链接为https://github.com/golang/go/issues/3117；如上图，结构体作为map的元素时，不能够直接赋值给结构体的某个字段，也就是map中的struct中的字段不能够直接寻址。

	2. 问题产生的原因

	关于golang中map的这种古怪的特性有这样几个观点：

	1）map作为一个封装好的数据结构，由于它底层可能会由于数据扩张而进行迁移，所以拒绝直接寻址，避免产生野指针；

	2）map中的key在不存在的时候，赋值语句其实会进行新的k-v值的插入，所以拒绝直接寻址结构体内的字段，以防结构体不存在的时候可能造成的错误；

	3）这可能和map的并发不安全性相关

	    x = y 这种赋值的方式，你必须知道 x的地址，然后才能把值 y 赋给 x。
	    但 go 中的 map 的 value 本身是不可寻址的，因为 map 的扩容的时候，可能要做 key/val pair迁移
	    value 本身地址是会改变的
	    不支持寻址的话又怎么能赋值呢

*/
func main() {
	start := time.Now()
	fmt.Printf("Program start execution at %s\n\n", start.Format("2006-01-02 15:04:05"))

	var gridTradeInfoStructMap = map[string]*gridTradeInfoStruct{}
	if _, ok := gridTradeInfoStructMap["000001"]; !ok {
		gridTradeInfoStructMap["000001"] = &gridTradeInfoStruct{10000, 10000}
	}

	fmt.Printf("gridTradeInfoStructMap[\"000001\"]: %v\n", gridTradeInfoStructMap["000001"])
	fmt.Printf("gridTradeInfoStructMap[\"000001\"].tradeFund: %v\n", gridTradeInfoStructMap["000001"].tradeFund)
	fmt.Printf("gridTradeInfoStructMap[\"000001\"].totalTradeFund: %v\n", gridTradeInfoStructMap["000001"].totalTradeFund)

	gridTradeInfoStructMap["000001"].tradeFund += 1000
	gridTradeInfoStructMap["000001"].totalTradeFund += 2000

	fmt.Printf("gridTradeInfoStructMap[\"000001\"]: %v\n", gridTradeInfoStructMap["000001"])
	fmt.Printf("gridTradeInfoStructMap[\"000001\"].tradeFund: %v\n", gridTradeInfoStructMap["000001"].tradeFund)
	fmt.Printf("gridTradeInfoStructMap[\"000001\"].totalTradeFund: %v\n", gridTradeInfoStructMap["000001"].totalTradeFund)

	var holdCodeSliceMap = map[string][]*gridTradeInfoStruct{}

	holdCodeSliceMap["000001"] = append(holdCodeSliceMap["000001"], &gridTradeInfoStruct{10000, 10000})
	holdCodeSliceMap["000001"] = append(holdCodeSliceMap["000001"], &gridTradeInfoStruct{20000, 20000})
	fmt.Printf("holdCodeSliceMap[\"000001\"][0]: %v\n", holdCodeSliceMap["000001"][0])
	fmt.Printf("holdCodeSliceMap[\"000001\"][1]: %v\n", holdCodeSliceMap["000001"][1])

	holdCodeSliceMap["000001"][0].tradeFund += 1000
	holdCodeSliceMap["000001"][0].totalTradeFund += 1000
	holdCodeSliceMap["000001"][1].tradeFund += 1000
	holdCodeSliceMap["000001"][1].totalTradeFund += 1000
	fmt.Printf("holdCodeSliceMap[\"000001\"]: %v\n", holdCodeSliceMap["000001"])
	fmt.Printf("len(holdCodeSliceMap[\"000001\"]): %v\n", len(holdCodeSliceMap["000001"]))
	fmt.Printf("holdCodeSliceMap[\"000001\"][0]: %v\n", holdCodeSliceMap["000001"][0])
	fmt.Printf("holdCodeSliceMap[\"000001\"][1]: %v\n", holdCodeSliceMap["000001"][1])

	for k, v := range holdCodeSliceMap {
		fmt.Printf("v: %p\n", v)
		holdCodeSliceMap[k] = append(v[:1], v[2:]...)
	}

	fmt.Printf("holdCodeSliceMap[\"000001\"]: %v\n", holdCodeSliceMap["000001"])
	fmt.Printf("len(holdCodeSliceMap[\"000001\"]): %v\n", len(holdCodeSliceMap["000001"]))
	fmt.Printf("holdCodeSliceMap[\"000001\"][0]: %v\n", holdCodeSliceMap["000001"][0])
	// fmt.Printf("holdCodeSliceMap[\"000001\"][1]: %v\n", holdCodeSliceMap["000001"][1])

	map_struct_op_01()

	elapsed := time.Since(start)
	fmt.Printf("\nProgram end execution at %s\n", time.Now().Format("2006-01-02 15:04:05"))
	fmt.Printf("Total elapsed time: %s\n", elapsed)
}
