/*
@Author:        hogan.chen@ymail.com
@Create Date:   2020-11-11
*/

package main

import (
	"fmt"
	"time"
)

// Slice1 泛型类型变量
type Slice1[T int | float64 | string] []T
type Map1[KEY int | string, VALUE string | float64] map[KEY]VALUE
type Struct1[T string | int | float64] struct {
	Title   string
	Content T
}

// MyNumber 自定义类型约束
type MyNumber interface {
	int | int8 | int16 | int32 | int64 | uint | uint8 | uint16 | uint32 | uint64 | float32 | float64
}

// 分别定义类型约束
type myInt interface {
	int | int8 | int16 | int32 | int64
}
type myUint interface {
	uint | uint8 | uint16 | uint32 | uint64
}
type myFloat interface{ float32 | float64 }

// 合并类型约束，三个自定义的约束类型，最后合并上了一个具体的string类型，这种快捷的写法也是可以的，这样就可以少写一个自定义的string类型的约束类型了。
type MyNum interface {
	myInt | myUint | myFloat | string
}

/*
在go泛型中，~它表示一个类型的超集。举个例子：

type MyInt interface {  ~int | ~int64}

则表示，这个约束的范围，不仅仅是int和int64本身，也包含只要最底层的是这2种类型的，都包含。那么啥时候会碰到这种情况呢？其实就是嵌套或者自定义类型的时候。

//申明1个约束范围type IntAll interface {  int | int64 | int32}
//定义1个泛型切片type MySliceInt[T IntAll] []T
//正确:var MyInt1 MySliceInt[int]
//自定义一个int型的类型type YourInt int
//错误：实例化会报错var MyInt2 MySliceInt[YourInt]

我们运行后，会发现，第二个会报错，因为MySliceInt允许的是int作为类型实参，而不是YourInt, 虽然YourInt类型底层类型是int，但它依旧不是int类型）。

这个时候~就排上用处了，我们可以这样写就可以了，表示底层的超集类型。

type IntAll interface {  ~int | ~int64 | ~int32}
*/
type DemoInt int
type IntAll interface {
	~int8 | ~int16 | ~int | ~int64 | ~int32
	// int8 | int16 | int | int64 | int32
}
type Slice[T IntAll] []T

// Sum 泛型函数，类型约束为: int | float64 | string
func Sum[T int | float64 | string](a, b T) T {
	return a + b
}

// Foreach 泛型函数
func Foreach[T MyNumber](list []T) {
	for _, t := range list {
		// fmt.Println(t)
		fmt.Print(t, " ")
	}
	fmt.Println()
}

// 泛型函数，类型约束为: any，表示没有约束
func MyPrintf[T any](list []T) {
	for _, t := range list {
		// fmt.Println(t)
		fmt.Print(t, " ")
	}
	fmt.Println()
}

/*
go 1.18 beta1 contraints包中引入ordered，但是后续contraints被移除，原本的ordered计划后续直接引入，这里我们可以先自行定义
可以看到Ordered其实就是内建标准类型的集合
*/
type Ordered interface {
	~int | ~int8 | ~int16 | ~int32 | ~int64 |
		~uint | ~uint8 | ~uint16 | ~uint32 | ~uint64 | ~uintptr |
		~float32 | ~float64 |
		~string
}

func GetMin[T Ordered](x, y T) T {
	if x < y {
		return x
	}
	return y
}

// comparable表示约束类型为可比较的，可用的比较符号为（==、!=）
func IsEqual[T comparable](x, y T) bool {
	if x == y {
		return true
	} else {
		return false
	}
}

