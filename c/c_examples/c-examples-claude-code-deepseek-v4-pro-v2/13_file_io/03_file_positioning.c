/**
 * ============================================================
 *  知识点: 文件定位与随机访问 (File Position and Random Access)
 *
 *  编译指令: gcc 03_file_positioning.c -o 03_file_positioning.exe -std=c11 -Wall
 *  运行指令: ./03_file_positioning.exe
 *
 *  本文件演示:
 *    1. ftell() / ftello()   — 获取当前文件位置
 *    2. fseek() / fseeko()   — 设置文件位置
 *       SEEK_SET — 从文件开头偏移
 *       SEEK_CUR — 从当前位置偏移
 *       SEEK_END — 从文件末尾偏移
 *    3. rewind()             — 回到文件开头
 *    4. feof()               — 判断是否到达文件末尾
 * ============================================================
 */

#include "../common/charset.h"
#include <stdio.h>
#include <stdlib.h>

#define DEMO_FILE "position_demo.txt"

/* 辅助函数 */
static void checkFile(FILE *fp, const char *filename, const char *mode);
static void showPosition(FILE *fp, const char *label);


/*------------------------------------------------------------------
 *  主函数
 *------------------------------------------------------------------*/
int main(void)
{
    printf("========================================\n");
    printf("  文件定位与随机访问\n");
    printf("========================================\n\n");

    /* 先创建一个测试文件, 写入一些带编号的文本行 */
    printf("--- 准备测试文件 ---\n");
    FILE *fp = fopen(DEMO_FILE, "w+");
    checkFile(fp, DEMO_FILE, "w+");

    for (int i = 1; i <= 10; i++) {
        fprintf(fp, "第 %2d 行: 这是示例文本行 #%d\n", i, i);
    }

    long fileSize = ftell(fp);  /* 获取文件大小 (当前位置在末尾) */
    printf("已写入 10 行, 文件总大小 = %ld 字节\n\n", fileSize);

    /*--------------------------------------------------------------
     *  1. ftell() — 获取当前文件位置
     *
     *  ftell(fp) 返回当前位置相对于文件开头的字节偏移量。
     *  失败时返回 -1L。
     *--------------------------------------------------------------*/
    printf("=== 1. ftell() — 获取当前位置 ===\n");

    rewind(fp);  /* 回到开头 */
    showPosition(fp, "rewind 后");

    /* 读取一行 */
    char buffer[256];
    fgets(buffer, sizeof(buffer), fp);
    showPosition(fp, "读取一行后");

    /* 再读一行 */
    fgets(buffer, sizeof(buffer), fp);
    showPosition(fp, "再读一行后");

    /* 跳到文件末尾 */
    fseek(fp, 0, SEEK_END);
    showPosition(fp, "fseek(0, SEEK_END) 后");
    printf("\n");

    /*--------------------------------------------------------------
     *  2. fseek() — 设置文件位置
     *
     *  fseek(fp, offset, whence)
     *    offset: 字节偏移量 (可为负值)
     *    whence: SEEK_SET — 从文件开头计算
     *            SEEK_CUR — 从当前位置计算
     *            SEEK_END — 从文件末尾计算
     *
     *  成功返回 0, 失败返回非 0
     *--------------------------------------------------------------*/
    printf("=== 2. fseek() — 设置位置 ===\n");

    /* SEEK_SET: 定位到文件开头 + 偏移 */
    printf("--- SEEK_SET: 从开头偏移 ---\n");
    fseek(fp, 0, SEEK_SET);          /* 回到开头 */
    showPosition(fp, "fseek(0, SEEK_SET)");

    /* 定位到偏移 50 字节处 */
    fseek(fp, 50, SEEK_SET);
    showPosition(fp, "fseek(50, SEEK_SET)");
    /* 从该位置读取一行, 看输出效果 */
    if (fgets(buffer, sizeof(buffer), fp) != NULL) {
        printf("从偏移 50 读取: \"%s\"", buffer);
    }
    showPosition(fp, "读取后位置");
    printf("\n");

    /* SEEK_CUR: 从当前位置偏移 */
    printf("--- SEEK_CUR: 从当前位置偏移 ---\n");
    fseek(fp, 30, SEEK_CUR);         /* 从当前位置前进 30 字节 */
    showPosition(fp, "fseek(30, SEEK_CUR) 后");
    if (fgets(buffer, sizeof(buffer), fp) != NULL) {
        printf("读取: \"%s\"", buffer);
    }
    printf("\n");

    /* SEEK_END: 从文件末尾偏移 */
    printf("--- SEEK_END: 从文件末尾偏移 ---\n");
    fseek(fp, -20, SEEK_END);        /* 从末尾往回退 20 字节 */
    showPosition(fp, "fseek(-20, SEEK_END) 后");
    if (fgets(buffer, sizeof(buffer), fp) != NULL) {
        printf("读取: \"%s\"", buffer);
    }
    printf("\n");

    /* 跳到文件末尾 */
    fseek(fp, 0, SEEK_END);
    showPosition(fp, "fseek(0, SEEK_END) — 文件末尾");
    printf("\n");

    /*--------------------------------------------------------------
     *  3. rewind() — 回到文件开头
     *
     *  等价于 fseek(fp, 0, SEEK_SET), 但没有返回值。
     *--------------------------------------------------------------*/
    printf("=== 3. rewind() — 回到开头 ===\n");

    /* 确保在文件末尾 */
    fseek(fp, 0, SEEK_END);
    showPosition(fp, "当前位置 (末尾)");

    rewind(fp);  /* 回到开头 */
    showPosition(fp, "rewind() 后");

    /* 从头读取前 3 行 */
    printf("重新读取前 3 行:\n");
    for (int i = 0; i < 3 && fgets(buffer, sizeof(buffer), fp) != NULL; i++) {
        printf("  %s", buffer);
    }
    printf("\n");

    /*--------------------------------------------------------------
     *  4. feof() — 判断文件是否结束
     *
     *  当读取操作尝试越过文件末尾时, 文件的 EOF 标志被设置。
     *  feof(fp) 返回非 0 表示已到达文件末尾。
     *--------------------------------------------------------------*/
    printf("=== 4. feof() — 判断文件末尾 ===\n");

    /* 跳到文件中间某个位置 */
    fseek(fp, 0, SEEK_SET);

    /* 读取所有行直到文件末尾 */
    int lineCount = 0;
    while (fgets(buffer, sizeof(buffer), fp) != NULL) {
        lineCount++;
    }

    if (feof(fp)) {   /* 检查是否因为到达文件末尾而结束 */
        printf("已到达文件末尾, 共读取 %d 行\n", lineCount);
    }

    /* feof 和 ferror 的区别 */
    printf("\nfeof(fp) = %d  (非 0 表示到达文件末尾)\n", feof(fp));
    printf("ferror(fp) = %d (非 0 表示发生错误)\n", ferror(fp));
    printf("\n");

    /*--------------------------------------------------------------
     *  5. 随机访问示例: 读取指定行
     *--------------------------------------------------------------*/
    printf("=== 5. 随机访问: 直接读取第 N 行 ===\n");

    /* 将文件位置重置 */
    rewind(fp);

    /* 显示所有行及其偏移量 */
    printf("各行的偏移位置:\n");
    long offsets[11];   /* 最多记录 10 行 + 1 */
    int count = 0;

    offsets[0] = 0;     /* 第一行在文件开头 */

    while (count < 10 && fgets(buffer, sizeof(buffer), fp) != NULL) {
        offsets[count + 1] = ftell(fp);  /* 记录下一行的开始位置 */
        printf("  行 %d: offset = %ld\n", count + 1, offsets[count]);
        count++;
    }

    /* 直接跳到第 5 行 */
    int targetLine = 5;
    printf("\n跳过到第 %d 行:\n", targetLine);

    fseek(fp, offsets[targetLine - 1], SEEK_SET);
    fgets(buffer, sizeof(buffer), fp);
    printf("  第 %d 行内容: \"%s\"", targetLine, buffer);
    printf("\n");

    /*--------------------------------------------------------------
     *  6. 注意事项: 文本模式与二进制模式的区别
     *
     * 在 Windows 的文本模式下:
     *   - 换行符 \n 在文件中存储为 \r\n (2 字节)
     *   - fseek 和 ftell 的偏移量可能与实际字节数不同
     * 在二进制模式下:
     *   - 不做任何转换
     *   - 偏移量精确到字节
     *--------------------------------------------------------------*/
    printf("=== 6. 注意事项 ===\n");
    printf("1. 文本模式下, ftell/fseek 的偏移量可能不可靠\n");
    printf("   (因为 \\n 和 \\r\\n 的转换会影响字节计数)\n");
    printf("2. 二进制文件中, ftell/fseek 精确到字节\n");
    printf("3. fseek 的 offset 参数是 long 类型 (32 位系统最多 2GB)\n");
    printf("4. 大文件 (>2GB) 应使用 fseeko/ftello (使用 off_t 类型)\n");
    printf("\n");

    /* 关闭文件 */
    fclose(fp);

    /* 清理临时文件 */
    remove(DEMO_FILE);
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

/*------------------------------------------------------------------
 *  showPosition: 打印当前 ftell 位置
 *------------------------------------------------------------------*/
static void showPosition(FILE *fp, const char *label)
{
    long pos = ftell(fp);
    if (pos == -1L) {
        printf("  [%s] ftell 失败\n", label);
    } else {
        printf("  [%s] 位置 = %ld 字节\n", label, pos);
    }
}
