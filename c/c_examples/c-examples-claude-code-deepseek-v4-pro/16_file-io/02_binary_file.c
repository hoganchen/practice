/*
 * ============================================
 * 知识点：二进制文件读写
 * 说明：
 *   二进制文件以原始字节形式读写数据，
 *   比文本文件更紧凑、更高效。
 *
 *   二进制读写函数：
 *   fwrite(ptr, size, count, fp)  — 写入二进制数据
 *   fread(ptr, size, count, fp)   — 读取二进制数据
 *   fseek(fp, offset, whence)     — 移动文件指针
 *   ftell(fp)                     — 获取文件指针位置
 *
 *   二进制模式：fopen("file", "rb"/"wb"/"ab"）
 *
 * 编译方法：
 *   gcc 02_binary_file.c -o 02_binary_file
 * ============================================
 */

#include <stdio.h>
#include "../utf8fix.h"
#include <stdlib.h>
#include <string.h>

#define FILENAME "data.bin"

typedef struct {
    int id;
    char name[30];
    double score;
} Record;

void write_records(void) {
    FILE *fp = fopen(FILENAME, "wb");  // 二进制写入
    if (fp == NULL) {
        printf("无法创建文件\n");
        return;
    }

    Record records[] = {
        {1001, "张三", 85.5},
        {1002, "李四", 92.0},
        {1003, "王五", 78.5},
        {1004, "赵六", 95.5}
    };

    int count = sizeof(records) / sizeof(records[0]);

    // 写入数组：一次写入所有记录
    size_t written = fwrite(records, sizeof(Record), count, fp);
    printf("写入 %zu 条记录\n", written);

    fclose(fp);
}

void read_records(void) {
    FILE *fp = fopen(FILENAME, "rb");  // 二进制读取
    if (fp == NULL) {
        printf("无法打开文件\n");
        return;
    }

    // 获取文件大小
    fseek(fp, 0, SEEK_END);
    long file_size = ftell(fp);
    rewind(fp);

    int record_count = file_size / sizeof(Record);
    printf("文件大小: %ld 字节, 记录数: %d\n",
           file_size, record_count);

    // 分配内存并读取所有记录
    Record *records = (Record*)malloc(file_size);
    if (records == NULL) return;

    size_t read = fread(records, sizeof(Record), record_count, fp);
    printf("读取 %zu 条记录:\n", read);

    for (size_t i = 0; i < read; i++) {
        printf("  ID: %d, 姓名: %s, 成绩: %.1f\n",
               records[i].id, records[i].name, records[i].score);
    }

    free(records);
    fclose(fp);
}

void access_random_record(void) {
    FILE *fp = fopen(FILENAME, "rb");
    if (fp == NULL) return;

    // 直接读取第3条记录（索引2），不读取前面的
    Record r;
    fseek(fp, 2 * sizeof(Record), SEEK_SET);  // 跳到第3条记录
    fread(&r, sizeof(Record), 1, fp);

    printf("随机访问第3条记录: ID=%d, %s, %.1f\n",
           r.id, r.name, r.score);

    fclose(fp);
}

void update_record(void) {
    FILE *fp = fopen(FILENAME, "rb+");  // 读写模式
    if (fp == NULL) return;

    // 修改第2条记录
    Record r;
    fseek(fp, 1 * sizeof(Record), SEEK_SET);
    fread(&r, sizeof(Record), 1, fp);

    printf("修改前: ID=%d, %s, %.1f\n", r.id, r.name, r.score);

    // 修改成绩
    r.score = 96.0;
    fseek(fp, - (long)sizeof(Record), SEEK_CUR);  // 后退一个记录
    fwrite(&r, sizeof(Record), 1, fp);

    printf("修改后成绩为 %.1f\n", r.score);

    fclose(fp);

    // 验证
    read_records();
}

int main() {
    printf("===== 二进制文件读写 =====\n\n");

    printf("--- 写入数据 ---\n");
    write_records();

    printf("\n--- 读取所有数据 ---\n");
    read_records();

    printf("\n--- 随机访问 ---\n");
    access_random_record();

    printf("\n--- 更新记录 ---\n");
    update_record();

    // 清理
    remove(FILENAME);
    printf("\n已删除测试文件\n");

    // ========== 二进制 vs 文本 ==========
    printf("\n===== 二进制 vs 文本总结 =====\n");

    printf("二进制模式:\n");
    printf("  优点: 紧凑、快速、精确存储\n");
    printf("  缺点: 不可读、跨平台有字节序问题\n");
    printf("  适用: 数据存储、序列化\n");

    printf("\n文本模式:\n");
    printf("  优点: 可读、可编辑、跨平台\n");
    printf("  缺点: 占用空间大、转换开销\n");
    printf("  适用: 配置文件、日志\n");

    return 0;
}

/*
 * ============================================
 * 关键点总结：
 *
 * 1. fwrite/fread 用于二进制数据读写
 * 2. "rb"/"wb"/"ab" 指定二进制模式
 * 3. fseek/ftell 用于随机访问
 * 4. 结构体可以直接二进制读写（但注意字节对齐）
 * 5. "rb+" 用于读写更新
 * 6. 二进制文件不可直接阅读
 * ============================================
 */
