/*
@Author:        hogan.chen@ymail.com
@Create Date:   2020-11-11
*/

package main

import (
	"fmt"
	"time"
)

// 薪资计算器接口
type SalaryCalculator interface {
	CalculateSalary() int
}

// 普通挖掘机员工
type Contract struct {
	empId  int
	basicpay int
}

// 有蓝翔技校证的员工
type Permanent struct {
	empId  int
	basicpay int
	jj int // 奖金
}

func (p Permanent) CalculateSalary() int {
	return p.basicpay + p.jj
}

func (c Contract) CalculateSalary() int {
	return c.basicpay
}

// 总开支
func totalExpense(s []SalaryCalculator) {
	expense := 0
	for _, v := range s {
		expense = expense + v.CalculateSalary()
	}
	fmt.Printf("总开支 $%d", expense)
}

// https://studygolang.com/articles/12560
func main() {
	start := time.Now()
	fmt.Printf("Start execution at %s\n", start.Format("2006-01-02 15:04:05"))

	pemp1 := Permanent{1,3000,10000}
	pemp2 := Permanent{2, 3000, 20000}
	cemp1 := Contract{3, 3000}

	// 通过接口实现多态
	employees := []SalaryCalculator{pemp1, pemp2, cemp1}
	totalExpense(employees)

	elapsed := time.Since(start)
	fmt.Printf("\nTotal elapsed time: %s\n", elapsed)
}
