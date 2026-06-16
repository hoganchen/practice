/*
 * ============================================
 * 知识点：指针与字符串
 * 说明：
 *   字符串与指针关系密切。字符串常量是
 *   字符数组，可以通过指针来操作。
 *
 *   两种字符串：
 *   1. 字符数组：char s[] = "Hello";
 *      — 可修改，在栈上分配
 *   2. 字符指针：char *s = "Hello";
 *      — 指向只读常量区，不可修改
 *
 *   理解指针与字符串的关系是掌握C语言的
 *   关键一步。
 *
 * 编译方法：
 *   gcc 03_pointers_and_strings.c -o 03_pointers_and_strings
 * ============================================
 */

#include <stdio.h>
#include "../utf8fix.h"
#include <string.h>
#include <ctype.h>  // 提供 toupper、tolower 等字符函数

int main() {
    // ========== 字符数组 vs 字符指针 ==========
    printf("===== 字符数组 vs 字符指针 =====\n");

    char arr[] = "Hello";   // 数组：在栈上分配 6 字节
    char *ptr  = "Hello";   // 指针：指向静态常量区的字符串

    printf("sizeof(arr) = %zu (包括'\\0')\n", sizeof(arr));
    printf("sizeof(ptr) = %zu (指针本身大小)\n", sizeof(ptr));

    // 数组可修改
    arr[0] = 'h';
    printf("修改数组: %s\n", arr);

    // 指针指向的只读数据不可修改！
    // ptr[0] = 'h';  // 未定义行为！可能崩溃

    // 指针可以重新指向其他地方
    ptr = "World";
    printf("重新指向: %s\n", ptr);

    // 数组名不能重新赋值
    // arr = "World";  // 编译错误

    // ========== 通过指针遍历字符串 ==========
    printf("\n===== 通过指针遍历字符串 =====\n");

    char str[] = "Pointer";
    char *p = str;

    printf("字符串: %s\n", str);

    // 遍历并输出 ASCII 码
    printf("逐个字符:\n");
    while (*p != '\0') {
        printf("  '%c' (ASCII: %d)\n", *p, *p);
        p++;
    }

    // ========== 指针实现字符串函数 ==========
    printf("\n===== 手动实现字符串操作 =====\n");

    // 手动实现 strlen
    char *text = "Hello, World!";
    char *s = text;
    int length = 0;
    while (*s != '\0') {
        length++;
        s++;
    }
    printf("\"%s\" 长度 = %d (手动计算)\n", text, length);
    printf("strlen 验证 = %zu\n", strlen(text));

    // 手动实现字符串复制
    char src[] = "Copy me!";
    char dest[20];
    char *src_p = src;
    char *dest_p = dest;

    while (*src_p != '\0') {
        *dest_p = *src_p;
        src_p++;
        dest_p++;
    }
    *dest_p = '\0';  // 添加字符串结束符
    printf("复制结果: \"%s\"\n", dest);

    // 更简洁的写法
    char dest2[20];
    char *sp = src;
    char *dp = dest2;
    while ((*dp++ = *sp++) != '\0');  // 一行完成复制
    printf("简洁复制: \"%s\"\n", dest2);

    // ========== 字符串大小写转换 ==========
    printf("\n===== 字符串转换 =====\n");

    char mixed[] = "Hello, C Language!";

    printf("原始:   %s\n", mixed);

    // 转大写
    for (int i = 0; mixed[i] != '\0'; i++) {
        mixed[i] = toupper(mixed[i]);
    }
    printf("大写:   %s\n", mixed);

    // 转小写
    for (int i = 0; mixed[i] != '\0'; i++) {
        mixed[i] = tolower(mixed[i]);
    }
    printf("小写:   %s\n", mixed);

    // ========== 字符串指针数组 ==========
    printf("\n===== 字符串指针数组 =====\n");

    // 方式1：指针数组（更灵活）
    char *colors[] = {"Red", "Green", "Blue", "Yellow"};
    int n_colors = sizeof(colors) / sizeof(colors[0]);

    printf("颜色列表 (指针数组):\n");
    for (int i = 0; i < n_colors; i++) {
        printf("  %d: %s\n", i, colors[i]);
    }

    // 指针元素可以重新指向
    colors[0] = "Cyan";
    printf("修改后: %s\n", colors[0]);

    // 方式2：二维字符数组（更紧凑，占用连续内存）
    char fruits[][10] = {"Apple", "Banana", "Orange"};
    int n_fruits = sizeof(fruits) / sizeof(fruits[0]);

    printf("\n水果列表 (二维数组):\n");
    for (int i = 0; i < n_fruits; i++) {
        printf("  %d: %s\n", i, fruits[i]);
    }

    // ========== 命令行风格的字符串处理 ==========
    printf("\n===== 字符串分割（手动） =====\n");

    char sentence[] = "C language is powerful";
    char *word = sentence;
    char *start;

    // 手动分割单词
    start = word;
    while (*word != '\0') {
        if (*word == ' ') {
            // 输出一个单词
            *word = '\0';
            printf("单词: \"%s\"\n", start);
            start = word + 1;
        }
        word++;
    }
    // 输出最后一个单词
    if (*start != '\0') {
        printf("单词: \"%s\"\n", start);
    }

    // ========== 字符串常量的地址 ==========
    printf("\n===== 字符串常量地址 =====\n");
    /*
     * 相同的字符串字面量可能共用同一份存储。
     */

    char *s1 = "Hello";
    char *s2 = "Hello";
    char arr1[] = "Hello";
    char arr2[] = "Hello";

    printf("s1 = %p, s2 = %p\n", (void*)s1, (void*)s2);
    printf("s1 == s2? %s (可能相同，取决于编译器)\n",
           s1 == s2 ? "是" : "否");
    printf("arr1 = %p, arr2 = %p\n", (void*)arr1, (void*)arr2);
    printf("arr1 == arr2? %s (总是不同)\n",
           arr1 == arr2 ? "是" : "否");

    // 比较字符串内容要用 strcmp，不要用 ==
    printf("\nstrcmp(s1, s2) = %d (内容比较)\n", strcmp(s1, s2));

    return 0;
}

/*
 * ============================================
 * 关键点总结：
 *
 * 1. 字符数组可修改，字符指针指向只读数据
 * 2. 指针可以重新赋值，数组名不能
 * 3. 字符串字面量存储在只读常量区
 * 4. 通过指针遍历字符串是常见操作
 * 5. 字符串指针数组比二维数组更灵活
 * 6. 比较字符串内容用 strcmp，不是 ==
 * ============================================
 */
