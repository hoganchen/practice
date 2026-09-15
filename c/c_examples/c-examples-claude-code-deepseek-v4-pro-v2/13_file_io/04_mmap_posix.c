/**
 * ============================================================
 *  知识点: 内存映射 mmap (POSIX) —— Linux / macOS
 *
 *  本文件演示 POSIX 的 mmap 机制, 包括:
 *    1. 匿名映射 (anonymous)  —— 不关联文件, 当动态内存用
 *    2. 文件映射 (file-backed) —— 把文件当数组一样读写
 *    3. MAP_SHARED 改动写回文件 + msync 强制同步
 *    4. MAP_PRIVATE 写时复制 (COW), 改动不写回文件
 *    5. munmap 解除映射
 *
 *  核心概念:
 *    - mmap 把"文件或匿名内存"映射进进程的虚拟地址空间
 *    - 调用时只登记 VMA, 不分配物理内存; 首次访问才按需分页(缺页中断)
 *    - 失败返回 MAP_FAILED ((void*)-1), 【不是 NULL】!
 *
 *  平台说明:
 *    - 本示例仅适用于 Linux / macOS (POSIX)
 *    - Windows 等价版本见 05_memory_mapping_windows.c
 *    - 在 Windows 上编译本文件会得到一段提示消息, 不会编译失败
 *
 *  编译指令 (Linux/macOS):
 *    gcc 04_mmap_posix.c -o 04_mmap_posix -std=c11 -Wall
 *  运行:
 *    ./04_mmap_posix
 * ============================================================
 */

/*
 * _DEFAULT_SOURCE 必须定义在任何 #include 之前。
 * 原因: 项目用 -std=c11 编译, 会定义 __STRICT_ANSI__, 使 glibc 隐藏
 *       MAP_ANONYMOUS / MAP_ANON 等扩展。定义 _DEFAULT_SOURCE 可让其可见。
 *       (在 macOS 上该宏无副作用)
 */
#define _DEFAULT_SOURCE 1

#include "../common/charset.h"
#include <stdio.h>
#include <stdlib.h>

#ifdef _WIN32

/* ==================================================================
 *  Windows 平台
 *
 *  mmap 是 POSIX 接口, Windows 不提供 sys/mman.h。
 *  这里编译为一段提示消息, 以保证本文件在两个平台都能编译通过,
 *  不会让 build.bat 报错。Windows 等价实现见同目录 05_*.c
 * ================================================================== */
int main(void)
{
    printf("========================================\n");
    printf("  内存映射 mmap (POSIX)\n");
    printf("========================================\n\n");
    printf("本示例使用 POSIX 接口 <sys/mman.h>,\n");
    printf("不适用于 Windows 平台。\n\n");
    printf("Windows 等价示例请见: 05_memory_mapping_windows.c\n");
    return 0;
}

#else  /* ==================== POSIX 实现 ==================== */

#include <string.h>
#include <fcntl.h>
#include <unistd.h>
#include <sys/mman.h>
#include <sys/stat.h>

#define DEMO_FILE   "mmap_demo.txt"
#define ANON_SIZE   (1u << 20)      /* 1 MB */

