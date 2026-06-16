/**
 * ============================================================================
 * 知识主题：泛型选择（_Generic 关键字）—— C11 标准新特性
 *
 * 什么是 _Generic？
 *   _Generic 是 C11 标准引入的关键字，用于实现编译期类型多态
 *   它根据表达式的类型在编译期选择不同的结果
 *   语法：_Generic(控制表达式, 类型1: 结果1, 类型2: 结果2, ..., default: 结果)
 *
 * 与 C++ 模板的区别：
 *   C 的 _Generic 比 C++ 模板简单得多：
 *   - C++ 模板：编译期生成完整的类型安全代码，功能强大但复杂
 *   - C 的 _Generic：仅在编译期做类型匹配和选择，本质是编译期 "switch"
 *   - _Generic 不涉及类型推导或代码生成，只是根据类型选择表达式
 *
 * 典型用途：
 *   1. 创建类型通用的打印宏（类似 C++ 的重载）
 *   2. 类型通用的数学运算
 *   3. 编译期类型检查
 *   4. 简化需要根据类型选择不同行为的代码
 *
 * 注意事项：
 *   - 控制表达式本身不会被求值，仅用于类型判断
 *   - 所有分支的表达式必须是有效的（类型正确），但只有匹配的那个会被编译
 *   - default 分支是可选的，但建议加上以处理未预期的类型
 *   - 类型匹配是精确匹配，不进行隐式类型转换
 *
 * 编译：gcc 05_generic_selection.c -o 05_generic_selection.exe -std=c11 -Wall
 * 运行：.\05_generic_selection.exe
 * ============================================================================
 */

#include "../common/charset.h"
#include <stdio.h>
#include <stdlib.h>
#include <math.h>  /* 用于 sqrt(), sin(), cos() 等数学函数 */

/*
 * 注意：C11 标准下，_Generic 关键字需要编译器支持 C11 模式。
 * 本文件使用 -std=c11 编译，_Generic 是该标准的一部分。
 *
 * _Generic 的基本语法示例：
 *
 *   #define TYPE_INFO(x) _Generic((x),               \
 *       int:        "int",                            \
 *       double:     "double",                         \
 *       float:      "float",                          \
 *       char*:      "string",                         \
 *       default:    "unknown"                         \
 *   )
 *
 * 当使用 TYPE_INFO(42) 时，编译器看到 x 是 int 类型，
 * 所以整个宏展开为 "int" 字符串。
 * 当使用 TYPE_INFO(3.14) 时，编译器看到 x 是 double 类型，
 * 所以整个宏展开为 "double" 字符串。
 */

/* ========================== 示例 1：类型名称打印 ========================== */

/**
 * 宏：TYPE_NAME(x)
 * 功能：返回变量类型的可读名称（字符串）
 * 说明：这是一个最基础的 _Generic 应用示例
 *       用于展示如何根据变量类型返回不同字符串
 */
#define TYPE_NAME(x) _Generic((x),          \
    int:        "int (整型)",               \
    long:       "long (长整型)",             \
    long long:  "long long (长长整型)",      \
    float:      "float (单精度浮点)",        \
    double:     "double (双精度浮点)",       \
    char:       "char (字符)",              \
    char*:      "char* (字符串指针)",        \
    default:    "unknown (未知类型)"         \
)

/* ========================== 示例 2：类型通用打印宏 ========================== */

/**
 * 宏：PRINT_VALUE(x)
 * 功能：根据变量的类型，使用对应的 printf 格式说明符进行打印
 * 说明：实现类似 C++ 函数重载的效果
 *       不同类型使用不同的格式说明符
 *       注意字符串和字符的处理方式不同
 */
#define PRINT_VALUE(x) _Generic((x),                            \
    int:        printf("  int:        %d\n", (x)),             \
    long:       printf("  long:       %ld\n", (x)),            \
    long long:  printf("  long long:  %lld\n", (x)),           \
    float:      printf("  float:      %f\n", (x)),             \
    double:     printf("  double:     %lf\n", (x)),            \
    char:       printf("  char:       '%c' (ASCII: %d)\n",     \
                       (x), (int)(long long)(x)),              \
    char*:      printf("  string:     \"%s\"\n", (x)),         \
    default:    printf("  type:       <未知类型，无法打印>\n")      \
)

