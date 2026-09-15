/**
 * ============================================================
 *  知识点: 内存映射 (Windows) —— CreateFileMapping / MapViewOfFile
 *
 *  Windows 没有 POSIX 的 mmap, 而是用一对 API 完成同样的工作。
 *  概念对照:
 *
 *    POSIX (Linux/macOS)              Windows
 *    ------------------------------   ---------------------------------
 *    mmap(..., MAP_ANONYMOUS)         CreateFileMapping(INVALID_HANDLE_VALUE, ...)
 *    mmap(..., fd, 0)                 CreateFileMapping(hFile, ...)
 *    <直接使用返回的指针>              MapViewOfFile(hMap, ...)
 *    munmap(p, len)                   UnmapViewOfFile(p)
 *    msync(p, len, MS_SYNC)           FlushViewOfFile(p, len)
 *    close(fd)                        CloseHandle(h)
 *
 *  本文件演示:
 *    1. 匿名字节映射  —— 相当于 malloc / 匿名 mmap
 *    2. 文件映射读写  —— 把文件当数组访问
 *    3. FlushViewOfFile 强制落盘
 *    4. 命名映射      —— 跨进程共享内存的基础
 *
 *  平台说明:
 *    - 本示例仅适用于 Windows
 *    - Linux/macOS 版本见 04_mmap_posix.c
 *    - 在 Linux/macOS 上编译本文件会得到一段提示消息, 不会编译失败
 *
 *  编译指令 (Windows / MinGW):
 *    gcc 05_memory_mapping_windows.c -o 05_memory_mapping_windows.exe -std=c11 -Wall
 *  运行:
 *    ./05_memory_mapping_windows.exe
 * ============================================================
 */

#include "../common/charset.h"
#include <stdio.h>
#include <stdlib.h>

#ifdef _WIN32

#include <windows.h>
#include <string.h>

#define DEMO_FILE   "win_map_demo.txt"
#define ANON_SIZE   (1u << 20)      /* 1 MB */
#define SHM_SIZE    4096
#define SHM_NAME    "Local\\MySharedMemoryDemo"

