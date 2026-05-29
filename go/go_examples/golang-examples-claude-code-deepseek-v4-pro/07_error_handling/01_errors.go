// ============================================================
// 知识点：错误处理（Error Handling）
//
// Go 没有 try-catch 异常机制，使用 error 接口处理错误。
// error 是内置接口：type error interface { Error() string }
// 通过多返回值返回错误，调用方检查 err != nil。
// Go 1.13+ 引入 errors.Is / errors.As 支持错误链。
// ============================================================

package main

import (
	"errors"
	"fmt"
	"math"
)

// ---- 1. errors.New 创建基本错误 ----
func sqrt(n float64) (float64, error) {
	if n < 0 {
		return 0, errors.New("不能对负数开平方")
	}
	return math.Sqrt(n), nil
}

// ---- 2. fmt.Errorf 创建带格式的错误 ----
func divide(a, b float64) (float64, error) {
	if b == 0 {
		return 0, fmt.Errorf("division by zero: %f / %f", a, b)
	}
	return a / b, nil
}

// ---- 3. 哨兵错误（Sentinel Error） ----
// 定义包级别的错误变量，调用方可以比较
var (
	ErrNotFound   = errors.New("资源未找到")
	ErrPermission = errors.New("权限不足")
	ErrInvalid    = errors.New("无效参数")
	ErrTimeout    = errors.New("操作超时")
)

type DataStore struct {
	data map[string]string
}

func (d *DataStore) Get(key string) (string, error) {
	if key == "" {
		return "", ErrInvalid
	}
	if d.data == nil {
		return "", ErrNotFound
	}
	val, ok := d.data[key]
	if !ok {
		return "", ErrNotFound
	}
	return val, nil
}

// ---- 4. errors.Is — 检查错误链中的哨兵 ----
// 即使错误被包装(wrap)了，errors.Is 也能匹配
func processFile(filename string) error {
	// 模拟多步操作，其中某些步骤返回封装后的错误
	return fmt.Errorf("处理文件 %s 失败: %w", filename, ErrPermission)
}

// ---- 5. 带上下文的错误处理 ----
type Config struct {
	Port    int
	Timeout int
}

func validateConfig(cfg Config) error {
	var errs []error

	if cfg.Port < 1 || cfg.Port > 65535 {
		errs = append(errs, fmt.Errorf("端口号 %d 无效（1-65535）", cfg.Port))
	}
	if cfg.Timeout <= 0 {
		errs = append(errs, fmt.Errorf("超时 %d 必须为正数", cfg.Timeout))
	}

	if len(errs) > 0 {
		return fmt.Errorf("配置验证失败: %v", errs)
	}
	return nil
}

func main() {
	// ---- 1. 基本错误处理 ----
	fmt.Println("--- 基本错误处理 ---")

	result, err := sqrt(9)
	if err != nil {
		fmt.Println("错误:", err)
	} else {
		fmt.Println("sqrt(9) =", result)
	}

	_, err = sqrt(-1)
	if err != nil {
		fmt.Println("预期错误:", err)
	}

	// ---- 2. 除法 ----
	fmt.Println("\n--- 除法错误 ---")
	_, err = divide(10, 0)
	if err != nil {
		fmt.Println("除法错误:", err)
	}

	// ---- 3. 哨兵错误 ----
	fmt.Println("\n--- 哨兵错误 ---")
	store := &DataStore{data: map[string]string{"a": "1"}}

	val, err := store.Get("a")
	if err != nil {
		fmt.Println("错误:", err)
	} else {
		fmt.Println("val =", val)
	}

	_, err = store.Get("not_exist")
	if errors.Is(err, ErrNotFound) {
		fmt.Println("键不存在（使用 errors.Is 判断）:", err)
	}

	_, err = store.Get("")
	if errors.Is(err, ErrInvalid) {
		fmt.Println("空键无效:", err)
	}

	// ---- 4. errors.Is 检查包装后的错误 ----
	fmt.Println("\n--- errors.Is 检查包装错误 ---")
	err = processFile("test.txt")
	fmt.Println("原始错误:", err)

	if errors.Is(err, ErrPermission) {
		fmt.Println("识别出权限错误（包装后仍可识别）")
	}
	if errors.Is(err, ErrNotFound) {
		fmt.Println("不是 '未找到' 错误")
	}

	// ---- 5. errors.As — 提取特定类型的错误 ----
	fmt.Println("\n--- errors.As 提取错误类型 ---")
	type ValidationError struct {
		Field   string
		Message string
	}

	validateAge := func(age int) error {
		if age < 0 || age > 150 {
			return &ValidationError{
				Field:   "age",
				Message: fmt.Sprintf("年龄 %d 超出范围 [0,150]", age),
			}
		}
		return nil
	}

	err = validateAge(200)
	var ve *ValidationError
	if errors.As(err, &ve) {
		fmt.Printf("验证错误: 字段=%s, 消息=%s\n", ve.Field, ve.Message)
	}

	// ---- 6. 多个错误处理 ----
	fmt.Println("\n--- 多个错误处理 ---")
	cfg := Config{Port: 99999, Timeout: -1}
	err = validateConfig(cfg)
	if err != nil {
		fmt.Println("配置错误:", err)
		// 输出类似：配置验证失败: [端口号 99999 无效（1-65535） 超时 -1 必须为正数]
	}

	// ---- 7. 错误处理的惯用模式 ----
	fmt.Println("\n--- 错误处理惯用模式 ---")

	// 推荐：先处理错误，快速返回
	if result, err := sqrt(25); err != nil {
		fmt.Println("错误:", err)
	} else {
		fmt.Println("sqrt(25) =", result)
	}

	// 不推荐：深层嵌套
	// if err == nil {
	//   if err == nil {
	//     ...
	//   }
	// }
}

// 编译运行：go run 01_errors.go
