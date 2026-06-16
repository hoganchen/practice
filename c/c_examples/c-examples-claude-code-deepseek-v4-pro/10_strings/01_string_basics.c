/*
 * ============================================
 * 知识点：字符串基础
 * 说明：
 *   C语言没有单独的字符串类型。
 *   字符串是字符数组，以空字符 '\0' 结尾。
 *
 *   两种表示方式：
 *   1. 字符数组：char str[] = "Hello";
 *      — 可修改，栈或全局存储
 *   2. 字符指针：char *str = "Hello";
 *      — 指向字符串字面量，只读，不可修改
 *
 * 编译方法：
 *   gcc 01_string_basics.c -o 01_string_basics
 * ============================================
 */

#include <stdio.h>
#include "../utf8fix.h"
#include <string.h>   // strlen 等字符串函数

int main() {
    // ========== 字符串的创建 ==========
    printf("===== 字符串的创建 =====\n");

    // 方式1：字符数组（可修改）
    char str1[] = "Hello";  // 编译器自动添加 '\0'，数组大小 = 6
    char str2[] = {'H', 'e', 'l', 'l', 'o', '\0'};  // 等价方式

    // 方式2：指定大小（要注意留出 '\0' 的位置）
    char str3[10] = "Hello";  // 可容纳更多字符

    // 方式3：字符指针（指向字符串字面量，只读！）
    char *str4 = "Hello";  // 字符串字面量在只读存储区

    // 打印字符串
    printf("str1: \"%s\"\n", str1);
    printf("str2: \"%s\"\n", str2);
    printf("str3: \"%s\"\n", str3);
    printf("str4: \"%s\"\n", str4);

    // ========== 字符串的 sizeof ==========
    printf("\n===== sizeof 和 strlen 的区别 =====\n");

    char msg[] = "Hello";

    // sizeof 包括结尾的 '\0'
    printf("字符串: \"%s\"\n", msg);
    printf("sizeof(msg)   = %zu (包括 '\\0')\n", sizeof(msg));
    printf("sizeof(msg)/sizeof(char) = %zu 个元素\n",
           sizeof(msg) / sizeof(msg[0]));

    // strlen 不包括结尾的 '\0'
    // strlen 返回的是字符串的长度（到第一个 '\0' 为止）
    printf("strlen(msg)   = %zu (不包括 '\\0')\n",
           strlen(msg));

    // ========== 字符数组 vs 字符指针 ==========
    printf("\n===== 字符数组 vs 字符指针 =====\n");

    char arr[] = "Hello";   // 字符数组：在栈上分配，可修改
    char *ptr  = "World";   // 字符指针：指向字面量，只读

    printf("数组 arr: %s\n", arr);
    printf("指针 ptr: %s\n", ptr);

    // 修改（数组可修改，指针指向的只读数据不能修改！）
    arr[0] = 'h';   // 合法！arr 是可变数组
    printf("修改后 arr: %s\n", arr);

    // ptr[0] = 'w';  // 危险！可能崩溃（修改只读数据）

    // 指针可以被重新赋值（指向别处）
    ptr = "C语言";    // ptr 现在指向另一个字符串字面量
    printf("重新赋值 ptr: %s\n", ptr);

    // 数组名不能重新赋值
    // arr = "New";    // 错误！数组名是常量

    // ========== 字符串的输入 ==========
    printf("\n===== 字符串输入 =====\n");

    char name[50];

    printf("请输入你的名字（使用 scanf）: ");
    scanf("%49s", name);  // %49s 限制输入长度，防止缓冲区溢出
    printf("你好，%s！\n", name);

    // 清空输入缓冲区
    while (getchar() != '\n');

    // 使用 fgets（更安全，可以包含空格）
    char fullname[50];
    printf("请输入你的全名: ");
    fgets(fullname, sizeof(fullname), stdin);
    // fgets 会读取换行符，需要去除
    // 手动去掉末尾的换行符
    int len = 0;
    while (fullname[len] != '\0') len++;
    if (len > 0 && fullname[len-1] == '\n') {
        fullname[len-1] = '\0';  // 去掉换行符
    }
    printf("你好，%s！\n", fullname);

    // ========== 字符串遍历 ==========
    printf("\n===== 字符串遍历 =====\n");

    char text[] = "C Language";

    // 方式1：使用下标和 '\0' 判断
    printf("逐个字符: ");
    for (int i = 0; text[i] != '\0'; i++) {
        printf("%c ", text[i]);
    }
    printf("\n");

    // 方式2：使用指针
    printf("指针遍历: ");
    char *p = text;
    while (*p != '\0') {
        printf("%c ", *p);
        p++;
    }
    printf("\n");

    // 方式3：计算字符串中某字符出现的次数
    char sentence[] = "hello world, how are you?";
    char search = 'o';
    int count = 0;

    for (int i = 0; sentence[i] != '\0'; i++) {
        if (sentence[i] == search) {
            count++;
        }
    }
    printf("\n'%c' 在 \"%s\" 中出现了 %d 次\n",
           search, sentence, count);

    // ========== 手动实现字符串长度计算 ==========
    printf("\n===== 手动实现 strlen =====\n");

    char test_str[] = "This is a test string!";
    int str_len = 0;

    while (test_str[str_len] != '\0') {
        str_len++;
    }

    printf("\"%s\" 的长度 = %d\n", test_str, str_len);

    // ========== 空字符串 ==========
    printf("\n===== 空字符串和 NULL 指针 =====\n");

    char empty[1] = "";     // 空字符串：只包含 '\0'
    char *null_str = NULL;  // 空指针：不指向任何位置

    printf("空字符串: \"%s\"\n", empty);
    printf("空字符串长度: %zu\n", strlen(empty));

    // 注意：strlen(NULL) 会导致程序崩溃！
    if (null_str == NULL) {
        printf("null_str 是空指针，不能调用 strlen\n");
    }

    // ========== 字符串数组 ==========
    printf("\n===== 字符串数组 =====\n");

    // 方式1：二维字符数组
    char colors[3][10] = {"Red", "Green", "Blue"};
    printf("颜色: %s, %s, %s\n", colors[0], colors[1], colors[2]);

    // 方式2：指针数组（更灵活，但不一定可修改）
    char *fruits[] = {"Apple", "Banana", "Orange"};
    printf("水果: %s, %s, %s\n", fruits[0], fruits[1], fruits[2]);

    // 指针数组的元素可以重新指向
    fruits[0] = "Pear";
    printf("修改后: %s, %s, %s\n", fruits[0], fruits[1], fruits[2]);

    return 0;
}

/*
 * ============================================
 * 关键点总结：
 *
 * 1. C 字符串以 '\0' 结尾（空字符）
 * 2. 字符数组可修改，字符指针指向字面量只读
 * 3. sizeof 包括 '\0'，strlen 不包括
 * 4. fgets() 比 scanf("%s") 更安全
 * 5. 指针数组比二维字符数组更灵活
 * ============================================
 */
