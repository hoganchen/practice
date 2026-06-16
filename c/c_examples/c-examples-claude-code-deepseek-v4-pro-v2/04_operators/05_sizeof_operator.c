/**
 * ============================================================
 * 知识点: sizeof 运算符
 *
 * sizeof 是 C 语言的编译时(大多数情况)单目运算符,用于计算
 * 类型或表达式所占的字节数。它返回 size_t 类型(无符号整数)。
 *
 * 核心要点:
 * 1. sizeof(type)     - 计算类型的字节大小
 * 2. sizeof expr      - 计算表达式结果的字节大小(不计算表达式)
 * 3. 数组上的 sizeof  - 返回整个数组的字节数
 * 4. 指针上的 sizeof  - 返回指针本身的字节数(不是所指向的对象!)
 * 5. 结构体上的 sizeof - 返回结构体字节数(包含填充对齐)
 * 6. VLA 上的 sizeof   - 运行时求值(唯一运行时求值的情况)
 * 7. sizeof 对 char 始终返回 1
 *
 * 编译指令:
 *   gcc 05_sizeof_operator.c -o 05_sizeof_operator.exe -std=c11 -Wall
 * 运行:
 *   ./05_sizeof_operator.exe
 * ============================================================
 */

#include "../common/charset.h"
#include <stdio.h>
#include <stddef.h>  /* 提供 offsetof 宏 */
#include <string.h>  /* 提供 strlen */

/* 定义一个结构体,包含不同成员,用于演示内存对齐 */
struct ExampleStruct {
    char   c;    /* 1 字节 */
    int    i;    /* 4 字节 */
    short  s;    /* 2 字节 */
    double d;    /* 8 字节 */
};

/* 紧凑型结构体: 成员类型相近,填充较少 */
struct PackedStruct {
    int    a;    /* 4 字节 */
    int    b;    /* 4 字节 */
    int    c;    /* 4 字节 */
};

/* 含数组成员的结构体 */
struct WithArray {
    int   id;
    char  name[20];
    float score;
};

/* 联合体: 大小为最大成员的大小 */
union ExampleUnion {
    char   c;
    int    i;
    double d;
};

