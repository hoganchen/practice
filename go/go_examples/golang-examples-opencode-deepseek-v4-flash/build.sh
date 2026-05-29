#!/bin/bash

echo "========================================"
echo "  正在编译所有 Go 示例代码..."
echo "========================================"
echo ""

# 设置输出目录
OUTPUT_DIR="build_output"
mkdir -p "$OUTPUT_DIR"

# 编译单个文件示例
COUNT=0
while IFS= read -r file; do
    # 跳过测试文件
    if echo "$file" | grep -qi "_test.go$"; then
        continue
    fi
    # 跳过包文件（15_packages 单独处理）
    if echo "$file" | grep -qi "15_packages"; then
        continue
    fi

    echo "编译: $file"
    name=$(basename "$file" .go)
    go build -o "$OUTPUT_DIR/$name" "$file"
    if [ $? -eq 0 ]; then
        echo "  [成功] -> $OUTPUT_DIR/$name"
    else
        echo "  [失败]"
    fi
    COUNT=$((COUNT + 1))
done < <(find . -name "*.go" -type f)

echo ""
echo "========================================"
echo "  编译完成！共编译 $COUNT 个文件"
echo "  可执行文件在 $OUTPUT_DIR/ 目录下"
echo "========================================"

echo ""
echo "注意：以下示例需要单独运行："
echo "  cd 15_packages && go mod init examples && go run main.go"
echo "  go run 28_net_http/01_http_server.go   (HTTP 服务器)"
echo "  go test -v ./23_testing/"
echo "  go test -v -bench=. ./33_testing_advanced/"
echo ""
