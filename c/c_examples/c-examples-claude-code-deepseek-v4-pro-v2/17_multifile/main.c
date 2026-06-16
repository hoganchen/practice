/*
 * 知识点：多文件项目的主程序 (Main Program Using Helper)
 *
 * 编译和链接方式：
 *   方式一（一步完成）：
 *     gcc main.c helper.c -o multifile_demo.exe -std=c11 -Wall
 *   方式二（分步编译 + 链接）：
 *     gcc -c helper.c -o helper.o -std=c11 -Wall
 *     gcc main.c helper.o -o multifile_demo.exe -std=c11 -Wall
 *
 * 运行指令：./multifile_demo.exe
 *
 * 本文件是多文件项目的主入口，演示如何：
 *   - 包含自定义头文件
 *   - 调用其他源文件中定义的函数
 *   - 使用头文件中的宏和内联函数
 *   - 组织多文件项目的结构
 */

/* ===== 标准库头文件 ===== */
#include "../common/charset.h"
#include <stdio.h>
#include <stdlib.h>

/* ===== 自定义头文件 ===== */
/* 双引号表示优先在当前目录查找头文件 */
#include "helper.h"

int main() {
    printf("============================================\n");
    printf("  多文件项目演示 (Multifile Demo)\n");
    printf("============================================\n\n");

    /* ===== 1. 调用 helper.c 中的数学函数 ===== */
    printf("----- 1. 数学运算 -----\n");

    int x = 20, y = 7;
    printf("  %d + %d = %d\n",  x, y, add(x, y));
    printf("  %d - %d = %d\n",  x, y, subtract(x, y));
    printf("  %d * %d = %d\n",  x, y, multiply(x, y));
    printf("  %d / %d = %.4f\n", x, y, divide(x, y));

    /* 测试除零错误 */
    printf("  %d / %d = %.2f\n", x, 0, divide(x, 0));

    printf("\n");

    /* ===== 2. 阶乘计算 ===== */
    printf("----- 2. 阶乘计算 -----\n");

    for (int i = 0; i <= 10; i++) {
        printf("  %d! = %lld\n", i, factorial(i));
    }

    printf("\n");

    /* ===== 3. 素数判断 ===== */
    printf("----- 3. 素数判断 -----\n");

    printf("  2 到 50 之间的素数: ");
    for (int i = 2; i <= 50; i++) {
        if (is_prime(i)) {
            printf("%d ", i);
        }
    }
    printf("\n\n");

    /* ===== 4. 字符串处理 ===== */
    printf("----- 4. 字符串处理 -----\n");

    char text[] = "Hello, World! This is C programming.";
    printf("  原始字符串: \"%s\"\n", text);
    printf("  单词数量: %d\n", word_count(text));

    to_upper(text);
    printf("  转大写: \"%s\"\n", text);

    printf("\n");

    /* ===== 5. 随机数生成 ===== */
    printf("----- 5. 随机数生成 -----\n");

    printf("  5 个 1~100 的随机数: ");
    for (int i = 0; i < 5; i++) {
        printf("%d ", random_range(1, 100));
    }
    printf("\n\n");

    /* ===== 6. 使用头文件中的宏 ===== */
    printf("----- 6. 宏的使用 -----\n");

    printf("  PI = %.10f\n", M_PI);
    printf("  BUFFER_SIZE = %d\n", BUFFER_SIZE);
    printf("  MAX(10, 20) = %d\n", MAX(10, 20));
    printf("  MIN(10, 20) = %d\n", MIN(10, 20));

    /* 使用 ARRAY_SIZE 宏计算数组元素个数 */
    int sample[] = {1, 2, 3, 4, 5, 6, 7, 8, 9, 10};
    printf("  sample 数组有 %llu 个元素\n", ARRAY_SIZE(sample));

    printf("\n");

    /* ===== 7. 内联函数的使用 ===== */
    printf("----- 7. 内联函数 -----\n");

    printf("  max_int(100, 200) = %d\n", max_int(100, 200));
    printf("  min_int(100, 200) = %d\n", min_int(100, 200));
    printf("  is_letter('A') = %d (是字母)\n", is_letter('A'));
    printf("  is_letter('9') = %d (不是字母)\n", is_letter('9'));

    printf("\n");

    /* ===== 8. 调试宏演示 ===== */
    printf("----- 8. 调试宏 -----\n");

    printf("  编译时未定义 DEBUG，因此 DEBUG_PRINT 不产生任何输出\n");
    printf("  如需启用调试输出，编译时添加 -DDEBUG 选项：\n");
    printf("    gcc main.c helper.c -o multifile_demo.exe -std=c11 -Wall -DDEBUG\n");

    /* 这个宏在 DEBUG 未定义时会被替换为空，不产生任何代码 */
    DEBUG_PRINT("这是一个调试消息\n");

    printf("\n============================================\n");
    printf("  程序结束\n");
    printf("============================================\n");

    return EXIT_SUCCESS;
}
