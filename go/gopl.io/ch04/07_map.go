/*
@Author:        hogan.chen@ymail.com
@Create Date:   2020-11-11
*/

package main

import (
	"fmt"
)

// 函数可以定义不使用，但是变量不可以
/*
和slice一样,map之间也不能进行相等比较;唯一的例外是和nil进行比较。要判断两个map是否包含相同的key和value,我们必须通过一个循环实现
*/
func equal(x, y map[string]int) bool {
	if len(x) != len(y) {
		return false
	}
	for k, xv := range x {
		if yv, ok := y[k]; !ok || yv != xv {
			return false
		}
	}
	return true
}

/*
在Go语言中,一个map就是一个哈希表的引用,map类型可以写为map[K]V,其中K和V分别对应key和value。map中所有的key都有相同的类型,
所有的value也有着相同的类型,但是key和value之间可以是不同的数据类型。
*/
func main() {
	fmt.Printf("Hello world!\n")

	// https://blog.csdn.net/wade3015/article/details/100149338
	// https://cyent.github.io/golang/datatype/map_nil/
	// nil map不能直接赋值，需要先初始化，可用make函数初始化
	var age_map map[string]int
	if age_map == nil {
		fmt.Printf("age_map is nil\n")
	} else {
		fmt.Printf("age_map is not nil\n")
	}

	// nil map不能直接赋值，需要先初始化，可用以下任意一条语句初始化
	// age_map = make(map[string]int)
	age_map = map[string]int{}
	age_map["kate"] = 30
	fmt.Printf("len(age_map): %d, %v\n", len(age_map), age_map)

	// 内置的make函数可以创建一个map
	ages := make(map[string]int)
	if ages == nil {
		fmt.Printf("ages is nil\n")
	} else {
		fmt.Printf("ages is not nil\n")
	}
	ages["alice"] = 31
	ages["charlie"] = 34
	fmt.Printf("len(ages): %d, %v\n", len(ages), ages)
	delete(ages, "alice") // 使用内置的delete函数可以删除元素
	fmt.Printf("len(ages): %d, %v\n", len(ages), ages)

	// 即使map中不存在“bob”下面的代码也可以正常工作,因为ages["bob"]失败时将返回0。
	ages["bob"] = ages["bob"] + 1 // happy birthday!

	// 判断john key对应的value是否存在
	_, ok := ages["john"]
	if ok {
		ages["john"] += 1 // happy birthday!
	} else {
		ages["john"] = 0
	}

	// map的下标语法将产生两个值;第二个是一个布尔值,用于报告元素是否真的存在。布尔变量一般命名为ok,特别适合马上用于if条件判断部分
	if _, ok := ages["lily"]; ok {
		ages["lily"]++
	} else {
		ages["lily"] += 35
	}

	fmt.Printf("len(ages): %d, %v\n", len(ages), ages)

	for name, age := range ages {
		fmt.Printf("name: %s\tage: %d\n", name, age)
	}

	// 但是map中的元素并不是一个变量,因此我们不能对map的元素进行取址操作:
	// _ = &ages["bob"] // compile error: cannot take address of map element

	// 我们也可以用map字面值的语法创建map,同时还可以指定一些最初的key/value
	person := map[string]int {
		"alice": 31,
		"charlie": 34,
	}
	fmt.Printf("len(person): %d, %v\n", len(person), person)
	delete(person, "charlie") // 使用内置的delete函数可以删除元素
	fmt.Printf("len(person): %d, %v\n", len(person), person)

	fmt.Printf("ages == person ? %v\n", equal(ages, person))
}
