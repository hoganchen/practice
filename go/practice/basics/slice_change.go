/*
@Author:        hogan.chen@ymail.com
@Create Date:   2024-10-01
*/

package main

import (
	"fmt"
	"time"
)

type Person struct {
	Name string
	Age  int
}

func basicDataType() {
	nums := []int{1, 2, 3, 4}

	// 方法1：通过索引遍历
	for i := 0; i < len(nums); i++ {
		nums[i] *= 2
	}
	fmt.Println(nums) // 输出: [2 4 6 8]

	// 方法2：使用range遍历索引
	for i := range nums {
		nums[i] *= 2
	}

	fmt.Println(nums) // 输出: [4 8 12 16]
}

func structDataType() {
	people := []Person{
		{"Alice", 30},
		{"Bob", 25},
	}

	// 正确方式：通过索引修改结构体字段
	for i := range people {
		people[i].Age += 1
	}

	fmt.Println(people) // 输出: [{Alice 31} {Bob 26}]
}

func pointerDataType() {
	a, b, c := 1, 2, 3
	nums := []*int{&a, &b, &c}

	// 通过指针副本修改指向的值
	for _, p := range nums {
		*p *= 2 // 修改指针指向的值
	}
	fmt.Println(*nums[0], *nums[1], *nums[2]) // 输出: 2 4 6

	// 若要替换指针本身，需用索引
	d := 100
	for i := range nums {
		nums[i] = &d // 通过索引修改切片中的指针
	}

	fmt.Println(*nums[0], *nums[1], *nums[2]) // 输出: 100 100 100
}

func main() {
	start := time.Now()
	fmt.Printf("Program start execution at %s\n\n", start.Format("2006-01-02 15:04:05"))

	basicDataType()
	structDataType()
	pointerDataType()

	elapsed := time.Since(start)
	fmt.Printf("\nProgram end execution at %s\n", time.Now().Format("2006-01-02 15:04:05"))
	fmt.Printf("Total elapsed time: %s\n", elapsed)
}
