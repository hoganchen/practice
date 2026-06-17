// ============================================================================
// 知识点: log/slog 结构化日志 (Go 1.21+)
//
// 说明:
// - log/slog 是 Go 1.21+ 引入的结构化日志库
// - slog.Info / slog.Debug / slog.Warn / slog.Error 快速记录
// - 支持键值对: slog.Int, slog.String, slog.Any 等
// - 默认使用 TextHandler, 可切换 JSONHandler
// - slog.Logger 可定制输出、级别、格式
// - slog.Group 用于日志分组
//
// 编译和运行:
//   go run 36_slog\01_structured_logging.go
// ============================================================================

package main

import (
	"log/slog"
	"os"
	"time"
)

func main() {
	// 基本结构化日志
	slog.Info("服务启动",
		slog.String("service", "my-app"),
		slog.Int("port", 8080),
		slog.String("env", "production"),
	)

	slog.Warn("磁盘空间不足",
		slog.String("disk", "/dev/sda1"),
		slog.Float64("used_pct", 92.5),
	)

	slog.Error("数据库连接失败",
		slog.String("host", "db.example.com"),
		slog.Duration("timeout", 5*time.Second),
	)

	// JSON 格式日志
	jsonLogger := slog.New(slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{
		Level: slog.LevelDebug,
	}))

	jsonLogger.Debug("调试信息", slog.Any("data", map[string]int{"a": 1}))
	jsonLogger.Info("JSON 格式日志", slog.String("format", "json"))

	// 自定义级别日志
	opts := &slog.HandlerOptions{
		Level: slog.LevelWarn,
	}
	warnLogger := slog.New(slog.NewTextHandler(os.Stdout, opts))
	warnLogger.Debug("这条不会输出")
	warnLogger.Warn("这条会输出")
}
