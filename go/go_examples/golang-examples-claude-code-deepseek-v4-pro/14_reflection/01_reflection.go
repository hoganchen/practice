// ============================================================
// 知识点：反射（reflect 包）
//
// 反射允许程序在运行时检查类型和值。
// reflect.TypeOf 获取类型信息，reflect.ValueOf 获取值信息。
// 主要用于：序列化/反序列化库、ORM、依赖注入框架等。
// 反射有性能开销，不到万不得已不用于常规代码路径。
// ============================================================

package main

import (
	"fmt"
	"reflect"
)

// ---- 1. 演示用的类型 ----

type Person struct {
	Name    string  `json:"name" validate:"required"`
	Age     int     `json:"age" validate:"min=0,max=150"`
	Email   string  `json:"email" validate:"required,email"`
	Height  float64 `json:"height,omitempty"`
}

func (p Person) Greet() string {
	return fmt.Sprintf("你好，我是 %s，今年 %d 岁", p.Name, p.Age)
}

func (p *Person) Birthday() {
	p.Age++
}

// ---- 2. 检查类型 ----
func inspectType(v interface{}) {
	t := reflect.TypeOf(v)
	fmt.Printf("类型: %s\n", t)
	fmt.Printf("种类: %s\n", t.Kind())

	// 如果是指针，获取其指向的类型
	if t.Kind() == reflect.Ptr {
		fmt.Printf("指向类型: %s\n", t.Elem())
	}
}

// ---- 3. 检查值 ----
func inspectValue(v interface{}) {
	val := reflect.ValueOf(v)
	fmt.Printf("值: %v\n", val)
	fmt.Printf("是否有效: %t\n", val.IsValid())

	if val.Kind() == reflect.Int || val.Kind() == reflect.Float64 {
		fmt.Printf("数值: %v\n", val.Interface())
	}

	if val.Kind() == reflect.String {
		fmt.Printf("字符串: %s\n", val.String())
	}
}

// ---- 4. 遍历结构体字段 ----
func inspectStruct(v interface{}) {
	t := reflect.TypeOf(v)
	val := reflect.ValueOf(v)

	// 如果是指针，获取其指向的元素
	if t.Kind() == reflect.Ptr {
		t = t.Elem()
		val = val.Elem()
	}

	if t.Kind() != reflect.Struct {
		fmt.Println("不是结构体")
		return
	}

	fmt.Printf("结构体: %s（共 %d 个字段）\n", t.Name(), t.NumField())

	for i := 0; i < t.NumField(); i++ {
		field := t.Field(i)
		value := val.Field(i)

		fmt.Printf("  字段 %d: %s\n", i, field.Name)
		fmt.Printf("    类型: %s\n", field.Type)
		fmt.Printf("    标签: %s\n", field.Tag)
		fmt.Printf("    值  : %v\n", value.Interface())

		// 读取特定标签
		jsonTag := field.Tag.Get("json")
		validateTag := field.Tag.Get("validate")
		fmt.Printf("    json tag: %q\n", jsonTag)
		fmt.Printf("    validate tag: %q\n", validateTag)
	}
}

// ---- 5. 调用方法 ----
func callMethod(v interface{}, methodName string) {
	val := reflect.ValueOf(v)
	method := val.MethodByName(methodName)

	if !method.IsValid() {
		fmt.Printf("方法 %s 不存在\n", methodName)
		return
	}

	result := method.Call(nil) // 调用无参数方法
	fmt.Printf("调用 %s() 结果: %v\n", methodName, result[0].Interface())
}

// ---- 6. 通过反射修改值 ----
func modifyValue(v interface{}, newName string) {
	val := reflect.ValueOf(v)

	// 必须是指针才能修改
	if val.Kind() != reflect.Ptr {
		fmt.Println("不能修改非指针值")
		return
	}

	elem := val.Elem()
	nameField := elem.FieldByName("Name")

	if nameField.IsValid() && nameField.CanSet() {
		nameField.SetString(newName)
		fmt.Printf("修改 Name 为: %s\n", newName)
	} else {
		fmt.Println("无法修改 Name 字段")
	}
}

func main() {
	// ---- 1. 基本类型检查 ----
	fmt.Println("--- 基本类型 ---")

	inspectType(42)
	inspectType("hello")
	inspectType(3.14)
	inspectType(Person{})
	inspectType(&Person{})

	// ---- 2. 值检查 ----
	fmt.Println("\n--- 值检查 ---")

	inspectValue(100)
	inspectValue("reflect")
	inspectValue(true)

	// ---- 3. 结构体反射 ----
	fmt.Println("\n--- 结构体反射 ---")

	p := Person{
		Name:   "Alice",
		Age:    30,
		Email:  "alice@example.com",
		Height: 165.5,
	}

	inspectStruct(p)

	// ---- 4. 动态调用方法 ----
	fmt.Println("\n--- 动态调用方法 ---")

	// 调用值接收者方法
	callMethod(p, "Greet")

	// ---- 5. 通过反射修改 ----
	fmt.Println("\n--- 反射修改 ---")

	pp := &Person{Name: "Bob", Age: 25}
	fmt.Printf("修改前: %s\n", pp.Name)
	modifyValue(pp, "Robert")
	fmt.Printf("修改后: %s\n", pp.Name)

	// ---- 6. Kind 判断 ----
	fmt.Println("\n--- Kind 判断 ---")

	checkKind := func(v interface{}) {
		kind := reflect.TypeOf(v).Kind()
		switch kind {
		case reflect.Int, reflect.Int8, reflect.Int16, reflect.Int32, reflect.Int64:
			fmt.Printf("  整数类型: %s (值=%v)\n", kind, v)
		case reflect.Float32, reflect.Float64:
			fmt.Printf("  浮点类型: %s (值=%v)\n", kind, v)
		case reflect.String:
			fmt.Printf("  字符串: %s (值=%q)\n", kind, v)
		case reflect.Slice:
			fmt.Printf("  Slice: %s (值=%v)\n", kind, v)
		case reflect.Map:
			fmt.Printf("  Map: %s (值=%v)\n", kind, v)
		case reflect.Struct:
			fmt.Printf("  Struct: %s (值=%v)\n", kind, v)
		default:
			fmt.Printf("  其他: %s\n", kind)
		}
	}

	checkKind(42)
	checkKind(3.14)
	checkKind("hello")
	checkKind([]int{1, 2, 3})
	checkKind(map[string]int{"a": 1})
	checkKind(Person{})

	// ---- 7. 创建类型的反射实例 ----
	fmt.Println("\n--- 创建实例 ---")

	// 通过反射创建新的 Person 实例
	t := reflect.TypeOf(Person{})
	newInstance := reflect.New(t).Elem()

	newInstance.FieldByName("Name").SetString("反射创建")
	newInstance.FieldByName("Age").SetInt(100)
	newInstance.FieldByName("Email").SetString("reflect@example.com")

	fmt.Printf("反射创建: %+v\n", newInstance.Interface())
}

// 编译运行：go run 01_reflection.go
