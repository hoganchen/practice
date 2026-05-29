// ============================================================
// 知识点：testing.T.Output — 测试输出流（Go 1.25+）
//
// T.Output() 返回 io.Writer，写入的内容会显示在测试日志中。
// 比 t.Log() 更灵活：可以直接传入需要 io.Writer 的库。
//
// 运行方法：
//   go test -v ./33_testing_advanced/
// ============================================================

package testing_advanced

import (
	"fmt"
	"testing"
)

// -------- T.Output 用法 --------
func TestOutput(t *testing.T) {
	// 获取输出 Writer
	w := t.Output()

	// 可以直接 fmt.Fprintf 写入（比 t.Log 更灵活）
	fmt.Fprintln(w, "这是通过 T.Output 写入的日志")
	fmt.Fprintf(w, "格式化输出: %s=%d\n", "count", 42)

	// 传递给需要 io.Writer 的库
	// 例如：一些日志库或编码器可以写入测试输出
	t.Log("以上内容来自 T.Output，与 t.Log 在同一输出流")
}

// -------- 与 t.Log 对比 --------
func TestOutputComparison(t *testing.T) {
	t.Log("t.Log 方式输出")

	w := t.Output()
	fmt.Fprintln(w, "T.Output 方式输出")
	fmt.Fprintln(w, "优点：可直接用于需要 io.Writer 的 API")
}
