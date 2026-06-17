// ============================================================================
// 知识点: html/template (HTML 模板)
//
// 说明:
// - html/template 与 text/template 语法相同
// - 区别: html/template 自动对输出进行 HTML 转义, 防止 XSS 攻击
// - 根据上下文(HTML/JS/CSS/URL)选择不同的转义策略
// - 使用 template.HTML 类型可跳过转义 (注意安全风险)
// - 开发 Web 应用时应始终使用 html/template
//
// 编译和运行:
//   go run 22_templates\02_html_template.go
// ============================================================================

package main

import (
	"html/template"
	"os"
)

func main() {
	const page = `<!DOCTYPE html>
<html>
<head><title>{{.Title}}</title></head>
<body>
  <h1>{{.Heading}}</h1>
  <p>用户输入: {{.UserInput}}</p>
  <p>安全HTML: {{.SafeHTML}}</p>
  <ul>
  {{range .Items}}
    <li>{{.}}</li>
  {{else}}
    <li>没有项目</li>
  {{end}}
  </ul>
</body>
</html>`

	data := struct {
		Title     string
		Heading   string
		UserInput string
		SafeHTML  template.HTML
		Items     []string
	}{
		Title:     "Go HTML 模板",
		Heading:   "html/template 示例",
		UserInput: `<script>alert('XSS')</script>`,
		SafeHTML:  template.HTML("<b>安全内容</b>"),
		Items:     []string{"项目1", "项目2", "项目3"},
	}

	tmpl := template.Must(template.New("page").Parse(page))
	tmpl.Execute(os.Stdout, data)
}
