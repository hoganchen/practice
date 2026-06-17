// ============================================================================
// 知识点: 子测试 (Subtests) 和 Test Helper
//
// 说明:
// - t.Run(name, fn) 创建子测试, 实现分组和并行测试
// - 子测试可以独立运行: go test -run TestName/SubName
// - t.Helper() 标记辅助函数, 错误报告时跳过该函数行号
// - 子测试支持并行: t.Parallel()
// - Cleanup 注册清理函数 (无论测试通过或失败都会执行)
//
// 测试运行:
//   go test ./29_testing/ -v -run TestCalculator
//   go test ./29_testing/ -v -run "TestCalculator/Add"
// ============================================================================

package main

import "errors"

var (
	ErrDivideByZero = errors.New("除数不能为零")
)

type Calculator struct{}

func (c Calculator) Add(a, b int) int { return a + b }
func (c Calculator) Subtract(a, b int) int { return a - b }
func (c Calculator) Multiply(a, b int) int { return a * b }
func (c Calculator) Divide(a, b int) (int, error) {
	if b == 0 {
		return 0, ErrDivideByZero
	}
	return a / b, nil
}

func main() {
	// 仅供编译通过, 实际运行请使用 go test
	_ = Calculator{}
}
