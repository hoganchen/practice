/*
 * ============================================
 * 知识点：字符处理 <ctype.h>
 * 说明：
 *   <ctype.h> 提供字符分类和转换函数。
 *   只处理 unsigned char 可表示的值和 EOF。
 *
 *   字符分类函数：
 *   isalpha()  — 是否为字母
 *   isdigit()  — 是否为数字
 *   isalnum()  — 是否为字母或数字
 *   isspace()  — 是否为空白字符
 *   isupper()  — 是否为大写字母
 *   islower()  — 是否为小写字母
 *   ispunct()  — 是否为标点符号
 *   isxdigit() — 是否为十六进制数字
 *   iscntrl()  — 是否为控制字符
 *   isprint()  — 是否为可打印字符
 *   isgraph()  — 是否为图形字符（可打印且非空格）
 *   isblank()  — 是否为空白（空格或制表符）C99
 *
 *   字符转换函数：
 *   toupper()  — 转大写
 *   tolower()  — 转小写
 *
 * 编译方法：
 *   gcc 01_ctype_library.c -o 01_ctype_library
 * ============================================
 */

#include <stdio.h>
#include "../utf8fix.h"
#include <ctype.h>   // 字符处理函数
#include <string.h>

// ========== 1. 字符分类函数速览 ==========
void classify_all(void) {
    printf("--- 字符分类函数速览 ---\n");

    // 测试 32~126 之间的可打印 ASCII 字符
    printf("字符 | ");
    // 列标题
    const char *funcs[] = {
        "isalpha", "isdigit", "isalnum", "isspace",
        "isupper", "islower", "ispunct", "isxdigit",
        "isprint", "isgraph"
    };
    int n_funcs = sizeof(funcs) / sizeof(funcs[0]);

    for (int i = 0; i < n_funcs; i++) {
        printf("%8s", funcs[i]);
    }
    printf("\n");
    printf("------+-");
    for (int i = 0; i < n_funcs; i++) printf("--------");
    printf("\n");

    // 显示部分字符的分类结果
    char test_chars[] = "A a 5 $ \t\n!";
    for (int i = 0; test_chars[i] != '\0'; i++) {
        char c = test_chars[i];
        // 跳过不可打印的字符（单独处理）
        if (c == '\t' || c == '\n') {
            printf("'%02x' |", (unsigned char)c);
        } else if (isprint((unsigned char)c)) {
            printf(" '%c' |", c);
        } else {
            continue;
        }

        printf("  %3s   %3s   %3s   %3s",
               isalpha((unsigned char)c) ? "✓" : "✗",
               isdigit((unsigned char)c) ? "✓" : "✗",
               isalnum((unsigned char)c) ? "✓" : "✗",
               isspace((unsigned char)c) ? "✓" : "✗");

        printf("   %3s   %3s   %3s   %3s",
               isupper((unsigned char)c) ? "✓" : "✗",
               islower((unsigned char)c) ? "✓" : "✗",
               ispunct((unsigned char)c) ? "✓" : "✗",
               isxdigit((unsigned char)c) ? "✓" : "✗");

        printf("   %3s   %3s\n",
               isprint((unsigned char)c) ? "✓" : "✗",
               isgraph((unsigned char)c) ? "✓" : "✗");
    }
}

// ========== 2. 字符串转换 ==========
void string_convert(const char *str) {
    printf("\n--- 大小写转换 ---\n");
    printf("原始: %s\n", str);

    printf("大写: ");
    for (size_t i = 0; i < strlen(str); i++) {
        putchar(toupper((unsigned char)str[i]));
    }
    printf("\n");

    printf("小写: ");
    for (size_t i = 0; i < strlen(str); i++) {
        putchar(tolower((unsigned char)str[i]));
    }
    printf("\n");

    // 首字母大写
    printf("首字母大写: ");
    if (str[0] != '\0') {
        putchar(toupper((unsigned char)str[0]));
        for (size_t i = 1; i < strlen(str); i++) {
            putchar(tolower((unsigned char)str[i]));
        }
    }
    printf("\n");

    // 驼峰式（每个单词首字母大写）
    printf("标题式: ");
    int new_word = 1;
    for (size_t i = 0; i < strlen(str); i++) {
        unsigned char c = str[i];
        if (isspace(c) || ispunct(c)) {
            new_word = 1;
            putchar(c);
        } else if (new_word) {
            putchar(toupper(c));
            new_word = 0;
        } else {
            putchar(tolower(c));
        }
    }
    printf("\n");
}

