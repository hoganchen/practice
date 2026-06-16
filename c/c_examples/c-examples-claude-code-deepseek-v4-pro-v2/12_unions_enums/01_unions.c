/**
 * ============================================================
 *  知识点: 联合体 (Unions)
 *
 *  编译指令: gcc 01_unions.c -o 01_unions.exe -std=c11 -Wall
 *  运行指令: ./01_unions.exe
 *
 *  本文件演示:
 *    1. 联合体的定义与语法
 *    2. 内存共享特征 (大小为最大成员的大小)
 *    3. 实际应用: 类型双关 (type punning)、变体类型 (variant)
 * ============================================================
 */

#include "../common/charset.h"
#include <stdio.h>
#include <string.h>

/*------------------------------------------------------------------
 *  1. 联合体的基本定义
 *
 *  联合体的所有成员共享同一块内存。
 *  联合体的大小等于其最大成员的大小。
 *  给任何一个成员赋值, 都会覆盖其他成员的值。
 *------------------------------------------------------------------*/

/* 定义一个联合体, 包含 int, float, char[4] 三种类型 */
union Data {
    int      i;      /* 4 字节 */
    float    f;      /* 4 字节 */
    char     str[4]; /* 4 字节 */
};  /* 联合体大小: max(4, 4, 4) = 4 字节 */

/*------------------------------------------------------------------
 *  2. 带 typedef 的联合体
 *------------------------------------------------------------------*/
typedef union {
    unsigned int   uint_value;    /* 无符号整数 */
    int            int_value;     /* 有符号整数 */
    float          float_value;   /* 浮点数 */
} Number;  /* 大小: max(4, 4, 4) = 4 字节 */

/*------------------------------------------------------------------
 *  3. 联合体 vs 结构体大小对比
 *------------------------------------------------------------------*/
typedef struct {
    int   i;      /* 4 字节 */
    float f;      /* 4 字节 */
    char  str[4]; /* 4 字节 */
} StructData;  /* 结构体大小: 4 + 4 + 4 = 12 字节 (可能有填充) */

/*------------------------------------------------------------------
 *  4. 变体类型 (Variant) —— 联合体的实际应用
 *
 *  使用联合体 + 枚举标记, 实现一个可以存储不同类型值的"变体"
 *  这就是 C 语言中实现"多态"或"泛型"的一种常见手法
 *------------------------------------------------------------------*/

/* 类型枚举: 标记当前 value 中存储的是什么类型 */
typedef enum {
    TYPE_INT,     /* 整型 */
    TYPE_FLOAT,   /* 浮点型 */
    TYPE_STRING   /* 字符串 */
} ValueType;

/* 变体结构体: 包含类型标记 + 联合体存储实际值 */
typedef struct {
    ValueType type;             /* 类型标记 */
    union {                     /* 匿名联合体 (C11 支持) */
        int     int_val;
        float   float_val;
        char    str_val[32];
    } data;                     /* 联合体成员名 */
} Variant;

/* 辅助函数: 打印 Variant */
void printVariant(const Variant *v);


/*------------------------------------------------------------------
 *  主函数
 *------------------------------------------------------------------*/
