#!/bin/bash

set -e

BUILD_DIR="build"
mkdir -p "$BUILD_DIR"

echo "===================================="
echo "  编译所有 Go 示例代码"
echo "===================================="
echo ""

# 查找所有 .go 文件, 排除 _test.go 文件
find . -name "*.go" -not -name "*_test.go" | while read -r file; do
    filename=$(basename "$file" .go)
    echo "[编译] $file"
    go build -o "${BUILD_DIR}/${filename}" "$file"
    echo "[成功] 输出: ${BUILD_DIR}/${filename}"
    echo ""
done

echo "===================================="
echo "  编译完成！所有示例已编译成功"
echo "  可执行文件位于 ${BUILD_DIR}/ 目录"
echo "===================================="
