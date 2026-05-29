// ============================================================
// 知识点：自定义错误类型
//
// 实现 error 接口（Error() string 方法）即可创建自定义错误。
// 自定义错误可以携带额外上下文信息。
// 通过 fmt.Errorf+%w 包装错误，errors.Unwrap/As/Is 检查。
// ============================================================

package main

import (
	"errors"
	"fmt"
	"strings"
)

// ---- 1. 简单自定义错误 ----
type NotFoundError struct {
	Resource string
	ID       string
}

// 实现 error 接口
func (e *NotFoundError) Error() string {
	return fmt.Sprintf("未找到 %s: id=%s", e.Resource, e.ID)
}

// ---- 2. 带多个上下文的结构体错误 ----
type ValidationErrors struct {
	Fields  []string
	Message string
}

func (e *ValidationErrors) Error() string {
	return fmt.Sprintf("验证错误 [%s]: %s",
		strings.Join(e.Fields, ", "), e.Message)
}

// ---- 3. 使用 %w 包装错误 ----
// 被包装的错误可以通过 errors.Is / errors.As 访问
type QueryError struct {
	Query string
	Err   error // 原始错误
}

func (e *QueryError) Error() string {
	if e.Err != nil {
		return fmt.Sprintf("查询 [%s] 失败: %v", e.Query, e.Err)
	}
	return fmt.Sprintf("查询 [%s] 失败", e.Query)
}

// Unwrap 方法让 errors.Is / errors.As 可以遍历到内部错误
func (e *QueryError) Unwrap() error {
	return e.Err
}

// ---- 4. 临时性错误（可重试 vs 不可重试） ----
type TemporaryError struct {
	Err       error
	Retryable bool
}

func (e *TemporaryError) Error() string {
	return fmt.Sprintf("临时错误(可重试=%v): %v", e.Retryable, e.Err)
}

func (e *TemporaryError) Unwrap() error {
	return e.Err
}

func (e *TemporaryError) IsTemporary() bool {
	return e.Retryable
}

func main() {
	// ---- 1. 使用自定义错误 ----
	fmt.Println("--- 自定义错误 ---")

	findUser := func(id string) error {
		return &NotFoundError{
			Resource: "user",
			ID:       id,
		}
	}

	err := findUser("u-999")
	fmt.Println("错误:", err)

	// 使用 errors.As 提取自定义错误
	var notFound *NotFoundError
	if errors.As(err, &notFound) {
		fmt.Printf("提取: Resource=%s, ID=%s\n", notFound.Resource, notFound.ID)
	}

	// ---- 2. 多字段验证错误 ----
	fmt.Println("\n--- 验证错误 ---")
	validateForm := func(name, email string) error {
		var errs ValidationErrors
		if name == "" {
			errs.Fields = append(errs.Fields, "name")
		}
		if !strings.Contains(email, "@") {
			errs.Fields = append(errs.Fields, "email")
		}
		if len(errs.Fields) > 0 {
			errs.Message = "表单字段无效"
			return &errs
		}
		return nil
	}

	err = validateForm("", "invalid")
	if err != nil {
		fmt.Println("表单错误:", err)
		var ve *ValidationErrors
		if errors.As(err, &ve) {
			fmt.Printf("  问题字段: %v\n", ve.Fields)
		}
	}

	// ---- 3. 错误包装（%w）----
	fmt.Println("\n--- 错误包装 ---")
	// 模拟数据库查询
	dbQuery := func(sql string) error {
		return errors.New("连接超时")
	}

	queryUser := func(id string) error {
		err := dbQuery("SELECT * FROM users WHERE id = " + id)
		if err != nil {
			return &QueryError{
				Query: "SELECT * FROM users WHERE id = " + id,
				Err:   err,
			}
		}
		return nil
	}

	err = queryUser("u-001")
	fmt.Println("查询错误:", err)

	// 使用 errors.Is 检查（需要 QueryError 实现 Unwrap）
	// 但我们自定义的 QueryError 不能直接匹配 dbQuery 的错误
	// 需要 Unwrap 方法

	var qe *QueryError
	if errors.As(err, &qe) {
		fmt.Printf("  查询: %s\n", qe.Query)
		fmt.Printf("  原始错误: %v\n", qe.Err)
	}

	// ---- 4. 临时错误检查 ----
	fmt.Println("\n--- 临时错误 ---")
	callService := func() error {
		return &TemporaryError{
			Err:       errors.New("网络不可达"),
			Retryable: true,
		}
	}

	err = callService()
	var temp *TemporaryError
	if errors.As(err, &temp) {
		if temp.IsTemporary() {
			fmt.Println("临时错误，可以重试:", temp)
		} else {
			fmt.Println("非临时错误，不可重试:", temp)
		}
	}

	// ---- 5. 错误链的 errors.Is ----
	fmt.Println("\n--- 错误链 ---")
	// 利用 %w 创建错误链
	rootCause := errors.New("磁盘空间不足")
	wrapped1 := fmt.Errorf("写入文件失败: %w", rootCause)
	wrapped2 := fmt.Errorf("保存数据失败: %w", wrapped1)

	fmt.Println("完整错误链:", wrapped2)
	fmt.Println("Is(磁盘空间不足):", errors.Is(wrapped2, rootCause))   // true
	fmt.Println("Is(写入文件失败):", errors.Is(wrapped2, wrapped1)) // true

	// 提取原始错误
	unwrapped := errors.Unwrap(wrapped2)
	fmt.Println("Unwrap 一层:", unwrapped)

	// ---- 6. fmt.Errorf 的 %w 限制 ----
	fmt.Println("\n--- %w 限制 ---")
	// 每个 fmt.Errorf 只能使用一个 %w
	err1 := errors.New("错误1")
	err2 := errors.New("错误2")

	combined := fmt.Errorf("多个错误: %w, %s", err1, err2.Error())
	fmt.Println("combined:", combined)

	// errors.Is 只能匹配第一个 %w 的错误
	fmt.Println("Is 错误1:", errors.Is(combined, err1)) // true
	fmt.Println("Is 错误2:", errors.Is(combined, err2)) // false（因为第二个是 %s 不是 %w）
}

// 编译运行：go run 02_custom_errors.go
