// ============================================================
// 知识点：结构化日志 log/slog（Go 1.21+）
//
// slog 是 Go 1.21 引入的结构化日志库，支持：
//   1. 键值对形式的日志输出
//   2. 多种日志级别（Debug、Info、Warn、Error）
//   3. JSON 和文本两种输出格式
//   4. 自定义日志处理器
//
// 编译运行方法：
//   go run 01_slog.go
// ============================================================

package main

import (
	"log/slog"
	"os"
	"time"
)

func main() {
	// -------- 默认 Text 格式日志 --------
	slog.Info("服务启动", "port", 8080, "env", "production")

	// -------- 不同日志级别 --------
	slog.Debug("调试信息", "detail", "仅在调试时可见")
	slog.Info("信息消息", "user", "张三")
	slog.Warn("警告消息", "diskUsage", 85.5)
	slog.Error("错误消息", "err", "连接超时")

	// -------- JSON 格式日志（更易被日志系统解析）--------
	logger := slog.New(slog.NewJSONHandler(os.Stdout, nil))
	logger.Info("JSON格式日志",
		"requestID", "req-001",
		"method", "GET",
		"path", "/api/users",
		"duration", 150*time.Millisecond,
	)

	// -------- 带 Source 信息的日志 --------
	// slog 可以记录日志代码的源文件位置
	opts := &slog.HandlerOptions{
		AddSource: true,
	}
	sourceLogger := slog.New(slog.NewTextHandler(os.Stdout, opts))
	sourceLogger.Info("这条日志包含源代码位置")

	// -------- 分组（Group）日志键 --------
	logger.Info("分组日志示例",
		slog.Group("request",
			"method", "POST",
			"path", "/api/login",
		),
		slog.Group("response",
			"status", 200,
			"latency", "120ms",
		),
	)

	// -------- slog.GroupAttrs（Go 1.25+）--------
	// GroupAttrs 是 Go 1.25 新增的，比 Group 更高效
	// 它只接收 slog.Attr 值（而非交替的 key-value）
	logger.Info("GroupAttrs 示例",
		slog.GroupAttrs("server",
			slog.String("host", "localhost"),
			slog.Int("port", 8080),
		),
		slog.GroupAttrs("metrics",
			slog.Float64("cpu", 45.2),
			slog.Float64("memory", 72.1),
		),
	)
}
