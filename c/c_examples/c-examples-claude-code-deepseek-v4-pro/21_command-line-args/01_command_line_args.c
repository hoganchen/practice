/*
 * ============================================
 * 知识点：命令行参数
 * 说明：
 *   main() 函数可以接收命令行参数：
 *   int main(int argc, char *argv[])
 *
 *   argc — 参数个数（包括程序名本身）
 *   argv — 参数字符串数组
 *     argv[0] = 程序名称
 *     argv[1] = 第一个参数
 *     argv[2] = 第二个参数
 *     ...
 *     argv[argc-1] = 最后一个参数
 *     argv[argc]   = NULL
 *
 * 编译方法：
 *   gcc 01_command_line_args.c -o 01_command_line_args
 * 运行方法：
 *   ./args hello world 42
 *   ./args --help
 *   ./args --name "John Doe"
 * ============================================
 */

#include <stdio.h>
#include "../utf8fix.h"
#include <stdlib.h>
#include <string.h>

// ========== 简单参数处理 ==========
void simple_demo(int argc, char *argv[]) {
    printf("===== 基本参数信息 =====\n");
    printf("程序名: %s\n", argv[0]);
    printf("参数个数: %d\n", argc);

    if (argc > 1) {
        printf("\n所有参数:\n");
        for (int i = 0; i < argc; i++) {
            printf("  argv[%d] = \"%s\"\n", i, argv[i]);
        }
    } else {
        printf("没有额外参数\n");
    }
}

// ========== 简单选项解析 ==========
void parse_options(int argc, char *argv[]) {
    printf("\n===== 选项解析 =====\n");

    int show_help = 0;
    const char *name = NULL;
    int count = 1;
    int verbose = 0;

    // 从 argv[1] 开始遍历（跳过程序名）
    for (int i = 1; i < argc; i++) {
        if (strcmp(argv[i], "--help") == 0 ||
            strcmp(argv[i], "-h") == 0) {
            show_help = 1;
        }
        else if (strcmp(argv[i], "--name") == 0 ||
                 strcmp(argv[i], "-n") == 0) {
            // 下一个参数是名字
            if (i + 1 < argc) {
                name = argv[++i];
            } else {
                printf("错误: --name 需要参数\n");
            }
        }
        else if (strcmp(argv[i], "--count") == 0 ||
                 strcmp(argv[i], "-c") == 0) {
            if (i + 1 < argc) {
                count = atoi(argv[++i]);
                if (count < 1) count = 1;
            }
        }
        else if (strcmp(argv[i], "--verbose") == 0 ||
                 strcmp(argv[i], "-v") == 0) {
            verbose = 1;
        }
        else if (argv[i][0] == '-') {
            printf("未知选项: %s\n", argv[i]);
        }
        else {
            printf("未知参数: %s\n", argv[i]);
        }
    }

    if (show_help) {
        printf("用法: %s [选项]\n", argv[0]);
        printf("选项:\n");
        printf("  --help, -h         显示帮助\n");
        printf("  --name NAME, -n    指定名字\n");
        printf("  --count N, -c N    重复次数\n");
        printf("  --verbose, -v      详细模式\n");
        return;
    }

    if (verbose) {
        printf("详细模式已开启\n");
        printf("name = %s\n", name ? name : "(未指定)");
        printf("count = %d\n", count);
    }

    // 执行主逻辑
    if (name != NULL) {
        for (int i = 0; i < count; i++) {
            printf("你好，%s！(#%d)\n", name, i + 1);
        }
    }
}

// ========== 计算器程序 ==========
void calculator(int argc, char *argv[]) {
    printf("\n===== 命令行计算器 =====\n");

    if (argc != 4) {
        printf("用法: %s <数字> <运算符> <数字>\n", argv[0]);
        printf("运算符: +, -, x, /\n");
        printf("示例: %s 10 + 5\n", argv[0]);
        return;
    }

    double a = atof(argv[1]);
    double b = atof(argv[3]);
    char op = argv[2][0];
    double result;

    switch (op) {
        case '+': result = a + b; break;
        case '-': result = a - b; break;
        case 'x':
        case '*': result = a * b; break;
        case '/':
            if (b == 0) {
                printf("错误: 除数不能为0\n");
                return;
            }
            result = a / b;
            break;
        default:
            printf("错误: 未知运算符 '%c'\n", op);
            return;
    }

    printf("%.2f %c %.2f = %.2f\n", a, op, b, result);
}

// ========== 环境变量 ==========
void environment_demo(void) {
    printf("\n===== 环境变量 =====\n");

    // 获取指定的环境变量
    const char *path = getenv("PATH");
    if (path != NULL) {
        printf("PATH = %s\n", path);
    }

    const char *home = getenv("HOME");
    if (home != NULL) {
        printf("HOME = %s\n", home);
    }

    // 检查环境变量是否存在
    const char *debug = getenv("DEBUG");
    if (debug != NULL && strcmp(debug, "1") == 0) {
        printf("调试模式已开启\n");
    }

    // 设置环境变量
    #ifdef _WIN32
        // _putenv_s("MY_VAR=my_value");
    #else
        // setenv("MY_VAR", "my_value", 1);
    #endif
}

// ========== main ==========
int main(int argc, char *argv[]) {
    printf("命令行参数示例程序\n");
    printf("========================================\n\n");

    // 基本演示
    simple_demo(argc, argv);

    // 如果有 --calc 参数，进入计算器模式
    if (argc > 1 && strcmp(argv[1], "--calc") == 0) {
        // 去掉 --calc 后重新处理
        calculator(argc - 1, argv + 1);
    } else {
        // 默认：选项解析模式
        parse_options(argc, argv);
    }

    // 环境变量
    environment_demo();

    // ========== 总结 ==========
    printf("\n===== 命令行参数总结 =====\n");

    printf("argc: 参数个数 (至少为 1)\n");
    printf("argv: 参数字符串数组\n");
    printf("  argv[0] = 程序路径/名称\n");
    printf("  argv[1]~argv[argc-1] = 参数\n");
    printf("  argv[argc] = NULL\n");

    printf("\n常用处理方式:\n");
    printf("  1. 简单顺序参数: ./程序 arg1 arg2\n");
    printf("  2. 选项参数: ./程序 --name value\n");
    printf("  3. 混合方式: ./程序 -nv --output file\n");

    printf("\n建议使用 getopt() 或 getopt_long() 处理\n");

    return 0;
}

/*
 * ============================================
 * 关键点总结：
 *
 * 1. main(int argc, char *argv[]) 接收命令行参数
 * 2. argc ≥ 1（至少包括程序名）
 * 3. argv[0] 通常是程序路径或名称
 * 4. argv[argc] == NULL（标准保证）
 * 5. 参数都是字符串，需自行转换（atoi/atof）
 * 6. getenv 获取环境变量
 * 7. 生产环境建议用 getopt 处理选项
 * ============================================
 */