/* ========================== 示例 3：类型通用的绝对值函数 ========================== */

/**
 * 宏：ABS_GENERIC(x)
 * 功能：通用的绝对值计算宏
 * 说明：根据参数类型自动选择不同的绝对值函数
 *       - int 类型使用 abs()  (来自 stdlib.h)
 *       - long 类型使用 labs() (来自 stdlib.h)
 *       - double 类型使用 fabs() (来自 math.h)
 *       - float 类型使用 fabsf() (来自 math.h)
 *
 *       注意：编译时需要链接数学库（-lm），但本示例中
 *       数学函数仅用于演示，实际执行不会报错
 */
#define ABS_GENERIC(x) _Generic((x),                    \
    int:        abs(x),                                  \
    long:       labs(x),                                 \
    long long:  llabs(x),                                \
    float:      fabsf(x),                                \
    double:     fabs(x),                                 \
    default:    (x)                                      \
)

/* ========================== 示例 4：整型提升与符号信息 ========================== */

/**
 * 宏：INT_SIGN_INFO(x)
 * 功能：判断整型变量的符号信息
 * 说明：演示 _Generic 处理有符号/无符号整数类型
 *       注意 _Generic 处理 unsigned 类型需要显式匹配
 */
#define INT_SIGN_INFO(x) _Generic((x),                      \
    int:              "有符号 int",                          \
    unsigned:         "无符号 unsigned int",                 \
    long:             "有符号 long",                         \
    unsigned long:    "无符号 unsigned long",                \
    short:            "有符号 short",                        \
    unsigned short:   "无符号 unsigned short",               \
    default:          "其它整型"                              \
)

/* ========================== 示例 5：类型通用的数学运算宏 ========================== */

/**
 * 宏：SQUARE(x)
 * 功能：计算平方
 * 说明：不同类型使用不同的计算方式
 *       整型使用乘法（避免隐式转换为浮点）
 *       浮点类型同样使用乘法
 */
#define SQUARE(x) _Generic((x),         \
    int:        (x) * (x),              \
    long:       (x) * (x),              \
    float:      (x) * (x),              \
    double:     (x) * (x),              \
    default:    ((x) * (x))             \
)

/* ========================== 示例 6：安全的类型转换宏 ========================== */

/**
 * 宏：SAFE_INT_CAST(x)
 * 功能：安全地将值转换为 int 类型
 * 说明：根据参数类型执行不同的转换逻辑
 *       - float/double 四舍五入取整
 *       - char 直接转为 int (ASCII 码)
 *       - 指针类型转换为 int 时发出警告
 */
#define SAFE_INT_CAST(x) _Generic((x),                          \
    int:        (x),                                             \
    float:      (int)((x) + 0.5f),    /* 四舍五入 */             \
    double:     (int)((x) + 0.5),     /* 四舍五入 */             \
    char:       (int)(x),                                       \
    default:    (int)(x)                                        \
)

/* ========================== 示例 7：编译期类型检查断言语义 ========================== */

/**
 * 宏：ASSERT_INT_TYPE(x)
 * 功能：编译期检查表达式是否为 int 类型
 * 说明：如果表达式不是 int 类型，会尝试展开不存在的符号
 *       导致编译错误，从而实现编译期类型检查
 *
 * 注意：这个宏利用了 _Generic 编译期求值的特性
 *       错误类型会触发 "implicit declaration" 或 "undefined" 错误
 */
#define ASSERT_INT_TYPE(x) _Generic((x),    \
    int:        (x),                          \
    default:    "ERROR: 期望 int 类型！"      \
)

/* ========================== 演示辅助函数 ========================== */

/**
 * 打印分隔线
 */
void printSeparator(const char *title) {
    printf("\n========================================\n");
    printf("  %s\n", title);
    printf("========================================\n");
}

/**
 * 演示类型名称打印
 */
