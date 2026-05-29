// ============================================================
// 知识点：自定义错误类型
//
// 实现 error 接口即可创建自定义错误类型。
// 自定义错误可以包含额外的上下文信息。
// errors.Is 和 errors.As 用于检查错误链。
//
// 编译运行方法：
//   go run 02_custom_errors.go
// ============================================================

package main

import (
	"errors"
	"fmt"
)

// -------- 自定义错误类型 --------
// 实现 Error() string 方法即满足了 error 接口
type ValidationError struct {
	Field   string // 出错的字段名
	Message string // 错误描述
}

func (e *ValidationError) Error() string {
	return fmt.Sprintf("字段 %s 验证失败: %s", e.Field, e.Message)
}

// -------- 带错误码的自定义错误 --------
type AppError struct {
	Code    int    // 错误码
	Message string // 错误信息
	Err     error  // 原始错误（可选的）
}

func (e *AppError) Error() string {
	return fmt.Sprintf("[错误码 %d] %s", e.Code, e.Message)
}

// 解包方法，支持 errors.Is/errors.As 查找
func (e *AppError) Unwrap() error {
	return e.Err
}

// -------- 使用哨兵错误（Sentinel Error）--------
var ErrNotFound = errors.New("记录未找到")
var ErrPermission = errors.New("权限不足")

// -------- 使用自定义错误的函数 --------
func validateAge(age int) error {
	if age < 0 {
		return &ValidationError{Field: "age", Message: "年龄不能为负数"}
	}
	if age < 18 {
		return &ValidationError{Field: "age", Message: "未满18岁"}
	}
	return nil
}

func main() {
	// -------- 使用自定义错误 --------
	fmt.Println("=== 自定义错误 ===")
	err := validateAge(-5)
	if err != nil {
		// 类型断言获取自定义错误的详细信息
		var ve *ValidationError
		if errors.As(err, &ve) {
			fmt.Printf("验证错误 - 字段: %s, 原因: %s\n", ve.Field, ve.Message)
		}
	}

	// -------- 使用哨兵错误 --------
	fmt.Println("\n=== 哨兵错误 ===")
	err = ErrNotFound
	if errors.Is(err, ErrNotFound) {
		fmt.Println("错误已被识别:", err)
	}

	// -------- 错误包装链 --------
	fmt.Println("\n=== 错误链 ===")
	originalErr := errors.New("数据库连接失败")
	appErr := &AppError{
		Code:    5001,
		Message: "服务内部错误",
		Err:     originalErr,
	}
	fmt.Println(appErr.Error())
}
