/*
 * 知识点：字符串与数字之间的转换 (String to Number Conversion and Formatting)
 *
 * 本程序演示 C 语言中字符串与数值之间的转换方法，包括：
 *   1. atoi / atol / atof —— 简单转换（无错误检查）
 *   2. strtol / strtoul / strtod —— 带错误检查的转换
 *   3. sprintf / snprintf —— 格式化输出到字符串
 *   4. sscanf —— 从字符串读取格式化数据
 *
 * 安全提示：
 *   atoi/atof 在遇到非法输入时返回 0 或 undefined，无法区分错误。
 *   strtol/strtod 能检测转换错误，更推荐使用。
 *   sprintf 不检查缓冲区大小，推荐使用 snprintf。
 *
 * 编译与运行：
 *   gcc 04_string_conversion.c -o 04_string_conversion.exe -std=c11 -Wall
 *   ./04_string_conversion.exe
 */

#include "../common/charset.h"
#include <stdio.h>
#include <stdlib.h>   // atoi, atol, atof, strtol, strtoul, strtod
#include <string.h>   // strcmp
#include <errno.h>    // errno（用于 strtol 的错误检测）
#include <limits.h>   // LONG_MIN, LONG_MAX

int main(void)
{
    /* ========== 1. atoi / atol / atof —— 简单转换 ========== */

    /*
     * int atoi(const char *str);
     * long atol(const char *str);
     * double atof(const char *str);
     *
     * 特点：
     *   - 使用简单
     *   - 跳过前导空白字符
     *   - 遇到非数字字符停止
     *   - 无法检测转换错误！非法输入返回 0
     */

    printf("=== atoi / atol / atof —— 简单转换 ===\n");

    printf("  atoi(\"42\")         = %d\n", atoi("42"));
    printf("  atoi(\"   -123\")    = %d\n", atoi("   -123"));
    printf("  atoi(\"0\")          = %d\n", atoi("0"));
    printf("  atoi(\"123abc\")     = %d（忽略后面的 abc）\n", atoi("123abc"));
    printf("  atoi(\"abc\")        = %d（非法输入，无法区分错误！）\n", atoi("abc"));
    printf("  atoi(\"\")           = %d（空字符串也返回 0）\n\n", atoi(""));

    printf("  atol(\"2147483647\") = %ld\n", atol("2147483647"));
    printf("  atof(\"3.14159\")    = %f\n\n", atof("3.14159"));


    /* ========== 2. strtol —— 带错误检查的转换 ========== */

    /*
     * long strtol(const char *str, char **endptr, int base);
     *
     * 参数：
     *   str    —— 要转换的字符串
     *   endptr —— 指向第一个未转换字符的指针（传 NULL 表示忽略）
     *   base   —— 进制（2~36，或 0 表示自动检测：0x=16进制，0=8进制，否则10进制）
     *
     * 返回值：
     *   成功：转换后的数值
     *   溢出：LONG_MAX 或 LONG_MIN，并设置 errno = ERANGE
     *   非法：0，且 endptr == str（没有字符被转换）
     *
     * strtoul —— 处理 unsigned long
     * strtod —— 处理 double
     */

    printf("=== strtol —— 带错误检查的转换 ===\n");

    const char *input;
    char *endptr;     // 接收未转换部分的地址
    long result;
    int base = 10;

    // 示例 1：正常转换
    input = "12345";
    errno = 0;                       // 先清零 errno
    result = strtol(input, &endptr, base);

    if (errno == ERANGE) {
        printf("  溢出！\n");
    } else if (endptr == input) {
        printf("  未找到有效数字！\n");
    } else if (*endptr != '\0') {
        // 有部分字符未转换（但至少转换了一部分）
        printf("  部分转换：strtol(\"%s\") = %ld，未转换部分：\"%s\"\n",
               input, result, endptr);
    } else {
        printf("  完全转换：strtol(\"%s\") = %ld\n", input, result);
    }

    // 示例 2：带后缀的字符串
    input = "256px";
    result = strtol(input, &endptr, 10);
    printf("  strtol(\"%s\") = %ld，剩余部分：\"%s\"\n", input, result, endptr);

    // 示例 3：十六进制
    input = "0xFF";
    result = strtol(input, &endptr, 0);   // base=0 自动检测
    printf("  strtol(\"%s\", base=0) = %ld（自动检测为 16 进制）\n", input, result);

    // 示例 4：非法输入
    input = "hello";
    result = strtol(input, &endptr, 10);
    if (endptr == input) {
        printf("  strtol(\"%s\") 失败：没有有效数字\n", input);
    }

    // 示例 5：溢出
    input = "999999999999999999999";
    errno = 0;
    result = strtol(input, &endptr, 10);
    if (errno == ERANGE) {
        printf("  strtol(\"%s\") 溢出！返回 %ld\n", input, result);
    }

    printf("\n");


    /* ========== 3. strtod —— 浮点数转换（带错误检查） ========== */

    /*
     * double strtod(const char *str, char **endptr);
     *   - 用法与 strtol 类似
     *   - 支持小数点和科学记数法（e/E）
     */

    printf("=== strtod —— 浮点数转换 ===\n");

    const char *d_str;
    double d_result;

    d_str = "3.14159";
    d_result = strtod(d_str, &endptr);
    printf("  strtod(\"%s\") = %f\n", d_str, d_result);

    d_str = "2.5e-3";  // 科学记数法
    d_result = strtod(d_str, &endptr);
    printf("  strtod(\"%s\") = %f\n", d_str, d_result);

    d_str = "invalid";
    d_result = strtod(d_str, &endptr);
    if (endptr == d_str) {
        printf("  strtod(\"%s\") 失败：不是有效数字\n", d_str);
    }

    printf("\n");


    /* ========== 4. sprintf / snprintf —— 格式化到字符串 ========== */

    /*
     * int sprintf(char *buf, const char *format, ...);
     *   - 将格式化数据写入字符串缓冲区
     *   - 不检查缓冲区大小！可能导致缓冲区溢出
     *   - 返回写入的字符数（不含 '\0'）
     *
     * int snprintf(char *buf, size_t size, const char *format, ...);
     *   - 最多写入 size-1 个字符，预留 '\0' 位置
     *   - 返回本该写入的字符数（不含 '\0'），如果 >= size 则截断
     *   - 推荐使用！
     */

    printf("=== sprintf / snprintf —— 格式化输出到字符串 ===\n");

    char buffer[64];

    // sprintf：不安全
    sprintf(buffer, "整数：%d，浮点数：%.2f，字符串：%s",
            42, 3.14, "Hello");
    printf("  sprintf 结果：\"%s\"\n", buffer);

    // snprintf：安全
    char safe_buf[30];
    int written = snprintf(safe_buf, sizeof(safe_buf),
                           "数值：%d 和 %.2f", 12345, 67.89);

    printf("  snprintf 结果：\"%s\"\n", safe_buf);
    printf("  snprintf 返回（应写入字符数）：%d\n", written);

    // 截断演示：故意用很小的缓冲区
    char tiny_buf[10];
#pragma GCC diagnostic push
#pragma GCC diagnostic ignored "-Wformat-truncation"
    written = snprintf(tiny_buf, sizeof(tiny_buf),
                       "数值：%d 和 %.2f", 12345, 67.89);
#pragma GCC diagnostic pop
    printf("  snprintf（截断）结果：\"%s\"\n", tiny_buf);
    printf("  snprintf 返回（应写入字符数）：%d —— 如果 >= 缓冲区大小说明被截断\n\n", written);

    printf("\n");


    /* ========== 5. sscanf —— 从字符串解析格式化数据 ========== */

    /*
     * int sscanf(const char *str, const char *format, ...);
     *   - 从字符串中按照格式读取数据
     *   - 返回成功匹配并赋值的参数个数
     *   - 可用于更复杂的解析场景
     */

    printf("=== sscanf —— 从字符串解析格式化数据 ===\n");

    // 简单解析
    const char *data1 = "42 3.14 hello";
    int i_val;
    double d_val;
    char s_val[20];

    int matched = sscanf(data1, "%d %lf %s", &i_val, &d_val, s_val);
    printf("  解析 \"%s\"：\n", data1);
    printf("    匹配了 %d 项\n", matched);
    printf("    int: %d, double: %.2f, string: %s\n\n", i_val, d_val, s_val);

    // 解析日期格式
    const char *date_str = "2024-01-15";
    int year, month, day;
    matched = sscanf(date_str, "%d-%d-%d", &year, &month, &day);
    if (matched == 3) {
        printf("  日期 \"%s\" 解析为：%d 年 %d 月 %d 日\n\n", date_str, year, month, day);
    }

    // 解析带单位的数据
    const char *measurement = "temp=25.5C, humidity=60%";
    double temp;
    int humidity;
    matched = sscanf(measurement, "temp=%lfC, humidity=%d%%", &temp, &humidity);
    if (matched == 2) {
        printf("  解析 \"%s\"：\n", measurement);
        printf("    温度：%.1f C，湿度：%d %%\n\n", temp, humidity);
    }

    // 解析失败示例
    const char *bad_data = "abc def";
    int parsed_count;
    int n1, n2;
    parsed_count = sscanf(bad_data, "%d %d", &n1, &n2);
    printf("  解析 \"%s\" 匹配了 %d 项（非数字开头匹配失败）\n\n",
           bad_data, parsed_count);


    /* ========== 6. 综合示例：健壮的用户输入转换 ========== */

    printf("=== 综合示例：健壮的用户输入转换 ===\n");

    const char *user_inputs[] = {
        "123",
        "  456  ",
        "78.9",
        "abc",
        "9999999999999999999",
        "0xABC"
    };

    for (int i = 0; i < 6; i++) {
        const char *input_str = user_inputs[i];
        errno = 0;
        endptr = NULL;

        long val = strtol(input_str, &endptr, 0);

        printf("  输入：\"%s\"\n", input_str);

        if (errno == ERANGE) {
            printf("    错误：数值溢出！\n");
        } else if (endptr == input_str) {
            printf("    错误：不是有效数字\n");
        } else if (*endptr != '\0' && *endptr != ' ') {
            printf("    警告：部分转换，未转换部分为 \"%s\"\n", endptr);
            printf("    转换值：%ld\n", val);
        } else {
            printf("    成功：%ld\n", val);
        }
    }

    printf("\n=== 总结 ===\n");
    printf("  简单转换：atoi / atol / atof（无错误检测）\n");
    printf("  安全转换：strtol / strtoul / strtod（推荐）\n");
    printf("  格式化到字符串：snprintf（安全）vs sprintf（不安全）\n");
    printf("  从字符串解析：sscanf\n");

    return 0;
}
