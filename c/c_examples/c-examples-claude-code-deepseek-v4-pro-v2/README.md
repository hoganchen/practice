# C语言示例代码学习教程

## 简介

本项目是一套完整的 C 语言学习示例代码集合，涵盖从基础语法到高级主题的各个方面。每个示例文件都是独立可编译运行的 C 程序（含多文件项目），配有详细的中文注释，帮助学习者理解 C 语言的核心概念和编程技巧。

项目共包含 **22 个分类**，**85 个源文件**，覆盖以下知识领域：

- C 语言基础语法（变量、数据类型、运算符、控制流、转义序列）
- 函数与存储类（含内联函数、函数指针、变参函数）
- 数组与指针（含动态内存管理、VLA、指定初始化器）
- 字符串处理
- 结构体、联合体与枚举（含柔性数组成员、复合字面量）
- 文件输入输出（含随机访问）
- 预处理器与宏（含可变参宏）
- C 标准库使用（数学、时间、随机数、排序查找、定宽整数类型）
- 布尔类型与类型泛型（stdbool.h、_Generic）
- 错误处理
- 多文件项目组织
- 多线程编程（pthreads、C11原子操作、线程本地存储）
- 网络编程（TCP socket）
- 位操作
- 数据结构（链表、栈、队列、二叉树、哈希表）
- 高级主题（信号处理、setjmp/longjmp、断言、复杂声明、环境变量）

## 运行环境

### 硬件要求

- 任意现代 x86/x64 或 ARM 计算机
- 至少 50 MB 可用磁盘空间（用于存储源码和编译输出）

### 软件要求

