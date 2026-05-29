// ============================================================
// 知识点：encoding/json/v2 — 实验性 JSON API（Go 1.25）
//
// Go 1.25 引入了实验性的 encoding/json/v2 包（需 GOEXPERIMENT=jsonv2）。
// 同时新增 encoding/json/jsontext 包用于底层 JSON 语法操作。
//
// 与 v1 的关键区别：
//   - 语义层（json/v2）和语法层（jsontext）分离
//   - Unmarshal 性能提升高达 10x
//   - 行为变更：无效 UTF-8 报错、重复键报错、nil slice→[]
//   - 新接口：MarshalerTo / UnmarshalerFrom（流式自定义）
//
// 本文件演示 v2 的 API 设计。
// 注意：这是实验性 API，不受兼容性承诺约束。
// ============================================================

package main

import (
	"fmt"
	"os"
	"os/exec"
	"strings"
)

// ---- 1. v2 API 概览 ----

// 如果启用了 GOEXPERIMENT=jsonv2，可以用以下包：
// import "encoding/json/v2"   // 语义层
// import "encoding/json/jsontext" // 语法层
//
// v2 Marshal/Unmarshal 签名：
//   func Marshal(in any, opts ...Options) ([]byte, error)
//   func Unmarshal(in []byte, out any, opts ...Options) error
//   func MarshalWrite(out io.Writer, in any, opts ...Options) error
//   func UnmarshalRead(in io.Reader, out any, opts ...Options) error

// ---- 2. v2 的使用示例（伪代码，需要 jsonv2 实验标记）----
/*
// 前置条件：
//   GOEXPERIMENT=jsonv2 go build
//   import jsonv2 "encoding/json/v2"

type User struct {
    ID    int    `json:"id"`
    Name  string `json:"name"`
    Email string `json:"email"`
}

// 序列化
user := User{ID: 1, Name: "Alice", Email: "alice@example.com"}
data, err := jsonv2.Marshal(user)

// 反序列化
var user2 User
err = jsonv2.Unmarshal(data, &user2)

// 流式写入
err = jsonv2.MarshalWrite(os.Stdout, user)

// 流式读取
err = jsonv2.UnmarshalRead(reader, &user)
*/

// ---- 3. v2 与 v1 的行为差异 ----
func main() {
	fmt.Println("=== encoding/json/v2 实验性 JSON API (Go 1.25) ===")
	fmt.Println()

	// ---- 3.1 行为差异对照表 ----
	fmt.Println("v1 与 v2 行为差异：")
	fmt.Println()
	fmt.Printf("  %-25s | %-20s | %-20s\n", "行为", "v1 (旧)", "v2 (新)")
	fmt.Println(strings.Repeat("-", 72))
	diffs := []struct{ behavior, v1, v2 string }{
		{"无效 UTF-8", "静默接受", "X 报错"},
		{"重复 JSON 键", "静默接受", "X 报错"},
		{"nil slice → JSON", "null", "[]"},
		{"nil map → JSON", "null", "{}"},
		{"字段名匹配", "大小写不敏感", "大小写敏感"},
		{"time.Duration", "特殊序列化", "X 报错"},
		{"Unmarshal 性能", "基准", "↑ 10x"},
	}
	for _, d := range diffs {
		fmt.Printf("  %-25s | %-20s | %-20s\n", d.behavior, d.v1, d.v2)
	}

	// ---- 3.2 启用方法 ----
	fmt.Println()
	fmt.Println("启用方法：")
	fmt.Println("  export GOEXPERIMENT=jsonv2  # Linux/macOS")
	fmt.Println("  set GOEXPERIMENT=jsonv2     # Windows CMD")
	fmt.Println("  $env:GOEXPERIMENT='jsonv2'  # Windows PowerShell")
	fmt.Println("  go build ./...")

	// ---- 3.3 v2 的流式自定义接口 ----
	fmt.Println()
	fmt.Println("v2 新增流式接口：")
	fmt.Println("  type MarshalerTo interface {")
	fmt.Println("      MarshalJSONTo(*jsontext.Encoder) error")
	fmt.Println("  }")
	fmt.Println("  type UnmarshalerFrom interface {")
	fmt.Println("      UnmarshalJSONFrom(*jsontext.Decoder) error")
	fmt.Println("  }")
	fmt.Println()
	fmt.Println("  通过 jsontext.Encoder/Decoder 实现纯流式处理")
	fmt.Println("  避免了 v1 中 []byte 的中间分配")

	// ---- 3.4 选项模式 ----
	fmt.Println()
	fmt.Println("v2 的选项模式（伪代码）：")
	fmt.Println("  jsonv2.Marshal(data, jsonv2.WithMarshalers(")
	fmt.Println("      jsonv2.MarshalToFunc(func(v MyType, enc *jsontext.Encoder) error {")
	fmt.Println("          // 自定义流式序列化")
	fmt.Println("      }),")
	fmt.Println("  ))")

	// ---- 4. 检查当前 Go 版本 ----
	fmt.Println()
	fmt.Println("当前 Go 版本检查：")

	// 运行 go version
	cmd := exec.Command("go", "version")
	output, err := cmd.Output()
	if err != nil {
		fmt.Printf("  无法检查 Go 版本: %v\n", err)
	} else {
		verStr := strings.TrimSpace(string(output))
		fmt.Printf("  %s\n", verStr)
		if strings.Contains(verStr, "go1.25") {
			fmt.Println("  ✓ 支持 encoding/json/v2（实验性）")
		} else {
			fmt.Println("  ⚠ 需要 Go 1.25+ 才能使用 jsonv2")
		}
	}

	// ---- 5. V2 代码示例（需 GOEXPERIMENT=jsonv2） ----
	fmt.Println()
	fmt.Println("v2 完整示例（需要 GOEXPERIMENT=jsonv2 编译）：")
	fmt.Println(`
  //go:build go1.25

  package main

  import (
      "fmt"
      "log"
      jsonv2 "encoding/json/v2"
  )

  type Product struct {
      Name  string ` + "`" + `json:"name"` + "`" + `
      Price float64 ` + "`" + `json:"price"` + "`" + `
  }

  func main() {
      p := Product{Name: "Laptop", Price: 999.99}
      data, err := jsonv2.Marshal(p)
      if err != nil {
          log.Fatal(err)
      }
      fmt.Println(string(data))
  }
  `)

	// 检查 env
	fmt.Println("当前 GOEXPERIMENT 设置：")
	goexperiment := os.Getenv("GOEXPERIMENT")
	if goexperiment == "" {
		fmt.Println("  (未设置)")
	} else {
		fmt.Printf("  GOEXPERIMENT=%s\n", goexperiment)
	}
	fmt.Println()
	fmt.Println("编译方法：")
	fmt.Println("  GOEXPERIMENT=jsonv2 go run 06_json_v2.go")

	// ---- 编译说明 ----
	fmt.Println()
	fmt.Println("=== 说明 ===")
	fmt.Println("此文件本身仅展示 v2 API 设计概念，不实际使用 jsonv2。")
	fmt.Println("实际使用需要设置 GOEXPERIMENT=jsonv2 环境变量。")
}

// 编译运行：go run 06_json_v2.go
// 部分功能需要：GOEXPERIMENT=jsonv2 go build
