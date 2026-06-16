/*
 * ============================================
 * 知识点：错误处理
 * 说明：
 *   C 语言没有内置的异常机制。错误处理通常
 *   通过以下几种方式实现：
 *
 *   1. 返回值表示错误（最常见）
 *   2. errno 全局变量（<errno.h>）
 *   3. perror() / strerror() 打印错误信息
 *   4. exit() / abort() 终止程序
 *   5. goto + cleanup 模式（资源清理）
 *
 * 编译方法：
 *   gcc 01_error_handling.c -o 01_error_handling
 * ============================================
 */

#include <stdio.h>
#include "../utf8fix.h"
#include <stdlib.h>    // exit, EXIT_FAILURE, EXIT_SUCCESS
#include <string.h>    // strerror
#include <errno.h>     // errno 及其错误码常量
#include <math.h>      // 用于演示数学错误

// ========== 1. 返回值表示错误 ==========
/*
 * 最常见的错误处理方式。
 * 函数返回特殊值表示错误。
 * 优点：简单直观
 * 缺点：可能被忽略
 */

// 除法：返回 1 成功，0 失败（除零）
int safe_divide(int a, int b, double *result) {
    if (b == 0) {
        return 0;  // 返回 0 表示错误
    }
    *result = (double)a / b;
    return 1;  // 返回 1 表示成功
}

// 文件读取
const char* read_file(const char *filename) {
    FILE *fp = fopen(filename, "r");
    if (fp == NULL) {
        return NULL;  // NULL 表示错误
    }
    // ... 读取操作 ...
    fclose(fp);
    return "file content";
}

// ========== 2. errno 错误码 ==========
/*
 * <errno.h> 定义了 errno 全局变量和错误码常量。
 * 很多库函数在出错时设置 errno。
 * 注意：应在函数返回错误后立即检查 errno。
 */

void demonstrate_errno(void) {
    printf("\n--- errno 错误码 ---\n");

    // 尝试打开不存在的文件
    FILE *fp = fopen("nonexistent.txt", "r");
    if (fp == NULL) {
        // errno 被自动设置为 ENOENT（文件不存在）
        printf("fopen() 失败, errno = %d\n", errno);
    }

    // 无效的数学运算
    errno = 0;  // 先清空 errno
    double result = sqrt(-1.0);
    if (errno == EDOM) {
        printf("sqrt(-1) 错误: EDOM (参数超出定义域)\n");
    }

    // 值溢出
    errno = 0;
    double huge = exp(1000.0);
    if (errno == ERANGE) {
        printf("exp(1000) 错误: ERANGE (结果溢出)\n");
    }
}

// ========== 3. perror() 和 strerror() ==========
/*
 * perror(msg)   — 打印 "msg: 错误描述"
 * strerror(n)   — 返回错误码 n 对应的描述字符串
 */

void demonstrate_error_messages(void) {
    printf("\n--- perror() 和 strerror() ---\n");

    // 使用 perror
    FILE *fp = fopen("/root/secret.txt", "r");
    if (fp == NULL) {
        perror("打开文件失败");  // 自动使用当前 errno
    }

    // 使用 strerror
    for (int err = 0; err <= 5; err++) {
        printf("errno %2d: %s\n", err, strerror(err));
    }
}

// ========== 4. exit() 终止程序 ==========
void check_pointer(void *ptr, const char *name) {
    if (ptr == NULL) {
        fprintf(stderr, "错误: %s 分配失败!\n", name);
        // exit(EXIT_FAILURE);  // 立即终止，这里注释掉防止结束程序
        return;  // 用 return 代替以便演示
    }
}

// ========== 5. goto + cleanup 模式 ==========
/*
 * 在 C 中，goto 常用于集中处理资源清理。
 * 当多次分配资源时，避免重复的清理代码。
 */
