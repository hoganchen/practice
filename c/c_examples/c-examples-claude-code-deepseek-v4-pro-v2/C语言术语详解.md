# C 语言术语详解

> 本文系统整理 C 语言（ISO/IEC 9899，即 C11）的核心术语，涵盖：
> - 每个术语的英文原名、中文译名与详细解释
> - 标准正式术语与常见民间叫法的差异（学习中最容易踩的坑）
> - 易混淆术语的辨析
>
> 约定：
> - **标准术语** —— 出现在 C 标准正文中的词
> - **民间术语** —— 教学社区/工业界流行，但标准中查不到的词

---

## 目录

1. [基础概念](#一基础概念)
2. [类型系统](#二类型系统)
3. [指针与内存](#三指针与内存)
4. [函数](#四函数)
5. [存储期·作用域·链接](#五存储期作用域链接)
6. [程序行为（未定义行为等）](#六程序行为未定义行为等)
7. [表达式与求值](#七表达式与求值)
8. [字面量、数组与字符串](#八字面量数组与字符串)
9. [预处理器](#九预处理器)
10. [标准库](#十标准库)
11. [术语辨析：标准术语 vs 民间叫法](#十一术语辨析标准术语-vs-民间叫法)
12. [中英对照速查表](#十二中英对照速查表)

---

## 一、基础概念

### 源文件 (source file)
磁盘上的一个 `.c` 或 `.h` 文本文件，是编译的输入单位之一。

### 翻译单元 (translation unit)
**标准术语**。经过预处理器处理后、交给编译器的一个完整编译单位。

> 一个 `.c` 文件加上它 `#include` 进来的所有头文件，展开后构成一个翻译单元。
> 切忌与"源文件"混为一谈 —— 源文件是磁盘文件，翻译单元是预处理后的结果。

### 声明 vs 定义 (declaration vs definition)
- **声明 (declaration)**：告诉编译器"有这么个名字，类型是什么"。可以有多个。
- **定义 (definition)**：真正分配存储空间 / 给出函数体。**只能有一个**。

```c
int x;            // 定义（分配了空间，且是 tentative definition）
extern int x;     // 声明（只是引用，不分配）
int f(int);       // 函数声明（原型）
int f(int a){ return a; }  // 函数定义
```

**"单一定义规则"（One Definition Rule）**：同一个对象/函数在一个程序中只能有一个定义。

### 暂时性定义 (tentative definition)
**标准术语**。文件作用域下没有初始化器的 `int x;` 属于暂时性定义。如果同一翻译单元内没有真正的定义，编译器会补一个"初始化为 0"的定义。

### 语句 vs 表达式 (statement vs expression)
- **表达式 (expression)**：产生一个值，如 `a + b`、`f(x)`。
- **语句 (statement)**：执行的单位，以分号结尾，如 `x = 1;`、`if (...)`。
- **表达式语句 (expression statement)**：`x = 1;` —— 表达式加分号构成语句。

### 副作用 (side effect)
**标准术语**。表达式求值过程中，对**执行环境状态的改变**（修改对象、I/O 等）。

```c
int a = 1;
a + 5;      // 无副作用（值被丢弃）
a++;        // 有副作用（a 被修改）
printf("x"); // 有副作用（产生 I/O）
```

### 块 (block)
用 `{ }` 括起来的一段复合语句。块引入了**块作用域 (block scope)**。

```c
{              // 块开始
    int x = 1; // x 只在块内可见
}              // 块结束，x 销毁
```

### 关键字 (keyword)
C 语言保留的、有特殊含义的词，**不能用作标识符**：`int`、`if`、`return`、`while`、`struct`……

> C11 共有 **44 个关键字**（C90 是 32 个）。`_Bool`、`_Thread_local`、`_Generic` 等下划线开头的也是关键字。

### 标识符 (identifier)
程序中的名字：变量名、函数名、类型名、标签等。

- 由字母、数字、下划线组成，**不能以数字开头**
- **区分大小写**（`Count` 与 `count` 是不同名字）

```c
int count_1;    // ✅
int 1count;     // ❌ 不能以数字开头
```

### 初始化 vs 赋值 (initialization vs assignment) ★
**两个完全不同的概念**，初学者最常混淆：

| | 初始化 (initialization) | 赋值 (assignment) |
|---|---|---|
| 时机 | **定义对象时**顺便给初值 | 对象**已存在**后改变其值 |
| 形式 | `int x = 5;` | `x = 5;` |

```c
int x = 5;    // 初始化
int y;        // y 的值不确定
y = 5;        // 赋值
```

> 数组、结构体等**只能初始化，不能整体赋值**：
> ```c
> int a[3] = {1, 2, 3};   // ✅ 初始化
> int b[3]; b = a;        // ❌ 数组不能整体赋值
> ```

### 初始化器与指定初始化器 (initializer / designated initializer)
**初始化器**：给对象提供初值的语法。**指定初始化器**：C99 特性，用**成员名或下标**指定初始化哪一部分。

```c
int a[5] = { [0] = 1, [4] = 5 };   // 指定下标
struct P p = { .y = 2, .x = 1 };   // 指定成员（顺序可打乱）
```

### 常量表达式 (constant expression) ★
**标准术语**。可以在**编译期求值**的表达式。

**关键**：C 中 `const` 变量**不是**常量表达式！

```c
int arr[5];              // ✅ 5 是常量表达式
const int n = 5;
int b[n];                // ❌ C 中错误！n 不是常量表达式（C++ 可以）
enum { SIZE = 5 };
int c[SIZE];             // ✅ 枚举常量是常量表达式
```

> 这正是「`const` ≠ 编译期常量」的体现（见 [第五节 const](#const)）。

### 声明符 vs 声明说明符 (declarator vs declaration specifier)
**标准术语**。C 的声明由两部分组成：

- **声明说明符 (specifier)**：类型 + 存储类，如 `static const int`
- **声明符 (declarator)**：名字及其修饰（指针/数组/函数），如 `*p[5]`

```c
static const int (*fp[3])(void);
└─ 说明符 ──────┘ └─ 声明符 ──┘
```

### 编译与链接 (compilation and linking)
从源码到可执行文件经过的步骤（**属工具链层面**，不是语言语法）：

1. **预处理 (preprocessing)** → 生成翻译单元
2. **编译 (compilation)** → 生成汇编代码
3. **汇编 (assembly)** → 生成**目标文件 (object file)**
4. **链接 (linking)** → 生成可执行文件

- **目标文件 (object file)**：编译产物，包含机器码与**符号表 (symbol table)**
- **链接器 (linker)**：把多个目标文件和库**链接**成最终程序
- **符号 (symbol)**：链接器眼中的名字（函数名、全局变量名）
- **未定义符号 (undefined symbol)**：被引用却没有定义

```text
a.c ─┐
b.c ─┼─ 编译 ─→ a.o, b.o ─ 链接 ─→ program.exe
libc ┘
```

> 报错 **"undefined reference to `foo'"** 就是**链接阶段**找不到 `foo` 的定义 —— 说明是声明了但没定义（或没链上对应的库）。

---

## 二、类型系统

### 对象 (object)
**标准术语**。一块**可存储数据的区域**，其内容可以表示值（值可以在程序执行期间变化）。

> 注意：C 标准里 "object" ≠ 面向对象里的"对象"。它就是"内存中的一块数据"。

### 类型 (type)
决定：
- 对象占多大内存（`sizeof`）
- 如何解释这块内存的位模式
- 能做哪些运算

### 限定符 (qualifier)
**标准术语**，共三个：
| 限定符 | 含义 |
|--------|------|
| `const` | 只读（**不是**编译期常量！） |
| `volatile` | 禁止优化，每次访问都真正读写（用于硬件寄存器、信号处理） |
| `restrict` | C99 新增，承诺指针是访问该对象的唯一途径，帮助优化 |

### 不完整类型 vs 完整类型 (incomplete / complete type)
- **不完整类型**：编译器不知道大小的类型。如 `void`、未定长的数组 `int a[]`、只有声明没有定义的结构体 `struct Node;`
- **完整类型**：大小已确定的类型

```c
struct Node;          // 不完整类型（前向声明）
struct Node *p;       // ✅ 可以定义指向它的指针
struct Node n;        // ❌ 错误！不知道大小，无法分配
```

### 兼容类型 (compatible type)
**标准术语**。两个类型"足够相像"，可以互相赋值。同一类型当然兼容；`int` 与 `int` 兼容，`int` 与 `long` 不一定兼容（取决于实现）。

### 标量类型 vs 聚合类型 (scalar / aggregate type)
- **标量类型 (scalar)**：算术类型 + 指针类型（单个值）
- **聚合类型 (aggregate)**：数组、结构体（多个值，C 中不含联合体）

### 算术类型 (arithmetic type)
整数类型 + 浮点类型。

### 填充 (padding) 与对齐 (alignment)
- **对齐 (alignment)**：对象地址必须是某个值（通常是自身大小）的整数倍，硬件访问更快。
- **填充 (padding)**：为满足对齐而在结构体成员之间插入的**未使用字节**。

```c
struct S {
    char  c;   // 1 字节
    // 3 字节填充（padding）
    int   i;   // 4 字节
};             // sizeof(struct S) = 8，不是 5！
```

### 位域 (bit-field)
结构体中用 `unsigned x : 3;` 指定成员占用的**位数**。

### 表示 vs 值 (representation vs value)
- **表示 (representation)**：内存中的位模式
- **值 (value)**：该位模式所代表的意义
- **陷阱表示 (trap representation)**：某些位模式**不代表任何值**，读取它会导致 UB。例如整数类型中未使用的**填充位**、或 `_Bool` 存储了非 `0`/`1` 的非法值
  > 注：现代 IEEE 754 浮点类型通常**没有**陷阱表示（`NaN` 是**合法值**，不是陷阱）

### 不确定值 (indeterminate value)
**标准术语**。未初始化对象的初始值状态。读取不确定值通常是 UB（或产生未指明值）。

> **民间叫"垃圾值 (garbage value)"** —— 标准里没有"垃圾值"这个词。

### 整型提升 (integer promotion)
**标准术语**。比 `int` 小的整数类型（`char`、`short`、`_Bool`、位域）在参与运算前，**一律先提升为 `int`**。

```c
char c = 200;      // 若 char 有符号，这里已是实现定义
int  r = c + 1;    // c 先提升为 int，再算
```

### 寻常算术转换 (usual arithmetic conversions)
**标准术语**。二元运算中，两个操作数类型不同时，按一套规则（精度从低到高）统一转换为共同类型。

```c
int   i = 5;
double d = 2.0;
i / 2.0;    // i 被转为 double，结果是 2.5
i / 2;      // 整数除法，结果是 2（截断）
```

### 隐式转换 vs 显式转换 (implicit / explicit conversion)
- **隐式**：编译器自动完成，如 `int → double`
- **显式（强制类型转换，cast）**：`(double)i`，程序员指定

### typedef（类型别名）
用 `typedef` 给**已有类型**起一个新名字。

```c
typedef unsigned int u32;              // u32 是 unsigned int 的别名
typedef int (*func_t)(int, int);       // 函数指针类型的别名
u32 x = 42;
```

> **注意**：`typedef` **不创建新类型**，只是别名。它和 `#define` 的文本替换不同 —— 有真正的类型检查，也更受编译器认可。

### 结构体、联合体、枚举 (structure / union / enumeration)
三种**派生类型**，区别在于内存布局：

| 类型 | 关键字 | 内存布局 |
|------|--------|----------|
| **结构体** | `struct` | 成员**各自占独立空间**，可同时存在 |
| **联合体** | `union` | 所有成员**共享同一块空间**，同一时刻只能存一个 |
| **枚举** | `enum` | 一组具名的整数常量 |

```c
struct Point { int x, y; };         // 结构体：x、y 各占 4 字节
union  U     { int i; float f; };   // 联合体：i、f 共用 4 字节
enum   Color { RED, GREEN, BLUE };  // 枚举：RED=0, GREEN=1, BLUE=2
```

### 标签 (tag) 与命名空间 (name space)
**标准术语**。C 中不同种类的名字**互不冲突**，因为它们位于不同的**命名空间**：

- **标签 (tag)**：跟在 `struct` / `union` / `enum` 后面的名字
- **普通标识符**：变量、函数、typedef 名
- `goto` 的**标签 (label)**、结构体**成员名**各占独立命名空间

```c
struct stat { int mode; };   // 标签 "stat"
int stat = 1;                // ✅ 普通标识符 "stat"，与标签互不冲突！
```

### 字节与位 (byte / bit)
**标准的定义与日常认知略有不同**：

- **字节 (byte)**：C 标准定义为 **`char` 的大小**，**至少 8 位**（不一定是 8！）
- `CHAR_BIT`（`<limits.h>`）给出一个字节的位数
- `sizeof` 返回的是**字节数**，不是位数

```c
#include <limits.h>
printf("%d\n", CHAR_BIT);   // 通常 8，但标准只保证 >= 8
```

### 类型双关 (type punning)
**民间术语**。透过**一种类型的表达式**去访问**另一种类型**所存储的对象，典型做法是用联合体。

```c
union { float f; uint32_t u; } pun;
pun.f = 3.14f;
printf("%08X\n", pun.u);   // 以位模式查看 float
```

> 严格来说，通过联合体做类型双关在 C 中是**被允许**的（C++ 中是 UB）；而用指针强转 `*(uint32_t*)&f` 则可能违反**严格别名规则**（见下）。

### 有效类型 (effective type) 与严格别名规则
**标准术语**。C 为已分配的对象维护一个「有效类型」，决定了能否用其他类型的左值去访问它。

> **严格别名规则 (strict aliasing)**：编译器假定不同类型的指针**不指向同一对象**，并据此优化。违反它（如 `*(int*)&f`）会导致 UB。
> 这也是 `-fstrict-aliasing` 开关背后的规则。

### 基本类型 vs 派生类型 (basic / derived type)
- **基本类型 (basic type)**：`void`、算术类型（整数 / 浮点）、原子类型
- **派生类型 (derived type)**：数组、函数、指针

```c
int         a;    // 基本类型
int         b[5]; // 派生：数组
int        *c;    // 派生：指针
int f(void);      // 派生：函数
```

### 字符类型 (character type) ★
**三种字符类型**：`char`、`signed char`、`unsigned char`。**它们是三个不同的类型**！

| 类型 | 是否可为负 | 用途 |
|------|-----------|------|
| `char` | **实现定义** ⚠️ | 文本字符 |
| `signed char` | 是（至少 -127~127） | 小整数 |
| `unsigned char` | 否（至少 0~255） | **原始字节** |

```c
char          c = 'A';     // 文本
unsigned char b = 0xFF;    // 原始字节
```

> 陷阱：`char` 是否有符号**取决于实现**（x86 上通常有符号）。处理字节值时应显式用 `unsigned char`。

### 布尔类型 (boolean type)
C99 起有原生布尔类型 `_Bool`，`<stdbool.h>` 提供 `bool` / `true` / `false` 宏。

```c
#include <stdbool.h>
bool ok = true;
```

> 任何**非 0 值**转 `_Bool` 都变成 `1`（**不是**保留原值）：
> ```c
> bool b = 42;   // b == 1
> ```

### 定宽整数类型 (fixed-width integer type)
`<stdint.h>` 提供的**精确宽度**整数：`int8_t`、`uint8_t` …… `int64_t`。

```c
#include <stdint.h>
int32_t  x = 42;      // 恰好 32 位
uint64_t y = 0;
```

> 相关变体：「最小宽度」`int_least8_t`、「最快」`int_fast8_t`、「最大」`intmax_t`。
> 用 `printf` 打印时要配 `<inttypes.h>` 的 `PRId32` 等宏。

### 复数类型 (complex type)
C99 特性。`_Complex`，`<complex.h>` 提供 `complex` 宏与虚数单位 `I`。

```c
#include <complex.h>
double complex z = 1.0 + 2.0 * I;
```

### size_t 与 ptrdiff_t
标准库定义的两个**与实现相关的整数类型**，专用于大小与指针差值：

- **`size_t`**：`sizeof` 的结果类型，**无符号**，用于大小 / 计数
- **`ptrdiff_t`**：两个指针相减的结果类型，**有符号**

```c
size_t    n = sizeof(arr);            // 无符号
ptrdiff_t d = &arr[5] - &arr[0];      // 有符号（可能为负）
```

> 这也是为什么 `for (size_t i = n - 1; i >= 0; i--)` 是**危险**的 —— 无符号永远 `>= 0`，会死循环。

### 字节序 (endianness) ★
**多字节对象在内存中的字节排列顺序**（实现定义）：

| 类型 | 含义 | 例：`0x12345678` 的存储 |
|------|------|-------------------------|
| **小端 (little-endian)** | 低位字节在低地址 | `78 56 34 12` |
| **大端 (big-endian)** | 高位字节在低地址 | `12 34 56 78` |

```c
uint32_t x = 0x12345678;
unsigned char *p = (unsigned char *)&x;
printf("%02X\n", p[0]);   // 小端输出 78，大端输出 12
```

> x86 / ARM（常见配置）是**小端**。网络协议（TCP/IP）用**大端**，所以有 `htons()` / `ntohl()` 转换函数。
> 写跨平台二进制格式时必须考虑字节序。

### 多维数组 (multidimensional array)
数组的数组。**按行主序 (row-major)** 连续存储。

```c
int m[3][4];        // 3 行 4 列，共 48 字节
m[1][2];            // 第 1 行第 2 列
```

> `m` 的类型是 `int(*)[4]`（指向 `int[4]` 的指针），这是理解二维数组参数的关键。

### 柔性数组成员 (flexible array member)
**C99 特性**。结构体**最后一个成员**可以是**未指定长度的数组**，实现变长结构体。

```c
struct Buffer {
    size_t len;
    char   data[];    // 柔性数组成员：不占 sizeof
};
struct Buffer *b = malloc(sizeof(struct Buffer) + n);  // 一次分配
b->data[0] = 'x';
```

> 必须放在结构体**最后**，且结构体不能只有它一个成员。

### 匿名结构体 / 联合体 (anonymous struct / union)
**C11 特性**。没有名字的嵌套结构体/联合体，其成员**直接提升到外层**访问。

```c
struct S {
    int tag;
    union {            // 匿名联合体
        int  i;
        float f;
    };                 // 无名字，也无成员名
};
struct S s; s.i = 1;   // 直接 s.i，不用 s.u.i
```

### 前向声明 (forward declaration)
**民间术语**（标准相关概念是"不完整类型"）。提前声明一个还没定义的类型。

```c
struct Node;                     // 前向声明
struct Node *next;               // ✅ 可以定义指向它的指针
```

> 用于**互相引用**的结构体（如链表节点）。

### 不透明类型 (opaque type)
**民间术语**。只暴露指针、隐藏内部结构的类型，用于**信息隐藏 / ABI 稳定**。

```c
// 头文件中
typedef struct Database Database;   // 只有名字，没有定义
Database *db_open(const char *path); // 使用者只能操作指针
```

---

## 三、指针与内存

### 指针 (pointer)
一个**对象**，其值为另一个对象（或函数）的地址。

```c
int x = 42;
int *p = &x;   // p 保存 x 的地址
```

### 对象指针 vs 函数指针 (object / function pointer)
C 中指针分两大类，**它们之间不能互相转换**：
- **对象指针**：指向数据（`int *`、`struct S *`）
- **函数指针**：指向函数（`int (*)(int, int)`）

> 标准不保证二者大小相同、可互相赋值。

### 空指针常量 vs 空指针 (null pointer constant vs null pointer)
**两个不同的标准术语**，日常常被混淆：
- **空指针常量 (null pointer constant)**：值为 `0` 的整数常量表达式，或 `(void*)0`。即 `NULL`。
- **空指针 (null pointer)**：把空指针常量赋给指针后，该指针的值。

```c
p = NULL;   // NULL 是"空指针常量"；赋值后 p 的值是"空指针"
```

### void 指针 (void pointer)
`void *`，**通用指针**。可以与其他对象指针互相转换，但**不能解引用、不能做指针算术**。

```c
void *vp = &x;              // ✅ 接收任意对象指针
int  *ip = (int *)vp;       // ✅ 转回来
*vp;                        // ❌ 错误！不知道指向什么类型
```

### 悬空指针 (dangling pointer)
**民间术语**。指向**已释放内存**的指针。解引用它是 UB。

```c
int *p = malloc(sizeof(int));
free(p);
*p = 5;   // ❌ p 已是悬空指针，UB！
```

### 野指针 (wild pointer)
**民间术语**。**未初始化**的指针，指向随机地址。

```c
int *p;    // p 是野指针（内容不确定）
*p = 5;    // ❌ UB！
```

### 空悬 vs 野 vs 空：三者对比

| 名称 | 状态 | 来源 |
|------|------|------|
| 野指针 (wild) | 未初始化，值是随机的 | `int *p;` |
| 悬空指针 (dangling) | 曾有效，所指内存已释放 | `free(p)` 之后 |
| 空指针 (null) | 明确为 NULL | `p = NULL;`（安全） |

### 指针算术 (pointer arithmetic)
对指针做加减，**以所指类型的大小为步长**。

```c
int arr[5];
int *p = arr;
p + 1;    // 前进 sizeof(int) = 4 字节，而非 1 字节
```

### 越过末尾的指针 (one past the end)
**标准术语**。允许指针指向数组**最后一个元素之后**的位置（用作哨兵），但**不能解引用**。

```c
int arr[5];
int *end = arr + 5;   // ✅ 合法，但不能 *end
for (int *p = arr; p != end; p++) { /* ... */ }  // ✅ 惯用法
```

### 衰减 (decay)
**民间术语**（标准中完全查不到"decay"一词）。

表示：**数组/函数类型的表达式，在大多数场合自动转换为指针**，同时**丢失部分信息**。

> 标准原文（§6.3.2.1p3）只说"转换（converted）为指向首元素的指针"，从不使用 "decay"。

```c
int arr[10];
int *p = arr;        // arr 从 int[10] 衰减为 int*，长度 10 丢失！
sizeof(arr);         // ✅ 此处不衰减 = 40
```

### 间接 vs 解引用 (indirection vs dereference)
**同一操作的两个名字**：
- **标准术语**：`*` 叫 **indirection operator（间接运算符）**（§6.5.3.2 "Address and indirection operators"）
- **民间术语**：dereference（解引用）

> "dereferencing" 一词首见于 K&R **第 2 版**（第 1 版只说 "access indirectly"）。C 标准至今只用 "indirection"。

```c
int x = 42, *p = &x;
int y = *p;   // 间接 / 解引用：取出 p 所指的值
```

### 可解引用 (dereferenceable)
**标准术语**。指针指向了有效对象，才"可解引用"。空指针、悬空指针、越界指针都不可解引用。

### 取地址运算符 (address-of operator)
`&`，返回对象的地址。**操作数必须是左值**（有地址的东西）。

```c
&x;      // ✅
&(x+1);  // ❌ 错误！x+1 是临时值，没有地址
&3;      // ❌ 错误！字面量没有地址
```

### 别名 (aliasing)
**标准术语**。两个指针指向同一块内存的现象。

```c
int x;
int *p = &x, *q = &x;   // p 和 q 是别名
```

**restrict** 就是程序员承诺"没有别名"，让编译器放心优化。

### 存储期 (storage duration)
**标准术语**，共四类 —— **这才是标准替代"堆/栈"的正式概念**：

| 存储期 | 中文 | 生命周期 | 典型来源 |
|--------|------|----------|----------|
| `automatic` | 自动 | 进入块时创建，离开块销毁 | 局部变量 |
| `static` | 静态 | 程序整个运行期间 | 全局变量、`static` 局部 |
| `allocated` | 已分配 | 从 `malloc` 到 `free` | `malloc`/`calloc` |
| `thread` | 线程 | 线程创建到结束 | `_Thread_local` |

### "堆"与"栈" (heap / stack)
**民间术语**。**C 标准里没有这两个概念**！

- 「栈」对应 **automatic storage duration**（自动存储期）
- 「堆」对应 **allocated storage duration**（已分配存储期）

它们是操作系统/实现层面的叫法，混进语言讨论会掩盖本质。

### 内存泄漏 (memory leak)
**民间术语**。`malloc` 后忘记 `free`，导致内存无法回收。

### 缓冲区溢出 (buffer overflow)
**民间术语**。写入超出缓冲区边界，是 UB 和安全漏洞的常见来源。

```c
char buf[10];
strcpy(buf, "this is way too long");  // ❌ 溢出！
```

### 指针数组 vs 数组指针 (array of pointers vs pointer to array) ★
**最容易搞混的一对**，括号的位置决定一切：

| 声明 | 读法 | 含义 |
|------|------|------|
| `int *a[5];` | `a` 是数组，元素为 `int*` | **指针数组**（5 个指针） |
| `int (*a)[5];` | `a` 是指针，指向 `int[5]` | **数组指针**（1 个指针） |

```c
int *arr_of_ptr[5];    // 指针数组：sizeof = 5 × 8 = 40
int (*ptr_to_arr)[5];  // 数组指针：sizeof = 8
```

> 口诀：`[]` 优先级高于 `*`。`*a[5]` 先结合成「数组」；`(*a)` 用括号**强制先成指针**。

### const 与指针的三种组合 ★
`const` 放的位置不同，含义**完全不同**：

| 声明 | 谁只读 | 能否改指针 | 能否改数据 |
|------|--------|:----------:|:----------:|
| `const int *p` | 所指的 **int** 只读 | ✅ | ❌ |
| `int * const p` | **指针 p 本身**只读 | ❌ | ✅ |
| `const int * const p` | **两者都只读** | ❌ | ❌ |

```c
int a = 1, b = 2;
const int *p1 = &a;   // ✅ p1 = &b;   ❌ *p1 = 3;
int * const p2 = &a;  // ❌ p2 = &b;   ✅ *p2 = 3;
```

> **读法：从右往左** —— `const int *p` 读作「p 是（指向 const int 的）指针」。
> 详见 `09_pointers/06_const_pointers.c`。

### 指向指针的指针 (pointer to pointer)
即「二级指针」 `T **`，存放的是**另一个指针的地址**。

```c
int x = 42;
int *p = &x;
int **pp = &p;    // pp 指向 p
**pp = 100;       // 等价于 x = 100
```

> 常见用途：在函数内**修改调用方的指针**（如 `free_mem(void **)`）、动态二维数组。

### 通用指针 (generic pointer)
**标准术语**。指 `void *` —— 可以存放任意对象指针的「通用」类型。**不能解引用、不能做指针算术**。

### 分配函数 (allocation function)
**标准术语**。指 `malloc` / `calloc` / `realloc` / `aligned_alloc` 这组**分配内存**的函数，以及配对的 `free`。

```c
void *malloc(size_t size);              // 分配，不初始化
void *calloc(size_t n, size_t size);    // 分配 + 清零
void *realloc(void *p, size_t size);    // 调整大小
void  free(void *p);                    // 释放
```

### 内存布局 (memory layout)
**民间概念**（标准只讲存储期）。一个典型进程的内存分区：

| 段 | 内容 | 对应标准概念 |
|----|------|-------------|
| 代码段 (.text) | 机器指令 | — |
| 数据段 (.data) | **已初始化**的全局/静态变量 | `static` 存储期 |
| BSS 段 | **未初始化**的全局/静态变量（自动清零） | `static` 存储期 |
| 常量区 | 字符串字面量、只读数据 | — |
| 堆 (heap) | `malloc` 分配的内存 | `allocated` 存储期 |
| 栈 (stack) | 局部变量、函数调用帧 | `automatic` 存储期 |

> 标准**不保证**这个划分，但几乎所有实现都如此。字符串字面量通常放在只读的常量区 —— 这正是修改它会 UB 的原因。

### 未定义行为 (undefined behavior, UB)
见 [第六节](#六程序行为未定义行为等)。**彻底负面**：标准不做任何保证。

---

## 四、函数

### 函数指示符 (function designator)
**标准术语**。类型为"函数类型"的表达式。函数名就是函数指示符。

> 除 `sizeof`、`&` 的操作数外，函数指示符会**衰减为函数指针**。

### 函数原型 vs 函数定义 (prototype vs definition)
- **原型 (prototype)**：只声明签名，告诉编译器参数类型和返回类型
- **定义 (definition)**：给出函数体

```c
int add(int, int);            // 原型
int add(int a, int b) {       // 定义
    return a + b;
}
```

### 形参 vs 实参 (parameter vs argument)
**严格区分**：
- **形参 (parameter)**：函数定义/声明中列出的变量
- **实参 (argument)**：调用时实际传入的值

```c
int add(int a, int b) { ... }  // a, b 是"形参"
add(3, 4);                     // 3, 4 是"实参"
```

### 传值 (pass by value)
**标准规定**：C 中**所有参数都是传值**。

> **民间"传引用 / 传地址 (pass by reference)"的说法是不准确的** —— 所谓"传引用"其实是"把指针的**值**传进去"。C++ 才有真正的引用。

```c
void f(int x)  { x = 100; }   // 改的是副本，不影响调用方
void g(int *p) { *p = 100; }  // p 仍是传值（地址的副本），但能改到所指对象
```

### 默认实参提升 (default argument promotions)
**标准术语**。调用**没有原型**的函数（或变参部分）时：`float` 提升为 `double`，小整型提升为 `int`。

### 变参函数 (variadic function)
接受**可变数量参数**的函数，用 `...` 表示。

```c
int printf(const char *fmt, ...);
```

需要 `stdarg.h` 的 `va_list` / `va_start` / `va_arg` / `va_end`。

### 函数指针 (function pointer)
指向函数的指针。语法：`返回类型 (*名字)(参数类型)`。

```c
int (*fp)(int, int) = add;
int r = fp(3, 4);        // ✅ 直接调用
int r2 = (*fp)(3, 4);    // ✅ 显式解引用，完全等价
// 两者等价由标准 §6.3.2.1p4 + §6.5.2.2p1 保证
```

### 回调 (callback)
**民间术语**。把函数指针作为参数传给另一个函数，在适当时机被"回头调用"。

```c
void bubble_sort(int arr[], int n, int (*cmp)(int, int));
```

### 内联函数 (inline function)
`inline` 建议编译器把函数体展开到调用点，避免函数调用开销。**注意**：这是"建议"，编译器可以不理会；C99 的 `inline` 还有复杂的链接语义。

### 递归 (recursion)
函数调用自身。必须要有**终止条件**。

```c
int fact(int n) {
    return n <= 1 ? 1 : n * fact(n - 1);  // 终止条件 n <= 1
}
```

### 返回局部变量指针 (returning pointer to local)
**经典错误**。局部变量的存储期在函数返回时结束，返回其地址得到悬空指针。

```c
int *bad(void) {
    int local = 42;
    return &local;   // ❌ 返回悬空指针，UB！
}
```

### 函数签名 (function signature)
**民间术语** —— C 标准中**没有**这个词。通常指函数的**返回类型 + 参数类型列表**。函数指针的类型就由签名决定。

```c
int add(int, int);       // 签名：int(int, int)
int (*fp)(int, int);     // 必须匹配同样的签名
```

> 注意：标准里对应的正式概念是**函数类型 (function type)**，"签名"是从 Java/C# 借来的说法。

### 函数体 (function body)
`{ }` 括起来的、函数实际执行的语句块。

### 尾调用 (tail call)
**民间术语**。函数的**最后一步**是调用另一个函数，且返回值直接作为自己的返回值。

```c
int f(int n) {
    return g(n);   // 尾调用：f 返回后无事可做
}
```

> 尾调用可被优化成**尾调用优化 (TCO)**，复用当前栈帧、避免栈增长 —— 但 **C 标准不要求**编译器这么做（C++ 和部分语言才有保证）。

### 栈帧 (stack frame)
**民间术语**（也叫活动记录）。一次函数调用在栈上占用的内存块，存放参数、返回地址、局部变量等。

> 每次调用都会压入一个栈帧，递归过深会导致**栈溢出 (stack overflow)**。

---

## 五、存储期·作用域·链接

### 作用域 (scope)
名字**可见**的范围。C 有四种：
- **块作用域 (block scope)**：`{ }` 内
- **文件作用域 (file scope)**：所有函数之外
- **函数作用域 (function scope)**：仅用于 `goto` 标签
- **函数原型作用域 (function prototype scope)**：函数原型参数列表中

### 链接 (linkage)
**标准术语**。决定不同翻译单元中的同名标识符**是否指向同一个实体**。

| 类别 | 含义 | 例子 |
|------|------|------|
| **外部链接 (external linkage)** | 跨文件可见 | 普通全局变量、非 static 函数 |
| **内部链接 (internal linkage)** | 仅本文件可见 | `static` 全局变量/函数 |
| **无链接 (no linkage)** | 仅当前作用域 | 局部变量 |

```c
int g;              // 外部链接
static int s;       // 内部链接（别的文件看不到）
void f(void) { int local; }  // local 无链接
```

### static（一个词，多种含义）
同一个关键字，在不同位置含义不同：

| 位置 | 含义 |
|------|------|
| 函数内的 `static` 局部变量 | 存储期变为静态（生命期贯穿整个程序），但作用域仍限于块 |
| 函数外的 `static` 全局变量 | 链接变为内部（本文件私有） |
| 函数定义前的 `static` | 函数变为内部链接 |

```c
void counter(void) {
    static int count = 0;  // 只初始化一次，跨调用保持
    count++;
    printf("%d\n", count);
}
```

### extern
声明"这个标识符在别处定义"，用于跨文件共享。

```c
// a.c
int shared = 10;

// b.c
extern int shared;   // 引用 a.c 的定义
```

### register
**存储类说明符**，建议把变量放在寄存器里。现代编译器基本忽略它。**唯一实际语义**：不能对它取地址（`&`）。

### volatile
告诉编译器"这个对象可能在程序控制之外改变"，**禁止优化掉每次读写**。用于硬件寄存器、信号处理中的共享变量。

```c
volatile int *reg = (int *)0x40000000;  // 硬件寄存器
*reg = 1;   // 编译器不能优化掉这行
```

### auto
C 中表示"自动存储期"（几乎从不显式写）。**注意**：C++11 里 `auto` 变成了**类型推导**，含义完全不同。

### const
**重要**：C 的 `const` 是 **read-only（只读）**，**不是**编译期常量！

```c
const int n = 5;
int arr[n];      // ❌ C 中错误！const int 不是"常量表达式"
                 //（C++ 里可以，C 中不行）
switch (x) {
    case n: ...  // ❌ 同样错误
}
```

> `const` 与指针有**三种组合**，见 `09_pointers/06_const_pointers.c`。

### 线程本地存储 (thread-local storage)
C11 的 `_Thread_local`（或 `<threads.h>` 的 `thread_local`），每个线程有独立副本。

---

## 六、程序行为（未定义行为等）

这是 C 语言**最重要也最容易混淆**的一组术语。它们是**三个不同层次**，不是同义词！

### 未定义行为 (undefined behavior, UB)
**标准不做任何要求**。编译器可以：
- 直接崩溃
- 静默产生垃圾结果
- 优化掉整段代码
- 格式化你的硬盘（标准允许任何事）

```c
int a[5];
a[10] = 1;        // ❌ 越界，UB
int i = 0;
i = i++ + 1;      // ❌ 序点间多次修改，UB
free(p); free(p); // ❌ double free，UB
```

### 未指明的行为 (unspecified behavior)
**合法**，但标准允许实现**自选一种**，且**不需要文档化**。

```c
f(g(), h());   // g() 和 h() 的求值顺序未指明
```

### 实现定义的行为 (implementation-defined behavior)
**合法**，实现**自选一种，但必须文档化**。

```c
int x = -1;
x >> 1;        // 右移：算术移位还是逻辑移位？实现定义
sizeof(int);   // int 多大？实现定义（通常 4）
char 是有符号还是无符号？实现定义
```

### 三者对比

| 行为类别 | 是否合法 | 实现是否自选 | 是否必须文档化 | 是否可移植 |
|----------|:--------:|:------------:|:--------------:|:----------:|
| **未定义行为 (UB)** | ❌ | — | — | 不可依赖 |
| **未指明的行为** | ✅ | ✅ | ❌ | 不可依赖 |
| **实现定义的行为** | ✅ | ✅ | ✅ | 依赖文档即可移植 |

### 可观察行为 (observable behavior)
标准术语。程序对外可见的效果：文件 I/O、交互设备的输入输出、`volatile` 访问。优化不得改变可观察行为（**as-if 规则**）。

### 严格符合的程序 (strictly conforming program)
只使用标准明确规定、不依赖任何实现定义/未指明/未定义行为的程序。

### 约束 (constraint)
**标准术语**。标准对程序施加的**必须遵守的要求**。违反约束，编译器**必须报诊断信息**（错误或警告）。

```c
int f(int a[static 5]);   // 数组参数至少 5 个元素（约束）
```

### 诊断信息 (diagnostic message)
**标准术语**。编译器对违反约束的程序**必须**输出的信息。

### 独立环境 vs 宿主环境 (freestanding / hosted environment)
- **宿主环境 (hosted)**：有完整标准库，有 `main`（一般程序）
- **独立环境 (freestanding)**：嵌入式等，只需提供少量头文件，入口不一定是 `main`

### 序列点 (sequence point)
**标准术语**（C11 后改称"sequenced before"关系）。程序执行中的某个时刻，此前所有副作用都已完成。

```c
i = i++ + 1;   // ❌ 两个修改之间没有序列点 → UB
a[i] = i++;    // ❌ 同样 UB
```

常见序列点：`;`、`&&`、`||`、`?:`、`,`、函数调用前后。

### 程序启动与终止 (program startup / termination)
- **启动**：宿主环境下，程序从 `main` 开始执行
- **终止**：`main` 返回、调用 `exit()`、或调用 `abort()`

> `exit()` 会**刷新缓冲区、调用 `atexit` 注册的清理函数**；`abort()` **不会**（直接异常终止）。

### 退出状态 (exit status)
程序**返回给操作系统**的整数，表示执行结果。可移植写法用两个宏：

```c
#include <stdlib.h>
int main(void) {
    return EXIT_SUCCESS;   // 通常为 0——成功
    // return EXIT_FAILURE; // 通常非 0——失败
}
```

### 实现限制 (implementation limits)
**标准术语**。标准**要求实现至少支持**的各种下限（翻译限制 translation limits），例如：

- 一个标识符至少 **31 个**有效字符（内部）
- 一次函数调用至少 **127 个**参数
- 一个 `switch` 至少 **1023 个** `case` 标签

> 超过这些下限属于**实现定义**。各类型的值域上限见 `<limits.h>` 的 `INT_MAX` / `CHAR_MIN` 等宏。

---

## 七、表达式与求值

### 运算符 (operator)
对操作数执行运算的符号。按**操作数个数**分类：

- **一元 (unary)**：`!`、`~`、`-`、`+`、`*`（解引用）、`&`（取址）、`sizeof`、`++`
- **二元 (binary)**：`+`、`-`、`*`、`/`、`==`、`&&`、`|`……
- **三元 (ternary)**：只有 `?:` 一个

### 复合赋值运算符 (compound assignment operator)
`+=`、`-=`、`*=`、`/=`、`%=`、`&=`、`|=`、`^=`、`<<=`、`>>=`。是"运算 + 赋值"的简写。

```c
a += b;    // 等价于 a = a + b;
x <<= 2;   // 等价于 x = x << 2;
```

> 左侧只求值**一次** —— 这让 `arr[i++] += 1` 是**安全**的，而 `arr[i++] = arr[i++] + 1` 是 **UB**。

### 条件运算符（三元运算符）(conditional / ternary operator)
`?:` 是 C 中**唯一**的三元运算符。

```c
int max = (a > b) ? a : b;   // 条件 ? 真值 : 假值
```

> 只有**被选中的分支**会求值（类似短路），可用于安全取值：
> ```c
> int y = p ? *p : 0;   // p 为空时不会解引用
> ```

### 成员访问运算符 (member access operator)
访问结构体 / 联合体成员：

- **`.`**：用于**对象本身** —— `s.x`
- **`->`**：用于**指针** —— `p->x`，等价于 `(*p).x`

```c
struct Point p = {1, 2};
struct Point *q = &p;
p.x;     // 对象用 .
q->x;    // 指针用 ->
(*q).x;  // 与 q->x 完全等价
```

### 前置 vs 后置自增/自减 (prefix vs postfix ++/--) ★
**经典混淆点** —— 两者**返回的值不同**：

| 写法 | 名称 | 表达式的值 | 副作用 |
|------|------|-----------|--------|
| `++i` | 前置 (prefix) | **自增后的** i | 先加 1 |
| `i++` | 后置 (postfix) | **自增前的** i | 后加 1 |

```c
int i = 5;
int a = ++i;   // i 变 6，a = 6
int j = 5;
int b = j++;   // b = 5，j 变 6（先取值，后自增）
```

> ⚠️ **不要**在同一表达式里对同一变量多次自增 —— 无序列点，**UB**：
> ```c
> i = i++ + 1;   // ❌ UB！
> ```

### 位操作与掩码 (bit manipulation / mask)
**民间术语**。直接操作整数**二进制位**的技术。

```c
x |=  (1u << n);    // 置位第 n 位
x &= ~(1u << n);    // 清位第 n 位
x ^=  (1u << n);    // 翻转第 n 位
if (x & (1u << n))  // 检查第 n 位
```

> 像 `1u << n` 这种只选中特定位的值叫做**掩码 (mask)**。
> 详见 `04_operators/02_bitwise_ops.c` 与 `20_bit_manipulation/`。

### 左值 (lvalue)
**标准术语**，最初指"能放在赋值号左边的表达式"。

**现代定义**：指定一个**对象**（即**有地址、可定位**）的表达式。

> **注意名字已过时**：`const int x` 是 lvalue（有地址），但**不能**赋值。名字与实际含义脱节。

```c
int x = 1;
x = 5;     // x 是 lvalue（可取地址）
5 = x;     // ❌ 5 不是 lvalue（字面量没有地址）
&x;        // ✅ lvalue 才有地址，可取
```

### 右值 (rvalue)
**标准术语**。不指定对象的值（纯值），**没有地址**，不能赋值。

```c
(x + 1) = 5;   // ❌ x+1 是右值
```

> **C++11 重新定义**了左右值，并引入 rvalue/xvalue/prvalue/glvalue，比 C 复杂得多。

### 左值转换 (lvalue conversion)
**标准术语**。lvalue 用作右值时，自动转换为**值**（丢掉地址信息）。

```c
int x = 1;
int y = x;   // 右边 x 从 lvalue 转为值 1
```

### 完整表达式 (full expression)
不被包含在另一个表达式内的表达式（如整个 `int y = x + 1;` 的右半部分）。完整表达式末尾是一个序列点。

### 副作用 (side effect)
见 [第一节](#一基础概念)。求值过程对外部状态的改变。

### 结合性 vs 优先级 (associativity vs precedence)
- **优先级 (precedence)**：哪个运算符先结合（`*` 高于 `+`）
- **结合性 (associativity)**：同优先级从左还是从右（`a-b-c` = `(a-b)-c` 左结合）

```c
a = b = c;    // 赋值右结合：a = (b = c)
a - b - c;    // 减法左结合：(a - b) - c
```

### 短路求值 (short-circuit evaluation)
`&&` 和 `||` 的特殊语义：**左侧结果已能确定整体时，右侧不求值**。

```c
if (p != NULL && *p == 5) { }  // p 为空时，*p 不会执行
```

### 整数溢出与环绕 (integer overflow / wraparound)
**有符号与无符号的行为完全不同**：

| 情况 | 行为 |
|------|------|
| 有符号整数溢出 | **未定义行为 (UB)** ❌ |
| 无符号整数溢出 | **环绕 (wraparound)**，定义良好 ✅ |

```c
int      si = INT_MAX; si += 1;    // ❌ UB！编译器可以做任何事
unsigned ui = UINT_MAX; ui += 1;   // ✅ 定义为 0（模 2^N 环绕）
```

> 这就是为什么许多哈希、加密算法**刻意使用 `unsigned`** —— 利用其明确的环绕语义。

### 未指定值 (unspecified value)
**标准术语**。一个**合法但未指明**的值（**不是** UB）。例如未初始化对象读取后得到的不确定值被使用，或某些运算结果未指明。

> 与「未指明的**行为**」区分：前者是**值**，后者是**行为**。

### 逗号运算符 (comma operator) ★
`,` 有**两种截然不同**的角色，极易混淆：

| 形式 | 名称 | 作用 |
|------|------|------|
| `a, b` | **逗号运算符** | 依次求值 a、b，**整个表达式的值是 b 的值** |
| `f(a, b)` | **逗号分隔符** | 只是分隔参数，**不是**运算符 |

```c
int x = (1, 2, 3);    // ✅ 逗号运算符 → x = 3（取最后一个）
int y = f(1, 2, 3);   // 这里的逗号是参数分隔符，不是运算符
```

> 逗号运算符**优先级最低**，且左侧先求值、存在序列点 —— 常用于 `for` 的多表达式：
> ```c
> for (i = 0, j = n; i < j; i++, j--) { /* ... */ }
> ```

### 求值顺序 (order of evaluation)
标准只规定了**部分**求值顺序，其余**未指明**：

```c
f() + g();     // f 和 g 谁先求值？未指明
a[i] = i++;    // ❌ 未指明 + 修改冲突 → UB
```

> **C11 用「先序于 (sequenced before)」关系取代了旧术语「序列点 (sequence point)」。**
> 顺序**明确**的场合：`&&`、`||`、`?:`、`,`、以及函数实参**全部求值完毕**后才进入函数体。

---

## 八、字面量、数组与字符串

### 字面量 (literal)
**标准术语**。源代码中**直接写出的值**：`42`（整数常量）、`3.14`（浮点常量）、`'A'`（字符常量）、`"hello"`（字符串字面量）。

### 字符常量 (character constant)
单引号括起的字符，如 `'A'`。**类型是 `int`，不是 `char`**！

```c
sizeof('A');   // C 中 = sizeof(int)（通常是 4），不是 1！
```

> 这是 C 与 C++ 的一个差异：C++ 中 `'A'` 的类型是 `char`，C 中是 `int`。

### 字符串字面量 (string literal)
双引号括起的字符串，如 `"hello"`。

- 类型是 `char[N+1]`（在 C 中，**不是** `const char*`）
- 末尾自动添加 `'\0'`

```c
"hello"    // 类型 char[6]，内容：h e l l o \0
```

> ⚠️ 修改字符串字面量的内容是 **UB**（它可能位于只读区）：
> ```c
> char *p = "hello";
> p[0] = 'H';   // ❌ UB！
> ```
> **与 C++ 对比**：C++ 中字面量类型是 `const char[N]`，C 中是 `char[N]`（但同样不可写）。

### 空字符 vs 空指针 ('\0' vs NULL) ★
**C 最经典的混淆之一**。两者值都是 0，但**类型和用途完全不同**：

| | `'\0'` | `NULL` |
|---|--------|--------|
| 名称 | 空字符 (null character) | 空指针常量 (null pointer constant) |
| 类型 | `char`（值为 0） | 指针 / `(void*)0` |
| 用途 | **终止字符串** | 表示指针**不指向任何东西** |

```c
char s[] = "hi";       // s = {'h', 'i', '\0'}
if (s[2] == '\0') { }  // ✅ 判断字符串结尾
char *p = NULL;
if (p == NULL) { }     // ✅ 判断空指针
```

### 空字符串 (empty string)
长度为 0 的字符串 `""`，占 **1 字节**（只含一个 `'\0'`）。

```c
sizeof("");   // = 1，不是 0！
```

### 复合字面量 (compound literal)
**C99 特性**。在表达式中直接构造**匿名对象**。

```c
int *p = (int[]){1, 2, 3};              // 匿名数组
struct Point q = (struct Point){1, 2};  // 匿名结构体
```

### 变长数组 (variable length array, VLA)
**C99 特性**。长度在**运行时**求值的数组。

```c
int n = get_size();
int arr[n];   // VLA：n 在运行时确定
```

> 注意：C11 起 VLA 是**可选特性**；VLA 不能有静态存储期，也不能作为结构体成员。

### 转义序列 (escape sequence)
用反斜杠 `\` 表示**无法直接输入**或**有特殊含义**的字符。

| 序列 | 含义 | 序列 | 含义 |
|------|------|------|------|
| `\n` | 换行 | `\\` | 反斜杠 |
| `\t` | 水平制表符 | `\'` | 单引号 |
| `\r` | 回车 | `\"` | 双引号 |
| `\0` | 空字符 | `\xNN` | 十六进制字节 |
| `\a` | 响铃 | `\NNN` | 八进制字节 |

```c
printf("第一行\n第二行\t制表\n");
char nul = '\0';
```

> 详见 `02_basics/04_escape_sequences.c`。

### 整数字面量的进制与后缀 (integer literal base / suffix)
- **进制**：十进制 `42`、八进制 `052`（前导 `0`）、十六进制 `0x2A`、二进制 `0b101010`（C23 / 扩展）
- **后缀**：`u`（无符号）、`l` / `ll`（long / long long）

```c
int  dec = 42;
int  oct = 052;      // = 42（八进制！前导 0 是陷阱）
int  hex = 0x2A;     // = 42
unsigned long long big = 123456789ULL;
```

> ⚠️ **经典陷阱**：`int x = 010;` 不是 10，而是 **8**！

### 浮点字面量与后缀 (floating literal / suffix)
- 默认类型是 `double`：`3.14`
- 后缀 `f` → `float`，`l` → `long double`
- 支持科学计数法：`1.5e3`（= 1500.0）

```c
float  f = 3.14f;    // 不加 f 会先当 double 再截断
double d = 3.14;
long double ld = 3.14L;
double sci = 1.5e-3; // 0.0015
```

---

## 九、预处理器

### 预处理指令 (preprocessing directive)
以 `#` 开头的行，交给预处理器处理。如 `#include`、`#define`、`#if`。

### 宏 (macro)
`#define` 定义的名字替换。
- **对象宏 (object-like)**：`#define PI 3.14`
- **函数宏 (function-like)**：`#define MAX(a,b) ((a)>(b)?(a):(b))`

> 函数宏必须给参数和整体加括号，否则容易出优先级错误。

### 字符串化 (stringizing)
`#` 运算符，把宏参数变成字符串。

```c
#define STR(x) #x
STR(hello)   // 展开为 "hello"
```

### 记号拼接 (token pasting)
`##` 运算符，把两个记号粘成一个。

```c
#define CONCAT(a,b) a##b
CONCAT(var, 1)   // 展开为 var1
```

### 可变参宏 (variadic macro)
用 `...` 和 `__VA_ARGS__` 接受可变参数。

```c
#define LOG(fmt, ...) printf(fmt, __VA_ARGS__)
```

### 头文件保护 (include guard)
防止头文件被重复包含。

```c
#ifndef MY_HEADER_H
#define MY_HEADER_H
/* 内容 */
#endif
```

> 现代写法也可用 `#pragma once`（非标准，但被普遍支持）。

### 预定义宏 (predefined macros)
编译器自动定义的宏：`__FILE__`、`__LINE__`、`__DATE__`、`__TIME__`、`__STDC__`。

### 条件编译 (conditional compilation)
用 `#if` / `#ifdef` / `#ifndef` / `#elif` / `#else` / `#endif` 控制**哪些代码参与编译**。

```c
#ifdef _WIN32
    #include <windows.h>
#else
    #include <unistd.h>
#endif
```

> 常用于跨平台适配、调试开关、版本特性裁剪。

### defined 运算符
条件编译中**专门判断宏是否已定义**的运算符。

```c
#if defined(DEBUG) && DEBUG > 1
    printf("debug level > 1\n");
#endif
```

> `defined(X)` 等价于 `#ifdef X`，但可以嵌入更复杂的表达式。

### 预处理记号 (preprocessing token)
预处理阶段处理的**最小单位**：标识符、数字、字符常量、字符串字面量、标点、头文件名等。

### 宏展开 (macro expansion)
把宏体**替换**到使用处，并**递归展开**（展开结果中的宏会继续被展开）。

```c
#define A 1
#define B (A + 2)
B        // → (1 + 2)
```

> ⚠️ 陷阱：宏是**纯文本替换**，没有类型检查，参数还可能被**多次求值**：
> ```c
> #define SQUARE(x) ((x)*(x))
> SQUARE(i++)   // ❌ i 被自增两次！
> ```

### #pragma 指令
**实现定义**的编译指示，用于控制编译器的具体行为。

```c
#pragma once          // 头文件只包含一次（非标准，但通用）
#pragma pack(1)       // 结构体按 1 字节对齐
#pragma GCC diagnostic ignored "-Wunused-variable"
```

### #error 与 #warning
在预处理阶段**主动报错 / 警告**，常用于检查编译前提条件。

```c
#if __STDC_VERSION__ < 201112L
    #error "需要 C11 或更高版本"
#endif
```

### 头文件 (header)
含声明（有时含定义）的 `.h` 文件，通过 `#include` 引入。

```c
#include <stdio.h>    // 尖括号：系统 / 标准库路径
#include "my.h"       // 双引号：先查当前目录，再查系统路径
```

### 翻译阶段 (translation phases)
标准规定的、从源文件到可执行程序的分析过程，共 **8 个阶段**：三字符替换、续行拼接、记号化、预处理、字符集转换、字符串拼接、翻译、链接。

> 日常所说的"预处理"只是其中**第 4 阶段**。

---

## 十、标准库

### errno
`<errno.h>` 中的全局变量，记录最近一次库调用出错的原因。

```c
errno = 0;
FILE *f = fopen("no.txt", "r");
if (f == NULL) perror("fopen");   // 打印 "fopen: No such file or directory"
```

### 流 (stream)
**标准术语**。标准库对 I/O 的抽象。三种预定义流：
- `stdin`（标准输入）
- `stdout`（标准输出）
- `stderr`（标准错误，无缓冲）

### 缓冲 (buffering)
- **全缓冲 (fully buffered)**：缓冲区满才输出（文件）
- **行缓冲 (line buffered)**：遇换行才输出（终端）
- **无缓冲 (unbuffered)**：立即输出（`stderr`）

### FILE
表示一个流的对象类型，`fopen` 返回 `FILE *`。

### 区域设置 (locale)
`<locale.h>`，控制数字格式、货币、字符分类等文化相关行为。

```c
setlocale(LC_ALL, "");
```

### 受限指针 (restrict)
见 [第二节限定符](#二类型系统)。

### 断言 (assertion)
- **`assert(cond)`**（`<assert.h>`）：**运行时**检查，条件为假则打印信息并调用 `abort()`
- **`_Static_assert`**（C11）：**编译期**断言

```c
#include <assert.h>
assert(p != NULL);   // 运行时检查
_Static_assert(sizeof(int) == 4, "int must be 4 bytes");   // 编译期检查
```

> 定义 `NDEBUG` 宏可**关闭** `assert`（发布版常用）；`_Static_assert` 不受影响。

### 信号 (signal)
**标准术语**。操作系统异步发给程序的**事件通知**。`<signal.h>` 提供 `signal()` / `raise()`。

```c
#include <signal.h>
signal(SIGINT, handler);   // 注册 Ctrl+C 的处理函数
raise(SIGINT);             // 主动发送信号
```

### 原子操作 (atomic operation)
**标准术语**。C11 的 `<stdatomic.h>` —— **不可分割**、不会被打断的操作，用于**无锁并发**。

```c
#include <stdatomic.h>
atomic_int counter = 0;
atomic_fetch_add(&counter, 1);   // 原子自增，无需互斥锁
```

### 宽字符与多字节字符 (wide / multibyte character)
- **多字节字符 (multibyte)**：一个字符占**可变字节数**（如 UTF-8 的汉字占 3 字节）
- **宽字符 (wide character)**：`wchar_t` 类型，**固定宽度**，用 `L"..."` 字面量

```c
wchar_t wc = L'中';
wchar_t ws[] = L"中文";
```

### 源字符集与执行字符集 (source / execution character set)
- **源字符集 (source character set)**：**源代码文件**中使用的字符集
- **执行字符集 (execution character set)**：**程序运行时**使用的字符集

> 两者**可以不同**（例如源码用 UTF-8、运行时用 EBCDIC）。这是理解**字符编码可移植性**的关键概念 —— 也是为什么 `L'中'` 的编码值依赖实现。

### 内存函数 (memory function)
`<string.h>` 中直接操作**原始内存（字节）**的一组函数：

| 函数 | 作用 | 关键点 |
|------|------|--------|
| `memcpy(d, s, n)` | 拷贝 n 字节 | **重叠区会 UB** ⚠️ |
| `memmove(d, s, n)` | 拷贝 n 字节 | **允许重叠** ✅ |
| `memset(p, c, n)` | 每字节填 c | 只能**按字节**填 |
| `memcmp(a, b, n)` | 比较 n 字节 | |

```c
int a[5], b[5];
memcpy(b, a, sizeof(a));             // 不重叠用 memcpy（通常更快）
memmove(a + 1, a, 4 * sizeof(int));  // 源与目标重叠时必须用 memmove

int arr[10];
memset(arr, 0, sizeof(arr));         // ✅ 清零
```

> ⚠️ `memset` 按**字节**填充：`memset(arr, 1, sizeof(arr))` 会把每个 `int` 填成 `0x01010101`，**不是 1**。

### 排序与查找 (sorting / searching)
`<stdlib.h>` 的通用排序与查找，通过**函数指针**回调比较逻辑：

```c
void  qsort (void *base, size_t n, size_t size, int (*cmp)(const void*, const void*));
void *bsearch(const void *key, const void *base, size_t n, size_t size,
              int (*cmp)(const void*, const void*));
```

```c
int cmp(const void *a, const void *b) { return *(const int*)a - *(const int*)b; }
int arr[] = {3, 1, 2};
qsort(arr, 3, sizeof(int), cmp);   // arr → {1, 2, 3}
```

> `bsearch` **要求数组已排序**。二者都靠 `void*` 实现"泛型"。

### 字符串与数字转换 (string ↔ number conversion)
```c
int    n = atoi("42");                 // 简单，但无错误检测
long   v = strtol("42", &end, 10);     // 可检测错误、可指定进制
double d = strtod("3.14", &end);       // 字符串 → double
```

> `strtol` / `strtod` 配合 `errno` 与 `end` 指针，能**可靠检测溢出和非法输入**，比 `atoi` 安全得多。

### 非局部跳转 (nonlocal jump)
`<setjmp.h>` 的 `setjmp` / `longjmp` —— 从深层嵌套中**跳回**之前保存的位置，绕过正常的函数返回链。

```c
#include <setjmp.h>
jmp_buf env;
if (setjmp(env) == 0) {
    deep_call();          // 内部某处调用 longjmp(env, 1)
} else {
    /* 从 longjmp 返回此处 */
}
```

> 常用于**错误恢复**。注意：`longjmp` 会跳过栈清理，可能造成资源泄漏。

---

## 十一、术语辨析：标准术语 vs 民间叫法

**这类"正统 vs 民间"的差异，是学习 C 时最大的困惑来源之一。** 规律是：
> 社区造词更形象、更好教，于是流行开来；标准为了兼容又改不掉，导致两套术语并存。

| 民间说法 | 标准正式术语 | 说明 |
|----------|--------------|------|
| **解引用 (dereference)** | **间接 (indirection)** | 标准 §6.5.3.2 用 "indirection"；K&R 第 2 版两者都提 |
| **衰减 (decay)** | "转换为指向首元素的指针" | ★ 标准全文**没有 "decay"** |
| **堆 / 栈 (heap / stack)** | **allocated / automatic 存储期** | ★ 标准**没有 heap/stack** |
| **传引用 (pass by reference)** | **传值 (pass by value)** | ★ C 中一切都是传值 |
| **垃圾值 (garbage value)** | **不确定值 (indeterminate value)** | 标准用 indeterminate/unspecified |
| **悬空指针 (dangling pointer)** | 无对应术语 | 标准只描述 UB |
| **野指针 (wild pointer)** | 无对应术语 | 纯民间词 |
| **内存泄漏 (memory leak)** | 无对应术语 | 描述 UB/资源问题的民间词 |
| **缓冲区溢出 (buffer overflow)** | 无对应术语 | 同上 |
| **段错误 (segfault)** | 无对应术语 | 这是操作系统/硬件概念 |
| **编译单元** | **翻译单元 (translation unit)** | 标准叫 translation unit |
| **左值/右值** | lvalue / rvalue | 名字是历史遗留，含义已变 |

### 常见易混淆术语对

这些**不是**「标准 vs 民间」的问题，而是**两个都正规、但极易弄混**的术语对：

| 易混淆对 | 关键区别 |
|----------|----------|
| `'\0'` / `NULL` / `0` / `"0"` | 空字符(char) / 空指针(指针) / 整数零 / 字符串 |
| `'A'` vs `"A"` | 字符常量（类型 `int`）vs 字符串字面量（2 字节：`'A','\0'`） |
| 指针数组 `int *a[5]` vs 数组指针 `int (*a)[5]` | 5 个指针 vs 1 个指向数组的指针 |
| `const int *p` vs `int * const p` | 数据只读 vs 指针本身只读 |
| 声明 (declaration) vs 定义 (definition) | 是否分配空间 / 给出函数体 |
| 形参 (parameter) vs 实参 (argument) | 定义中列出的变量 vs 调用时传入的值 |
| 不确定值 vs 未指定值 | 未初始化的**状态** vs 合法但未指明的**值** |
| 表示 (representation) vs 值 (value) | 位模式 vs 该位模式所代表的意义 |
| 数组 vs 指针 | 一块内存空间 vs 一个存储地址的变量 |
| 结构体 vs 联合体 | 成员各占独立空间 vs 成员共享同一空间 |

### 名字与含义脱节的术语（更隐蔽的坑）

| 术语 | 字面/历史含义 | 现在的真实含义 |
|------|---------------|----------------|
| **lvalue** | "赋值号左边" | 指定一个**有地址的对象**的表达式 |
| **const** | "常量" | **只读**（非编译期常量！） |
| **static** | "静态" | 一个词 3~4 种无关含义（见第五节） |
| **auto** | 自动存储 | C++11 中变成类型推导 |
| **register** | 寄存器 | 现在只剩"不可取地址"的含义 |

---

## 十二、中英对照速查表

| 中文 | 英文 | 是否标准术语 |
|------|------|:------------:|
| 翻译单元 | translation unit | ✅ |
| 编译与链接 | compilation and linking | ❌ 民间（工具链层面） |
| 目标文件 | object file | ❌ 民间（工具链层面） |
| 链接器 | linker | ❌ 民间（工具链层面） |
| 符号 | symbol | ❌ 民间（工具链层面） |
| 声明 / 定义 | declaration / definition | ✅ |
| 暂时性定义 | tentative definition | ✅ |
| 关键字 | keyword | ✅ |
| 标识符 | identifier | ✅ |
| 初始化 / 赋值 | initialization / assignment | ✅ |
| 初始化器 / 指定初始化器 | initializer / designated initializer | ✅ |
| 常量表达式 | constant expression | ✅ |
| 声明符 / 声明说明符 | declarator / declaration specifier | ✅ |
| 运算符（一元/二元/三元） | operator (unary/binary/ternary) | ✅ |
| 复合赋值运算符 | compound assignment operator | ✅ |
| 条件运算符（三元） | conditional / ternary operator | ✅ |
| 成员访问运算符 | member access operator | ✅ |
| 前置 / 后置自增 | prefix / postfix increment | ✅ |
| 位操作 / 掩码 | bit manipulation / mask | ❌ 民间 |
| 副作用 | side effect | ✅ |
| 左值 / 右值 | lvalue / rvalue | ✅ |
| 左值转换 | lvalue conversion | ✅ |
| 序列点 | sequence point | ✅ |
| 完整表达式 | full expression | ✅ |
| 短路求值 | short-circuit evaluation | ✅ |
| 整数溢出 / 环绕 | integer overflow / wraparound | ✅ |
| 未指定值 | unspecified value | ✅ |
| 逗号运算符 | comma operator | ✅ |
| 求值顺序 | order of evaluation | ✅ |
| 先序于 | sequenced before | ✅ |
| 优先级 / 结合性 | precedence / associativity | ✅ |
| 对象 | object | ✅ |
| 不完整类型 | incomplete type | ✅（+ 民间称"前向声明" forward declaration） |
| 兼容类型 | compatible type | ✅ |
| 标量 / 聚合类型 | scalar / aggregate type | ✅ |
| 基本类型 / 派生类型 | basic / derived type | ✅ |
| 字符类型 | character type | ✅ |
| 布尔类型 | boolean type | ✅ |
| 定宽整数类型 | fixed-width integer type | ✅ |
| 复数类型 | complex type | ✅ |
| 填充 / 对齐 | padding / alignment | ✅ |
| 位域 | bit-field | ✅ |
| typedef（类型别名） | typedef | ✅ |
| 结构体 / 联合体 / 枚举 | structure / union / enumeration | ✅ |
| 标签 / 命名空间 | tag / name space | ✅ |
| 字节 / 位 | byte / bit | ✅ |
| 有效类型 | effective type | ✅ |
| 类型双关 | type punning | ❌ 民间 |
| 字节序 | endianness | ✅ |
| 多维数组 | multidimensional array | ✅ |
| 柔性数组成员 | flexible array member | ✅ |
| 匿名结构体 / 联合体 | anonymous struct / union | ✅ |
| 前向声明 | forward declaration | ❌ 民间 |
| 不透明类型 | opaque type | ❌ 民间 |
| 整型提升 | integer promotion | ✅ |
| 寻常算术转换 | usual arithmetic conversions | ✅ |
| 不确定值 | indeterminate value | ✅（民间：垃圾值 garbage value） |
| 指针 | pointer | ✅ |
| 对象指针 / 函数指针 | object / function pointer | ✅ |
| 空指针常量 / 空指针 | null pointer constant / null pointer | ✅ |
| void 指针 | void pointer | ✅ |
| 指针算术 | pointer arithmetic | ✅ |
| 越过末尾 | one past the end | ✅ |
| 可解引用 | dereferenceable | ✅ |
| 别名 | aliasing | ✅ |
| 指针数组 / 数组指针 | array of pointers / pointer to array | ✅ |
| 二级指针 | pointer to pointer | ✅ |
| 通用指针 | generic pointer | ✅ |
| 分配函数 | allocation function | ✅ |
| 内存布局（代码段/数据段/BSS/堆/栈） | memory layout | ❌ 民间 |
| 存储期 | storage duration | ✅ |
| 作用域 | scope | ✅ |
| 链接 | linkage | ✅ |
| 函数指示符 | function designator | ✅ |
| 函数原型 | function prototype | ✅ |
| 形参 / 实参 | parameter / argument | ✅ |
| 传值 | pass by value | ✅（民间：pass by reference ❌） |
| 默认实参提升 | default argument promotions | ✅ |
| 变参函数 | variadic function | ✅ |
| 函数签名（= 函数类型） | function signature / function type | ❌ 民间 / ✅ |
| 尾调用 | tail call | ❌ 民间 |
| 栈帧 | stack frame | ❌ 民间 |
| 未定义行为 | undefined behavior (UB) | ✅ |
| 未指明的行为 | unspecified behavior | ✅ |
| 实现定义的行为 | implementation-defined behavior | ✅ |
| 可观察行为 | observable behavior | ✅ |
| 约束 | constraint | ✅ |
| 诊断 | diagnostic | ✅ |
| 严格符合的程序 | strictly conforming program | ✅ |
| 宿主 / 独立环境 | hosted / freestanding environment | ✅ |
| 程序启动 / 终止 | program startup / termination | ✅ |
| 退出状态 | exit status | ✅ |
| 实现限制 | implementation limits | ✅ |
| 衰减 | decay | ❌ 民间 |
| 解引用 | dereference | ⚠️ 标准用 indirection |
| 堆 / 栈 | heap / stack | ❌ 民间 |
| 悬空指针 | dangling pointer | ❌ 民间 |
| 野指针 | wild pointer | ❌ 民间 |
| 内存泄漏 | memory leak | ❌ 民间 |
| 缓冲区溢出 | buffer overflow | ❌ 民间 |
| 段错误 | segmentation fault | ❌ OS 概念 |
| 字面量 | literal | ✅ |
| 字符常量 | character constant | ✅ |
| 字符串字面量 | string literal | ✅ |
| 空字符 | null character | ✅ |
| 空字符串 | empty string | ✅ |
| 复合字面量 | compound literal | ✅ |
| 变长数组 | variable length array (VLA) | ✅ |
| 转义序列 | escape sequence | ✅ |
| 整数字面量的进制/后缀 | integer literal base / suffix | ✅ |
| 浮点字面量与后缀 | floating literal / suffix | ✅ |
| 严格别名 | strict aliasing | ❌ 民间（编译器/工具链术语） |
| 断言 | assertion | ✅ |
| 信号 | signal | ✅ |
| 原子操作 | atomic operation | ✅ |
| 宽字符 / 多字节字符 | wide / multibyte character | ✅ |
| 源字符集 / 执行字符集 | source / execution character set | ✅ |
| 预处理指令 | preprocessing directive | ✅ |
| 宏 | macro | ✅ |
| 字符串化 / 记号拼接 | stringizing / token pasting | ✅ |
| 可变参宏 | variadic macro | ✅ |
| 头文件保护 | include guard | ❌ 民间 |
| 预定义宏 | predefined macro | ✅ |
| 条件编译 | conditional compilation | ✅ |
| 预处理记号 | preprocessing token | ✅ |
| 宏展开 | macro expansion | ✅ |
| #pragma | pragma | ✅ |
| 头文件 | header | ✅ |
| 翻译阶段 | translation phase | ✅ |
| errno | errno | ✅ |
| 流 | stream | ✅ |
| 缓冲 | buffering | ✅ |
| FILE | FILE | ✅ |
| 区域设置 | locale | ✅ |
| 受限指针 | restrict | ✅ |
| 内存函数（memcpy/memmove/memset） | memory function | ❌ 民间（函数族叫法） |
| 排序 / 查找 | sorting / searching | ✅ |
| 字符串与数字转换 | string ↔ number conversion | ❌ 民间（描述性叫法） |
| 非局部跳转 | nonlocal jump | ✅ |

---

## 学习建议

1. **优先掌握标准术语**：阅读标准文档、编译器错误信息、权威书籍时用的都是标准词。
2. **认识民间术语**：日常交流、面试、技术博客大量使用民间词，两者都要能听懂。
3. **警惕"名字与含义不符"**：`const`、`static`、`lvalue`、`auto` 这类术语，**不要望文生义**。
4. **区分三个行为层次**：UB / 未指明 / 实现定义，这是写出可移植代码的关键。
5. **查证时看标准原文**：ISO/IEC 9899 是最权威的来源，任何术语歧义都可在那里终结。

---

*本文档配套 C 示例代码项目使用，建议结合各目录下的源码一起阅读。*
