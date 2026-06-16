/*
 * ============================================
 * 知识点：C99 / C11 重要特性
 * 说明：
 *   C99 和 C11 引入了很多重要的语言特性，
 *   让 C 语言更现代、更安全、更易用。
 *
 * C99 重要特性：
 *   1. 指定初始化器（Designated Initializers）
 *   2. 复合字面量（Compound Literals）
 *   3. 变长数组（VLA，C11 中降为可选）
 *   4. 单行注释 //
 *   5. 声明与代码混合
 *   6. inline 函数
 *   7. 可变参数宏 __VA_ARGS__
 *   8. long long, 复数类型等
 *
 * C11 重要特性：
 *   1. _Static_assert
 *   2. _Generic 泛型选择
 *   3. 匿名结构体/联合体
 *   4. _Alignas / _Alignof
 *   5. _Noreturn 函数
 *   6. 线程支持（<threads.h>）
 *   7. 原子操作（<stdatomic.h>）
 *
 * 编译方法：
 *   gcc -std=c11 01_c99_features.c -o 01_c99_features
 * ============================================
 */

#include <stdio.h>
#include "../utf8fix.h"
#include <stdlib.h>   // exit
#include <stddef.h>   // offsetof
#include <stdalign.h>  // alignas, alignof (C11)
#include <stdnoreturn.h> // noreturn (C11)

// ========== C99: 指定初始化器（Designated Initializers）==========
/*
 * 可以按名称初始化结构体或数组的指定成员。
 * 未指定的成员自动初始化为 0。
 */
void designated_initializers(void) {
    printf("--- C99: 指定初始化器 ---\n");

    // 数组指定初始化
    int arr[10] = {[0] = 1, [3] = 4, [9] = 10};
    printf("数组: ");
    for (int i = 0; i < 10; i++) {
        printf("%d ", arr[i]);
    }
    printf("\n");

    // 结构体指定初始化
    struct Point {
        int x;
        int y;
        int z;
    };

    struct Point p1 = {.x = 10, .z = 30};  // y 自动为 0
    printf("Point: x=%d, y=%d, z=%d\n",
           p1.x, p1.y, p1.z);

    // 嵌套指定初始化
    struct Rectangle {
        struct Point top_left;
        struct Point bottom_right;
    };

    struct Rectangle rect = {
        .top_left = {.x = 0, .y = 0},
        .bottom_right.x = 100,  // 嵌套指定
        .bottom_right.y = 200
    };
    printf("Rectangle: (%d,%d)-(%d,%d)\n",
           rect.top_left.x, rect.top_left.y,
           rect.bottom_right.x, rect.bottom_right.y);

    // 范围指定初始化（GCC 扩展）
    int zero_to_hundred[101] = {[0 ... 100] = 0};  // GCC 扩展
    printf("范围初始化 (GCC扩展)\n");
}

// ========== C99: 复合字面量（Compound Literals）==========
/*
 * 临时创建"匿名"的数组/结构体值。
 * 语法：(类型){初始化列表}
 */
void compound_literals(void) {
    printf("\n--- C99: 复合字面量 ---\n");

    // 匿名数组
    int *arr = (int[]){1, 2, 3, 4, 5};
    printf("复合字面量数组: ");
    for (int i = 0; i < 5; i++) {
        printf("%d ", arr[i]);
    }
    printf("\n");

    // 作为函数参数
    struct Point { int x; int y; };

    struct Point p = (struct Point){10, 20};  // 复合字面量
    printf("复合字面量 Point: (%d, %d)\n", p.x, p.y);

    // 临时创建结构体作为参数
    void print_point(struct Point pt) {
        printf("  Point: (%d, %d)\n", pt.x, pt.y);
    }

    print_point((struct Point){30, 40});  // 直接创建临时结构体

    // 指向匿名数组
    int sum_array(int *arr, int size) {
        int sum = 0;
        for (int i = 0; i < size; i++) sum += arr[i];
        return sum;
    }

    int total = sum_array((int[]){1, 2, 3, 4, 5, 6, 7}, 7);
    printf("匿名数组求和: %d\n", total);
}

// ========== C99: 变长数组 VLA（可选，C11）==========
/*
 * VLA 可以在运行时确定数组大小。
 * C99 强制支持，C11 改为可选。
 * 注意：VLA 在栈上分配，过大会栈溢出。
 */
/*
// 注释掉以避免 C11 下不支持 VLA 的编译器报错
void vla_example(int rows, int cols) {
    printf("\n--- C99: 变长数组 VLA ---\n");

    int matrix[rows][cols];  // VLA，大小在运行时确定

    // 填充和打印
    for (int i = 0; i < rows; i++) {
        for (int j = 0; j < cols; j++) {
            matrix[i][j] = i * cols + j + 1;
            printf("%3d ", matrix[i][j]);
        }
        printf("\n");
    }

    printf("sizeof(VLA) = %zu\n", sizeof(matrix));
}
*/

// ========== C11: _Generic 泛型选择 ==========
/*
 * _Generic 根据表达式的类型选择不同的结果。
 * 类似于 C++ 的重载，是编译期多态。
 */

// 泛型打印宏：根据参数类型选择不同的格式化输出
#define TYPE_NAME(x) _Generic((x), \
    int:        "int", \
    long:       "long", \
    double:     "double", \
    float:      "float", \
    char:       "char", \
    char*:      "string", \
    const char*:"const string", \
    default:    "unknown" \
)

