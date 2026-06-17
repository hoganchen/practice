// ============================================================================
// 知识点: httptest - HTTP 测试服务器
//
// 说明:
// - net/http/httptest 提供 HTTP 测试工具
// - httptest.NewServer 创建测试用 HTTP 服务器
// - httptest.NewRequest 创建测试请求
// - httptest.ResponseRecorder 捕获响应
// - 不需要实际启动端口, 使用内存通信
//
// 编译和运行:
//   go run 45_http_advanced\02_httptest_server.go
// ============================================================================

package main

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/http/httptest"
)

type UserResponse struct {
	ID   int    `json:"id"`
	Name string `json:"name"`
}

func userHandler(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	user := UserResponse{ID: 1, Name: fmt.Sprintf("User-%s", id)}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(user)
}

func main() {
	// 创建测试用的 Handler
	mux := http.NewServeMux()
	mux.HandleFunc("GET /api/users/{id}", userHandler)

	// 创建测试服务器 (内存通信, 不占用端口)
	server := httptest.NewServer(mux)
	defer server.Close()

	fmt.Println("测试服务器 URL:", server.URL)

	// 发送测试请求
	resp, err := http.Get(server.URL + "/api/users/42")
	if err != nil {
		fmt.Println("请求失败:", err)
		return
	}
	defer resp.Body.Close()

	body, _ := io.ReadAll(resp.Body)
	fmt.Printf("状态码: %d\n", resp.StatusCode)
	fmt.Printf("响应体: %s\n", string(body))

	// 使用 httptest.ResponseRecorder 测试 Handler
	fmt.Println("\n=== ResponseRecorder 测试 ===")
	req := httptest.NewRequest("GET", "/api/users/100", nil)
	rec := httptest.NewRecorder()
	mux.ServeHTTP(rec, req)

	var user UserResponse
	json.Unmarshal(rec.Body.Bytes(), &user)
	fmt.Printf("状态码: %d\n", rec.Code)
	fmt.Printf("用户: %+v\n", user)
}
