/*
 * ============================================
 * 知识点：类型转换 — 隐式转换与显式转换（强制类型转换）
 * 说明：
 *   C 语言中类型转换分为两种：
 *
 *   1. 隐式类型转换（自动类型转换）
 *      — 编译器自动进行的转换
 *      — 整型提升（Integer Promotion）：char/short → int
 *      — 算术转换（Usual Arithmetic Conversion）：向精度更高的类型转换
 *
 *   2. 显式类型转换（强制类型转换 / Cast）
 *      — 程序员用 (type) 语法手动转换
 *      — 语法：(目标类型)表达式
 *
 *   注意：不恰当的类型转换可能导致精度丢失或逻辑错误！
 *
 * 编译方法：
 *   gcc 01_type_conversion.c -o 01_type_conversion
 * ============================================
 */

#include <stdio.h>
#include "../utf8fix.h"
#include <stdbool.h>

int main() {
    // ============================================================
    // 第一部分：隐式类型转换（自动转换）
    // ============================================================
    printf("===== 隐式类型转换 =====\n\n");

    // ---------- 1. 整型提升（Integer Promotion）----------
    printf("--- 1. 整型提升 ---\n");
    /*
     * 在表达式中，char/short 会被自动提升为 int。
     * 这是 C 标准规定的，为了获得更好的性能。
     */
    char c = 'A';    // ASCII: 65
    int  i = 100;
    // char 被提升为 int 后参与运算
    int result = c + i;
    printf("'A'(%d) + %d = %d (char 自动提升为 int)\n\n",
           c, i, result);

    // ---------- 2. 算术转换（Usual Arithmetic Conversion）----------
    printf("--- 2. 算术转换 ---\n");
    /*
     * 当不同类型一起运算时，向精度更高的类型转换：
     * int → unsigned int → long → unsigned long
     * → long long → unsigned long long → float
     * → double → long double
     */

    int     a = 5;
    double  b = 2.5;
    // int 自动转换为 double 后运算
    double  r1 = a + b;
    printf("int(%d) + double(%.1f) = %.1f (int → double)\n",
           a, b, r1);

    // 混合整数和浮点
    printf("5 / 2 = %d   (整数除法，截断)\n", 5 / 2);
    printf("5 / 2.0 = %.1f (double 除法，精确)\n", 5 / 2.0);

    // ---------- 3. 赋值时的转换 ----------
    printf("\n--- 3. 赋值转换 ---\n");

    double pi = 3.14159;
    int truncated = pi;  // double → int，小数部分丢失
    printf("double %.5f → int = %d (小数被截断)\n",
           pi, truncated);

    // 无符号 ← 有符号
    int negative = -5;
    unsigned int positive = negative;
    printf("int %d → unsigned int = %u (负数变极大正数)\n",
           negative, positive);

    // 较宽类型赋值给较窄类型（会发生截断）
    int wide = 0x12345678;
    short narrow = wide;  // int → short，高位丢失
    printf("int 0x%X → short = 0x%X (高位截断)\n",
           wide, (unsigned short)narrow);

    // ---------- 4. 函数参数传递时的转换 ----------
    printf("\n--- 4. 函数参数传递 ---\n");
    /*
     * 传递给可变参数函数时，float 提升为 double，
     * char/short 提升为 int。
     */
    float  f_val = 3.14f;
    char   c_val = 'x';
    short  s_val = 100;

    // printf 的可变参数中，float → double, char → int, short → int
    printf("float 在可变参数中提升为 double: %f\n", f_val);
    printf("char 在可变参数中提升为 int: %d\n", c_val);

    // ============================================================
    // 第二部分：显式类型转换（强制类型转换）
    // ============================================================
    printf("\n===== 显式类型转换 =====\n\n");

    // ---------- 基本语法 ----------
    printf("--- 基本语法 ---\n");
    int x = 10, y = 3;

    // 不加转换：整数除法
    printf("%d / %d = %d (整数除法)\n", x, y, x / y);

    // 强制转换为 double：得到浮点结果
    printf("(double)%d / %d = %.2f\n", x, y,
           (double)x / y);

    // ---------- 指针类型转换 ----------
    printf("\n--- 指针转换 ---\n");

    int    int_val = 0x12345678;
    int   *int_ptr = &int_val;
    char  *char_ptr = (char*)&int_val;  // int* → char*

    printf("int 值: 0x%X\n", int_val);
    printf("以 char* 逐字节读取:\n");
    for (int i = 0; i < sizeof(int); i++) {
        printf("  字节 %d: 0x%02X\n", i,
               (unsigned char)char_ptr[i]);
    }

    // void* 与具体类型指针之间的转换
    void *vptr = &int_val;
    int *back = (int*)vptr;
    printf("void* → int*: %d\n", *back);

    // ---------- 安全的类型转换 ----------
    printf("\n--- 安全的转换 ---\n");

    // 使用中间 double 避免整数溢出
    int big1 = 2000000000;
    int big2 = 1500000000;
    // 直接相乘可能溢出
    long long product1 = big1 * big2;  // 先 int 溢出，再赋值
    // 先转换再相乘
    long long product2 = (long long)big1 * big2;

    printf("int * int (溢出): %lld\n", product1);
    printf("(long long) * int: %lld\n", product2);

    // ---------- 转换的陷阱 ----------
    printf("\n--- 常见陷阱 ---\n");

    // 陷阱1：有符号与无符号比较
    int      si = -1;
    unsigned ui = 1;
    if (si < ui) {
        // 有符号被转为无符号，-1 变成极大的正数
        printf("陷阱1: %d < %u 为假!(隐藏转换)\n", si, ui);
    } else {
        printf("陷阱1: %d >= %u (因为 -1 被转为 %u)\n",
               si, ui, (unsigned)si);
    }

    // 陷阱2：浮点转整数丢失精度
    double large = 123456789123.0;
    float  approx = (float)large;
    printf("陷阱2: double %.0f → float = %.0f (精度丢失)\n",
           large, approx);

    // 陷阱3：截断（truncation）
    int big_val = 0x10001;  // 65537
    short small_val = (short)big_val;
    printf("陷阱3: int %d → short = %d (高位丢失)\n",
           big_val, small_val);

    // ---------- 合理使用转换 ----------
    printf("\n--- 合理使用示例 ---\n");

    // 获取数组索引的差值（ptrdiff_t）
    int arr[] = {10, 20, 30, 40, 50};
    int *p1 = &arr[0], *p2 = &arr[4];
    ptrdiff_t diff = p2 - p1;  // 元素个数差
    printf("指针差值: %td 个元素\n", diff);

    // printf 中 size_t 的正确格式化
    size_t sz = sizeof(arr);
    printf("数组大小: %zu 字节\n", sz);

    // ========== 总结 ==========
    printf("\n===== 类型转换规则总结 =====\n");
    printf("转换方向：\n");
    printf("  char → int → long → long long\n");
    printf("                      → float → double → long double\n");
    printf("         unsigned int → unsigned long → ...\n");
    printf("安全原则：\n");
    printf("  1. 避免有符号与无符号混用\n");
    printf("  2. 浮点转整数注意精度丢失\n");
    printf("  3. 较宽类型转较窄类型注意截断\n");
    printf("  4. 整数溢出前先提升类型\n");

    return 0;
}

/*
 * ============================================
 * 关键点总结：
 *
 * 1. 整型提升：char/short → int
 * 2. 算术转换：向精度更高的类型转换
 * 3. 强制转换：(type)expr 语法
 * 4. 有符号与无符号混用非常危险！
 * 5. float→int 会截断小数
 * 6. 大→小 转换会截断高位
 * 7. 指针转换需注意对齐问题
 * ============================================
 */
