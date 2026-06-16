/*
 * 知识点：常用字符串函数 (<string.h>)
 *
 * 本程序演示 C 语言标准库中常用的字符串操作函数，包括：
 *   1. strcpy / strncpy  —— 字符串拷贝（含安全限制版）
 *   2. strcat / strncat  —— 字符串拼接（含安全限制版）
 *   3. strcmp / strncmp  —— 字符串比较
 *   4. 缓冲区溢出风险与安全编码
 *
 * 所有函数声明在 <string.h> 中，使用时务必注意：
 *   - 目标缓冲区必须足够大！
 *   - strcpy/strcat 不检查缓冲区大小，是缓冲区溢出的常见来源
 *   - strncpy/strncat 提供大小限制，更安全
 *
 * 编译与运行：
 *   gcc 02_string_functions.c -o 02_string_functions.exe -std=c11 -Wall
 *   ./02_string_functions.exe
 */

#include "../common/charset.h"
#include <stdio.h>
#include <string.h>

int main(void)
{
    /* ========== 1. strcpy —— 字符串拷贝 ========== */

    /*
     * char *strcpy(char *dest, const char *src);
     *   - 将 src 字符串（包括 '\0'）复制到 dest
     *   - dest 必须有足够空间，否则缓冲区溢出！
     *   - 返回 dest（方便链式调用）
     */

    printf("=== strcpy —— 字符串拷贝 ===\n");

    char src1[] = "Hello, World!";
    char dest1[20];  // 确保空间足够

    strcpy(dest1, src1);  // 将 src1 拷贝到 dest1
    printf("  src1  = \"%s\"\n", src1);
    printf("  dest1 = \"%s\"\n\n", dest1);

    // 缓冲区溢出示例（危险！请勿实际运行！）：
    // char small[5];
    // strcpy(small, "This is too long!");  // 溢出！未定义行为！


    /* ========== 2. strncpy —— 限制长度的拷贝 ========== */

    /*
     * char *strncpy(char *dest, const char *src, size_t n);
     *   - 最多复制 n 个字符到 dest
     *   - 如果 src 长度 >= n，则 dest 不会以 '\0' 结尾！
     *   - 如果 src 长度 < n，剩余位置填充 '\0'
     *   - 安全做法：n = sizeof(dest) - 1，并手动置 '\0'
     */

    printf("=== strncpy —— 安全限制拷贝 ===\n");

    char dest2[10];
    const char *src2 = "This is a very long string";

    // 最多复制 sizeof(dest2) - 1 = 9 个字符
    strncpy(dest2, src2, sizeof(dest2) - 1);
    dest2[sizeof(dest2) - 1] = '\0';  // 手动确保以 '\0' 结尾！

    printf("  src2  = \"%s\"\n", src2);
    printf("  dest2 = \"%s\"（已截断）\n\n", dest2);


    /* ========== 3. strcat —— 字符串拼接 ========== */

    /*
     * char *strcat(char *dest, const char *src);
     *   - 将 src 追加到 dest 末尾（覆盖 dest 原来的 '\0'）
     *   - dest 必须有足够的空间，否则缓冲区溢出！
     *   - 返回 dest
     */

    printf("=== strcat —— 字符串拼接 ===\n");

    char dest3[30] = "Hello";  // 注意空间要足够
    const char *src3 = ", World!";

    strcat(dest3, src3);
    printf("  拼接结果：\"%s\"\n\n", dest3);


    /* ========== 4. strncat —— 限制长度的拼接 ========== */

    /*
     * char *strncat(char *dest, const char *src, size_t n);
     *   - 最多追加 n 个字符到 dest 末尾
     *   - 自动添加 '\0' 结尾（与 strncpy 不同！）
     *   - 更安全：dest 预留 len(dest) + n + 1 空间
     */

    printf("=== strncat —— 安全限制拼接 ===\n");

    char dest4[12] = "Hi";
    const char *src4 = ", this is a long tail!";

    // 最多追加 5 个字符（留 1 个给 '\0'）
    strncat(dest4, src4, 5);
    printf("  安全拼接结果：\"%s\"\n\n", dest4);


    /* ========== 5. strcmp —— 字符串比较 ========== */

    /*
     * int strcmp(const char *s1, const char *s2);
     *   - 逐字符比较，按字典序（ASCII 值）
     *   - 返回：
     *       < 0  —— s1 < s2
     *       == 0 —— s1 == s2
     *       > 0  —— s1 > s2
     *   - 比较到 '\0' 为止
     */

    printf("=== strcmp —— 字符串比较 ===\n");

    const char *s1 = "apple";
    const char *s2 = "banana";
    const char *s3 = "apple";

    printf("  strcmp(\"%s\", \"%s\") = %d\n", s1, s2, strcmp(s1, s2));  // < 0
    printf("  strcmp(\"%s\", \"%s\") = %d\n", s2, s1, strcmp(s2, s1));  // > 0
    printf("  strcmp(\"%s\", \"%s\") = %d\n", s1, s3, strcmp(s1, s3));  // 0

    // 注意大小写敏感！大写字母的 ASCII 值小于小写字母
    printf("  strcmp(\"Apple\", \"apple\") = %d（大小写敏感！）\n\n",
           strcmp("Apple", "apple"));


    /* ========== 6. strncmp —— 限制长度的比较 ========== */

    /*
     * int strncmp(const char *s1, const char *s2, size_t n);
     *   - 只比较前 n 个字符
     *   - 返回值含义同 strcmp
     */

    printf("=== strncmp —— 限制长度比较 ===\n");

    const char *prefix_check = "Hello, World!";
    const char *prefix = "Hello";

    if (strncmp(prefix_check, prefix, strlen(prefix)) == 0) {
        printf("  \"%s\" 以 \"%s\" 开头\n", prefix_check, prefix);
    }

    printf("\n");


    /* ========== 7. 综合示例：安全字符串处理 ========== */

    printf("=== 综合示例：安全字符串处理 ===\n");

    char buffer[16] = {0};  // 初始化为全 0

    // 安全地拷贝
    strncpy(buffer, "Hello", sizeof(buffer) - 1);
    buffer[sizeof(buffer) - 1] = '\0';
    printf("  第一步：\"%s\"\n", buffer);

    // 安全地拼接
    size_t current_len = strlen(buffer);
    size_t remaining   = sizeof(buffer) - current_len - 1;
    size_t to_copy     = (strlen(", World!") < remaining) ? strlen(", World!") : remaining;
    strncat(buffer, ", World!", to_copy);
    printf("  第二步：\"%s\"\n", buffer);

    // 验证结果
    if (strcmp(buffer, "Hello, World!") == 0) {
        printf("  字符串已正确拼接！\n");
    } else {
        printf("  字符串被截断了（缓冲区太小）\n");
    }

    printf("\n");


    /* ========== 8. 安全提示 ========== */

    /*
     * strcpy/strcat 的危险性：
     *   它们不会检查目标缓冲区的大小，如果源字符串太长，
     *   就会溢出到相邻内存区域，导致：
     *   - 程序崩溃
     *   - 数据损坏
     *   - 安全漏洞（缓冲区溢出攻击）
     *
     * 安全建议：
     *   优先使用 strncpy/strncat，并确保正确设置终止符
     *   或者使用更安全的替代方案（如 snprintf）
     */
    printf("=== 安全建议 ===\n");
    printf("  1. 优先使用 strncpy 而非 strcpy\n");
    printf("  2. 使用 strncpy 后手动置 '\\0'\n");
    printf("  3. 优先使用 strncat 而非 strcat\n");
    printf("  4. 使用 snprintf 格式化字符串更安全\n");
    printf("  5. 始终确保目标缓冲区足够大\n");

    return 0;
}
