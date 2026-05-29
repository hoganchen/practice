// ============================================================
// 知识点：高级测试技术
//
// 演示 Go 1.24+ 的新测试特性：
//   - testing.B.Loop() — 更高效更安全的基准测试循环（Go 1.24+）
//   - 表格驱动测试（Table-driven tests）
//   - 子测试（Subtests）
//   - Fuzz 测试基础
//
// 运行测试：
//   go test -v -bench=. ./33_testing_advanced/
//   go test -fuzz=FuzzDivide ./33_testing_advanced/  (需运行约 10 秒)
// ============================================================

package testing_advanced

import (
	"testing"
)

// -------- 传统基准测试 --------
func BenchmarkSumTraditional(b *testing.B) {
	for i := 0; i < b.N; i++ {
		Sum(1000)
	}
}

// -------- testing.B.Loop() 新方式（Go 1.24+）--------
// b.Loop() 自动管理循环次数，更安全且性能更好
func BenchmarkSumNew(b *testing.B) {
	for b.Loop() {
		Sum(1000)
	}
}

// -------- 表驱动测试 --------
func TestIsPrime(t *testing.T) {
	tests := []struct {
		name string
		n    int
		want bool
	}{
		{"小于2", 1, false},
		{"质数", 7, true},
		{"合数", 8, false},
		{"大质数", 97, true},
		{"偶数合数", 100, false},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := IsPrime(tt.n)
			if got != tt.want {
				t.Errorf("IsPrime(%d) = %v, 期望 %v", tt.n, got, tt.want)
			}
		})
	}
}

// -------- Fuzz 测试（随机测试）--------
func FuzzDivide(f *testing.F) {
	// 添加种子语料库
	f.Add(10, 3)
	f.Add(100, 7)
	f.Add(0, 5)

	f.Fuzz(func(t *testing.T, a, b int) {
		result, err := Divide(a, b)
		if b == 0 {
			if err == nil {
				t.Errorf("除零时应返回错误")
			}
			return
		}
		if err != nil {
			t.Errorf("Unexpected error: %v", err)
		}
		// 验证：a = result * b + 余数
		if a != result*b+(a%b) {
			t.Errorf("不满足除法恒等式")
		}
	})
}
