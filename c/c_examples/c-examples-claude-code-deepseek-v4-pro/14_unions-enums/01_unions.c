/*
 * ============================================
 * 知识点：联合体（union）
 * 说明：
 *   联合体允许在同一个内存位置存储不同
 *   类型的数据。所有成员共享同一块内存，
 *   大小等于最大成员的大小。
 *
 *   和结构体的区别：
 *   结构体：每个成员有独立的内存空间
 *   联合体：所有成员共享同一块内存
 *
 *   联合体一次只能使用一个成员。
 *   常用于节省内存或数据解析。
 *
 * 编译方法：
 *   gcc 01_unions.c -o 01_unions
 * ============================================
 */

#include <stdio.h>
#include "../utf8fix.h"
#include <string.h>

// ========== 联合体定义 ==========
union Data {
    int i;
    float f;
    char str[20];
};

// ========== 联合体 vs 结构体 ==========
union UnionExample {
    char c;     // 1 字节
    int i;      // 4 字节
    double d;   // 8 字节
};

struct StructExample {
    char c;     // 1 字节 + 3 padding
    int i;      // 4 字节
    double d;   // 8 字节
};

// ========== 带类型标记的联合体（区分当前使用哪个成员） ==========
enum DataType { TYPE_INT, TYPE_FLOAT, TYPE_STRING };

struct TaggedData {
    enum DataType type;     // 当前使用的数据类型
    union {
        int i;
        float f;
        char str[20];
    } data;
};

int main() {
    // ========== 联合体基本用法 ==========
    printf("===== 联合体基本用法 =====\n");

    union Data data;

    // 存储 int
    data.i = 42;
    printf("data.i = %d\n", data.i);

    // 存储 float（覆盖了之前的 int）
    data.f = 3.14f;
    printf("data.f = %f\n", data.f);
    printf("data.i = %d (已损坏！因为被 float 覆盖)\n", data.i);

    // 存储字符串（覆盖了之前的 float）
    strcpy(data.str, "Hello");
    printf("data.str = %s\n", data.str);
    printf("data.f = %f (已损坏)\n", data.f);

    // ========== 联合体大小 ==========
    printf("\n===== 联合体与结构体大小对比 =====\n");

    printf("union:  %zu 字节\n", sizeof(union UnionExample));
    printf("struct: %zu 字节\n", sizeof(struct StructExample));

    // 联合体大小 = 最大成员的大小
    printf("\n各成员大小:\n");
    printf("  char:   %zu\n", sizeof(char));
    printf("  int:    %zu\n", sizeof(int));
    printf("  double: %zu\n", sizeof(double));
    printf("  union:  %zu (等于最大成员)\n",
           sizeof(union UnionExample));

    // ========== 带类型标记的联合体 ==========
    printf("\n===== 带类型标记的联合体 =====\n");

    struct TaggedData td1;
    td1.type = TYPE_INT;
    td1.data.i = 100;

    struct TaggedData td2;
    td2.type = TYPE_FLOAT;
    td2.data.f = 99.5f;

    struct TaggedData td3;
    td3.type = TYPE_STRING;
    strcpy(td3.data.str, "C Language");

    // 根据类型打印
    void print_tagged(const struct TaggedData *td) {
        switch (td->type) {
            case TYPE_INT:
                printf("  整数: %d\n", td->data.i);
                break;
            case TYPE_FLOAT:
                printf("  浮点数: %f\n", td->data.f);
                break;
            case TYPE_STRING:
                printf("  字符串: %s\n", td->data.str);
                break;
        }
    }

    printf("带标记的数据:\n");
    print_tagged(&td1);
    print_tagged(&td2);
    print_tagged(&td3);

    // ========== 联合体的实际应用 ==========
    printf("\n===== 实际应用 =====\n");

    // 1. 解析 IP 地址
    union IP {
        unsigned int addr;        // 32 位整数
        unsigned char octets[4];  // 4 个字节
    };

    union IP ip;
    ip.addr = 0xC0A80101;  // 0xC0=192, 0xA8=168, 0x01=1, 0x01=1

    printf("IP 地址: %d.%d.%d.%d\n",
           ip.octets[0], ip.octets[1],
           ip.octets[2], ip.octets[3]);

    // 2. 解析字节序（endianness）
    union Endian {
        int value;
        unsigned char bytes[sizeof(int)];
    };

    union Endian e;
    e.value = 0x01020304;

    printf("\n字节序检查:\n");
    printf("int 值: 0x01020304\n");
    printf("内存中的字节: ");
    for (int i = 0; i < sizeof(int); i++) {
        printf("%02x ", e.bytes[i]);
    }
    if (e.bytes[0] == 0x04) {
        printf("(小端序 Little-Endian)\n");
    } else {
        printf("(大端序 Big-Endian)\n");
    }

    // 3. 区分不同类型的数据
    printf("\n===== 变体类型（Variant）示例 =====\n");

    // 定义一个可以存储不同类型的结构
    typedef enum { VAL_INT, VAL_FLOAT, VAL_DOUBLE } ValType;

    typedef struct {
        ValType type;
        union {
            int i;
            float f;
            double d;
        };
    } Variant;

    Variant vals[] = {
        {VAL_INT,   .i = 42},
        {VAL_FLOAT, .f = 3.14f},
        {VAL_DOUBLE,.d = 2.71828}
    };

    for (int i = 0; i < 3; i++) {
        printf("值 %d: ", i + 1);
        switch (vals[i].type) {
            case VAL_INT:
                printf("%d (整数)\n", vals[i].i);
                break;
            case VAL_FLOAT:
                printf("%f (浮点)\n", vals[i].f);
                break;
            case VAL_DOUBLE:
                printf("%lf (双精度)\n", vals[i].d);
                break;
        }
    }

    // ========== 匿名联合体（C11） ==========
    printf("\n===== 匿名联合体（C11） =====\n");

    // 有些编译器支持匿名联合体，可以直接访问成员
    // 不经过 data. 前缀
    struct AnonymousExample {
        enum { NUM_INT, NUM_FLOAT } type;
        union {  // 匿名联合体
            int i;
            float f;
        };  // 没有名称
    };

    struct AnonymousExample anon;
    anon.type = NUM_INT;
    anon.i = 555;  // 直接访问，不需要 anon.data.i

    if (anon.type == NUM_INT) {
        printf("匿名联合体: %d\n", anon.i);
    }

    return 0;
}

/*
 * ============================================
 * 关键点总结：
 *
 * 1. 联合体所有成员共享同一块内存
 * 2. 联合体大小 = 最大成员大小
 * 3. 一次只能使用一个成员（否则数据混乱）
 * 4. 带类型标记的联合体是安全的使用方式
 * 5. 联合体常用于节省内存和数据解析
 * 6. 匿名联合体（C11）可以简化访问
 * ============================================
 */
