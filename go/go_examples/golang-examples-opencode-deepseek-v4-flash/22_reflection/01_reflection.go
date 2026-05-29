// ============================================================
// 知识点：反射（Reflection）
//
// 反射让程序可以在运行时检查类型和值信息。
// reflect 包提供：Type（类型）、Value（值）、Kind（种类）。
// 常见用途：JSON 序列化、ORM 映射、配置文件解析。
// 注意：反射性能较低，谨慎使用。
//
// 编译运行方法：
//   go run 01_reflection.go
// ============================================================

package main

import (
	"fmt"
	"reflect"
)

// -------- 用于反射的结构体 --------
type User struct {
	Name string `json:"name" validate:"required"`
	Age  int    `json:"age" validate:"gte=0,lte=150"`
	Email string `json:"email,omitempty" validate:"email"`
}

// 实现 String 方法
func (u User) Greet() string {
	return fmt.Sprintf("你好，我是 %s，%d 岁", u.Name, u.Age)
}

func main() {
	// -------- reflect.Type 和 reflect.Value --------
	fmt.Println("=== 获取类型和值信息 ===")
	x := 42

	t := reflect.TypeOf(x)
	v := reflect.ValueOf(x)

	fmt.Println("类型:", t)
	fmt.Println("种类:", t.Kind())
	fmt.Println("值:", v)
	fmt.Println("接口值:", v.Interface())

	// -------- 反射结构体 --------
	fmt.Println("\n=== 反射结构体 ===")
	user := User{
		Name:  "张三",
		Age:   30,
		Email: "zhangsan@example.com",
	}

	userType := reflect.TypeOf(user)
	userValue := reflect.ValueOf(user)

	// 遍历字段
	for i := 0; i < userType.NumField(); i++ {
		field := userType.Field(i)
		value := userValue.Field(i)

		fmt.Printf("字段 %d: %s (%s) = %v [标签: %s]\n",
			i, field.Name, field.Type, value.Interface(), field.Tag)
	}

	// -------- 反射调用方法 --------
	fmt.Println("\n=== 反射调用方法 ===")
	greetMethod := userValue.MethodByName("Greet")
	if greetMethod.IsValid() {
		results := greetMethod.Call(nil) // 调用方法
		fmt.Println("反射调用的结果:", results[0].String())
	}

	// -------- 通过反射修改值（需要指针）--------
	fmt.Println("\n=== 通过反射修改值 ===")
	pi := 3.14
	pv := reflect.ValueOf(&pi) // 需要指针
	pv.Elem().SetFloat(3.14159)
	fmt.Println("修改后:", pi)

	// -------- Kind 检查 --------
	fmt.Println("\n=== Kind 检查 ===")
	checkType(42)
	checkType("hello")
	checkType(3.14)
	checkType([]int{1, 2, 3})
	checkType(User{})
}

func checkType(i interface{}) {
	t := reflect.TypeOf(i)
	switch t.Kind() {
	case reflect.Int, reflect.Float64:
		fmt.Printf("%v 是数值类型 (%s)\n", i, t)
	case reflect.String:
		fmt.Printf("%v 是字符串类型\n", i)
	case reflect.Slice:
		fmt.Printf("%v 是切片类型 (%s)\n", i, t.Elem())
	case reflect.Struct:
		fmt.Printf("%v 是结构体类型 (%s)\n", i, t)
	default:
		fmt.Printf("%v 的类型是 %s\n", i, t)
	}
}