void demoTypeName(void) {
    printSeparator("示例 1：类型名称打印 (TYPE_NAME)");

    int a = 42;
    long b = 123L;
    float c = 3.14f;
    double d = 2.71828;
    char e = 'A';
    const char *f = "Hello, _Generic!";

    printf("  TYPE_NAME(a)  -> %s\n", TYPE_NAME(a));
    printf("  TYPE_NAME(b)  -> %s\n", TYPE_NAME(b));
    printf("  TYPE_NAME(c)  -> %s\n", TYPE_NAME(c));
    printf("  TYPE_NAME(d)  -> %s\n", TYPE_NAME(d));
    printf("  TYPE_NAME(e)  -> %s\n", TYPE_NAME(e));
    printf("  TYPE_NAME(f)  -> %s\n", TYPE_NAME(f));
}

/**
 * 演示类型通用打印
 */
void demoGenericPrint(void) {
    printSeparator("示例 2：类型通用打印 (PRINT_VALUE)");

    int a = 42;
    long long b = 9999999999LL;
    float c = 3.14159f;
    double d = 2.718281828;
    char e = 'Z';
    const char *f = "Hello, World!";

    printf("  PRINT_VALUE(a)  "); PRINT_VALUE(a);
    printf("  PRINT_VALUE(b)  "); PRINT_VALUE(b);
    printf("  PRINT_VALUE(c)  "); PRINT_VALUE(c);
    printf("  PRINT_VALUE(d)  "); PRINT_VALUE(d);
    printf("  PRINT_VALUE(e)  "); PRINT_VALUE(e);

    /*
     * 注意：对于 const char*，_Generic 不会自动匹配到 char*
     * 因为 const char* 和 char* 在 C 的类型系统中是不同的类型。
     * 这里通过强制转换来演示（实际使用时需要添加 const char* 分支）。
     *
     * 要正确处理 const char*，宏定义中需要添加：
     *   const char*: printf("  string: \"%s\"\n", (x))
     *
     * 这展示了 _Generic 的一个特点：类型匹配是精确的。
     */
    printf("  PRINT_VALUE(f)  ");
    PRINT_VALUE((char*)f);
}

/**
 * 演示通用绝对值
 */
void demoGenericAbs(void) {
    printSeparator("示例 3：通用绝对值 (ABS_GENERIC)");

    int a = -42;
    double b = -3.14159;
    float c = -2.718f;

    printf("  ABS_GENERIC(-42)       = %d\n",     ABS_GENERIC(a));
    printf("  ABS_GENERIC(-3.14159)  = %lf\n",    ABS_GENERIC(b));

    /* 注意：%f 用于 float 类型 */
    printf("  ABS_GENERIC(-2.718f)   = %f\n",     ABS_GENERIC(c));
}

/**
 * 演示整型符号信息
 */
void demoSignInfo(void) {
    printSeparator("示例 4：整型符号信息 (INT_SIGN_INFO)");

    int a = 10;
    unsigned int b = 20U;
    long c = 30L;
    unsigned long d = 40UL;

    printf("  INT_SIGN_INFO(a)  -> %s\n", INT_SIGN_INFO(a));
    printf("  INT_SIGN_INFO(b)  -> %s\n", INT_SIGN_INFO(b));
    printf("  INT_SIGN_INFO(c)  -> %s\n", INT_SIGN_INFO(c));
    printf("  INT_SIGN_INFO(d)  -> %s\n", INT_SIGN_INFO(d));
}

/**
 * 演示通用平方运算
 */
void demoSquare(void) {
    printSeparator("示例 5：通用平方运算 (SQUARE)");

    int a = 7;
    double b = 3.5;
    float c = 2.5f;

    /* 使用 %d 打印整型平方 */
    printf("  SQUARE(7)         = %d\n",     SQUARE(a));
    printf("  SQUARE(3.5)       = %lf\n",    SQUARE(b));
    printf("  SQUARE(2.5f)      = %f\n",     SQUARE(c));

    /* 注意：_Generic 是编译期求值的，不会产生运行时开销 */
    printf("\n  > _Generic 在编译期完成类型匹配，无运行时开销！\n");
}

/**
 * 演示安全类型转换
 */