// https://cloud.tencent.com/developer/article/2029500
// https://zhuanlan.zhihu.com/p/594661012
func main() {
	start := time.Now()
	fmt.Printf("Program start execution at %s\n\n", start.Format("2006-01-02 15:04:05"))

	// 泛型函数的调用和泛型变量实例化一样，就是得显示的申明一下实际的这个T，到底是什么类型的，也可以调用时把T去掉，go语言会自动类型推导
	fmt.Printf("1 + 2 = %v\n", Sum[int](1, 2))
	fmt.Printf("1 + 2 = %v\n", Sum(1, 2))
	fmt.Printf("1.1 + 2.2 = %v\n", Sum[float64](1.1, 2.2))
	fmt.Printf("1.1 + 2.2 = %v\n", Sum(1.1, 2.2))
	fmt.Printf("Hello + world = %v\n", Sum[string]("Hello ", "world"))
	fmt.Printf("Hello + world = %v\n", Sum("Hello ", "world"))

	// 泛型类型变量在定义时，需要指定T
	mySlice1 := Slice1[int]{1, 2, 3}
	mySlice2 := Slice1[float64]{1.1, 2.2, 3.3}
	mySlice3 := Slice1[string]{"Hello", "world", "!"}
	fmt.Printf("mySlice1: %v\n", mySlice1)
	fmt.Printf("mySlice2: %v\n", mySlice2)
	fmt.Printf("mySlice3: %v\n", mySlice3)

	myMap1 := Map1[int, string]{1: "Hello", 2: "world"}
	myMap2 := Map1[string, string]{"s1": "Hello", "s2": "world"}
	myMap3 := Map1[int, float64]{1: 1.1, 2: 2.2}
	myMap4 := Map1[string, float64]{"s1": 1.1, "s2": 2.2}
	fmt.Printf("myMap1: %v\n", myMap1)
	fmt.Printf("myMap2: %v\n", myMap2)
	fmt.Printf("myMap3: %v\n", myMap3)
	fmt.Printf("myMap4: %v\n", myMap4)

	myStruct1 := Struct1[string]{Title: "Master", Content: "string"}
	myStruct2 := Struct1[int]{Title: "Master", Content: 1}
	myStruct3 := Struct1[float64]{Title: "Master", Content: 1.1}
	fmt.Printf("myStruct1: %v\n", myStruct1)
	fmt.Printf("myStruct2: %v\n", myStruct2)
	fmt.Printf("myStruct3: %v\n", myStruct3)

	// 泛型函数在调用时，不用指定T，go语言会自动类型推导
	Foreach[int]([]int{1, 2, 3, 4, 5})
	Foreach([]int{1, 2, 3, 4, 5})
	MyPrintf[string]([]string{"s1", "s2", "s3", "s4", "s5"})
	MyPrintf([]string{"s1", "s2", "s3", "s4", "s5"})

	// 如果IntAll的泛型定义为：type IntAll interface { int8 | int16 | int | int64 | int32 }
	// 则如下语句会打印错误：generic_add.go:135:20: DemoInt does not implement IntAll (possibly missing ~ for int in constraint IntAll)
	// ~它表示一个类型的超集，“type IntAll interface { int8 | int16 | int | int64 | int32 }” 这个约束的范围，不仅仅是包含所有的int类型本身，也包含只要最底层的是这2种类型的，都包含
	mySlice4 := Slice[DemoInt]{1, 2, 3, 4, 5}
	fmt.Printf("mySlice4: %v\n", mySlice4)

	// Ordered和comparable的用法
	fmt.Printf("GetMin(10, 20): %v\n", GetMin[int](10, 20))
	fmt.Printf("GetMin(1.1, 2.2): %v\n", GetMin[float32](1.1, 2.2))
	fmt.Printf("IsEqual(10, 20): %v\n", IsEqual[int](10, 20))
	fmt.Printf("IsEqual(\"string\", \"string\"): %v\n", IsEqual[string]("string", "string"))

	elapsed := time.Since(start)
	fmt.Printf("\nProgram end execution at %s\n", time.Now().Format("2006-01-02 15:04:05"))
	fmt.Printf("Total elapsed time: %s\n", elapsed)
}
