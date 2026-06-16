/**
 * ============================================================
 *  知识点: 结构体填充、对齐与位域
 *         (Struct Padding, Alignment, and Bit Fields)
 *
 *  编译指令: gcc 03_struct_padding_and_bitfields.c -o 03_struct_padding_and_bitfields.exe -std=c11 -Wall
 *  运行指令: ./03_struct_padding_and_bitfields.exe
 *
 *  本文件演示:
 *    1. 结构体成员之间的填充字节 (padding)
 *    2. 成员顺序对结构体大小的影响
 *    3. offsetof 宏 (来自 <stddef.h>) 计算成员偏移量
 *    4. 位域 (bit fields) 用于节省空间
 * ============================================================
 */

#include "../common/charset.h"
#include <stdio.h>
#include <stddef.h>   /* 提供 offsetof 宏 */
#include <stdint.h>   /* 提供 int32_t 等定长类型 */

/* =================================================================
 *  1. 结构体对齐与填充 (Padding)
 *
 *  编译器会按每个成员的自然对齐要求插入填充字节:
 *    - char:   1 字节对齐 => 可以放在任何位置
 *    - short:  2 字节对齐 => 偏移量必须是 2 的倍数
 *    - int:    4 字节对齐 => 偏移量必须是 4 的倍数
 *    - double: 8 字节对齐 (在 Windows/MSVC 中可能是 8)
 *
 *  结构体的总大小必须是最大成员对齐值的整数倍。
 * ================================================================= */

/* 结构体 A: 按从大到小排列 (高效) */
typedef struct {
    double d;   /* 8 字节, 偏移 0 */
    int    i;   /* 4 字节, 偏移 8  (8 已经是 4 的倍数, 无需填充) */
    short  s;   /* 2 字节, 偏移 12 (12 已经是 2 的倍数, 无需填充) */
    char   c;   /* 1 字节, 偏移 14 */
    /* 填充 1 字节使总大小为 16 (8 的倍数) */
} AlignGood;    /* 总大小: 8 + 4 + 2 + 1 + 1(pad) = 16 字节 */

/* 结构体 B: 按从小到大排列 (低效, 产生更多填充) */
typedef struct {
    char   c;   /* 1 字节, 偏移 0 */
    /* 填充 3 字节, 因为下一个成员 int 需要 4 字节对齐 */
    int    i;   /* 4 字节, 偏移 4 */
    /* 填充 2 字节, 因为下一个成员 double 需要 8 字节对齐 */
    double d;   /* 8 字节, 偏移 8 */
    short  s;   /* 2 字节, 偏移 16 */
    /* 填充 6 字节使总大小为 24 (8 的倍数) */
} AlignBad;     /* 总大小: 1 + 3(pad) + 4 + 4(pad) + 8 + 2 + 6(pad) = 28 字节 */
                /* 实际上最后会填充到 24 字节(8 的倍数靠上)  — 我们来算精确的:
                 * c:偏移0(1B), pad:1-3(3B), i:偏移4(4B), d:偏移8(8B), s:偏移16(2B)
                 * 内容总大小=1+3+4+8+2=18, 对齐到8的倍数=24, 再填充6B
                 * => 总大小 24 字节
                 */

/* 结构体 C: 重新排序优化后的版本 (等价于 AlignGood) */
typedef struct {
    double d;   /* 8 字节 */
    double e;   /* 8 字节 (再添加一个 double 不影响基本对齐逻辑) */
    int    i;   /* 4 字节 */
    short  s;   /* 2 字节 */
    char   c1;  /* 1 字节 */
    char   c2;  /* 1 字节 */
    /* 填充 0 字节 (16 + 4 + 2 + 1 + 1 = 24, 已经是 8 的倍数) */
} AlignOptimized; /* 总大小: 24 字节 */

/* =================================================================
 *  2. 使用 offsetof 宏查看成员偏移量
 *
 *  offsetof(type, member) 返回成员在结构体中的字节偏移量
 *  定义在 <stddef.h> 中
 * ================================================================= */

