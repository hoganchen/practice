# C语言示例代码教程

## 📚 简介

本教程通过精心设计的示例代码，帮助有编程基础的开发者快速学习C语言。每个示例都包含：
- 📝 知识点说明（中文）
- 💬 详细的逐行中文注释
- 🔧 编译方法
- 🏃 可直接编译运行的完整代码

## 📋 目录结构

| 序号 | 目录 | 知识点 |
|------|------|--------|
| 01 | [hello-world](01_hello-world/) | Hello World 程序入门 |
| 02 | [data-types](02_data-types/) | 基本数据类型 |
| 03 | [constants](03_constants/) | 常量和字面量 |
| 04 | [operators](04_operators/) | 运算符 |
| 05 | [input-output](05_input-output/) | 输入输出 |
| 06 | [conditional](06_conditional/) | 条件判断 |
| 07 | [loops](07_loops/) | 循环 |
| 08 | [functions](08_functions/) | 函数 |
| 09 | [arrays](09_arrays/) | 数组 |
| 10 | [strings](10_strings/) | 字符串 |
| 11 | [pointers](11_pointers/) | 指针 |
| 12 | [dynamic-memory](12_dynamic-memory/) | 动态内存分配 |
| 13 | [structures](13_structures/) | 结构体 |
| 14 | [unions-enums](14_unions-enums/) | 联合体和枚举 |
| 15 | [typedef](15_typedef/) | typedef 类型定义 |
| 16 | [file-io](16_file-io/) | 文件输入输出 |
| 17 | [preprocessor](17_preprocessor/) | 预处理 |
| 18 | [headers](18_headers/) | 头文件与多文件编程 |
| 19 | [function-pointers](19_function-pointers/) | 函数指针 |
| 20 | [variadic-functions](20_variadic-functions/) | 可变参数函数 |
| 21 | [command-line-args](21_command-line-args/) | 命令行参数 |
| 22 | [bit-manipulation](22_bit-manipulation/) | 位操作 |
| 23 | [linked-list](23_linked-list/) | 链表 |
| 24 | [sorting](24_sorting/) | 排序算法 |
| 25 | [type-conversion](25_type-conversion/) | 类型转换（隐式/显式） |
| 26 | [error-handling](26_error-handling/) | 错误处理 |
| 27 | [math-library](27_math-library/) | 数学库 &lt;math.h&gt; |
| 28 | [date-time](28_date-time/) | 日期时间 &lt;time.h&gt; |
| 29 | [goto](29_goto/) | goto 语句与标签 |
| 30 | [assertions](30_assertions/) | 断言 &lt;assert.h&gt; |
| 31 | [storage-class](31_storage-class/) | 存储类别说明符 |
| 32 | [c99-c11-features](32_c99-c11-features/) | C99/C11 重要特性 |
| 33 | [random](33_random/) | 随机数生成 &lt;stdlib.h&gt; |
| 34 | [signal](34_signal/) | 信号处理 &lt;signal.h&gt; |
| 35 | [setjmp](35_setjmp/) | 非局部跳转 &lt;setjmp.h&gt; |
| 36 | [threads](36_threads/) | 线程编程 (pthread / Win32) |
| 37 | [ctype](37_ctype/) | 字符分类 &lt;ctype.h&gt; |
| 38 | [stdlib-utils](38_stdlib-utils/) | stdlib 实用工具 |
| 39 | [stdatomic](39_stdatomic/) | 原子操作 &lt;stdatomic.h&gt; |

## 🚀 使用方法

### 编译运行单个文件

使用 GCC 编译器（MinGW 或 Linux GCC）：

```bash
# 编译
gcc 文件名.c -o 输出文件名

# 运行（Windows）
输出文件名.exe

# 运行（Linux/Mac）
./输出文件名
```

### 编译运行多文件项目

```bash
# 对于 multi-file 示例
gcc *.c -o main
./main
```

### Windows 环境准备

1. 安装 MinGW-w64 或使用 WSL
2. 将 gcc 添加到系统 PATH
3. 在终端中运行上述命令

### Linux/Mac 环境

系统通常已自带 GCC，直接编译运行即可。

## 💡 学习建议

1. **按顺序学习**：知识点由浅入深，建议按目录序号顺序学习
2. **动手实践**：阅读示例后，尝试修改代码观察效果
3. **查阅资料**：遇到不懂的概念，可以配合[C语言标准文档](https://en.cppreference.com/w/c)查阅
4. **举一反三**：每个示例都展示了一个核心概念，思考如何在实际项目中应用

## 📖 每个示例文件包含

```c
/*
 * ============================================
 * 知识点：[知识点名称]
 * 说明：[详细的中文说明]
 * 编译方法：gcc 文件名.c -o 输出文件名
 * ============================================
 */

#include <stdio.h>

int main() {
    // [中文注释解释代码功能]
    printf("Hello, World!\n");
    return 0;
}
```

---

**开始学习 → [01 Hello World](01_hello-world/01_hello_world.c)**

---

## 配套编译注意

| 目录 | 特殊编译选项 |
|------|-------------|
| 27_math-library | `gcc -lm` 链接数学库（Linux） |
| 32_c99-c11-features | 建议 `gcc -std=c11` |
| 36_threads | `gcc -lpthread`（Linux，pthread 版本） |
| 39_stdatomic | 建议 `gcc -std=c11`，可能需要 `-latomic` |
