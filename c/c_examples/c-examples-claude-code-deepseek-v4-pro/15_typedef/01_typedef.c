/*
 * ============================================
 * 知识点：typedef — 类型别名
 * 说明：
 *   typedef 为已有类型创建别名，提高
 *   代码可读性和可移植性。
 *
 *   常用场景：
 *   1. 简化复杂类型声明
 *   2. 增强代码可移植性
 *   3. 为结构体/枚举创建简洁名称
 *   4. 定义函数指针类型
 *
 * 编译方法：
 *   gcc 01_typedef.c -o 01_typedef
 * ============================================
 */

#include <stdio.h>
#include "../utf8fix.h"

// ========== 基本类型别名 ==========
typedef unsigned int uint;           // unsigned int 的别名
typedef unsigned char byte;          // unsigned char 的别名
typedef long long int64;             // 64位整型的别名

// ========== 结构体别名 ==========
// 方式1：定义结构体同时创建别名
typedef struct {
    double x;
    double y;
    double z;
} Point3D;

// 方式2：先定义结构体，再创建别名
struct Employee {
    int id;
    char name[50];
    double salary;
};
typedef struct Employee Employee;  // struct Employee → Employee

// ========== 枚举别名 ==========
typedef enum {
    SPRING, SUMMER, AUTUMN, WINTER
} Season;

// ========== 函数指针别名 ==========
// 定义一个函数指针类型：接收两个 int，返回 int
typedef int (*MathOp)(int, int);

// ========== 数组别名 ==========
typedef int IntArray10[10];          // IntArray10 是 int[10] 的别名
typedef char String50[50];          // String50 是 char[50] 的别名

// ========== 复杂类型别名 ==========
// 定义一个指向函数的指针类型，该函数接收 (int, char*)，返回 double*
typedef double* (*Callback)(int, char*);

// ========== 可移植性别名 ==========
typedef int int32_t;       // 跨平台：32位整数
typedef short int16_t;     // 跨平台：16位整数
typedef char int8_t;       // 跨平台：8位整数

// ========== 函数定义 ==========
int add(int a, int b) { return a + b; }
int sub(int a, int b) { return a - b; }
int mul(int a, int b) { return a * b; }

int main() {
    // ========== 基本类型别名 ==========
    printf("===== 基本类型别名 =====\n");

    uint    u = 100;         // 等价于 unsigned int
    byte    by = 0xFF;       // 等价于 unsigned char
    int64   big = 999999;    // 等价于 long long

    printf("uint  u = %u\n", u);
    printf("byte  by = 0x%X\n", by);
    printf("int64 big = %lld\n", big);

    // ========== 结构体别名 ==========
    printf("\n===== 结构体别名 =====\n");

    Point3D p = {1.0, 2.0, 3.0};  // 不需要 struct 关键字！
    printf("Point3D: (%.1f, %.1f, %.1f)\n", p.x, p.y, p.z);

    Employee emp;    // 等价于 struct Employee
    emp.id = 1001;
    printf("Employee ID: %d\n", emp.id);

    // ========== 枚举别名 ==========
    printf("\n===== 枚举别名 =====\n");

    Season current = AUTUMN;  // 不需要 enum 关键字
    printf("当前季节: %d (0:春 1:夏 2:秋 3:冬)\n", current);

    // ========== 函数指针别名 ==========
    printf("\n===== 函数指针别名 =====\n");

    MathOp operation;  // 使用别名声明函数指针

    operation = add;
    printf("add(10, 5) = %d\n", operation(10, 5));

    operation = sub;
    printf("sub(10, 5) = %d\n", operation(10, 5));

    operation = mul;
    printf("mul(10, 5) = %d\n", operation(10, 5));

    // ========== 数组别名 ==========
    printf("\n===== 数组别名 =====\n");

    IntArray10 arr = {1, 2, 3, 4, 5};  // 等价于 int arr[10]
    printf("数组: ");
    for (int i = 0; i < 5; i++) {
        printf("%d ", arr[i]);
    }
    printf("\n");

    String50 name = "Hello, typedef!";  // 等价于 char name[50]
    printf("字符串: %s\n", name);

    // ========== 不使用 typedef 的对比 ==========
    printf("\n===== 有 typedef 和没有的对比 =====\n");

    printf("不用 typedef:\n");
    printf("  struct Point3D pt;\n");
    printf("  enum Season s;\n");
    printf("  int (*op)(int, int);\n");

    printf("\n用 typedef:\n");
    printf("  Point3D pt;\n");
    printf("  Season s;\n");
    printf("  MathOp op;\n");

    // ========== 复杂类型的省略 ==========
    printf("\n===== 复杂类型简化 =====\n");

    // 没有 typedef：定义一个包含函数指针的结构体
    struct Calculator {
        char name[20];
        int (*operation)(int, int);  // 函数指针
    };

    // 使用 typedef 简化
    typedef struct {
        char name[20];
        MathOp operation;  // 使用之前定义的类型别名
    } Calculator;
    // MathOp 就是 int (*)(int, int) 的别名

    Calculator calc = {"乘法", mul};
    printf("%s: 6 * 7 = %d\n", calc.name, calc.operation(6, 7));

    // ========== 使用 typedef 提高可移植性 ==========
    printf("\n===== 可移植性 =====\n");

    // 在不同平台上，int 的大小可能不同
    // 使用 typedef 定义固定宽度的类型
    printf("int32_t (自定义): %zu 字节\n", sizeof(int32_t));
    printf("int16_t (自定义): %zu 字节\n", sizeof(int16_t));

    // 实际项目中可以使用 stdint.h 中的标准类型
    // #include <stdint.h>
    // int32_t, uint64_t 等

    // ========== typdef vs #define ==========
    printf("\n===== typedef vs #define =====\n");

    /*
     * typedef 由编译器处理，提供类型检查
     * #define 由预处理器处理，纯文本替换
     */
    printf("typedef: 编译器处理，有类型检查\n");
    printf("#define: 预处理器，纯文本替换\n");

    // 关键区别示例：
    #define PTR_INT int*
    typedef int* TYPEDEF_INT;

    PTR_INT a, b;   // 展开为 int* a, b;  → a是指针，b是int！
    TYPEDEF_INT c, d;  // c和d都是int*

    printf("\n#define int* a, b: a=%p, b=%p (b是int不是指针!)\n",
           (void*)&a, (void*)&b);
    printf("typedef int* c, d: 都是int指针\n");

    return 0;
}

/*
 * ============================================
 * 关键点总结：
 *
 * 1. typedef 为类型创建别名
 * 2. 简化结构体/枚举的使用（不需 struct/enum 关键字）
 * 3. 简化函数指针和复杂类型声明
 * 4. 提高平台间的可移植性
 * 5. typedef 有类型检查，#define 没有
 * 6. 在声明多个变量时，typedef 比 #define 更安全
 * ============================================
 */
