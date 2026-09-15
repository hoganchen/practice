/**
 * ============================================================
 * 知识点: 字节序 (Endianness) —— 检测 CPU 是大端还是小端
 *
 * 字节序 (endianness) 指多字节数据在内存中的字节排列顺序:
 *
 *   大端序 (big-endian)   : 高位字节存放在低地址
 *                           0x12345678 → [12][34][56][78]
 *   小端序 (little-endian): 低位字节存放在低地址
 *                           0x12345678 → [78][56][34][12]
 *
 * 说明:
 *   - x86 / x86-64 是典型的小端架构
 *   - ARM 默认小端, 但可切换为大端
 *   - 网络协议 (TCP/IP) 规定使用大端序, 称为"网络字节序"
 *   - 写跨平台二进制文件 / 网络通信时必须考虑字节序
 *
 * 本程序用三种方法检测当前机器的字节序:
 *   方法 1: 联合体 (union) 类型双关 —— 最经典
 *   方法 2: 指针强制转换 + 逐字节访问
 *   方法 3: 编译期宏 __BYTE_ORDER__ —— 零运行时开销
 *
 * 编译指令:
 *   gcc 08_endianness.c -o 08_endianness.exe -std=c11 -Wall
 * 运行:
 *   ./08_endianness.exe
 * ============================================================
 */

#include "../common/charset.h"
#include <stdio.h>
#include <stdint.h>   /* uint8_t / uint16_t / uint32_t */

/*
 * 辅助函数: 以十六进制逐字节打印一段内存
 * 用于直观展示数据在内存中的实际排列
 */
static void print_bytes(const void *p, size_t n)
{
    const uint8_t *bytes = (const uint8_t *)p;

    for (size_t i = 0; i < n; i++) {
        printf("%02X", bytes[i]);
        if (i + 1 < n) {
            printf(" ");
        }
    }
}

/*
 * 方法 1: 联合体 (union) 类型双关
 *
 * 联合体的所有成员共享同一块内存。给 i 赋值后, 再按 c[] 逐字节读取,
 * 就能看到这个整数在内存中的字节顺序。这是最经典的检测方法。
 *
 * 返回值: 1 = 小端, 0 = 大端
 */
static int is_little_endian_union(void)
{
    union {
        uint32_t value;
        uint8_t  bytes[4];
    } u;

    u.value = 0x01020304u;   /* 四个字节各不相同, 便于区分 */

    /*
     * 小端: 低地址存放低位字节 → bytes[0] = 0x04
     * 大端: 低地址存放高位字节 → bytes[0] = 0x01
     */
    return (u.bytes[0] == 0x04);
}

/*
 * 方法 2: 指针强制转换 + 逐字节访问
 *
 * 把 uint32_t 的地址转成 uint8_t*, 逐字节检查。
 * 原理和方法 1 相同, 但用的是指针而非联合体。
 *
 * 返回值: 1 = 小端, 0 = 大端
 */
static int is_little_endian_pointer(void)
{
    uint32_t x = 0x01020304u;
    const uint8_t *p = (const uint8_t *)&x;

    return (p[0] == 0x04);
}

/*
 * 方法 3: 编译期检测宏 (GCC / Clang 扩展)
 *
 * __BYTE_ORDER__ 等宏由编译器在预处理阶段定义, 无需任何运行时开销。
 * 注意: 这是编译器扩展, 不是 C 标准的一部分 (MSVC 不提供)。
 *
 * 返回值: 1 = 小端, 0 = 大端或未知
 */
static int is_little_endian_compile_time(void)
{
#if defined(__BYTE_ORDER__) && defined(__ORDER_LITTLE_ENDIAN__)
    return (__BYTE_ORDER__ == __ORDER_LITTLE_ENDIAN__);
#else
    return -1;   /* 该编译器不支持此宏 */
#endif
}

/*
 * 精确判定字节序, 能区分"混合字节序(mixed-endian)"这种罕见情况
 *
 * 返回值: 1 = 小端, 2 = 大端, 0 = 混合/未知
 */
static int detect_endianness(void)
{
    union {
        uint32_t value;
        uint8_t  bytes[4];
    } u;

    u.value = 0x01020304u;

    /* 小端: 04 03 02 01 ; 大端: 01 02 03 04 */
    if (u.bytes[0] == 0x04 && u.bytes[1] == 0x03 &&
        u.bytes[2] == 0x02 && u.bytes[3] == 0x01) {
        return 1;   /* 小端 */
    }
    if (u.bytes[0] == 0x01 && u.bytes[1] == 0x02 &&
        u.bytes[2] == 0x03 && u.bytes[3] == 0x04) {
        return 2;   /* 大端 */
    }
    return 0;       /* 混合字节序 (如 PDP-endian), 极罕见 */
}

/*
 * 字节序转换: 把一个 32 位整数的高低字节整体颠倒
 *
 * 小端机器上把整数转成"网络字节序(大端)"或转回来, 都靠这个操作。
 * 标准库提供了 htonl / ntohl (Linux: <arpa/inet.h>, Windows: <winsock2.h>),
 * 这里手写一遍以便理解其原理。
 */
static uint32_t swap_bytes32(uint32_t v)
{
    return ((v & 0x000000FFu) << 24) |
           ((v & 0x0000FF00u) << 8)  |
           ((v & 0x00FF0000u) >> 8)  |
           ((v & 0xFF000000u) >> 24);
}