void demoTypeCast(void) {
    printSeparator("示例 6：安全类型转换 (SAFE_INT_CAST)");

    float a = 3.7f;
    double b = 4.2;
    char c = 'M';

    printf("  SAFE_INT_CAST(3.7f)   = %d  (四舍五入)\n", SAFE_INT_CAST(a));
    printf("  SAFE_INT_CAST(4.2)    = %d  (四舍五入)\n", SAFE_INT_CAST(b));
    printf("  SAFE_INT_CAST('M')    = %d  (ASCII 码: %c)\n",
           SAFE_INT_CAST(c), (char)SAFE_INT_CAST(c));
}

/**
 * 演示编译期类型检查
 */
void demoTypeCheck(void) {
    printSeparator("示例 7：编译期类型检查与复杂应用");

    int a = 100;

    /*
     * 编译期类型检查演示：
     * _Generic 表达式在编译期求值，编译器会检查所有分支的类型一致性
     * 如果使用 ASSERT_INT_TYPE 传入非 int 类型...
     * 下面的代码被注释掉了，因为会触发编译警告（字符串赋值给 int）
     */
    printf("  ASSERT_INT_TYPE(a) = %d  (类型检查通过)\n",
           ASSERT_INT_TYPE(a));

    /*
     * 如果将 double 传入 ASSERT_INT_TYPE，default 分支返回字符串，
     * 而宏外部期望的是整型表达式，会导致编译警告。
     * 取消下面这行的注释看看编译器的反应：
     */
    /* double b = 200.5; printf("  ASSERT_INT_TYPE(b) = %d\n", ASSERT_INT_TYPE(b)); */

    printf("\n  > 提示：_Generic 的类型匹配是精确匹配\n");
    printf("  > 例如：int 不能隐式匹配到 long 分支\n");
    printf("  > 必须为每种需要的类型显式提供分支\n");
}

/**
 * 演示 _Generic 的常见陷阱
 */
void demoCommonPitfalls(void) {
    printSeparator("陷阱说明：_Generic 的注意事项");

    printf("  1. 控制表达式不会被求值：\n");
    printf("     _Generic((x), int: 1, default: 0) 中 (x) 不会被计算\n");
    printf("     编译器只看 x 的类型，不计算其值\n\n");

    printf("  2. 类型匹配是精确匹配：\n");
    printf("     const char* 和 char* 是不同的类型\n");
    printf("     int 和 const int 也是不同的类型\n");
    printf("     需要为每个变体提供独立的分支\n\n");

    printf("  3. 所有分支的类型必须一致（或可隐式转换到同一类型）：\n");
    printf("     宏展开后所有分支应该能赋值给同一个变量类型\n\n");

    printf("  4. 数组和指针的区分：\n");
    printf("     char arr[10] 的类型是 char[10]，不是 char*\n");
    printf("     在表达式中传递给 _Generic 时，数组退化为指针\n\n");

    printf("  5. default 分支是可选的但建议提供：\n");
    printf("     如果缺少匹配类型且没有 default，编译会报错\n");
}

/* ========================== 主函数 ========================== */

int main(void) {
    printf("============================================================\n");
    printf("  泛型选择 _Generic 关键字演示程序 (C11)\n");
    printf("============================================================\n");
    printf("\n   _Generic 语法：\n");
    printf("   _Generic(控制表达式,\n");
    printf("       类型1: 结果1,\n");
    printf("       类型2: 结果2,\n");
    printf("       ...,\n");
    printf("       default: 默认结果\n");
    printf("   )\n\n");

    /* 运行各演示函数 */
    demoTypeName();
    demoGenericPrint();
    demoGenericAbs();
    demoSignInfo();
    demoSquare();
    demoTypeCast();
    demoTypeCheck();
    demoCommonPitfalls();

    printf("\n========================================\n");
    printf("  总结：_Generic 是 C11 提供的编译期类型多态机制\n");
    printf("  适用场景：类型通用宏、简化重载代码、编译期类型检查\n");
    printf("  局限：仅编译期选择，无运行时多态，无类型推导\n");
    printf("========================================\n\n");

    return 0;
}