// ========== 3. 字符串统计 ==========
void analyze_string(const char *str) {
    printf("\n--- 字符串统计分析 ---\n");
    printf("文本: %s\n\n", str);

    int alpha = 0, digit = 0, space = 0;
    int upper = 0, lower = 0, punct = 0;
    int control = 0, hex = 0, word = 0;

    for (size_t i = 0; str[i] != '\0'; i++) {
        unsigned char c = (unsigned char)str[i];

        // 分类统计
        if (isalpha(c))   alpha++;
        if (isdigit(c))   digit++;
        if (isspace(c))   space++;
        if (isupper(c))   upper++;
        if (islower(c))   lower++;
        if (ispunct(c))   punct++;
        if (iscntrl(c))   control++;
        if (isxdigit(c))  hex++;

        // 单词计数（简单版本）
        if (isalnum(c) && (i == 0 || !isalnum((unsigned char)str[i-1]))) {
            word++;
        }
    }

    printf("统计结果:\n");
    printf("  总字符数: %zu\n", strlen(str));
    printf("  字母数:   %5d\n", alpha);
    printf("  数字数:   %5d\n", digit);
    printf("  空白数:   %5d\n", space);
    printf("  大写数:   %5d\n", upper);
    printf("  小写数:   %5d\n", lower);
    printf("  标点数:   %5d\n", punct);
    printf("  16进制:   %5d\n", hex);
    printf("  单词数:   %5d\n", word);
}

// ========== 4. 过滤函数 ==========
/*
 * 使用 is* 函数从字符串中过滤特定字符
 */
void filter_digits(const char *str, char *out) {
    // 提取所有数字字符
    int j = 0;
    for (int i = 0; str[i] != '\0'; i++) {
        if (isdigit((unsigned char)str[i])) {
            out[j++] = str[i];
        }
    }
    out[j] = '\0';
}

void filter_alpha(const char *str, char *out) {
    // 提取所有字母
    int j = 0;
    for (int i = 0; str[i] != '\0'; i++) {
        if (isalpha((unsigned char)str[i])) {
            out[j++] = str[i];
        }
    }
    out[j] = '\0';
}

void filter_demo(void) {
    printf("\n--- 字符过滤 ---\n");
    const char *test = "ABC123def!@#456GHI";

    char digits[100], letters[100];
    filter_digits(test, digits);
    filter_alpha(test, letters);

    printf("原始:  %s\n", test);
    printf("数字:  %s\n", digits);
    printf("字母:  %s\n", letters);
}

// ========== 5. 验证函数 ==========
int is_valid_identifier(const char *name) {
    if (name == NULL || name[0] == '\0') return 0;

    unsigned char first = (unsigned char)name[0];
    // C 标识符必须以字母或下划线开头
    if (!isalpha(first) && first != '_') return 0;

    // 后续字符可以是字母、数字、下划线
    for (int i = 1; name[i] != '\0'; i++) {
        unsigned char c = (unsigned char)name[i];
        if (!isalnum(c) && c != '_') return 0;
    }
    return 1;
}

void validation_demo(void) {
    printf("\n--- 标识符验证 ---\n");
    const char *tests[] = {"valid_name", "123abc", "_private", "no-space"};
    int n = sizeof(tests) / sizeof(tests[0]);

    for (int i = 0; i < n; i++) {
        printf("  \"%s\" → %s\n",
               tests[i],
               is_valid_identifier(tests[i]) ? "✓ 有效" : "✗ 无效");
    }
}

// ========== main ==========
int main() {
    printf("===== 字符处理 <ctype.h> =====\n\n");

    classify_all();
    string_convert("Hello, C Language! 2024");
    analyze_string("Hello, World! 123 $#@");
    filter_demo();
    validation_demo();

    // 注意事项
    printf("\n===== 注意事项 =====\n");
    printf("1. 参数类型：int（EOF 或 unsigned char 范围）\n");
    printf("2. char 参数需先转 unsigned char：\n");
    printf("   isalpha((unsigned char)c)\n");
    printf("   否则负值 char 可能导致未定义行为\n");
    printf("3. 区域设置 <locale.h> 可影响分类规则\n");
    printf("4. 这些函数通常用查表法实现，效率很高\n");

    return 0;
}

/*
 * ============================================
 * 关键点总结：
 *
 * 1. is* 函数用于字符分类（字母/数字/空白等）
 * 2. toupper/tolower 用于大小写转换
 * 3. 参数必须转为 unsigned char，否则有符号 char
 *    的负值会导致未定义行为
 * 4. 可用于字符串解析、验证、格式化
 * 5. 字符分类受 locale 影响（如 isalpha('é') 可识别）
 * ============================================
 */
