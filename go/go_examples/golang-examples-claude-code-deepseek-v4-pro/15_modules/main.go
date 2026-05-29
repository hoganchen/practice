// ============================================================
// 知识点：模块管理（Go Modules）
//
// Go Modules 是 Go 1.11+ 官方依赖管理系统。
// go.mod 文件定义模块路径和依赖。
// go.sum 文件锁定依赖版本和校验和。
// 常用命令：
//   go mod init module-name     // 初始化模块
//   go mod tidy                 // 整理依赖
//   go get package@version      // 添加/更新依赖
//   go mod download             // 下载依赖
//   go mod vendor               // 创建 vendor 目录
//   go build ./...              // 编译所有包
// ============================================================

package main

import (
	"encoding/json"
	"fmt"
	"os"
	"time"

	"go-examples/15_modules/pkg/calculator"
)

// 定义模块内部的包
// 本示例演示模块化编程的基本结构

// ---- 内部包 ----
// 在同一个模块内的不同包
// pkg/calculator/ 是一个内部包

// ---- 模块初始化步骤 ----
// 1. 初始化模块:
//    go mod init go-examples/15_modules
//
// 2. 编译运行:
//    go run main.go
//
// 3. 添加第三方依赖:
//    go get github.com/google/uuid
//    go mod tidy

// ---- 模块使用示例 ----
// 使用模块内的包
// import "go-examples/15_modules/pkg/calculator"

func main() {
	fmt.Println("=== Go Modules 示例 ===")
	fmt.Println()

	// 使用本模块内的计算器包
	total := calculator.Add(10, 20)
	fmt.Printf("10 + 20 = %d\n", total)

	product := calculator.Multiply(6, 7)
	fmt.Printf("6 × 7 = %d\n", product)

	result, remainder := calculator.Divide(17, 5)
	fmt.Printf("17 ÷ 5 = %d 余 %d\n", result, remainder)

	fmt.Println()

	// ---- JSON 配置文件示例 ----
	config := struct {
		AppName  string `json:"app_name"`
		Version  string `json:"version"`
		Port     int    `json:"port"`
		Debug    bool   `json:"debug"`
		StartAt  string `json:"start_at"`
	}{
		AppName: "GoModulesExample",
		Version: "1.0.0",
		Port:    8080,
		Debug:   true,
		StartAt: time.Now().Format(time.RFC3339),
	}

	jsonBytes, _ := json.MarshalIndent(config, "", "  ")
	fmt.Println("应用配置:")
	os.Stdout.Write(jsonBytes)
	fmt.Println()

	// ---- 显示模块信息 ----
	fmt.Println("\n--- 模块信息 ---")
	fmt.Println("模块路径: go-examples/15_modules")
	fmt.Println("Go 版本: 1.21+")
	fmt.Println("依赖文件: go.mod + go.sum")
	fmt.Println()

	fmt.Println("=== 示例结束 ===")
}

// ---- 模块结构说明 ----
// 15_modules/
//   ├── go.mod          # 模块定义文件
//   ├── go.sum          # 依赖校验和（有第三方依赖时生成）
//   ├── main.go         # 主程序
//   └── pkg/
//       └── calculator/ # 子包
//           └── calculator.go

// 编译运行：go run main.go
// 或者：go build -o app.exe && ./app.exe
