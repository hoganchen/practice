// ============================================================================
// 知识点: encoding/csv CSV 读写
//
// 说明:
// - csv.NewReader 读取 CSV, csv.NewWriter 写入 CSV
// - Reader.ReadAll 一次性读取所有行
// - Reader 支持自定义分隔符 (Comma 字段)
// - Writer.Write / WriteAll 写入行
// - CSV 中字段含逗号或引号时会自动转义
//
// 编译和运行:
//   go run 41_csv\01_csv_read_write.go
// ============================================================================

package main

import (
	"bytes"
	"encoding/csv"
	"fmt"
	"strings"
)

func main() {
	// 写入 CSV
	var buf bytes.Buffer
	writer := csv.NewWriter(&buf)

	records := [][]string{
		{"姓名", "年龄", "城市", "职业"},
		{"张三", "28", "北京", "工程师"},
		{"李四", "32", "上海", "设计师"},
		{"王五", "25", "广州", "产品经理"},
		{"赵六", "30", "深圳", "包含,逗号"},
	}

	writer.WriteAll(records)
	writer.Flush()

	if err := writer.Error(); err != nil {
		fmt.Println("写入失败:", err)
		return
	}

	fmt.Println("写入的 CSV:")
	fmt.Println(buf.String())

	// 读取 CSV
	reader := csv.NewReader(strings.NewReader(buf.String()))
	allRecords, err := reader.ReadAll()
	if err != nil {
		fmt.Println("读取失败:", err)
		return
	}

	fmt.Println("读取的 CSV 数据:")
	for i, row := range allRecords {
		fmt.Printf("  行 %d: %v\n", i, row)
	}

	// 自定义分隔符 (如制表符 TSV)
	tsvData := "名称\t价格\t数量\n苹果\t5.5\t100\n香蕉\t3.2\t200"
	tsvReader := csv.NewReader(strings.NewReader(tsvData))
	tsvReader.Comma = '\t'
	tsvRecords, _ := tsvReader.ReadAll()
	fmt.Println("\nTSV (制表符分隔):")
	for _, row := range tsvRecords {
		fmt.Printf("  %v\n", row)
	}
}