int process_file(const char *filename) {
    FILE *fp = NULL;
    char *buffer = NULL;
    int ret = -1;  // 默认返回错误

    // 打开文件
    fp = fopen(filename, "r");
    if (fp == NULL) {
        perror("打开文件失败");
        goto cleanup;  // 跳转到清理代码
    }

    // 分配缓冲区
    buffer = (char*)malloc(1024);
    if (buffer == NULL) {
        fprintf(stderr, "内存分配失败\n");
        goto cleanup;
    }

    // 读取文件
    if (fgets(buffer, 1024, fp) == NULL) {
        fprintf(stderr, "读取文件失败\n");
        goto cleanup;
    }

    printf("成功读取: %s\n", buffer);
    ret = 0;  // 成功

cleanup:
    // 集中清理：无论哪个步骤出错，都会执行这里
    if (buffer != NULL) {
        free(buffer);
        printf("  缓冲区已释放\n");
    }
    if (fp != NULL) {
        fclose(fp);
        printf("  文件已关闭\n");
    }
    return ret;
}

// ========== 返回错误码的枚举 ==========
typedef enum {
    ERR_SUCCESS = 0,
    ERR_NULL_POINTER = -1,
    ERR_OUT_OF_MEMORY = -2,
    ERR_FILE_OPEN = -3,
    ERR_FILE_READ = -4,
    ERR_INVALID_PARAM = -5,
} ErrorCode;

const char* error_string(ErrorCode code) {
    switch (code) {
        case ERR_SUCCESS:       return "成功";
        case ERR_NULL_POINTER:  return "空指针";
        case ERR_OUT_OF_MEMORY: return "内存不足";
        case ERR_FILE_OPEN:     return "无法打开文件";
        case ERR_FILE_READ:     return "文件读取错误";
        case ERR_INVALID_PARAM:  return "参数无效";
        default:                return "未知错误";
    }
}

// ========== 主函数 ==========
int main() {
    printf("===== C 语言错误处理 =====\n");

    // ========== 返回值检查 ==========
    printf("\n--- 1. 返回值检查 ---\n");
    double result;
    if (safe_divide(10, 0, &result)) {
        printf("10 / 0 = %.2f\n", result);
    } else {
        printf("错误: 除数不能为 0!\n");
    }

    if (safe_divide(10, 3, &result)) {
        printf("10 / 3 = %.2f\n", result);
    }

    // ========== errno ==========
    demonstrate_errno();

    // ========== perror / strerror ==========
    demonstrate_error_messages();

    // ========== goto cleanup ==========
    printf("\n--- goto cleanup 模式 ---\n");
    process_file("existing_file.txt");   // 演示失败路径

    // 先创建一个文件用于测试
    FILE *test_fp = fopen("existing_file.txt", "w");
    if (test_fp) {
        fprintf(test_fp, "Hello, Error Handling!\n");
        fclose(test_fp);
        process_file("existing_file.txt");  // 演示成功路径
        remove("existing_file.txt");
    }

    // ========== 错误码枚举 ==========
    printf("\n--- 错误码枚举 ---\n");
    ErrorCode errors[] = {
        ERR_SUCCESS, ERR_NULL_POINTER,
        ERR_OUT_OF_MEMORY, ERR_FILE_OPEN,
        ERR_INVALID_PARAM
    };
    for (int i = 0; i < 5; i++) {
        printf("  %s\n", error_string(errors[i]));
    }

    // ========== 错误处理策略总结 ==========
    printf("\n===== 错误处理策略总结 =====\n");
    printf("策略                   | 适用场景\n");
    printf("----------------------|----------------------------\n");
    printf("返回值检查            | 通用，最常用\n");
    printf("errno + perror       | 系统调用/库函数\n");
    printf("goto cleanup         | 多层资源分配/释放\n");
    printf("exit()/abort()       | 致命错误，无法恢复\n");
    printf("错误码枚举            | 大型项目，统一错误码\n");
    printf("setjmp/longjmp       | 深层嵌套的错误恢复\n");

    return 0;
}

/*
 * ============================================
 * 关键点总结：
 *
 * 1. 检查函数返回值是最基本的错误处理
 * 2. errno 包含最后一次错误的错误码
 * 3. perror() 打印错误信息到 stderr
 * 4. strerror() 将错误码转为可读字符串
 * 5. goto + cleanup 模式集中管理资源释放
 * 6. exit() 用于不可恢复的错误
 * 7. 使用枚举定义统一的错误码体系
 * ============================================
 */
