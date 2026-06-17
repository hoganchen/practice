// ============================================================================
// 知识点: 子测试 (Subtests) 和 Test Helper
//
// 说明:
// - t.Run 创建子测试, 支持嵌套
// - t.Helper() 标记辅助函数, 错误定位更准确
// - t.Cleanup 注册清理函数
// - 可通过 -run 参数运行特定子测试
// - 子测试支持并行执行
//
// 运行:
//   go test ./29_testing/ -v -run TestCalculator
//   go test ./29_testing/ -v -run "TestCalculator/Add"
// ============================================================================

package main

import (
	"testing"
)

func assertEqual(t testing.TB, got, want int) {
	t.Helper()
	if got != want {
		t.Errorf("got %d, want %d", got, want)
	}
}

func TestCalculator(t *testing.T) {
	calc := Calculator{}

	t.Run("Add", func(t *testing.T) {
		cases := []struct{ a, b, want int }{
			{1, 2, 3},
			{0, 0, 0},
			{-1, 1, 0},
			{99, 1, 100},
		}
		for _, c := range cases {
			assertEqual(t, calc.Add(c.a, c.b), c.want)
		}
	})

	t.Run("Subtract", func(t *testing.T) {
		assertEqual(t, calc.Subtract(10, 3), 7)
		assertEqual(t, calc.Subtract(0, 5), -5)
	})

	t.Run("Multiply", func(t *testing.T) {
		assertEqual(t, calc.Multiply(6, 7), 42)
		assertEqual(t, calc.Multiply(0, 100), 0)
	})

	t.Run("Divide", func(t *testing.T) {
		t.Run("normal", func(t *testing.T) {
			got, err := calc.Divide(10, 3)
			if err != nil {
				t.Fatalf("unexpected error: %v", err)
			}
			assertEqual(t, got, 3)
		})
		t.Run("by_zero", func(t *testing.T) {
			_, err := calc.Divide(10, 0)
			if err == nil {
				t.Error("expected error, got nil")
			}
		})
	})

	t.Run("Parallel", func(t *testing.T) {
		t.Run("sub1", func(t *testing.T) { t.Parallel(); assertEqual(t, 1+1, 2) })
		t.Run("sub2", func(t *testing.T) { t.Parallel(); assertEqual(t, 2*3, 6) })
	})
}