int main(void)
{
    printf("========================================\n");
    printf("  内存映射 (Windows)\n");
    printf("========================================\n\n");

    /* =============================================================
     * 1. 匿名字节映射 —— 由系统分页文件支持, 不关联具体文件
     *
     *    CreateFileMapping(INVALID_HANDLE_VALUE, ...) 等价于
     *    POSIX 的 mmap(..., MAP_ANONYMOUS, -1, 0)
     * ============================================================= */
    printf("======== 1. 匿名字节映射 ========\n");

    HANDLE hAnon = CreateFileMappingA(
        INVALID_HANDLE_VALUE,   /* 匿名: 由系统分页文件支持 */
        NULL,                   /* 默认安全属性 */
        PAGE_READWRITE,         /* 读写权限 */
        0,                      /* 大小高 32 位 */
        ANON_SIZE,              /* 大小低 32 位 */
        NULL);                  /* 无名 */

    if (hAnon == NULL) {
        printf("CreateFileMapping 失败, 错误码 = %lu\n",
               (unsigned long)GetLastError());
        return 1;
    }

    /* 把映射对象"视图"接进本进程的地址空间 */
    unsigned char *mem =
        (unsigned char *)MapViewOfFile(hAnon, FILE_MAP_ALL_ACCESS, 0, 0, ANON_SIZE);

    if (mem == NULL) {
        printf("MapViewOfFile 失败, 错误码 = %lu\n",
               (unsigned long)GetLastError());
        CloseHandle(hAnon);
        return 1;
    }

    printf("映射 %u 字节成功, 起始地址 = %p\n", ANON_SIZE, (void *)mem);

    /* 像普通数组一样使用 */
    memset(mem, 0, ANON_SIZE);
    for (int i = 0; i < 10; i++) {
        mem[i] = (unsigned char)('A' + i);
    }
    printf("写入 10 个字符: ");
    for (int i = 0; i < 10; i++) {
        printf("%c", mem[i]);
    }
    printf("\n");

    UnmapViewOfFile(mem);
    CloseHandle(hAnon);
    printf("已 UnmapViewOfFile + CloseHandle\n\n");

    /* =============================================================
     * 2. 文件映射读写
     * ============================================================= */
    printf("======== 2. 文件映射 (读写) ========\n");

    HANDLE hFile = CreateFileA(
        DEMO_FILE,
        GENERIC_READ | GENERIC_WRITE,
        0,                      /* 不共享 */
        NULL,
        CREATE_ALWAYS,          /* 总是新建/覆盖 */
        FILE_ATTRIBUTE_NORMAL,
        NULL);

    if (hFile == INVALID_HANDLE_VALUE) {
        printf("CreateFile 失败, 错误码 = %lu\n",
               (unsigned long)GetLastError());
        return 1;
    }

    const char *text =
        "Hello, memory mapping! 这是通过内存映射写入的内容。\n"
        "第二行: Windows 用 CreateFileMapping + MapViewOfFile。\n";

    DWORD written = 0;
    if (!WriteFile(hFile, text, (DWORD)strlen(text), &written, NULL)) {
        printf("WriteFile 失败, 错误码 = %lu\n",
               (unsigned long)GetLastError());
        CloseHandle(hFile);
        return 1;
    }
    printf("已写入 %lu 字节到 %s\n", (unsigned long)written, DEMO_FILE);

    /* 创建文件映射对象; 大小为 0 表示"映射整个文件" */
    HANDLE hMap = CreateFileMappingA(hFile, NULL, PAGE_READWRITE, 0, 0, NULL);
    if (hMap == NULL) {
        printf("CreateFileMapping 失败, 错误码 = %lu\n",
               (unsigned long)GetLastError());
        CloseHandle(hFile);
        return 1;
    }

    /* 映射整个文件到本进程地址空间 */
    char *view = (char *)MapViewOfFile(hMap, FILE_MAP_ALL_ACCESS, 0, 0, 0);
    if (view == NULL) {
        printf("MapViewOfFile 失败, 错误码 = %lu\n",
               (unsigned long)GetLastError());
        CloseHandle(hMap);
        CloseHandle(hFile);
        return 1;
    }

    printf("映射成功, 文件内容如下:\n----\n%s----\n", view);
    printf("注意: 没有调用 ReadFile, 直接通过指针读取\n\n");

    /* 修改映射内存 —— 会写回文件 */
    printf("修改前首字符: '%c'\n", view[0]);
    view[0] = 'h';      /* 'H' -> 'h' */
    printf("修改后首字符: '%c' (此刻只改了内存)\n", view[0]);

    /* 强制把改动刷回磁盘; 第二个参数 0 表示整个视图 */
    if (!FlushViewOfFile(view, 0)) {
        printf("FlushViewOfFile 失败, 错误码 = %lu\n",
               (unsigned long)GetLastError());
    }

    UnmapViewOfFile(view);
    CloseHandle(hMap);
    CloseHandle(hFile);
    printf("已 FlushViewOfFile + UnmapViewOfFile + CloseHandle\n\n");

    /* 重新打开文件, 验证改动确实落盘 */
    hFile = CreateFileA(DEMO_FILE, GENERIC_READ, FILE_SHARE_READ, NULL,
                        OPEN_EXISTING, FILE_ATTRIBUTE_NORMAL, NULL);
    if (hFile != INVALID_HANDLE_VALUE) {
        char buf[128] = {0};
        DWORD rd = 0;
        if (ReadFile(hFile, buf, sizeof(buf) - 1, &rd, NULL)) {
            printf("重新读取文件首行: %.20s...\n", buf);
        }
        CloseHandle(hFile);
    }
    printf("\n");

    /* =============================================================
     * 3. 命名映射 —— 跨进程共享内存的基础
     *
     *    只要两个进程用【同一个名字】调用 CreateFileMapping,
     *    就会拿到同一块底层内存。参数 NULL 换成名字即可。
     *    (本例在同一个进程内演示两次映射, 原理相同)
     * ============================================================= */
    printf("======== 3. 命名映射 (可跨进程共享) ========\n");

    HANDLE hShm = CreateFileMappingA(INVALID_HANDLE_VALUE, NULL,
                                     PAGE_READWRITE, 0, SHM_SIZE, SHM_NAME);
    if (hShm == NULL) {
        printf("CreateFileMapping(命名) 失败, 错误码 = %lu\n",
               (unsigned long)GetLastError());
    } else {
        char *shm = (char *)MapViewOfFile(hShm, FILE_MAP_ALL_ACCESS, 0, 0, SHM_SIZE);
        if (shm != NULL) {
            strcpy(shm, "Hello from shared memory!");
            printf("写入共享内存: %s\n", shm);

            /* 第二次用同名映射 —— 模拟"另一个进程"来读 */
            HANDLE hShm2 = CreateFileMappingA(INVALID_HANDLE_VALUE, NULL,
                                              PAGE_READWRITE, 0, SHM_SIZE, SHM_NAME);
            if (hShm2 != NULL) {
                char *shm2 = (char *)MapViewOfFile(hShm2, FILE_MAP_ALL_ACCESS,
                                                   0, 0, SHM_SIZE);
                if (shm2 != NULL) {
                    printf("第二次映射读取到: %s\n", shm2);
                    printf("(两次映射共享同一块底层物理内存; "
                           "虚拟地址可以不同: %p / %p)\n",
                           (void *)shm, (void *)shm2);
                    UnmapViewOfFile(shm2);
                }
                CloseHandle(hShm2);
            }
            UnmapViewOfFile(shm);
        }
        CloseHandle(hShm);
    }
    printf("\n");

    /* =============================================================
     * 4. 清理与总结
     * ============================================================= */
    DeleteFileA(DEMO_FILE);
    printf("已删除测试文件 %s\n\n", DEMO_FILE);

    printf("======== 总结 ========\n");
    printf("1. Windows 没有 mmap, 用 CreateFileMapping + MapViewOfFile\n");
    printf("2. 匿名映射: CreateFileMapping(INVALID_HANDLE_VALUE, ...)\n");
    printf("3. 文件映射: 先打开文件, 再 CreateFileMapping(hFile, ...)\n");
    printf("4. 改动会写回文件; FlushViewOfFile 可强制落盘\n");
    printf("5. 命名映射可实现跨进程共享内存\n");
    printf("6. 用毕必须 UnmapViewOfFile + CloseHandle\n\n");

    printf("===== 程序结束 =====\n");
    return 0;
}

#else  /* ==================== 非 Windows 平台 ==================== */

/* ------------------------------------------------------------------
 * Linux / macOS 平台: 本示例使用 Windows API (windows.h), 不可用。
 * 这里编译为一段提示消息, 以保证本文件在两个平台都能编译通过,
 * 不会让 build.sh 报错。POSIX 等价实现见同目录 04_*.c
 * ------------------------------------------------------------------ */
int main(void)
{
    printf("========================================\n");
    printf("  内存映射 (Windows)\n");
    printf("========================================\n\n");
    printf("本示例使用 Windows API <windows.h>,\n");
    printf("不适用于 Linux/macOS 平台。\n\n");
    printf("POSIX 等价示例请见: 04_mmap_posix.c\n");
    return 0;
}

#endif /* _WIN32 */