int main(void)
{
    printf("========================================\n");
    printf("  内存映射 mmap (POSIX)\n");
    printf("========================================\n\n");

    /* =============================================================
     * 1. 匿名映射 —— 不关联文件, 相当于手动版的 malloc
     * ============================================================= */
    printf("======== 1. 匿名映射 (anonymous) ========\n");

    unsigned char *mem = mmap(NULL, ANON_SIZE,
                              PROT_READ | PROT_WRITE,
                              MAP_PRIVATE | MAP_ANONYMOUS,
                              -1, 0);           /* fd = -1, offset = 0 */
    if (mem == MAP_FAILED) {                /* 注意: 不是 NULL! */
        perror("mmap(anonymous)");
        return 1;
    }

    printf("映射 %u 字节成功, 起始地址 = %p\n", ANON_SIZE, (void *)mem);
    printf("系统页大小 = %ld 字节\n", sysconf(_SC_PAGESIZE));

    /* 可以像普通数组一样使用这块内存 */
    memset(mem, 0, ANON_SIZE);
    for (int i = 0; i < 10; i++) {
        mem[i] = (unsigned char)('A' + i);
    }
    printf("写入 10 个字符: ");
    for (int i = 0; i < 10; i++) {
        printf("%c", mem[i]);
    }
    printf("\n");

    /* 用完必须解除映射, 否则一直占用地址空间 */
    if (munmap(mem, ANON_SIZE) == -1) {
        perror("munmap(anonymous)");
    }
    printf("已 munmap, 内存归还内核\n\n");

    /* =============================================================
     * 2. 文件映射 (只读) —— 把文件内容当数组读
     * ============================================================= */
    printf("======== 2. 文件映射 (读取) ========\n");

    /* 先准备一个测试文件 */
    int fd = open(DEMO_FILE, O_RDWR | O_CREAT | O_TRUNC, 0644);
    if (fd == -1) {
        perror("open");
        return 1;
    }

    const char *text =
        "Hello, mmap! 这是通过内存映射读取的内容。\n"
        "第二行: mmap 让文件访问像数组一样简单。\n";

    size_t text_len = strlen(text);
    if (write(fd, text, text_len) != (ssize_t)text_len) {
        perror("write");
        close(fd);
        return 1;
    }
    printf("已创建测试文件 %s (%zu 字节)\n", DEMO_FILE, text_len);

    /* 取得文件大小 */
    struct stat st;
    if (fstat(fd, &st) == -1) {
        perror("fstat");
        close(fd);
        return 1;
    }
    size_t len = (size_t)st.st_size;
    printf("文件大小 = %zu 字节\n", len);

    /* 建立只读映射 */
    char *ro = mmap(NULL, len, PROT_READ, MAP_PRIVATE, fd, 0);
    if (ro == MAP_FAILED) {
        perror("mmap(read)");
        close(fd);
        return 1;
    }

    printf("映射成功, 文件内容如下:\n----\n%.*s----\n", (int)len, ro);
    printf("注意: 全程没有调用 read(), 直接通过指针访问文件内容\n\n");

    munmap(ro, len);

    /* =============================================================
     * 3. MAP_SHARED 可写映射 —— 改动会写回文件
     * ============================================================= */
    printf("======== 3. MAP_SHARED 写回文件 ========\n");

    char *rw = mmap(NULL, len, PROT_READ | PROT_WRITE, MAP_SHARED, fd, 0);
    if (rw == MAP_FAILED) {
        perror("mmap(shared)");
        close(fd);
        return 1;
    }

    printf("修改前首字符: '%c'\n", rw[0]);
    rw[0] = 'h';        /* 'H' -> 'h' */
    printf("修改后首字符: '%c' (此刻只改了内存)\n", rw[0]);

    /*
     * msync 把改动强制刷回文件。
     * 即便不调用 msync, 内核也会在 munmap 时把 MAP_SHARED 的脏页写回,
     * 但时机不确定; 需要确切落盘时应显式调用。
     */
    if (msync(rw, len, MS_SYNC) == -1) {
        perror("msync");
    }
    munmap(rw, len);
    close(fd);
    printf("已 msync + munmap\n\n");

    /* 重新读文件, 验证改动确实落盘 */
    FILE *check = fopen(DEMO_FILE, "r");
    if (check != NULL) {
        char buf[128] = {0};
        size_t n = fread(buf, 1, sizeof(buf) - 1, check);
        (void)n;
        printf("重新读取文件首行: %.20s...\n", buf);
        fclose(check);
    }
    printf("\n");

    /* =============================================================
     * 4. MAP_PRIVATE —— 写时复制, 改动不写回文件
     * ============================================================= */
    printf("======== 4. MAP_PRIVATE (写时复制) ========\n");

    fd = open(DEMO_FILE, O_RDONLY);
    if (fd == -1) {
        perror("open");
        return 1;
    }
    if (fstat(fd, &st) == -1) {
        perror("fstat");
        close(fd);
        return 1;
    }
    len = (size_t)st.st_size;

    /*
     * MAP_PRIVATE 允许以 PROT_WRITE 映射【只读】打开的文件 ——
     * 因为写入不会写回文件, 而是触发"写时复制", 只改本进程的私有副本。
     */
    char *priv = mmap(NULL, len, PROT_READ | PROT_WRITE, MAP_PRIVATE, fd, 0);
    if (priv == MAP_FAILED) {
        perror("mmap(private)");
        close(fd);
        return 1;
    }

    printf("私有映射首字符: '%c'\n", priv[0]);
    priv[0] = 'Z';      /* 触发 COW: 内核为本进程复制一份页 */
    printf("改为 'Z' 后: '%c' (只影响本进程)\n", priv[0]);
    munmap(priv, len);
    close(fd);

    /* 验证文件未被改动 */
    check = fopen(DEMO_FILE, "r");
    if (check != NULL) {
        char buf[128] = {0};
        size_t n = fread(buf, 1, sizeof(buf) - 1, check);
        (void)n;
        printf("文件首字符仍为: '%c' (未被 PRIVATE 映射改动)\n", buf[0]);
        fclose(check);
    }
    printf("\n");

    /* =============================================================
     * 5. 清理与总结
     * ============================================================= */
    remove(DEMO_FILE);
    printf("已删除测试文件 %s\n\n", DEMO_FILE);

    printf("======== 总结 ========\n");
    printf("1. mmap 让文件/内存可像数组一样访问, 无需 read/write\n");
    printf("2. 匿名映射 = 手动版 malloc (MAP_ANONYMOUS, fd = -1)\n");
    printf("3. MAP_SHARED  : 改动写回文件, 多进程可见\n");
    printf("4. MAP_PRIVATE : 写时复制, 改动不写回文件\n");
    printf("5. 失败返回 MAP_FAILED ((void*)-1), 不是 NULL\n");
    printf("6. 用毕必须 munmap, 否则映射一直占用虚拟地址空间\n\n");

    printf("===== 程序结束 =====\n");
    return 0;
}

#endif /* _WIN32 */
