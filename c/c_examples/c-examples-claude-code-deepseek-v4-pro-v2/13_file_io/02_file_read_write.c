/**
 * ============================================================
 *  知识点: 文件的读写函数 (File Reading and Writing Functions)
 *
 *  编译指令: gcc 02_file_read_write.c -o 02_file_read_write.exe -std=c11 -Wall
 *  运行指令: ./02_file_read_write.exe
 *
 *  本文件演示 C 标准库中四种文件读写方式:
 *    1. fgetc / fputc  — 逐字符读写
 *    2. fgets / fputs  — 逐行读写
 *    3. fread / fwrite — 二进制块读写
 *    4. fprintf / fscanf — 格式化读写
 * ============================================================
 */

#include "../common/charset.h"
#include <stdio.h>
#include <string.h>
#include <stdlib.h>

#define TEXT_FILE "test_readwrite.txt"
#define BIN_FILE  "test_binary.bin"

/* 辅助函数声明 */
static void checkFile(FILE *fp, const char *filename, const char *mode);


/*------------------------------------------------------------------
 *  主函数
 *------------------------------------------------------------------*/
int main(void)
{
    printf("========================================\n");
    printf("  文件的读写函数\n");
    printf("========================================\n\n");

    /* ==============================================================
     *  第一部分: 逐字符读写 (fgetc / fputc)
     *
     *  fputc(ch, fp) — 写入一个字符到文件
     *  fgetc(fp)     — 从文件读取一个字符
     *  返回 EOF (-1) 表示文件结束或错误
     * ============================================================== */
    printf("=== 1. 逐字符: fputc / fgetc ===\n");

    /* 逐字符写入 */
    FILE *fp = fopen(TEXT_FILE, "w");
    checkFile(fp, TEXT_FILE, "w");

    const char *charMsg = "Hello, fputc!\n第二行文字\n";
    printf("写入字符串: \"%s\"\n", charMsg);

    for (int i = 0; charMsg[i] != '\0'; i++) {
        fputc(charMsg[i], fp);  /* 逐个字符写入 */
    }
    fclose(fp);

    /* 逐字符读取 */
    fp = fopen(TEXT_FILE, "r");
    checkFile(fp, TEXT_FILE, "r");

    printf("逐字符读取结果: ");
    int ch;
    while ((ch = fgetc(fp)) != EOF) {
        putchar(ch);   /* 将字符输出到终端 */
    }
    printf("\n");
    fclose(fp);
    printf("\n");

    /* ==============================================================
     *  第二部分: 逐行读写 (fgets / fputs)
     *
     *  fputs(str, fp)  — 写入字符串到文件 (不自动追加换行)
     *  fgets(buf, size, fp) — 从文件读取一行 (包含换行符, 自动加 \0)
     *
     *  注意: fgets 会读取换行符, 而 fputs 不会自动添加换行符
     * ============================================================== */
    printf("=== 2. 逐行: fputs / fgets ===\n");

    fp = fopen(TEXT_FILE, "w");
    checkFile(fp, TEXT_FILE, "w");

    fputs("第一行: 使用 fputs 写入\n", fp);
    fputs("第二行: fputs 不会追加换行符\n", fp);
    fputs("第三行: 需要手动加 \\n\n", fp);

    fclose(fp);

    /* 逐行读取 */
    fp = fopen(TEXT_FILE, "r");
    checkFile(fp, TEXT_FILE, "r");

    char line[256];
    int lineNum = 0;
    printf("逐行读取结果:\n");
    while (fgets(line, sizeof(line), fp) != NULL) {
        lineNum++;
        /* fgets 会保留换行符, 所以不需要再 \n */
        printf("  行 %d (%zu 字符): %s", lineNum, strlen(line), line);
    }
    fclose(fp);
    printf("\n");

    /* ==============================================================
     *  第三部分: 二进制块读写 (fread / fwrite)
     *
     *  fwrite(ptr, size, count, fp) — 写入 count 个 size 字节的数据块
     *  fread(ptr, size, count, fp)  — 读取 count 个 size 字节的数据块
     *
     *  返回值: 实际读取/写入的元素个数 (不是字节数!)
     *  适用于读写结构体、数组等二进制数据
     * ============================================================== */
    printf("=== 3. 二进制块: fwrite / fread ===\n");

    /* 准备数据: 结构体数组 */
    typedef struct {
        int   id;
        char  name[20];
        double salary;
    } Employee;

    Employee staff[3] = {
        { 1001, "张三",   8500.50 },
        { 1002, "李四",   9200.00 },
        { 1003, "王五",   11000.75 }
    };

    /* 写入二进制文件 */
    fp = fopen(BIN_FILE, "wb");
    checkFile(fp, BIN_FILE, "wb");

    size_t written = fwrite(staff, sizeof(Employee), 3, fp);
    printf("写入 %zu 个 Employee 结构体到二进制文件\n", written);

    fclose(fp);

    /* 从二进制文件读取 */
    fp = fopen(BIN_FILE, "rb");
    checkFile(fp, BIN_FILE, "rb");

    Employee readBack[3] = { 0 };
    size_t readCnt = fread(readBack, sizeof(Employee), 3, fp);
    printf("读取 %zu 个 Employee 结构体:\n", readCnt);

    for (size_t i = 0; i < readCnt; i++) {
        printf("  [%zu] id=%d, name=%s, salary=%.2f\n",
               i, readBack[i].id, readBack[i].name, readBack[i].salary);
    }

    fclose(fp);
    printf("\n");

    /* ==============================================================
     *  第四部分: 格式化读写 (fprintf / fscanf)
     *
     *  fprintf(fp, format, ...) — 格式化写入, 类似于 printf
     *  fscanf(fp, format, ...)  — 格式化读取, 类似于 scanf
     *
     *  适用于读写格式化的文本数据 (如 CSV、配置等)
     * ============================================================== */
    printf("=== 4. 格式化: fprintf / fscanf ===\n");

    fp = fopen(TEXT_FILE, "w");
    checkFile(fp, TEXT_FILE, "w");

    /* 写入格式化的表格数据 */
    fprintf(fp, "%-10s %-10s %s\n", "姓名", "年龄", "分数");
    fprintf(fp, "%-10s %-10d %.1f\n", "张三",    20, 92.5);
    fprintf(fp, "%-10s %-10d %.1f\n", "李四",    21, 88.0);
    fprintf(fp, "%-10s %-10d %.1f\n", "王五",    19, 95.5);

    fclose(fp);

    printf("使用 fprintf 写入的格式化内容:\n");
    fp = fopen(TEXT_FILE, "r");
    checkFile(fp, TEXT_FILE, "r");

    /* 先读取表头并打印 */
    char header[256];
    fgets(header, sizeof(header), fp);
    printf("  %s", header);

    /* 使用 fscanf 读取数据 */
    char name[50];
    int  age;
    float score;

    while (fscanf(fp, "%s %d %f", name, &age, &score) == 3) {
        printf("  姓名=%-6s 年龄=%-3d 分数=%.1f\n", name, age, score);
    }

    fclose(fp);
    printf("\n");

    /* ==============================================================
     *  第五部分: 四种方式的对比总结
     * ============================================================== */
    printf("=== 5. 四种读写方式总结 ===\n");
    printf("  方式           | 适用场景               | 函数\n");
    printf("  -------------- + ---------------------- + ----------\n");
    printf("  逐字符         | 小文本, 简单处理       | fgetc/fputc\n");
    printf("  逐行           | 文本行处理             | fgets/fputs\n");
    printf("  二进制块       | 结构体/数组/大块数据   | fread/fwrite\n");
    printf("  格式化         | 格式化文本/CSV/配置    | fprintf/fscanf\n");
    printf("\n");

    /* 清理临时文件 */
    remove(TEXT_FILE);
    remove(BIN_FILE);
    printf("临时文件已清理\n");

    return 0;
}


/* =================================================================
 *  辅助函数实现
 * ================================================================= */

static void checkFile(FILE *fp, const char *filename, const char *mode)
{
    if (fp == NULL) {
        printf("错误: 无法以 \"%s\" 模式打开文件 \"%s\"\n", mode, filename);
        perror("原因");
        exit(EXIT_FAILURE);
    }
}
