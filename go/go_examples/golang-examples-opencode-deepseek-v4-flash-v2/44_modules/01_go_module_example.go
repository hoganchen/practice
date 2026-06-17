// ============================================================================
// 知识点: Go Modules 模块管理
//
// 说明:
// - Go module 是 Go 的依赖管理系统, 从 Go 1.16 起默认启用
// - go.mod 文件定义模块路径和依赖版本
// - 核心命令:
//   go mod init <module-path>  - 初始化新模块
//   go get <package>@<version> - 添加/更新依赖
//   go mod tidy                - 清理无用依赖, 补充缺失依赖
//   go mod download            - 下载所有依赖到本地缓存
//   go mod vendor              - 将依赖复制到 vendor 目录
// - replace 指令用于替换依赖路径 (调试/本地开发)
// - indirect 注释表示间接依赖
//
// 本示例目录包含两个模块:
//   44_modules/        - 主模块 (依赖 mylib)
//   44_modules/mylib/  - 子模块 (作为本地依赖)
// 使用 replace 指令将 mylib 指向本地目录
//
// 编译和运行 (需在 44_modules 目录下, 因为有独立 go.mod):
//   cd 44_modules
//   go run .
//   go build -o module_demo.exe .
// 注意: 从根目录 go build 会失败, 因为该文件属于独立模块
// ============================================================================

package main

import (
	"fmt"

	"example.com/mylib"
)

func main() {
	fmt.Println("=== Go Modules 示例 ===")

	// 使用本地模块 mylib 提供的函数
	sum := mylib.Add(10, 20)
	product := mylib.Multiply(5, 6)
	quotient, err := mylib.Divide(100, 3)
	if err == nil {
		fmt.Printf("  Add(10, 20) = %d\n", sum)
		fmt.Printf("  Multiply(5, 6) = %d\n", product)
		fmt.Printf("  Divide(100, 3) = 商=%d, 余数=%d\n", quotient.Quotient, quotient.Remainder)
	}

	// 查看 go.mod 内容
	fmt.Println("\ngo.mod 文件内容:")
	fmt.Println("  module example.com/modules-demo")
	fmt.Println("  go 1.25")
	fmt.Println("  require example.com/mylib v0.0.0")
	fmt.Println("  replace example.com/mylib => ./mylib")
}
