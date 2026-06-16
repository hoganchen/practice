/*
 * 知识点：错误处理 (errno 和 perror)
 *
 * 编译指令：gcc 01_errno_and_perror.c -o 01_errno_and_perror.exe -std=c11 -Wall
 * 运行指令：./01_errno_and_perror.exe
 *
 * 本文件演示 C 标准库中的错误处理机制：
 *   - errno   —— 全局错误码变量，定义在 <errno.h>
 *   - perror()—— 打印错误描述信息到 stderr
 *   - strerror()—— 将 errno 转换为可读的错误描述字符串
 *
 * 核心概念：
 *   C 标准库中的很多函数在出错时会设置 errno 全局变量
 *   errno 是线程局部存储（C11 支持线程本地），因此多线程安全
 *   每次函数调用后应尽快检查 errno，因为后续成功的调用可能覆盖它
 *   perror() 和 strerror() 是查看错误信息的两种方式
 */

#include "../common/charset.h"
#include <stdio.h>
#include <stdlib.h>
#include <string.h>  /* strerror() */
#include <errno.h>   /* errno 和错误码常量 */
#include <math.h>    /* 用于演示数学错误 */

int main() {
    printf("============================================\n");
    printf("  errno 和 perror 错误处理演示\n");
    printf("============================================\n\n");

    /* ===== 1. 文件操作错误演示 ===== */
    printf("----- 1. perror() 打印错误信息 -----\n");

    /* 尝试打开一个不存在的文件 */
    FILE *fp = fopen("不存在的文件.txt", "r");
    if (fp == NULL) {
        /* perror() 自动使用全局 errno 变量
         * 它会输出："自定义前缀: 错误描述" */
        perror("fopen 失败");

        /* 也可以这样输出到 stdout 而不是 stderr */
        printf("（上面的错误输出到了 stderr）\n\n");
    }

    /* ===== 2. strerror() 获取错误字符串 ===== */
    printf("----- 2. strerror() 转换错误码 -----\n");

    /* 故意制造一个错误：打开不存在的文件 */
    FILE *fp2 = fopen("/nonexistent/path/to/file.txt", "r");
    if (fp2 == NULL) {
        /* strerror(errno) 将 errno 数值转换为可读字符串 */
        printf("打开文件失败！错误码: %d, 描述: %s\n",
               errno, strerror(errno));
    }

    /* ===== 3. 常见的 errno 值 ===== */
    printf("\n----- 3. 常见 errno 值一览 -----\n");

    /* 恢复 errno 为 0（无错误） */
    errno = 0;
    printf("errno = %2d (%-30s) — %s\n", 0, "成功", strerror(0));

    /* 遍历一些常见的 errno 值 */
    /* EACCES EEXIST EINVAL ENOENT ENOMEM EPERM ERANGE
     * 这些宏都在 <errno.h> 中定义 */
    printf("\n常用 errno 常量:\n");

    /* 注意：有些 errno 值在不同操作系统上数值不同
     * 应始终使用宏名而非硬编码的数值 */
#ifdef EACCES
    errno = EACCES;
    printf("  EACCES (%2d): %s\n", EACCES, strerror(EACCES));
#endif
#ifdef EEXIST
    errno = EEXIST;
    printf("  EEXIST (%2d): %s\n", EEXIST, strerror(EEXIST));
#endif
#ifdef EINVAL
    errno = EINVAL;
    printf("  EINVAL (%2d): %s\n", EINVAL, strerror(EINVAL));
#endif
#ifdef ENOENT
    errno = ENOENT;
    printf("  ENOENT (%2d): %s\n", ENOENT, strerror(ENOENT));
#endif
#ifdef ENOMEM
    errno = ENOMEM;
    printf("  ENOMEM (%2d): %s\n", ENOMEM, strerror(ENOMEM));
#endif
#ifdef EPERM
    errno = EPERM;
    printf("  EPERM  (%2d): %s\n", EPERM, strerror(EPERM));
#endif
#ifdef ERANGE
    errno = ERANGE;
    printf("  ERANGE (%2d): %s\n", ERANGE, strerror(ERANGE));
#endif
#ifdef EBADF
    errno = EBADF;
    printf("  EBADF  (%2d): %s\n", EBADF, strerror(EBADF));
#endif
#ifdef EAGAIN
    errno = EAGAIN;
    printf("  EAGAIN (%2d): %s\n", EAGAIN, strerror(EAGAIN));
#endif

    printf("\n");

    /* ===== 4. 数学函数错误演示 ===== */
    printf("----- 4. 数学函数错误处理 -----\n");

    /* 对数函数的定义域：log(x) 需要 x > 0 */
    double result = log(-1.0);
    if (errno != 0) {
        /* <math.h> 中的函数也可能设置 errno
         * log(-1) 会设置 errno 为 EDOM（定义域错误）*/
        printf("log(-1.0) 结果: %f, errno: %d, 描述: %s\n",
               result, errno, strerror(errno));
    }

    /* ===== 5. 内存分配错误 ===== */
    printf("\n----- 5. 内存分配错误 -----\n");

    /* 尝试分配一个巨大的内存块，可能失败 */
    size_t huge_size = (size_t)-1;  /* 理论上最大可能值 */
    void *ptr = malloc(huge_size);
    if (ptr == NULL) {
        /* malloc 失败时会设置 errno 为 ENOMEM */
        printf("malloc(%zu) 失败!\n", huge_size);
        printf("  errno = %d, 描述: %s\n", errno, strerror(errno));
    } else {
        free(ptr);
    }

    /* ===== 6. 使用 errno 的最佳实践 ===== */
    printf("\n----- 6. 使用 errno 的最佳实践 -----\n");

    printf("1) 函数调用前将 errno 设为 0\n");
    printf("2) 函数返回错误后立即检查 errno\n");
    printf("3) 使用 perror() 快速输出，或 strerror() 获取字符串\n");
    printf("4) 避免检查 errno 来判断成功——检查函数的返回值\n");
    printf("5) errno 是线程安全的（C11 线程本地存储）\n");

    printf("\n============================================\n");
    printf("  程序结束\n");
    printf("============================================\n");

    return 0;
}
