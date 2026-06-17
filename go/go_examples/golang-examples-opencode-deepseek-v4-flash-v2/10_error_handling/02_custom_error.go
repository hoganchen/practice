// ============================================================================
// 知识点: 自定义错误类型
//
// 说明:
// - 实现 error 接口即可创建自定义错误类型
// - 自定义错误可以携带额外信息(状态码、详情等)
// - errors.As 用于检查错误类型并提取信息
// - 自定义错误类型可提供额外方法
//
// 编译和运行:
//   go run 10_error_handling\02_custom_error.go
// ============================================================================

package main

import (
	"errors"
	"fmt"
)

// 自定义错误类型
type ValidationError struct {
	Field   string
	Message string
}

func (e *ValidationError) Error() string {
	return fmt.Sprintf("字段 %s 验证失败: %s", e.Field, e.Message)
}

func validateAge(age int) error {
	if age < 0 {
		return &ValidationError{Field: "age", Message: "年龄不能为负数"}
	}
	if age > 150 {
		return &ValidationError{Field: "age", Message: "年龄超出合理范围"}
	}
	return nil
}

func main() {
	err := validateAge(-5)
	if err != nil {
		fmt.Println("错误:", err)

		// errors.As 提取自定义错误类型
		var valErr *ValidationError
		if errors.As(err, &valErr) {
			fmt.Printf("  问题字段: %s, 详情: %s\n", valErr.Field, valErr.Message)
		}
	}

	// 正常情况
	if err := validateAge(25); err == nil {
		fmt.Println("年龄验证通过")
	}
}
