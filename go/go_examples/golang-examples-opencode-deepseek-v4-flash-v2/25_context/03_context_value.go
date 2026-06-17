// ============================================================================
// 知识点: Context 传值
//
// 说明:
// - context.WithValue 在 context 中存储键值对
// - 适合传递请求范围的元数据(请求ID、认证令牌等)
// - 不应用 context 传递函数参数
// - 键类型应为自定义类型(非内建类型), 避免冲突
//
// 编译和运行:
//   go run 25_context\03_context_value.go
// ============================================================================

package main

import (
	"context"
	"fmt"
)

type contextKey string

const (
	RequestIDKey contextKey = "request_id"
	UserIDKey    contextKey = "user_id"
)

func processRequest(ctx context.Context) {
	reqID, _ := ctx.Value(RequestIDKey).(string)
	userID, _ := ctx.Value(UserIDKey).(int)

	fmt.Printf("处理请求: request_id=%s, user_id=%d\n", reqID, userID)
}

func middleware(ctx context.Context) context.Context {
	ctx = context.WithValue(ctx, RequestIDKey, "req-001")
	ctx = context.WithValue(ctx, UserIDKey, 42)
	return ctx
}

func main() {
	ctx := context.Background()
	ctx = middleware(ctx)
	processRequest(ctx)
}
