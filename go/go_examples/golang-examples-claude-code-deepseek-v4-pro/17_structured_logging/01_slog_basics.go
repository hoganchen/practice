// ============================================================
// 知识点：log/slog — 结构化日志（Go 1.21+）
//
// slog 是 Go 1.21 引入的结构化日志包，支持：
//   - 键值对日志（key=value 或 JSON 格式）
//   - 多级别：Debug, Info, Warn, Error
//   - 自定义 Handler（TextHandler, JSONHandler）
//   - 性能优化（延迟计算、分组）
// ============================================================

package main

import (
	"context"
	"fmt"
	"log/slog"
	"os"
	"time"
)

func main() {
	// ---- 1. 基本用法 ----
	fmt.Println("=== log/slog 结构化日志 (Go 1.21+) ===")
	fmt.Println()

	// 默认 logger（文本格式）
	fmt.Println("--- 默认 Logger (TextHandler) ---")
	slog.Info("服务启动", "port", 8080, "env", "production")
	slog.Warn("磁盘空间不足", "disk", "/dev/sda1", "free", "2GB")
	slog.Error("数据库连接失败", "host", "db.example.com", "timeout", 30)

	// ---- 2. 日志级别 ----
	fmt.Println()
	fmt.Println("--- 日志级别 ---")
	slog.Debug("调试信息") // 默认不输出（级别门槛为 Info）
	slog.Info("信息")
	slog.Warn("警告")
	slog.Error("错误")

	// 设置输出级别
	fmt.Println()
	fmt.Println("--- 设置日志级别为 Debug ---")
	handler := slog.NewTextHandler(os.Stdout, &slog.HandlerOptions{
		Level: slog.LevelDebug, // 从 Debug 开始输出
	})
	debugLogger := slog.New(handler)
	debugLogger.Debug("现在可以看到调试信息了")
	debugLogger.Info("普通信息")

	// ---- 3. JSON 格式 ----
	fmt.Println()
	fmt.Println("--- JSON Handler ---")
	jsonHandler := slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{
		Level: slog.LevelInfo,
	})
	jsonLogger := slog.New(jsonHandler)
	jsonLogger.Info("JSON 格式日志", "user_id", 42, "action", "login")

	// ---- 4. 分组日志 ----
	fmt.Println()
	fmt.Println("--- 分组日志 ---")
	slog.Info("请求处理",
		slog.Group("request",
			slog.String("method", "GET"),
			slog.String("path", "/api/users"),
			slog.Int("status", 200),
		),
		slog.Group("latency",
			slog.Duration("total", 150*time.Millisecond),
			slog.Float64("ms", 150.0),
		),
	)

	// ---- 5. 惰性计算（Lazy Evaluation）----
	fmt.Println()
	fmt.Println("--- 惰性计算 ---")
	expensiveOp := func() string {
		time.Sleep(10 * time.Millisecond)
		return "计算结果"
	}
	// 如果日志级别低于 Debug，expensiveOp 不会执行
	debugLogger.Debug("惰性计算", "result", slog.Any("data", expensiveOp()))

	// ---- 6. 带 source 的日志 ----
	fmt.Println()
	fmt.Println("--- 记录源代码位置 ---")
	sourceHandler := slog.NewTextHandler(os.Stdout, &slog.HandlerOptions{
		AddSource: true,
		Level:     slog.LevelInfo,
	})
	sourceLogger := slog.New(sourceHandler)
	sourceLogger.Info("带来源信息的日志")

	// ---- 7. 自定义属性过滤 ----
	fmt.Println()
	fmt.Println("--- 自定义属性过滤（替换敏感信息）---")
	customHandler := slog.NewTextHandler(os.Stdout, &slog.HandlerOptions{
		ReplaceAttr: func(groups []string, a slog.Attr) slog.Attr {
			if a.Key == "password" {
				return slog.String("password", "***FILTERED***")
			}
			return a
		},
	})
	customLogger := slog.New(customHandler)
	customLogger.Info("用户登录", "user", "admin", "password", "secret123")

	// ---- 8. 从 context 获取 Logger ----
	fmt.Println()
	fmt.Println("--- Context Logger ---")
	// slog 可以与 context 配合，传递请求范围内的 Logger
	ctx := context.WithValue(context.Background(), "request_id", "req-123")
	ctxLogger := slog.With("request_id", ctx.Value("request_id"))
	ctxLogger.Info("处理请求", "handler", "GetUser")

	// ---- 9. 性能建议 ----
	fmt.Println()
	fmt.Println("=== 性能建议 ===")
	fmt.Println("  1. 使用 slog.Int/String/Bool 等类型函数避免反射")
	fmt.Println("  2. 使用 Logger.With 预绑定常用字段")
	fmt.Println("  3. 对于高吞吐路径，考虑使用自定义 Handler")
	fmt.Println("  4. Debug 级别的惰性计算不会影响性能")
	fmt.Println()
	fmt.Println("=== 编译方法 ===")
	fmt.Println("  go run 01_slog_basics.go")
	fmt.Println("  # 需要 Go 1.21+")
}

// 编译运行：go run 01_slog_basics.go
// 需要 Go 1.21+
