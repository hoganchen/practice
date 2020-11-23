/*
@Author:        hogan.chen@ymail.com
@Create Date:   2020-11-11
*/

package main

import (
	"fmt"
	"time"
)

type Employee struct {
	ID int
	Name string
	Address string
	DoB time.Time
	Position string
	Salary int
	ManagerID int
}

type NewEmployee struct {
	ID, Salary, ManagerID int
	Name, Address, Position string
	// date on board
	DoB time.Time
}

var dilbert Employee

type Point struct {X, Y int}

func anonymous_element() {
	/*
	Go语言有一个特性让我们只声明一个成员对应的数据类型而不指名成员的名字;这类成员就叫匿名成员。
	匿名成员的数据类型必须是命名的类型或指向一个命名的类型的指针。下面的代码中,Circle和Wheel各自都有一个匿名成员。
	我们可以说Point类型被嵌入到了Circle结构体,同时Circle类型被嵌入到了Wheel结构体。
	*/
	type Point struct {
		X, Y int
	}
	type Circle struct {
		Point
		Radius int
	}
	type Wheel struct {
		Circle
		Spokes int
	}

	var w Wheel
	w.X = 88 // equivalent to w.Circle.Point.X = 88
	w.Y = 99 // equivalent to w.Circle.Point.Y = 99
	w.Radius = 55 // equivalent to w.Circle.Radius = 55
	w.Spokes = 200

	fmt.Println(w)

	// wx := Wheel{{{11, 22}, 33}, 44} // missing type in composite literal
	wx := Wheel{Circle{Point{11, 22}, 33}, 44}
	fmt.Println(wx)

	w = Wheel{Circle: Circle{Point: Point{X: 1111}}}
	fmt.Println(w)

	wy := Wheel{Circle{Point{111, 222}, 333}, 444}
	fmt.Println(wy)
}

func main() {
	fmt.Printf("Hello world!\n")

	dilbert.ID = 100001
	dilbert.Name = "Dilbert"
	dilbert.Address = "changan street 001"
	// dilbert.DoB = time.Now()
	dilbert.DoB = time.Date(1982, time.October, 15, 8, 30, 0, 529784000, time.Local)
	dilbert.Position = "CEO"
	dilbert.Salary = 20000
	dilbert.ManagerID = 100001
	fmt.Printf("Name: %v, Struct: %v\n", dilbert.Name, dilbert)

	position := &dilbert.Position
	*position = "Chairman"
	fmt.Printf("Name: %v, Struct: %v\n", dilbert.Name, dilbert)

	var employeeOfTheMonth *Employee = &dilbert
	employeeOfTheMonth.Position += " (proactive team player)"
	fmt.Printf("Name: %v, Struct: %v\n", dilbert.Name, dilbert)

	// 要求以结构体成员定义的顺序为每个结构体成员指定一个面值。它要求写代码和读代码的人要记住结构体的每个成员的类型和顺序
	john := NewEmployee{100002, 15000, 100001, "John", "chunxi road", "CTO", time.Now()}
	fmt.Printf("Name: %v, Struct: %v\n", john.Name, john)

	lily := NewEmployee{Name: "Lily", ID: 100003, Address: "tianfu road",
		Salary: 14000, Position: "CFO", ManagerID: 100001, DoB: time.Now()}
	fmt.Printf("Name: %v, Struct: %v\n", lily.Name, lily)

	// 以成员名字和相应的值来初始化,可以包含部分或全部的成员, 在这种形式的结构体面值写法中,如果成员被忽略的话将默认用零值。
	// 因为,提供了成员的名字,所有成员出现的顺序并不重要。
	kate := NewEmployee{Name: "Kate", ID: 100004, Address: "renming south road",
		Position: "Senior Director", ManagerID: 100001}
	fmt.Printf("Name: %v, Struct: %v\n", kate.Name, kate)

	AwardAnnualRaise(&lily)
	fmt.Printf("Name: %v, Struct: %v\n", lily.Name, lily)

	AwardAnnualRaisePercent(&john, 20)
	fmt.Printf("Name: %v, Struct: %v\n", john.Name, john)

	fmt.Println(Scale(Point{1, 2}, 5))

	p := Point{1, 2}
	q := Point{2, 1}
	fmt.Println(p.X == q.X && p.Y == q.Y) // "false"
	fmt.Println(p.X == q.Y && p.Y == q.X) // "false"
	fmt.Println(p == q) // "false"

	type address struct {
		hostname string
		port int
	}

	// 可比较的结构体类型和其他可比较的类型一样,可以用于map的key类型
	hits := make(map[address]int)
	hits[address{"golang.org", 443}]++
	fmt.Println(hits)

	type Point struct {
		X, Y int
	}
	type Circle struct {
		Center Point
		Radius int
	}
	type Wheel struct {
		Circle Circle
		Spokes int
	}

	var w Wheel
	w.Circle.Center.X = 8
	w.Circle.Center.Y = 8
	w.Circle.Radius = 5
	w.Spokes = 20
	fmt.Println(w)

	anonymous_element()
}

// 结构体可以作为函数的参数和返回值
func Scale(p Point, factor int) Point {
	return Point{p.X * factor, p.Y * factor}
}

// 如果考虑效率的话,较大的结构体通常会用指针的方式传入和返回
func Bonus(e *Employee, percent int) int {
	return e.Salary * percent / 100
}

// 如果要在函数内部修改结构体成员的话,用指针传入是必须的;因为在Go语言中,所有的函数参数都是值拷贝传入的,函数参数将不再是函数调用时的原始变量。
func AwardAnnualRaise(e *NewEmployee) {
	e.Salary = e.Salary * 105 / 100
}

func AwardAnnualRaisePercent(e *NewEmployee, percent int) {
	fmt.Printf("1 + percent / 100 = %v\n", 1 + percent / 100)
	// e.Salary = e.Salary * (1 + percent / 100)
	e.Salary += e.Salary * percent / 100
}