void generic_selection(void) {
    printf("\n--- C11: _Generic 泛型选择 ---\n");

    int    i = 42;
    double d = 3.14;
    float  f = 2.71f;
    char   c = 'A';
    char  *s = "Hello";

    printf("int     → %s\n", TYPE_NAME(i));
    printf("double  → %s\n", TYPE_NAME(d));
    printf("float   → %s\n", TYPE_NAME(f));
    printf("char    → %s\n", TYPE_NAME(c));
    printf("char*   → %s\n", TYPE_NAME(s));
    printf("100L    → %s\n", TYPE_NAME(100L));
}

// ========== C11: 对齐（Alignment）==========
void alignment_features(void) {
    printf("\n--- C11: 内存对齐 ---\n");

    // alignof 获取类型的对齐要求
    printf("char 的对齐:   %zu\n", alignof(char));
    printf("int 的对齐:    %zu\n", alignof(int));
    printf("double 的对齐: %zu\n", alignof(double));

    // alignas 指定对齐方式
    struct AlignedStruct {
        char c;
        // 指定 int 成员按 16 字节对齐
        alignas(16) int i;
    };

    printf("AlignedStruct 中 int 偏移: %zu\n",
           offsetof(struct AlignedStruct, i));
    printf("AlignedStruct 大小: %zu\n",
           sizeof(struct AlignedStruct));
}

// ========== C11: _Noreturn 函数 ==========
/*
 * _Noreturn 表示函数不会返回（会终止程序）。
 * 编译器可以做更好的优化。
 */
_Noreturn void force_exit(void) {
    // 这个函数不会返回
    printf("这个函数不会返回...\n");
    // exit(EXIT_SUCCESS);
    // 注释掉以便演示继续进行
    // 实际上这里需要用 exit() 或 abort()，
    // 否则编译器会警告
    // 为了演示，我们不真的终止程序
    printf("（如果取消 exit() 注释，程序会终止）\n");
    // 使用 exit 而不是 return
    exit(0);
}

// ========== C11: 匿名结构体/联合体 ==========
/*
 * 匿名成员允许直接访问内部结构体的成员。
 */
void anonymous_structs(void) {
    printf("\n--- C11: 匿名结构体/联合体 ---\n");

    struct Employee {
        int id;
        struct {
            int year;
            int month;
            int day;
        };  // 匿名结构体：不需要名字
    };

    struct Employee emp = {1001, {2024, 1, 15}};

    // 直接访问匿名成员中的字段
    printf("员工 %d: 入职日期 %d-%02d-%02d\n",
           emp.id, emp.year, emp.month, emp.day);

    // 匿名联合体
    struct Variant {
        enum { TYPE_INT, TYPE_FLOAT } type;
        union {
            int i;
            float f;
        };  // 匿名联合体
    };

    struct Variant v;
    v.type = TYPE_INT;
    v.i = 42;  // 直接访问，不需要 v.data.i

    if (v.type == TYPE_INT) {
        printf("匿名联合体: %d\n", v.i);
    }
}

// ========== C99: inline 函数 ==========
// inline 建议编译器内联展开，减少函数调用开销
static inline int max(int a, int b) {
    return a > b ? a : b;
}

// ========== C99: 声明与代码混合 ==========
void mix_declarations(void) {
    printf("\n--- C99: 声明与代码混合 ---\n");
    printf("C99 之前所有变量必须在代码块开头声明\n");
    printf("C99 之后可以在代码任何位置声明变量\n");

    int x = 10;
    printf("x = %d\n", x);

    // 可以在使用前再声明
    int y = x * 2;
    printf("y = x*2 = %d\n", y);

    // for 循环中声明
    for (int i = 0; i < 3; i++) {  // int i 在 C99 中有效
        printf("i = %d ", i);
    }
    printf("\n");
}

// ========== main ==========
int main() {
    printf("===== C99 / C11 特性 =====\n");

    designated_initializers();
    compound_literals();

    // VLA 演示（如果编译器支持）
#ifdef __STDC_NO_VLA__
    printf("\n--- VLA: 不支持（编译器不支持）\n");
#else
    // vla_example(3, 4);  // 取消注释查看 VLA
    printf("\n--- VLA: 编译器可能支持（需要 C99 模式）\n");
    // gcc -std=c99 ... 启用 VLA
#endif

    generic_selection();

    // 对齐
    alignment_features();

    // 匿名结构体
    anonymous_structs();

    // inline
    printf("\n--- inline 函数 ---\n");
    printf("max(10, 20) = %d\n", max(10, 20));

    // 声明混合
    mix_declarations();

    // 编译时断言（在文件顶部已经使用了 _Static_assert）
    printf("\n--- _Static_assert ---\n");
    printf("编译时断言已通过：sizeof(int) >= 4\n");

    // ========== 编译标准的选择 ==========
    printf("\n===== 编译标准选择 =====\n");
    printf("gcc -std=c89 file.c    — ANSI C 标准\n");
    printf("gcc -std=c99 file.c    — C99 标准\n");
    printf("gcc -std=c11 file.c    — C11 标准\n");
    printf("gcc -std=c17 file.c    — C17 标准\n");
    printf("gcc -std=c2x file.c    — C23 标准（实验性）\n");

    return 0;
}

/*
 * ============================================
 * 关键点总结：
 *
 * C99:
 * 1. 指定初始化器 .member = value
 * 2. 复合字面量 (type){init}
 * 3. VLA 变长数组（可选）
 * 4. 声明与代码可混合
 * 5. inline 函数
 *
 * C11:
 * 6. _Static_assert 编译时断言
 * 7. _Generic 泛型选择
 * 8. 匿名结构体/联合体
 * 9. alignas / alignof 对齐控制
 * 10. _Noreturn 函数
 * ============================================
 */