int main(void)
{
    printf("========================================\n");
    printf("  联合体 (Unions)\n");
    printf("========================================\n\n");

    /*--------------------------------------------------------------
     *  1. 联合体的内存共享特性
     *--------------------------------------------------------------*/
    printf("--- 联合体 Data 的内存共享 ---\n");

    union Data data;

    /* 联合体的大小等于最大成员的大小 */
    printf("sizeof(union Data)   = %zu 字节\n", sizeof(union Data));
    printf("sizeof(StructData)   = %zu 字节\n", sizeof(StructData));
    printf("联合体所有成员共享内存, 大小仅 4 字节\n");
    printf("结构体每个成员独立内存, 大小 12 字节\n\n");

    /* 给 int 成员赋值 */
    data.i = 42;
    printf("赋值为整数 42:\n");
    printf("  data.i     = %d\n",         data.i);
    printf("  data.f     = %f (损坏数据)\n", data.f);
    printf("  data.str   = \"%s\" (损坏数据)\n", data.str);
    printf("\n");

    /* 给 float 成员赋值 (会覆盖 int 的值) */
    data.f = 3.14f;
    printf("赋值为浮点数 3.14:\n");
    printf("  data.f     = %f\n",         data.f);
    printf("  data.i     = %d (损坏数据)\n", data.i);
    printf("  data.str   = \"%s\" (损坏数据)\n", data.str);
    printf("\n");

    /* 给字符串成员赋值 (会覆盖 float 的值) */
    strcpy(data.str, "ABC");
    printf("赋值为字符串 \"ABC\":\n");
    printf("  data.str   = \"%s\"\n",      data.str);
    printf("  data.i     = %d (损坏数据)\n", data.i);
    printf("  data.f     = %f (损坏数据)\n", data.f);
    printf("\n");

    /* 结论: 联合体同一时刻只能正确读取最后一次赋值的成员 */
    printf("结论: 联合体所有成员共享同一块内存,\n");
    printf("      同一时刻只能正确读取最后一次写入的成员!\n\n");

    /*--------------------------------------------------------------
     *  2. 类型双关 (Type Punning)
     *
     * 通过联合体, 可以查看同一段内存的"不同解释方式"。
     * 这是 C 语言中一种常见的底层编程技巧。
     *--------------------------------------------------------------*/
    printf("--- 类型双关 (查看 float 的十六进制表示) ---\n");

    Number num;
    num.float_value = 3.14f;

    printf("float 值: %f\n", num.float_value);
    printf("作为 unsigned int 解释: 0x%08X\n", num.uint_value);
    printf("作为 int 解释: %d\n", num.int_value);
    printf("\n");
    printf("解释: 同一块 4 字节内存, 被不同方式解读\n");
    printf("float 的 3.14 在内存中的二进制模式,\n");
    printf("如果被当作 unsigned int 解读就是 0x%08X\n", num.uint_value);
    printf("\n");

    /*--------------------------------------------------------------
     *  3. 访问成员的不同偏移量
     *--------------------------------------------------------------*/
    printf("--- 联合体成员地址验证 ---\n");
    printf("&data.i       = %p\n", (void*)&data.i);
    printf("&data.f       = %p\n", (void*)&data.f);
    printf("&data.str     = %p\n", (void*)&data.str);
    printf("所有成员的地址相同! 证明它们共享同一块内存\n\n");

    /*--------------------------------------------------------------
     *  4. 变体类型 (Variant) —— 联合体 + 枚举
     *
     * 这是实际工程中联合体的常见用法:
     * 用一个枚举标记当前存储的类型,
     * 用联合体存储实际的值, 节省内存。
     *--------------------------------------------------------------*/
    printf("--- 变体类型 (Variant) 实现 ---\n");

    Variant v1;
    v1.type = TYPE_INT;
    v1.data.int_val = 100;
    printf("创建:");
    printVariant(&v1);

    Variant v2;
    v2.type = TYPE_FLOAT;
    v2.data.float_val = 2.71828f;
    printf("创建:");
    printVariant(&v2);

    Variant v3;
    v3.type = TYPE_STRING;
    strcpy(v3.data.str_val, "Hello C!");
    printf("创建:");
    printVariant(&v3);

    printf("\n");
    printf("Variant 大小 = %zu 字节\n", sizeof(Variant));
    printf("(枚举 4 字节 + 联合体 32 字节 = 36 字节)\n");
    printf("如果使用结构体存储所有可能类型, 会占用更多! (4+4+4+32=44+填充)\n");

    return 0;
}


/* =================================================================
 *  辅助函数实现
 * ================================================================= */

/*------------------------------------------------------------------
 *  printVariant: 根据 type 标记打印联合体中的值
 *------------------------------------------------------------------*/
void printVariant(const Variant *v)
{
    switch (v->type) {
        case TYPE_INT:
            printf("  [整型]   %d\n", v->data.int_val);
            break;
        case TYPE_FLOAT:
            printf("  [浮点数] %f\n", v->data.float_val);
            break;
        case TYPE_STRING:
            printf("  [字符串] \"%s\"\n", v->data.str_val);
            break;
        default:
            printf("  [未知类型]\n");
            break;
    }
}
