/**
 * ============================================================
 *  知识点: 文件的打开与关闭 (File Opening and Closing)
 *
 *  编译指令: gcc 01_file_open_close.c -o 01_file_open_close.exe -std=c11 -Wall
 *  运行指令: ./01_file_open_close.exe
 *
 *  本文件演示:
 *    1. fopen() 的各种模式: r, w, a, r+, w+, rb, wb
 *    2. fclose() 关闭文件
 *    3. 检查文件是否成功打开 (返回 NULL 表示失败)
 *    4. 创建一个示例文件 (写入), 然后读取回来
 * ============================================================
 */

#include "../common/charset.h"
#include <stdio.h>
#include <stdlib.h>

/* 用于存放演示数据的文件路径 */
#define DEMO_FILE "demo_file.txt"
#define BIN_FILE  "demo_binary.bin"

/*------------------------------------------------------------------
 *  辅助函数声明
 *------------------------------------------------------------------*/

/* 检查文件是否成功打开, 失败则报错并退出 */
static void checkFile(FILE *fp, const char *filename, const char *mode);

/* 显示文件内容 (逐字符读取并打印) */
static void showFileContent(const char *filename);

/*------------------------------------------------------------------
 *  主函数
 *---------------------------------------------------------------=---*/
int main(void)
{
    printf("========================================\n");
    printf("  文件的打开与关闭\n");
    printf("========================================\n\n");

    /* 注意: FILE 是指针, fopen 返回 FILE*
     * 所有文件操作都通过 FILE* 进行
     */

    /*--------------------------------------------------------------
     *  1. "w" 模式 — 写入模式 (Write)
     *
     *  如果文件不存在则创建; 如果文件已存在则清空内容。
     *  只能写入, 不能读取。
     *--------------------------------------------------------------*/
    printf("--- 1. \"w\" 模式: 写入文件 ---\n");

    FILE *fp = fopen(DEMO_FILE, "w");
    checkFile(fp, DEMO_FILE, "w");

    /* 向文件写入几行文本 */
    fprintf(fp, "这是第一行文本\n");
    fprintf(fp, "这是第二行文本\n");
    fprintf(fp, "这是第三行文本 — 文件行数: 3\n");

    printf("成功写入 %d 行数据到 %s\n\n", 3, DEMO_FILE);

    /* 关闭文件 */
    fclose(fp);
    fp = NULL;  /* 避免悬空指针 */

    /*--------------------------------------------------------------
     *  2. "r" 模式 — 读取模式 (Read)
     *
     *  文件必须存在, 否则 fopen 返回 NULL。
     *  只能读取, 不能写入。
     *--------------------------------------------------------------*/
    printf("--- 2. \"r\" 模式: 读取文件 ---\n");

    fp = fopen(DEMO_FILE, "r");
    checkFile(fp, DEMO_FILE, "r");

    /* 逐行读取并打印 */
    char buffer[256];
    int lineNum = 0;
    while (fgets(buffer, sizeof(buffer), fp) != NULL) {
        lineNum++;
        printf("  第 %d 行: %s", lineNum, buffer);
    }
    printf("\n");

    fclose(fp);
    fp = NULL;
    printf("\n");

    /*--------------------------------------------------------------
     *  3. "a" 模式 — 追加模式 (Append)
     *
     *  如果文件不存在则创建。
     *  写入的数据追加到文件末尾, 不会清空已有内容。
     *--------------------------------------------------------------*/
    printf("--- 3. \"a\" 模式: 追加内容 ---\n");

    fp = fopen(DEMO_FILE, "a");
    checkFile(fp, DEMO_FILE, "a");

    fprintf(fp, "这是追加的第四行\n");
    fprintf(fp, "这是追加的第五行\n");

    fclose(fp);
    fp = NULL;

    printf("已追加 2 行, 现在文件内容:\n");
    showFileContent(DEMO_FILE);
    printf("\n");

    /*--------------------------------------------------------------
     *  4. "r+" 模式 — 读写模式 (Read/Write, 不创建)
     *
     *  文件必须存在。
     *  可以读取和写入, 写入从文件开头开始覆盖。
     *--------------------------------------------------------------*/
    printf("--- 4. \"r+\" 模式: 读写 (文件必须存在) ---\n");

    fp = fopen(DEMO_FILE, "r+");
    checkFile(fp, DEMO_FILE, "r+");

    /* 从文件开头覆盖写入 "Hello World!" 到第一行 */
    fseek(fp, 0, SEEK_SET);        /* 定位到文件开头 */
    fprintf(fp, "Hello World!\n");  /* 覆盖第一行 */

    fclose(fp);
    fp = NULL;

    printf("覆盖写入 \"Hello World!\" 后:\n");
    showFileContent(DEMO_FILE);
    printf("\n");

    /*--------------------------------------------------------------
     *  5. "w+" 模式 — 读写模式 (先清空)
     *
     *  如果文件不存在则创建; 如果存在则清空内容。
     *  可以读取和写入。
     *--------------------------------------------------------------*/
    printf("--- 5. \"w+\" 模式: 读写 (清空后写入) ---\n");

    fp = fopen(DEMO_FILE, "w+");
    checkFile(fp, DEMO_FILE, "w+");

    /* 写入新内容 */
    fprintf(fp, "这是 w+ 模式写入的新内容\n");
    fprintf(fp, "文件原来的内容已经被清空\n");

    /* 将文件位置重置到开头, 然后读取 */
    rewind(fp);

    printf("读取刚刚写入的内容:\n");
    while (fgets(buffer, sizeof(buffer), fp) != NULL) {
        printf("  %s", buffer);
    }
    printf("\n");

    fclose(fp);
    fp = NULL;

    /*--------------------------------------------------------------
     *  6. "a+" 模式 — 追加+读取模式
     *
     *  如果文件不存在则创建。
     *  可以读取, 写入始终在文件末尾。
     *--------------------------------------------------------------*/
    printf("--- 6. \"a+\" 模式: 追加+读取 ---\n");

    fp = fopen(DEMO_FILE, "a+");
    checkFile(fp, DEMO_FILE, "a+");

    /* 读取原有内容 (需要先定位到文件开头, 因为 a+ 模式下位置在末尾) */
    rewind(fp);
    printf("原有内容:\n");
    while (fgets(buffer, sizeof(buffer), fp) != NULL) {
        printf("  %s", buffer);
    }

    /* 追加新内容 (始终在文件末尾) */
    fprintf(fp, "这是 a+ 模式追加的行\n");

    fclose(fp);
    fp = NULL;
    printf("\n");

    /*--------------------------------------------------------------
     *  7. "wb" 和 "rb" — 二进制模式
     *
     *  在 Windows 上, 文本模式和二进制模式的处理不同:
     *    文本模式: \n 会被转换为 \r\n (写入时) 和 \r\n 被转换为 \n (读取时)
     *    二进制模式: 不做任何转换
     *--------------------------------------------------------------*/
    printf("--- 7. \"wb\"/\"rb\" 二进制模式 ---\n");

    /* 写入二进制数据 */
    fp = fopen(BIN_FILE, "wb");
    checkFile(fp, BIN_FILE, "wb");

    int numbers[] = { 100, 200, 300, 400, 500 };
    size_t written = fwrite(numbers, sizeof(int), 5, fp);
    printf("成功写入 %zu 个整数到二进制文件\n", written);

    fclose(fp);
    fp = NULL;

    /* 读取二进制数据 */
    fp = fopen(BIN_FILE, "rb");
    checkFile(fp, BIN_FILE, "rb");

    int readNums[5] = { 0 };
    size_t readCount = fread(readNums, sizeof(int), 5, fp);
    printf("成功读取 %zu 个整数: ", readCount);
    for (size_t i = 0; i < readCount; i++) {
        printf("%d ", readNums[i]);
    }
    printf("\n");

    fclose(fp);
    fp = NULL;

    /*--------------------------------------------------------------
     *  8. fopen 失败处理
     *
     *  当打开不存在的文件进行读取时, fopen 返回 NULL。
     *--------------------------------------------------------------*/
    printf("\n--- 8. 失败处理: 打开不存在的文件 ---\n");

    fp = fopen("nonexistent_file.xyz", "r");
    if (fp == NULL) {
        printf("fopen 返回 NULL, 打开失败 (文件不存在)\n");
        /* perror 可以打印出具体的错误信息 */
        perror("  perror 输出");
    } else {
        /* 通常不会执行到这里 */
        fclose(fp);
    }

    printf("\n");

    /* 清理临时文件 */
    remove(DEMO_FILE);
    remove(BIN_FILE);

    printf("临时文件已清理\n");

    return 0;
}


/* =================================================================
 *  辅助函数实现
 * ================================================================= */

/*------------------------------------------------------------------
 *  checkFile: 检查文件是否成功打开, 失败则报错退出
 *------------------------------------------------------------------*/
static void checkFile(FILE *fp, const char *filename, const char *mode)
{
    if (fp == NULL) {
        printf("错误: 无法以 \"%s\" 模式打开文件 \"%s\"\n", mode, filename);
        perror("原因");
        exit(EXIT_FAILURE);
    }
}

/*------------------------------------------------------------------
 *  showFileContent: 逐字符读取并打印文件内容
 *------------------------------------------------------------------*/
static void showFileContent(const char *filename)
{
    FILE *fp = fopen(filename, "r");
    if (fp == NULL) {
        printf("  (无法打开文件)\n");
        return;
    }

    int ch;
    while ((ch = fgetc(fp)) != EOF) {
        putchar(ch);
    }
    /* 如果文件末尾没有换行, 补一个 */
    printf("\n");

    fclose(fp);
}
