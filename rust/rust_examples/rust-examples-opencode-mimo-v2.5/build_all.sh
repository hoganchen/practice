#!/bin/bash

# ============================================
# 编译所有 Rust 示例代码 (Linux/macOS)
# ============================================

echo "开始编译 Rust 示例代码..."

# 创建输出目录
mkdir -p bin

# 编译每个示例
for dir in */; do
    # 跳过 bin 目录
    if [ "$dir" = "bin/" ]; then
        continue
    fi
    
    echo "编译 $dir 目录..."
    for file in "$dir"*.rs; do
        if [ -f "$file" ]; then
            filename=$(basename "$file" .rs)
            echo "  编译 $file"
            rustc "$file" -o "bin/$filename" 2>/dev/null
            if [ $? -eq 0 ]; then
                echo "    编译成功: $filename"
            else
                echo "    编译失败: $file"
            fi
        fi
    done
done

echo ""
echo "编译完成!"
echo "可执行文件位于 bin 目录"
echo ""

# 赋予可执行权限
chmod +x bin/*