/* =================================================================
 *  3. 位域 (Bit Fields)
 *
 *  语法: 类型 成员名 : 位数;
 *  用于精确控制每个成员占用的比特位数
 *  适用于硬件寄存器、协议头部、标志位等场景
 * ================================================================= */

/* 没有使用位域的日期结构体 */
typedef struct {
    unsigned int year;   /* 4 字节 = 32 位 */
    unsigned int month;  /* 4 字节 = 32 位 */
    unsigned int day;    /* 4 字节 = 32 位 */
} DateNoBit;  /* 总大小: 12 字节 */

/* 使用位域的日期结构体 */
typedef struct {
    unsigned int year  : 12;   /* 年份用 12 位 (可表示 0-4095) */
    unsigned int month : 4;    /* 月份用 4 位 (可表示 0-15) */
    unsigned int day   : 5;    /* 日期用 5 位 (可表示 0-31) */
} DateWithBit;  /* 总大小: 4 字节 (3 个位域共享一个 unsigned int) */

/* 设备寄存器模拟: 使用位域表示状态标志 */
typedef struct {
    unsigned int power_on : 1;   /* bit 0: 电源状态 */
    unsigned int mode     : 2;   /* bit 1-2: 工作模式 (0-3) */
    unsigned int error    : 1;   /* bit 3: 错误标志 */
    unsigned int reserved : 3;   /* bit 4-6: 保留位 */
    unsigned int data     : 8;   /* bit 7-14: 数据 */
} DeviceReg;  /* 总大小: 4 字节 */

/* =================================================================
 *  4. 测试结构体: 演示成员重排对大小的影响
 * ================================================================= */

/* 重新排序: 不良顺序 (小→大) */
typedef struct {
    char   a;   /* 1 字节 */
    /* +3 填充 */
    int    b;   /* 4 字节 */
    char   c;   /* 1 字节 */
    /* +1 填充 */
    short  d;   /* 2 字节 */
    char   e;   /* 1 字节 */
    /* +1 填充 */
    int    f;   /* 4 字节 */
    /* +3 填充 (总大小对齐到 4 的倍数) */
} BadOrder; /* 预计: 1+3+4+1+1+2+1+1+4 = 18, 对齐到 4 => 20 字节 */

/* 重新排序: 良好顺序 (大→小) */
typedef struct {
    int    b;   /* 4 字节 */
    int    f;   /* 4 字节 */
    short  d;   /* 2 字节 */
    char   a;   /* 1 字节 */
    char   c;   /* 1 字节 */
    char   e;   /* 1 字节 */
    /* +1 填充 (总大小对齐到 4 的倍数) */
} GoodOrder;  /* 预计: 4+4+2+1+1+1 = 13, 对齐到 4 => 16 字节 */

/* 使用 packed 属性: GCC 支持, 强制取消填充 (非标准) */
/* 注意: __attribute__((packed)) 是 GCC 扩展, C11 标准未定义 */
typedef struct __attribute__((packed)) {
    char  c;    /* 1 字节, 偏移 0 */
    int   i;    /* 4 字节, 偏移 1 (不按 4 对齐!) */
    short s;    /* 2 字节, 偏移 5 */
} PackedStruct; /* 总大小: 1 + 4 + 2 = 7 字节 (无填充) */


/*------------------------------------------------------------------
 *  主函数
 *------------------------------------------------------------------*/