int main(void)
{
    printf("========================================\n");
    printf("  字节序检测 (Endianness)\n");
    printf("========================================\n\n");

    /* ======== 1. 直观展示: 一个整数在内存中的字节排列 ======== */
    printf("======== 1. 数据在内存中的字节排列 ========\n");

    uint32_t value = 0x12345678u;

    printf("整数 value = 0x%08X (%u)\n", value, value);
    printf("内存中的字节 (从低地址到高地址): ");
    print_bytes(&value, sizeof(value));
    printf("\n\n");

    printf("对照:\n");
    printf("  若为小端 → 78 56 34 12 (低位字节在前)\n");
    printf("  若为大端 → 12 34 56 78 (高位字节在前)\n\n");

    /* 同样展示 16 位和 64 位类型, 说明字节序对所有多字节类型都适用 */
    uint16_t v16 = 0xABCDu;
    printf("16位: 0x%04X → ", v16);
    print_bytes(&v16, sizeof(v16));
    printf("\n");

    uint64_t v64 = 0x0102030405060708ULL;
    printf("64位: 0x%016llX → ", (unsigned long long)v64);
    print_bytes(&v64, sizeof(v64));
    printf("\n\n");

    /* ======== 2. 三种检测方法 ======== */
    printf("======== 2. 三种检测方法 ========\n");

    /* --- 方法 1: 联合体 --- */
    printf("[方法 1] 联合体类型双关:     ");
    if (is_little_endian_union()) {
        printf("小端 (little-endian)\n");
    } else {
        printf("大端 (big-endian)\n");
    }

    /* 展示方法 1 的内部细节 */
    {
        union {
            uint32_t value;
            uint8_t  bytes[4];
        } demo;
        demo.value = 0x01020304u;

        printf("         演示: 0x01020304 存入后, bytes[] = ");
        print_bytes(demo.bytes, 4);
        printf("\n");
        printf("         因为 bytes[0] = 0x%02X, 所以判定为%s\n",
               demo.bytes[0],
               demo.bytes[0] == 0x04 ? "小端" : "大端");
    }

    /* --- 方法 2: 指针 --- */
    printf("[方法 2] 指针强转逐字节访问: ");
    if (is_little_endian_pointer()) {
        printf("小端 (little-endian)\n");
    } else {
        printf("大端 (big-endian)\n");
    }

    /* --- 方法 3: 编译期宏 --- */
    printf("[方法 3] 编译期宏 __BYTE_ORDER__: ");
    {
        int ct = is_little_endian_compile_time();
        if (ct == -1) {
            printf("该编译器不支持此宏\n");
        } else if (ct) {
            printf("小端 (little-endian)\n");
        } else {
            printf("大端 (big-endian)\n");
        }
    }
    printf("\n");

    /* ======== 3. 综合判定 ======== */
    printf("======== 3. 最终判定 ========\n");

    int order = detect_endianness();
    printf("当前 CPU 的字节序: ");
    switch (order) {
        case 1:
            printf("小端序 (Little-Endian)\n");
            printf("  → 低位字节存放在低地址 (x86/x64 的典型行为)\n");
            break;
        case 2:
            printf("大端序 (Big-Endian)\n");
            printf("  → 高位字节存放在低地址 (部分 ARM/SPARC/PowerPC)\n");
            break;
        default:
            printf("混合字节序或未知 (极少见)\n");
            break;
    }

    /* 说明字节序只对多字节类型有意义 */
    printf("\n注意: 字节序只对多字节类型 (%s) 有意义。\n",
           "short/int/long/float/double/指针等");
    printf("单字节的 char / uint8_t 不受字节序影响。\n\n");

    /* ======== 4. 实际应用: 与网络字节序互相转换 ======== */
    printf("======== 4. 实际应用: 主机序 <-> 网络序 ========\n");

    uint32_t host_val = 0x12345678u;
    uint32_t net_val  = swap_bytes32(host_val);   /* 手工转换 */

    printf("主机字节序的值: 0x%08X → 内存 ", host_val);
    print_bytes(&host_val, sizeof(host_val));
    printf("\n");

    printf("转换为网络序后: 0x%08X → 内存 ", net_val);
    print_bytes(&net_val, sizeof(net_val));
    printf("\n");

    printf("再转回来:       0x%08X (与原始值一致: %s)\n",
           swap_bytes32(net_val),
           swap_bytes32(net_val) == host_val ? "是" : "否");

    printf("\n说明:\n");
    printf("  网络协议 (TCP/IP) 规定统一使用大端序, 称为\"网络字节序\"。\n");
    printf("  在小端机器上收发数据时, 需要用 htonl/htons/ntohl/ntohs\n");
    printf("  之类的函数做转换, 否则多字节数值会被解析错误。\n\n");

    /* ======== 5. 为什么需要关心字节序 ======== */
    printf("======== 5. 为什么需要关心字节序 ========\n");
    printf("1. 网络通信: 必须统一为网络字节序(大端), 否则数值错乱\n");
    printf("2. 二进制文件: 跨平台读写多字节数据时必须约定字节序\n");
    printf("3. 类型双关: 用 union/指针按字节查看数据时, 结果依赖字节序\n");
    printf("4. 位域布局: 结构体位域的内存布局同样受字节序影响\n");
    printf("5. 安全: 某些漏洞利用(如整数溢出+字节序)依赖具体字节序\n\n");

    printf("===== 程序结束 =====\n");

    return 0;
}
