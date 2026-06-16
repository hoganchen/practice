/*
 * ============================================
 * 知识点：文件读写 — 文本文件
 * 说明：
 *   C语言通过 FILE* 指针进行文件操作。
 *
 *   常用函数：
 *   fopen()   — 打开文件（r, w, a, r+, w+, a+）
 *   fclose()  — 关闭文件
 *   fprintf() — 格式化写入文件
 *   fscanf()  — 格式化读取文件
 *   fgets()   — 读取一行
 *   fputs()   — 写入字符串
 *   fgetc()   — 读取一个字符
 *   fputc()   — 写入一个字符
 *   feof()    — 检查文件是否结束
 *
 * 编译方法：
 *   gcc 01_file_read_write.c -o 01_file_read_write
 * ============================================
 */

#include <stdio.h>
#include "../utf8fix.h"
#include <stdlib.h>
#include <string.h>

#define FILENAME "test.txt"

int main() {
    // ========== 写入文件 ==========
    printf("===== 写入文件 =====\n");

    /*
     * fopen 模式：
     * "w" — 写入（覆盖已有内容，不存在则创建）
     * "r" — 读取（文件必须存在）
     * "a" — 追加（写入到末尾）
     * "r+" — 读写（文件必须存在）
     * "w+" — 读写（覆盖创建）
     * "a+" — 读写追加
     */
    FILE *fp = fopen(FILENAME, "w");
    if (fp == NULL) {
        printf("无法创建文件 %s\n", FILENAME);
        return 1;
    }

    // 写入字符串
    fputs("Hello, File I/O!\n", fp);
    fputs("这是第二行\n", fp);

    // 格式化写入
    fprintf(fp, "整数: %d, 浮点: %.2f, 字符串: %s\n",
            42, 3.14, "C语言");

    // 写入单个字符
    fputc('A', fp);
    fputc('\n', fp);

    printf("已写入文件 %s\n", FILENAME);

    // 关闭文件
    fclose(fp);
    printf("文件已关闭\n\n");

    // ========== 读取文件 ==========
    printf("===== 读取文件 =====\n");

    fp = fopen(FILENAME, "r");
    if (fp == NULL) {
        printf("无法打开文件 %s\n", FILENAME);
        return 1;
    }

    // 方式1：逐行读取
    printf("逐行读取 (fgets):\n");
    char buffer[256];
    int line_num = 1;

    // fgets 读取一行（包括换行符），遇到 EOF 返回 NULL
    while (fgets(buffer, sizeof(buffer), fp) != NULL) {
        // 去掉末尾的换行符（可选）
        size_t len = strlen(buffer);
        if (len > 0 && buffer[len-1] == '\n') {
            buffer[len-1] = '\0';  // 去掉换行
        }
        printf("  第%d行: %s\n", line_num++, buffer);
    }

    // 文件指针已经到末尾，需要重置才能再次读取
    // rewind(fp);  // 重置文件指针到开头

    fclose(fp);

    // ========== 追加写入 ==========
    printf("\n===== 追加写入 =====\n");

    fp = fopen(FILENAME, "a");  // 追加模式
    if (fp == NULL) {
        printf("无法打开文件\n");
        return 1;
    }

    fprintf(fp, "这是追加的内容\n");
    fprintf(fp, "追加时间: 2024年\n");

    fclose(fp);

    // 验证追加结果
    printf("追加完成，读取验证:\n");
    fp = fopen(FILENAME, "r");
    char c;
    while ((c = fgetc(fp)) != EOF) {  // fgetc 读取单个字符
        putchar(c);
    }
    fclose(fp);

    // ========== 检查文件是否存在 ==========
    printf("\n===== 文件存在性检查 =====\n");

    fp = fopen("不存在的文件.txt", "r");
    if (fp == NULL) {
        printf("文件不存在或无法打开\n");
        perror("fopen");  // 打印具体错误信息
    } else {
        fclose(fp);
    }

    // ========== 获取文件大小 ==========
    printf("\n===== 文件信息 =====\n");

    fp = fopen(FILENAME, "r");
    if (fp != NULL) {
        // 移动文件指针到末尾
        fseek(fp, 0, SEEK_END);      // SEEK_END：从文件末尾
        long file_size = ftell(fp);  // 获取当前位置（文件大小）
        rewind(fp);                  // 重置到开头
        fclose(fp);

        printf("文件名: %s\n", FILENAME);
        printf("文件大小: %ld 字节\n", file_size);
    }

    // ========== 复制文件 ==========
    printf("\n===== 文件复制 =====\n");

    const char *src_name = FILENAME;
    const char *dst_name = "test_copy.txt";

    FILE *src = fopen(src_name, "r");
    FILE *dst = fopen(dst_name, "w");

    if (src == NULL || dst == NULL) {
        printf("文件复制失败\n");
    } else {
        int ch;
        while ((ch = fgetc(src)) != EOF) {
            fputc(ch, dst);  // 逐个字符复制
        }
        fclose(src);
        fclose(dst);
        printf("文件 %s 已复制到 %s\n", src_name, dst_name);
    }

    // ========== 文件错误处理 ==========
    printf("\n===== 错误处理 =====\n");

    fp = fopen("/nonexistent/path/file.txt", "r");
    if (fp == NULL) {
        // perror 打印错误信息
        perror("打开文件失败");

        // strerror 获取错误字符串
        printf("错误代码: %d\n", errno);
    }

    // ========== 删除文件 ==========
    printf("\n===== 清理 =====\n");

    if (remove(dst_name) == 0) {
        printf("已删除: %s\n", dst_name);
    }

    // 保留原测试文件
    printf("保留 %s 供查看\n", FILENAME);

    return 0;
}

/*
 * ============================================
 * 关键点总结：
 *
 * 1. fopen 打开文件，fclose 关闭
 * 2. "r" 读，"w" 写（覆盖），"a" 追加
 * 3. 每次 fopen 后检查是否为 NULL
 * 4. fgets 读取一行，fputs 写入一行
 * 5. fgetc/fputc 读写单个字符
 * 6. feof, ferror, perror 用于错误处理
 * 7. fseek, ftell 定位文件指针
 * 8. remove 删除文件
 * ============================================
 */
