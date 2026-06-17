// ============================================================================
// 知识点: text/template 文本模板
//
// 说明:
// - text/template 用于生成文本输出, 将数据与模板分离
// - 模板语法: {{.FieldName}} 访问数据字段
// - 支持循环: {{range .Items}}...{{end}}
// - 支持条件: {{if .Cond}}...{{else}}...{{end}}
// - template.Must 用于包装解析错误为 panic
//
// 编译和运行:
//   go run 22_templates\01_text_template.go
// ============================================================================

package main

import (
	"os"
	"text/template"
)

type TodoItem struct {
	Title     string
	Completed bool
}

type TodoData struct {
	User  string
	Items []TodoItem
}

func main() {
	const tmpl = `待办事项列表 - {{.User}}
{{range .Items}}
  {{if .Completed}}[✓]{{else}}[ ]{{end}} {{.Title}}
{{else}}
  (没有待办事项)
{{end}}`

	todo := TodoData{
		User: "Alice",
		Items: []TodoItem{
			{Title: "学习 Go 模板", Completed: true},
			{Title: "编写示例代码", Completed: true},
			{Title: "测试编译", Completed: false},
			{Title: "提交代码", Completed: false},
		},
	}

	t := template.Must(template.New("todos").Parse(tmpl))
	t.Execute(os.Stdout, todo)
}
