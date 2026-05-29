#!/bin/bash
# ============================================================
# Go 示例代码批量编译脚本（Linux / macOS / Git Bash）
# 编译所有目录下的 Go 示例代码
# 依赖 Go 1.21+ 环境
# ============================================================

set -e

echo "========================================"
echo "  Go 语言示例 - 批量编译脚本"
echo "========================================"
echo ""

# 检查 go 命令
if ! command -v go &>/dev/null; then
    echo "[错误] 未找到 go 命令，请先安装 Go"
    exit 1
fi

echo "Go 版本: $(go version)"
echo ""

DIRS="01_hello_basics 02_control_flow 03_functions 04_collections 05_structs_interfaces 06_pointers 07_error_handling 08_concurrency 09_file_io 10_time 11_context 12_testing 13_networking 14_reflection 15_modules 16_go125_new_features 17_structured_logging"
SUCCESS=0
FAILED=0

mkdir -p build

for dir in $DIRS; do
    echo "[编译] $dir"
    if [ ! -d "$dir" ]; then
        echo "  [跳过] 目录不存在: $dir"
        continue
    fi

    cd "$dir"

    if [ "$dir" = "15_modules" ]; then
        if go build -o ../build/${dir} . 2>/dev/null; then
            echo "  [成功] $dir → build/${dir}"
            SUCCESS=$((SUCCESS + 1))
        else
            echo "  [失败] $dir"
            FAILED=$((FAILED + 1))
        fi
    elif [ "$dir" = "12_testing" ]; then
        echo "  [跳过] 测试目录，请运行: go test ./$dir/"
    elif [ "$dir" = "16_go125_new_features" ]; then
        # Go 1.25 特性目录
        for file in *.go; do
            basename="${file%.go}"
            # 跳过 synctest 说明文件（仅 _test.go 可运行）
            if [ "$basename" = "02_synctest_basic" ]; then
                continue
            fi
            if go build -o "/dev/null" "$file" 2>/dev/null; then
                echo "  [成功] ${file}"
                SUCCESS=$((SUCCESS + 1))
            else
                echo "  [失败] ${file} (可能需要 Go 1.25+)"
                FAILED=$((FAILED + 1))
            fi
        done
    else
        for file in *.go; do
            basename="${file%.go}"
            if go build -o "/dev/null" "$file" 2>/dev/null; then
                echo "  [成功] ${file}"
                SUCCESS=$((SUCCESS + 1))
            else
                echo "  [失败] ${file}"
                FAILED=$((FAILED + 1))
            fi
        done
    fi

    cd ..
done

echo ""
echo "========================================"
echo " 编译完成: 成功 ${SUCCESS} 个, 失败 ${FAILED} 个"
echo "========================================"
echo ""
echo "使用方法："
echo "  cd 目录名"
echo "  go run 文件名.go"
echo ""
echo "测试："
echo "  go test -v ./12_testing/"
echo "  go test -v ./16_go125_new_features/ -run TestSynctest"