- **C 编译器**：GCC (MinGW-w64) 或 Clang，支持 C11 标准
  - Windows：推荐 [MinGW-w64](https://www.mingw-w64.org/) 或 [TDM-GCC](https://jmeubank.github.io/tdm-gcc/)
  - Linux：`sudo apt install gcc` (Debian/Ubuntu) 或 `sudo dnf install gcc` (Fedora)
  - macOS：`xcode-select --install` 安装 Command Line Tools
- **构建工具**：GNU Make（可选，可直接使用 gcc 命令）
- ** pthread 库**：用于多线程示例
  - Windows：MinGW-w64 已包含 pthread
  - Linux/macOS：系统自带
- **Winsock 库**：仅 Windows 网络编程示例需要（MinGW-w64 已包含）

### 验证编译器

```bash
gcc --version
```

输出应显示 gcc 版本信息，并支持 `-std=c11` 选项。

## 如何使用示例

### 编译和运行单个示例

进入示例所在目录，使用 gcc 编译：

```bash
# 进入目录
cd 01_hello_world

# 编译
gcc 01_hello_world.c -o 01_hello_world.exe -std=c11 -Wall

# 运行
./01_hello_world.exe
```

各示例文件的编译指令和运行指令均包含在源文件顶部的注释中。

### 特殊文件的编译说明

| 类别 | 文件 | 编译需要 |
|------|------|----------|
| 网络编程 | `19_network/*.c` | Windows: `-lws2_32` |
| 多线程 | `18_threading/*.c` | `-lpthread` |
| 数学函数 | `15_standard_library/02_math_functions.c` | `-lm`（MinGW 可选） |
| 多文件项目 | `17_multifile/main.c` + `helper.c` | 同时编译两个文件 |

### 多文件项目

```bash
cd 17_multifile
gcc main.c helper.c -o multifile_demo.exe -std=c11 -Wall
./multifile_demo.exe
```

## 一键构建所有示例

### Windows

在项目根目录双击运行 `build.bat`，或在命令行执行：

```batch
build.bat
```

脚本会自动：
1. 编译多文件项目 (`17_multifile/main.c` + `helper.c`)
2. 逐一遍历所有子目录，编译每个 `.c` 文件
3. 为网络文件自动添加 `-lws2_32` 链接选项
4. 为线程文件自动添加 `-lpthread` 链接选项
5. 为数学函数文件自动添加 `-lm` 链接选项
6. 输出每个文件的编译结果（成功/失败）
7. 最后显示汇总统计

### Unix (Linux / macOS)

```bash
chmod +x build.sh
./build.sh
```

脚本会自动：
1. 编译多文件项目
2. 逐一遍历所有子目录，编译每个 `.c` 文件
3. 为线程文件自动添加 `-lpthread` 链接选项
4. 为数学函数文件自动添加 `-lm` 链接选项
5. 输出每个文件的编译结果
6. 最后显示汇总统计

> **注意**：网络编程示例 (`19_network/`) 使用 Windows Winsock API，在 Unix 系统上无法编译。如需在 Linux 上测试网络编程，请参考 Berkeley socket 的相关资料。

## 目录结构

```
C-examples-claude-code-kimi-v2.7/
  build.bat          -- Windows 编译脚本
  build.sh           -- Unix 编译脚本
  README.md          -- 本文件
  01_hello_world/    -- Hello World
  02_basics/         -- 基础语法
  03_data_types/     -- 数据类型
  ...                -- 其他目录
```

## 文件清单

| 目录 | 文件 | 知识点 |
|------|------|--------|
| 01_hello_world | 01_hello_world.c | Hello World 第一个C程序 |
| 02_basics | 01_variables_and_constants.c | 变量与常量 |
| 02_basics | 02_basic_io.c | 基本输入输出（printf/scanf/getchar） |
| 02_basics | 03_format_specifiers.c | 格式说明符（%d、%f、%x、%p等） |
| 02_basics | 04_escape_sequences.c | 转义序列（\\n、\\t、\\r、\\xNN等） |
| 03_data_types | 01_integer_types.c | 整数数据类型（short/int/long/long long） |
| 03_data_types | 02_float_types.c | 浮点类型（float/double/long double） |
| 03_data_types | 03_type_conversion.c | 类型转换与强制类型转换 |
| 03_data_types | 04_const_and_typedef.c | const限定符与typedef类型别名 |
| 03_data_types | 05_fixed_width_integers.c | 定宽整数类型（stdint.h/inttypes.h） |
| 03_data_types | 06_boolean_type.c | 布尔类型（stdbool.h/C99 _Bool） |
| 04_operators | 01_arithmetic_logical_ops.c | 算术运算符与逻辑运算符 |
| 04_operators | 02_bitwise_ops.c | 位运算符（&、\|、^、~、<<、>>） |
| 04_operators | 03_relational_and_ternary.c | 关系运算符与三元运算符 |
| 04_operators | 04_operator_precedence.c | 运算符优先级与结合性 |
| 04_operators | 05_sizeof_operator.c | sizeof运算符详解 |
| 05_control_flow | 01_if_else.c | if-else条件判断语句 |
| 05_control_flow | 02_switch_case.c | switch-case多分支选择语句 |
| 05_control_flow | 03_while_do_while.c | while和do-while循环 |
| 05_control_flow | 04_for_loop.c | for循环 |
| 05_control_flow | 05_break_continue_goto.c | break、continue和goto跳转 |
| 06_functions | 01_function_basics.c | 函数定义与调用 |
| 06_functions | 02_pass_by_value.c | 传值调用 |
| 06_functions | 03_recursion.c | 递归函数 |
| 06_functions | 04_function_pointers.c | 函数指针 |
| 06_functions | 05_variadic_functions.c | 变参函数 |
| 06_functions | 06_inline_functions.c | 内联函数（inline关键字） |
| 07_storage_classes | 01_storage_classes.c | 存储类（auto/static/extern/register） |
| 08_arrays | 01_array_basics.c | 数组基础（一维数组） |
| 08_arrays | 02_multidimensional_arrays.c | 多维数组（二维数组） |
| 08_arrays | 03_variable_length_arrays.c | 可变长数组（VLA，C99特性） |
| 08_arrays | 04_designated_initializers.c | 指定初始化器（C99特性） |
| 09_pointers | 01_pointer_basics.c | 指针基础（&和*运算符） |
| 09_pointers | 02_pointer_arithmetic.c | 指针算术运算 |
| 09_pointers | 03_pointers_and_arrays.c | 指针与数组的关系 |
| 09_pointers | 04_dynamic_memory.c | 动态内存分配（malloc/calloc/realloc/free） |
| 09_pointers | 05_pointers_to_pointers.c | 指向指针的指针（二级指针） |
| 09_pointers | 06_const_pointers.c | const与指针的三种组合 |
| 09_pointers | 07_void_pointers.c | void指针（通用指针） |
| 10_strings | 01_string_basics.c | 字符数组与null终止符 |
| 10_strings | 02_string_functions.c | 常用字符串函数（strcpy/strcat/strcmp） |
| 10_strings | 03_string_search.c | 字符串查找与分割（strstr/strtok） |
| 10_strings | 04_string_conversion.c | 字符串与数字之间转换（atoi/strtol/sprintf） |
| 11_structs | 01_struct_basics.c | 结构体基础（定义、初始化、访问） |
| 11_structs | 02_struct_arrays_and_pointers.c | 结构体数组与指针（箭头运算符） |
| 11_structs | 03_struct_padding_and_bitfields.c | 结构体填充、对齐与位域 |
| 11_structs | 04_self_referential_structs.c | 自引用结构体（链表节点） |
| 11_structs | 05_flexible_array_member.c | 柔性数组成员（C99特性） |
| 11_structs | 06_compound_literals.c | 复合字面量（C99特性） |
| 12_unions_enums | 01_unions.c | 联合体（内存共享、类型双关） |
| 12_unions_enums | 02_enums.c | 枚举（具名常量、switch-case） |
| 13_file_io | 01_file_open_close.c | 文件打开与关闭（fopen/fclose） |
| 13_file_io | 02_file_read_write.c | 文件读写（fgetc/fgets/fread/fprintf） |
| 13_file_io | 03_file_positioning.c | 文件定位与随机访问（fseek/ftell） |
| 14_preprocessor | 01_macro_define.c | 宏定义（对象宏、函数宏） |
| 14_preprocessor | 02_conditional_compilation.c | 条件编译（#if/#ifdef/#ifndef） |
| 14_preprocessor | 03_stringize_concatenation.c | 字符串化与符号拼接运算符（#和##） |
| 14_preprocessor | 04_predefined_macros.c | 预定义宏（__FILE__/__LINE__/__DATE__） |
| 14_preprocessor | 05_variadic_macros.c | 可变参宏（__VA_ARGS__） |
| 15_standard_library | 01_random_number.c | 随机数生成（rand/srand） |
| 15_standard_library | 02_math_functions.c | 数学库函数（sin/sqrt/pow/fabs） |
| 15_standard_library | 03_time_and_date.c | 时间和日期函数（time/clock/strftime） |
| 15_standard_library | 04_sorting_searching.c | 排序和查找（qsort/bsearch） |
| 16_error_handling | 01_errno_and_perror.c | errno和perror错误处理 |
| 16_error_handling | 02_exit_and_atexit.c | 退出状态和清理函数（exit/atexit/abort） |
| 17_multifile | main.c + helper.c | 多文件项目（头文件保护、函数声明） |
| 18_threading | 01_thread_basics.c | pthreads线程创建（pthread_create/join） |
| 18_threading | 02_mutex_sync.c | 互斥锁线程同步（pthread_mutex_lock） |
| 18_threading | 03_atomic_operations.c | 原子操作（C11 stdatomic.h） |
| 18_threading | 04_thread_local_storage.c | 线程本地存储（C11 _Thread_local） |
| 19_network | 01_tcp_client.c | TCP客户端编程（socket/connect） |
| 19_network | 02_tcp_server.c | TCP服务器编程（socket/bind/listen/accept） |
| 20_bit_manipulation | 01_bit_operations.c | 位操作实战（设置/清除/切换/检查位） |
| 21_data_structures | 01_linked_list.c | 单向链表（插入/删除/遍历） |
| 21_data_structures | 02_stack.c | 栈（后进先出LIFO，push/pop/peek） |
| 21_data_structures | 03_queue.c | 队列（环形缓冲区FIFO，enqueue/dequeue） |
| 21_data_structures | 04_binary_tree.c | 二叉搜索树（插入/查找/删除/遍历） |
| 21_data_structures | 05_hash_table.c | 哈希表（链地址法，插入/删除/查找） |
| 22_advanced_topics | 01_signal_handling.c | 信号处理（signal/SIGINT/raise） |
| 22_advanced_topics | 02_setjmp_longjmp.c | 非局部跳转（setjmp/longjmp错误恢复） |
| 22_advanced_topics | 03_assert_and_static_assert.c | 运行时断言与静态断言（assert/Static_assert） |
| 22_advanced_topics | 04_complex_declarations.c | 复杂指针声明解读（右左法则） |
| 22_advanced_topics | 05_generic_selection.c | 泛型选择（C11 _Generic关键字，编译期类型分发） |
| 22_advanced_topics | 06_environment_vars.c | 环境变量（getenv/putenv读取设置环境变量） |

## 学习路线建议

按照目录编号顺序学习，建议路线：

1. **入门阶段**：01~04（Hello World、基础语法、数据类型、运算符）
2. **控制流程**：05（条件判断、循环、跳转）
3. **函数**：06~07（函数定义、传值、递归、函数指针、内联函数、存储类）
4. **核心概念**：08~10（数组、指针、VLA、指定初始化器、字符串）-- 重中之重
5. **自定义类型**：11~12（结构体、联合体、枚举、柔性数组、复合字面量）
6. **文件操作**：13（文件打开、读写、定位）
7. **预处理**：14~15（宏定义、条件编译、可变参宏、标准库）
8. **标准库**：15~16（数学、时间、排序、随机数、错误处理）
9. **项目组织**：17（多文件项目）
10. **进阶主题**：18~22（线程、原子操作、网络、位操作、数据结构、_Generic、环境变量）

## 常见问题

### Q: 编译时报错 "undefined reference to `pthread_create'"

确保编译时添加了 `-lpthread` 链接选项。如果使用 `build.bat` 或 `build.sh`，脚本会自动处理。

### Q: 网络示例编译失败 "WSAStartup was not declared"

网络示例使用 Windows Winsock API，需要在 Windows 环境下使用 MinGW-w64 编译。Linux/macOS 用户需要修改代码使用 Berkeley socket API。

### Q: 运行 build.bat 后 cmd 窗口闪退

在命令行中运行 `build.bat` 而不是双击，这样可以看到编译输出信息。

### Q: 编译输出文件在哪里？

每个 `.c` 文件编译后的 `.exe`（Windows）或可执行文件（Unix）位于同一目录下，与源文件同名。

---

*Happy Coding!*