int main(void)
{
    printf("=================================================\n");
    printf("  结构体填充、对齐与位域\n");
    printf("=================================================\n\n");

    /*--------------------------------------------------------------
     *  1. 查看不同结构体的大小
     *--------------------------------------------------------------*/
    printf("--- 结构体大小对比 ---\n");
    printf("sizeof(AlignGood)      = %zu 字节\n", sizeof(AlignGood));
    printf("sizeof(AlignBad)       = %zu 字节\n", sizeof(AlignBad));
    printf("sizeof(AlignOptimized) = %zu 字节\n", sizeof(AlignOptimized));
    printf("\n");

    /* 分析: AlignGood 和 AlignBad 包含完全相同的成员, 只是顺序不同! */
    printf("注意: AlignGood 和 AlignBad 包含完全相同的成员类型,\n");
    printf("      只是声明顺序不同, 大小却不同!\n");
    printf("      因为编译器需要插入填充字节来满足对齐要求\n\n");

    /*--------------------------------------------------------------
     *  2. 使用 offsetof 查看成员偏移量
     *--------------------------------------------------------------*/
    printf("--- offsetof 查看成员偏移量 ---\n");
    printf("AlignGood:\n");
    printf("  offsetof(d) = %zu\n", offsetof(AlignGood, d));
    printf("  offsetof(i) = %zu\n", offsetof(AlignGood, i));
    printf("  offsetof(s) = %zu\n", offsetof(AlignGood, s));
    printf("  offsetof(c) = %zu\n", offsetof(AlignGood, c));

    printf("AlignBad:\n");
    printf("  offsetof(c) = %zu\n", offsetof(AlignBad, c));
    printf("  offsetof(i) = %zu\n", offsetof(AlignBad, i));
    printf("  offsetof(d) = %zu\n", offsetof(AlignBad, d));
    printf("  offsetof(s) = %zu\n", offsetof(AlignBad, s));
    printf("\n");

    /* 可以看到 AlignBad 中, int 前面填充了 3 字节, double 前面又填充了 4 字节 */
    printf("AlignBad 中可以看到额外的填充字节浪费了空间\n\n");

    /*--------------------------------------------------------------
     *  3. 成员重排优化
     *--------------------------------------------------------------*/
    printf("--- 成员重排对大小的影响 ---\n");
    printf("sizeof(BadOrder)  = %zu 字节 (不合理顺序)\n", sizeof(BadOrder));
    printf("sizeof(GoodOrder) = %zu 字节 (优化顺序)\n", sizeof(GoodOrder));
    printf("节约了 %zu 字节\n\n",
           sizeof(BadOrder) - sizeof(GoodOrder));

    /*--------------------------------------------------------------
     *  4. packed 属性 (GCC 扩展)
     *--------------------------------------------------------------*/
    printf("--- packed 属性 (取消填充) ---\n");
    printf("sizeof(PackedStruct) = %zu 字节 (无填充)\n", sizeof(PackedStruct));
    printf("成员 c 偏移: %zu\n", offsetof(PackedStruct, c));
    printf("成员 i 偏移: %zu (注意: 不是 4 的倍数!)\n", offsetof(PackedStruct, i));
    printf("成员 s 偏移: %zu\n", offsetof(PackedStruct, s));
    printf("警告: packed 结构体访问效率低, 某些平台可能异常\n\n");

    /*--------------------------------------------------------------
     *  5. 位域 (Bit Fields)
     *--------------------------------------------------------------*/
    printf("--- 位域 (Bit Fields) ---\n");
    printf("sizeof(DateNoBit)  = %zu 字节 (无位域)\n", sizeof(DateNoBit));
    printf("sizeof(DateWithBit)= %zu 字节 (使用位域)\n", sizeof(DateWithBit));
    printf("位域版本仅用 4 字节, 节省了 %zu 字节!\n",
           sizeof(DateNoBit) - sizeof(DateWithBit));

    /* 使用位域结构体 */
    DateWithBit dbit = { 2026, 6, 15 };

    printf("DateWithBit: year=%u, month=%u, day=%u\n\n",
           dbit.year, dbit.month, dbit.day);

    /*--------------------------------------------------------------
     *  6. 位域在硬件编程中的使用
     *--------------------------------------------------------------*/
    printf("--- 设备寄存器位域模拟 ---\n");
    DeviceReg reg = { 0 };  /* 初始化所有位为 0 */

    reg.power_on = 1;    /* 打开电源 */
    reg.mode     = 2;    /* 设置为模式 2 */
    reg.data     = 0xAB; /* 设置数据 */

    printf("sizeof(DeviceReg) = %zu 字节\n", sizeof(DeviceReg));
    printf("power_on = %u\n", reg.power_on);
    printf("mode     = %u\n", reg.mode);
    printf("error    = %u\n", reg.error);
    printf("data     = 0x%02X\n", reg.data);

    /* 位域成员的地址不能取 (&reg.power_on 非法) */
    printf("\n注意: 位域成员不能使用 & 取地址, 因为它们不是独立字节\n");

    return 0;
}
