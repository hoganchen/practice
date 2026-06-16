/*
 * ============================================
 * 知识点：string.h 字符串处理函数
 * 说明：
 *   <string.h> 提供了丰富的字符串操作函数：
 *   strlen()    — 获取字符串长度
 *   strcpy()    — 复制字符串
 *   strcat()    — 拼接字符串
 *   strcmp()    — 比较字符串
 *   strchr()    — 查找字符
 *   strstr()    — 查找子串
 *   strtok()    — 分割字符串
 *
 *   注意：这些函数不检查缓冲区大小！
 *   安全版本：strncpy(), strncat(), strncmp()
 *
 * 编译方法：
 *   gcc 02_string_functions.c -o 02_string_functions
 * ============================================
 */

#include <stdio.h>
#include "../utf8fix.h"
#include <string.h>  // 字符串操作函数
#include <stdlib.h>  // atoi, atof, strtol

int main() {
    // ========== strlen() — 获取长度 ==========
    printf("===== strlen() =====\n");

    char str[] = "Hello, C Language!";
    printf("字符串: \"%s\"\n", str);
    printf("长度: %zu\n", strlen(str));
    printf("sizeof: %zu (包括'\\0')\n", sizeof(str));

    // ========== strcpy() / strncpy() — 复制 ==========
    printf("\n===== strcpy() / strncpy() =====\n");

    char src[] = "Hello";
    char dst[20];
    char dst2[20];

    // strcpy：复制字符串（不安全，不检查边界）
    strcpy(dst, src);
    printf("strcpy: dst = \"%s\"\n", dst);

    // strncpy：安全复制，指定最大复制长度
    strncpy(dst2, src, sizeof(dst2) - 1);
    dst2[sizeof(dst2) - 1] = '\0';  // 确保以 '\0' 结尾
    printf("strncpy: dst2 = \"%s\"\n", dst2);

    // ========== strcat() / strncat() — 拼接 ==========
    printf("\n===== strcat() / strncat() =====\n");

    char greeting[30] = "Hello";
    char name[] = " World";

    // strcat：在末尾拼接（不安全）
    strcat(greeting, name);
    printf("strcat: \"%s\"\n", greeting);

    // strncat：安全拼接
    char str_cat[30] = "Good";
    strncat(str_cat, " Morning", 5);  // 只拼接前5个字符
    printf("strncat: \"%s\"\n", str_cat);

    // ========== strcmp() / strncmp() — 比较 ==========
    printf("\n===== strcmp() =====\n");

    char s1[] = "apple";
    char s2[] = "banana";
    char s3[] = "apple";

    // strcmp：按字典序比较
    // 返回值：s1 < s2 为负，相等为 0，s1 > s2 为正
    printf("strcmp(\"%s\", \"%s\") = %d\n", s1, s2, strcmp(s1, s2));
    printf("strcmp(\"%s\", \"%s\") = %d\n", s1, s3, strcmp(s1, s3));
    printf("strcmp(\"%s\", \"%s\") = %d\n", s2, s1, strcmp(s2, s1));

    // strncmp：只比较前 n 个字符
    printf("strncmp(\"%s\", \"%s\", 3) = %d\n",
           s1, s2, strncmp(s1, s2, 3));

    // 注意事项
    // if (s1 == s3)  // 错误！比较的是地址，不是内容
    // 应该使用 strcmp
    if (strcmp(s1, s3) == 0) {
        printf("\"%s\" 和 \"%s\" 相等\n", s1, s3);
    }

    // ========== strchr() — 查找字符 ==========
    printf("\n===== strchr() =====\n");

    char text[] = "Hello, World!";
    char *found = strchr(text, 'o');

    if (found != NULL) {
        // found 指向找到的字符位置
        int position = found - text;  // 计算索引
        printf("在 \"%s\" 中找到 '%c' 在索引 %d\n",
               text, 'o', position);
        printf("从该位置起: \"%s\"\n", found);

        // 查找下一个
        found = strchr(found + 1, 'o');
        if (found) {
            printf("下一个 'o' 在索引 %td\n", found - text);
        }
    }

    // 查找字符最后一次出现的位置
    char *last = strrchr(text, 'o');
    if (last) {
        printf("最后一个 'o' 在索引 %td\n", last - text);
    }

    // ========== strstr() — 查找子串 ==========
    printf("\n===== strstr() =====\n");

    char sentence[] = "The quick brown fox jumps over the lazy dog";
    char *sub = strstr(sentence, "fox");

    if (sub) {
        printf("在 \"%s\" 中找到 \"fox\":\n", sentence);
        printf("从 \"%s\" 开始\n", sub);
        printf("索引位置: %td\n", sub - sentence);
    } else {
        printf("未找到\n");
    }

    // ========== strtok() — 字符串分割 ==========
    printf("\n===== strtok() =====\n");

    char data[] = "2024-01-15,张三,85.5,及格";
    char *token;

    printf("原始数据: \"%s\"\n", data);

    // strtok 会修改原字符串（用 '\0' 替换分隔符）
    // 所以如果原字符串需要保留，先复制一份
    char copy[100];
    strcpy(copy, data);

    printf("分割结果:\n");
    token = strtok(copy, ",-");  // 第一次调用：传入字符串
    int field = 1;
    while (token != NULL) {
        printf("  字段 %d: \"%s\"\n", field, token);
        token = strtok(NULL, ",-");  // 后续调用：传 NULL
        field++;
    }

    // ========== sprintf() — 格式化输出到字符串 ==========
    printf("\n===== sprintf() =====\n");

    char buffer[100];
    int id = 1001;
    char product[] = "Keyboard";
    double price = 89.5;

    // 格式化数据写入字符串
    int written = sprintf(buffer,
                        "商品ID: %d, 名称: %s, 价格: %.2f",
                        id, product, price);
    printf("格式化的字符串: \"%s\"\n", buffer);
    printf("写入字符数: %d\n", written);

    // snprintf：安全的格式化（指定最大长度）
    char small_buffer[20];
    snprintf(small_buffer, sizeof(small_buffer),
             "Hello, %s!", "World World World");
    printf("截断后的字符串: \"%s\"\n", small_buffer);

    // ========== 字符串与数字转换 ==========
    printf("\n===== 字符串与数字转换 =====\n");

    // 字符串 → 数字
    const char *num_str = "  1234  ";
    int num = atoi(num_str);          // 简单转换
    double dnum = atof("3.14159");    // 转 double

    printf("atoi(\"%s\")   = %d\n", num_str, num);
    printf("atof(\"3.14159\") = %f\n", dnum);

    // 更安全的转换：strtol, strtod（可以检测错误）
    char *endptr;
    long safe_num = strtol("  456  ", &endptr, 10);
    if (*endptr == '\0') {
        printf("strtol: %ld\n", safe_num);
    }

    return 0;
}

/*
 * ============================================
 * 关键点总结：
 *
 * 1. strlen 返回字符串长度（不含 '\0'）
 * 2. strcpy/strcat 不检查边界，优先用 strncpy/strncat
 * 3. strcmp 比较内容，不能用 == 比较字符串
 * 4. strtok 会修改原字符串
 * 5. snprintf 比 sprintf 更安全
 * 6. atoi/atof 简单但无错误检查，推荐 strtol
 * ============================================
 */
