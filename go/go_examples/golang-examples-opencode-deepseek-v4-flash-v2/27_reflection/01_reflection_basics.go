// ============================================================================
// 知识点: reflect 反射
//
// 说明:
// - reflect 包提供了运行时反射能力, 可以检查类型和值
// - reflect.TypeOf 获取类型信息
// - reflect.ValueOf 获取值信息
// - reflect.Kind 获取底层类型种类
// - 修改值需要 Elem() 获取可寻址的指针值
// - 反射有性能开销, 不应在热路径中过度使用
//
// 编译和运行:
//   go run 27_reflection\01_reflection_basics.go
// ============================================================================

package main

import (
	"fmt"
	"reflect"
)

type Person struct {
	Name string
	Age  int
}

func inspectStruct(v any) {
	val := reflect.ValueOf(v)
	typ := val.Type()

	fmt.Printf("类型: %s\n", typ)
	fmt.Printf("字段数量: %d\n", val.NumField())

	for i := 0; i < val.NumField(); i++ {
		field := typ.Field(i)
		value := val.Field(i)
		fmt.Printf("  字段 %d: %s (%s) = %v\n", i, field.Name, field.Type, value.Interface())
	}
}

func main() {
	// 基本类型反射
	str := "Hello, Reflection!"
	fmt.Println("TypeOf:", reflect.TypeOf(str))
	fmt.Println("ValueOf:", reflect.ValueOf(str))
	fmt.Println("Kind:", reflect.TypeOf(str).Kind())

	// 结构体反射
	p := Person{Name: "Alice", Age: 30}
	inspectStruct(p)

	// 通过反射修改变量
	x := 10
	v := reflect.ValueOf(&x).Elem()
	if v.CanSet() {
		v.SetInt(42)
	}
	fmt.Println("通过反射修改后 x =", x)
}