int main(void)
{
    printf("========================================\n");
    printf("   sizeof 运算符详细演示\n");
    printf("========================================\n\n");

    /* ======== 1. sizeof 基本类型 ======== */
    printf("======== 1. 基本类型的 sizeof ========\n");
    printf("sizeof(char)         = %zu 字节\n", sizeof(char));
    printf("sizeof(short)        = %zu 字节\n", sizeof(short));
    printf("sizeof(int)          = %zu 字节\n", sizeof(int));
    printf("sizeof(long)         = %zu 字节\n", sizeof(long));
    printf("sizeof(long long)    = %zu 字节\n", sizeof(long long));
    printf("sizeof(float)        = %zu 字节\n", sizeof(float));
    printf("sizeof(double)       = %zu 字节\n", sizeof(double));
    printf("sizeof(long double)  = %zu 字节\n", sizeof(long double));
    printf("sizeof(void*)        = %zu 字节 (指针大小)\n", sizeof(void*));
    printf("sizeof(size_t)       = %zu 字节\n\n", sizeof(size_t));

    /* ======== 2. sizeof 表达式(不计算表达式) ======== */
    printf("======== 2. sizeof 表达式(不计算表达式本身) ========\n");

    int a = 10;
    int b = 20;

    /* sizeof 表达式: 计算表达式结果类型的大小,但不执行表达式 */
    size_t sz_expr = sizeof(a + b);
    printf("sizeof(a + b) = %zu 字节 (表达式的类型是 int)\n", sz_expr);

    /* sizeof 不会计算表达式,所以 a 和 b 的值不变 */
    size_t sz_side_effect = sizeof(a++);
    printf("sizeof(a++) = %zu 字节,但 a 的值未变: %d (说明不会执行表达式)\n",
           sz_side_effect, a);

    /* sizeof 作用于字面量 */
    printf("sizeof(42)         = %zu 字节 (int)\n", sizeof(42));
    printf("sizeof(3.14)       = %zu 字节 (double)\n", sizeof(3.14));
    printf("sizeof(\"Hello\")   = %zu 字节 (含 null 终止符的字符数组)\n", sizeof("Hello"));
    printf("sizeof('A')        = %zu 字节 (C语言中字符常量是 int!)\n\n", sizeof('A'));

    /* ======== 3. sizeof 数组 ======== */
    printf("======== 3. sizeof 数组(返回整个数组大小) ========\n");

    int int_arr[10];
    double dbl_arr[5];
    char str_arr[] = "Hello, C!";

    printf("int int_arr[10]:        sizeof(int_arr) = %zu 字节\n", sizeof(int_arr));
    printf("  元素个数 = %zu\n", sizeof(int_arr) / sizeof(int_arr[0]));
    printf("\n");
    printf("double dbl_arr[5]:     sizeof(dbl_arr) = %zu 字节\n", sizeof(dbl_arr));
    printf("  元素个数 = %zu\n", sizeof(dbl_arr) / sizeof(dbl_arr[0]));
    printf("\n");
    printf("char str_arr[] = \"Hello, C!\":\n");
    printf("  sizeof(str_arr) = %zu 字节 (包含 \\0)\n", sizeof(str_arr));
    printf("  strlen(str_arr) = %zu (不包含 \\0)\n\n", strlen(str_arr));

    /* ======== 4. sizeof 指针(关键陷阱!) ======== */
    printf("======== 4. sizeof 指针(关键区别!) ========\n");

    int arr[20];
    int *ptr = arr;  /* 指针指向数组首元素 */

    printf("int arr[20]:         sizeof(arr) = %zu 字节 (整个数组)\n", sizeof(arr));
    printf("int *ptr = arr:      sizeof(ptr) = %zu 字节 (指针本身!)\n", sizeof(ptr));
    printf("  sizeof(*ptr)        = %zu 字节 (指针指向的元素)\n", sizeof(*ptr));

    /*
     * 常见错误: 将数组作为函数参数传递时,数组退化为指针!
     * 在函数内部 sizeof 数组参数得到的是指针大小,不是数组大小。
     */
    printf("\n注意: 数组作为函数参数时会退化为指针!\n");
    printf("在函数外 sizeof(arr) = %zu, 传入函数后 sizeof = 指针大小\n\n",
           sizeof(arr));

    /* 指向不同类型指针的大小(在同一位宽平台上通常相同) */
    printf("sizeof(char*)   = %zu 字节\n", sizeof(char*));
    printf("sizeof(int*)    = %zu 字节\n", sizeof(int*));
    printf("sizeof(double*) = %zu 字节\n", sizeof(double*));
    printf("sizeof(void*)   = %zu 字节\n\n", sizeof(void*));

    /* ======== 5. sizeof 结构体(含内存对齐) ======== */
    printf("======== 5. sizeof 结构体(含内存对齐) ========\n");

    struct ExampleStruct s1;
    struct PackedStruct s2;
    struct WithArray s3;

    printf("struct ExampleStruct:\n");
    printf("  成员: char(%zu) + int(%zu) + short(%zu) + double(%zu)\n",
           sizeof(char), sizeof(int), sizeof(short), sizeof(double));
    printf("  理论简单和: %zu 字节\n",
           sizeof(char) + sizeof(int) + sizeof(short) + sizeof(double));
    printf("  实际 sizeof = %zu 字节 (含填充对齐!)\n", sizeof(s1));
    printf("  额外填充字节: %zu\n\n",
           sizeof(s1) - (sizeof(char) + sizeof(int) + sizeof(short) + sizeof(double)));

    printf("struct PackedStruct (三个 int):\n");
    printf("  sizeof = %zu 字节 (整齐对齐,无填充)\n\n", sizeof(s2));

    printf("struct WithArray (int + char[20] + float):\n");
    printf("  sizeof = %zu 字节\n\n", sizeof(s3));

    /* 结构体成员的偏移量 */
    printf("结构体成员偏移量(使用 <stddef.h> 中的 offsetof 宏):\n");
    printf("  offsetof(struct ExampleStruct, c) = %zu 字节\n",
           offsetof(struct ExampleStruct, c));
    printf("  offsetof(struct ExampleStruct, i) = %zu 字节\n",
           offsetof(struct ExampleStruct, i));
    printf("  offsetof(struct ExampleStruct, s) = %zu 字节\n",
           offsetof(struct ExampleStruct, s));
    printf("  offsetof(struct ExampleStruct, d) = %zu 字节\n",
           offsetof(struct ExampleStruct, d));

    /* ======== 6. sizeof 联合体 ======== */
    printf("\n======== 6. sizeof 联合体 ========\n");

    union ExampleUnion u;
    printf("union ExampleUnion (char + int + double):\n");
    printf("  sizeof = %zu 字节 (最大成员的大小)\n", sizeof(u));
    printf("  sizeof(char)   = %zu\n", sizeof(char));
    printf("  sizeof(int)    = %zu\n", sizeof(int));
    printf("  sizeof(double) = %zu\n\n", sizeof(double));

    /* ======== 7. sizeof 与 VLA (运行时求值) ======== */
    printf("======== 7. sizeof 与 VLA(运行时求值) ========\n");

    int n = 8;
    int vla[n];  /* 变长数组,长度在运行时确定 */

    printf("int n = 8; int vla[n];\n");
    printf("sizeof(vla) = %zu 字节 (运行时计算)\n", sizeof(vla));
    for (int i = 0; i < n; i++) {
        vla[i] = i * i;
    }
    printf("vla 数组元素个数 = %zu\n\n", sizeof(vla) / sizeof(vla[0]));

    /* ======== 8. sizeof 与函数返回值 ======== */
    printf("======== 8. sizeof 与函数 ========\n");
    printf("sizeof(main) = %zu 字节 (函数也有大小,但极少使用)\n", sizeof(main));

    /* ======== 9. 实际应用: 计算数组长度 ======== */
    printf("\n======== 9. 实用技巧: 宏计算数组长度 ========\n");

    /* 定义宏: 安全地计算数组元素个数 */
#define ARRAY_SIZE(arr) (sizeof(arr) / sizeof((arr)[0]))

    int data[] = {10, 20, 30, 40, 50, 60, 70, 80};
    printf("int data[] 有 %zu 个元素\n", ARRAY_SIZE(data));
    for (size_t i = 0; i < ARRAY_SIZE(data); i++) {
        printf("  data[%zu] = %d\n", i, data[i]);
    }

    return 0;
}
