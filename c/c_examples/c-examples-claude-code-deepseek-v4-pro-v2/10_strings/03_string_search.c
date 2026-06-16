/*
 * 知识点：字符串查找与分割 (String Search and Tokenization)
 *
 * 本程序演示 C 语言中字符串查找和分割的常用函数，包括：
 *   1. strstr()  —— 查找子串
 *   2. strchr()  —— 查找字符（从前往后）
 *   3. strrchr() —— 查找字符（从后往前）
 *   4. strtok()  —— 字符串分割（标记化），注意它会修改原字符串！
 *
 * 编译与运行：
 *   gcc 03_string_search.c -o 03_string_search.exe -std=c11 -Wall
 *   ./03_string_search.exe
 */

#include "../common/charset.h"
#include <stdio.h>
#include <string.h>

int main(void)
{
    /* ========== 1. strstr() —— 查找子串 ========== */

    /*
     * char *strstr(const char *haystack, const char *needle);
     *   - 在 haystack 中查找第一次出现 needle 的位置
     *   - 找到则返回指向该位置的指针
     *   - 没找到则返回 NULL
     *   - 大小写敏感
     */

    printf("=== strstr() —— 查找子串 ===\n");

    const char *text = "The quick brown fox jumps over the lazy dog";
    const char *word = "fox";

    char *found = strstr(text, word);
    if (found != NULL) {
        printf("  在 \"%s\" 中找到了 \"%s\"\n", text, word);
        printf("  找到的位置：\"%s\"\n", found);  // 从找到的位置开始打印
        printf("  偏移量：%td 个字符\n\n", found - text);  // 计算偏移
    } else {
        printf("  未找到 \"%s\"\n\n", word);
    }

    // 查找不存在的子串
    char *not_found = strstr(text, "cat");
    if (not_found == NULL) {
        printf("  \"cat\" 未找到\n\n");
    }

    // 多次查找：找到第一个后继续找下一个
    printf("  多次查找示例：\n");
    const char *sentence = "she sells sea shells by the sea shore";
    const char *target = "sea";
    const char *p = sentence;
    int count = 0;

    while ((p = strstr(p, target)) != NULL) {
        count++;
        printf("    第 %d 次出现：位置偏移 %td\n", count, p - sentence);
        p += strlen(target);  // 移动到找到的字符串之后继续查找
    }
    printf("  共找到 %d 次\n\n", count);


    /* ========== 2. strchr() —— 查找字符（从前往后） ========== */

    /*
     * char *strchr(const char *s, int c);
     *   - 在字符串 s 中从前往后查找第一个字符 c
     *   - c 会被当作 char 处理（尽管类型是 int）
     *   - 找到返回指针，没找到返回 NULL
     */

    printf("=== strchr() —— 从前往后查找字符 ===\n");

    const char *email = "user@example.com";
    char *at_pos = strchr(email, '@');

    if (at_pos != NULL) {
        printf("  邮箱：%s\n", email);
        printf("  '@' 的位置偏移：%td\n", at_pos - email);

        // 提取用户名：复制到 '@' 之前的字符
        size_t username_len = at_pos - email;
        char username[50];
        strncpy(username, email, username_len);
        username[username_len] = '\0';  // 确保终止
        printf("  用户名：%s\n", username);

        // 提取域名：'@' 之后的部分
        printf("  域名：%s\n\n", at_pos + 1);
    }

    // 查找文件扩展名
    const char *filename = "document.txt";
    char *dot = strchr(filename, '.');

    if (dot != NULL) {
        printf("  文件名：%s\n", filename);
        printf("  扩展名：%s\n\n", dot + 1);
    }


    /* ========== 3. strrchr() —— 查找字符（从后往前） ========== */

    /*
     * char *strrchr(const char *s, int c);
     *   - 在字符串 s 中从后往前查找最后一个字符 c
     *   - 找到返回指针，没找到返回 NULL
     *   - 常用于提取文件路径中的文件名（查找最后一个 '/'）
     */

    printf("=== strrchr() —— 从后往前查找字符 ===\n");

    const char *filepath = "/home/user/documents/report.txt";

    // 查找最后一个 '/'（文件分隔符）
    char *last_slash = strrchr(filepath, '/');
    if (last_slash != NULL) {
        printf("  完整路径：%s\n", filepath);
        printf("  文件名：%s\n\n", last_slash + 1);  // 最后一个 '/' 之后的部分
    }

    // 查找最后一个 '.'（文件扩展名）
    char *last_dot = strrchr(filepath, '.');
    if (last_dot != NULL) {
        printf("  文件扩展名：%s\n\n", last_dot + 1);
    }


    /* ========== 4. strtok() —— 字符串分割 ========== */

    /*
     * char *strtok(char *str, const char *delim);
     *
     * 重要特性：
     *   - 第一次调用时传入要分割的字符串
     *   - 后续调用传入 NULL 继续分割
     *   - 会修改原字符串！将分隔符替换为 '\0'
     *   - 不是线程安全的（内部使用静态缓冲区）
     *   - 多线程中使用 strtok_r（POSIX）
     *
     * strtok 的工作原理：
     *   1. 从 str 开始，跳过前导分隔符
     *   2. 找到下一个分隔符，将其替换为 '\0'
     *   3. 返回指向 token 起始位置的指针
     *   4. 保存位置到内部静态变量
     *   5. 下次调用 NULL 时从保存位置继续
     */

    printf("=== strtok() —— 字符串分割 ===\n");

    // 注意：strtok 会修改原字符串，所以不能用字符串字面量！
    // 必须用可修改的 char 数组
    char csv[] = "apple,banana,orange,grape,watermelon";
    const char *delim = ",";  // 分隔符

    printf("  原始字符串：%s\n", csv);
    printf("  分割结果：\n");

    // 第一次调用：传入要分割的字符串
    char *token = strtok(csv, delim);
    int token_count = 0;

    while (token != NULL) {
        token_count++;
        printf("    Token %d: \"%s\"\n", token_count, token);
        // 后续调用：传入 NULL
        token = strtok(NULL, delim);
    }

    // 注意：原字符串已被修改！
    // printf("  分割后原字符串：%s\n", csv);  // 只有 "apple" 了！
    printf("\n");

    // 多个分隔符的示例
    printf("  多分隔符示例：\n");
    char sentence2[] = "Hello,   World!  How are you?";
    printf("    原始：\"%s\"\n", sentence2);

    token = strtok(sentence2, " ,!?");  // 空格、逗号、感叹号、问号都是分隔符
    token_count = 0;
    while (token != NULL) {
        token_count++;
        printf("    Token %d: \"%s\"\n", token_count, token);
        token = strtok(NULL, " ,!?");
    }
    printf("\n");


    /* ========== 5. 综合示例：解析简单的键值对 ========== */

    printf("=== 综合示例：解析键值对 ===\n");

    // 模拟一个简单的配置文件行（格式：key = value）
    char config[] = "name = Claude    \nversion = 2.7\nlanguage = C";

    printf("  原始配置：\n%s\n\n", config);

    // 先用 '\n' 分割行
    token = strtok(config, "\n");
    while (token != NULL) {
        // 每行再用 '=' 分割键值对
        char *key = strtok(token, "=");
        char *val = strtok(NULL, "=");

        if (key != NULL && val != NULL) {
            // 去除首尾空格（简化处理，这里用 strtok 的空格分割）
            // 实际应用需要更完善的处理
            printf("    键：\"%s\"  ->  值：\"%s\"\n", key, val);
        }
        token = strtok(NULL, "\n");
    }

    printf("\n");


    /* ========== 6. 不使用 strtok 的自定义分割 ========== */

    /*
     * 如果你不想修改原字符串，或者需要线程安全，
     * 可以自己实现简单的字符串分割
     */
    printf("=== 自定义分割（不修改原字符串）===\n");

    const char *immutable = "one-two-three-four";
    const char *separator = "-";
    const char *pos = immutable;
    const char *next;

    while ((next = strstr(pos, separator)) != NULL) {
        // 打印从 pos 到分隔符之间的部分
        size_t seg_len = next - pos;
        printf("    片段：\"%.*s\"\n", (int)seg_len, pos);
        pos = next + strlen(separator);  // 跳到分隔符之后
    }
    // 打印最后一段
    printf("    片段：\"%s\"\n\n", pos);

    return 0;
}
