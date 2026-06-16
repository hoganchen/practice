/**
 * ============================================================================
 * 知识主题：环境变量（Environment Variables）
 *
 * 什么是环境变量？
 *   环境变量是操作系统维护的一组键值对，用于配置程序运行环境
 *   每个进程都继承其父进程的环境变量副本
 *   常见的环境变量包括：
 *     - PATH：可执行文件搜索路径
 *     - HOME / USERPROFILE：用户主目录
 *     - LANG：系统语言和编码设置
 *     - TEMP / TMP：临时文件目录
 *     - OS：操作系统名称
 *
 * 环境变量操作函数 (C 标准库)：
 *   getenv(name)     - 读取环境变量（C89 标准，所有平台可用）
 *   putenv(str)      - 设置/修改环境变量（POSIX）
 *   setenv(name,value,overwrite) - 设置环境变量（POSIX，推荐）
 *   unsetenv(name)   - 删除环境变量（POSIX）
 *   environ          - 全局外部变量，指向完整的环境变量列表（POSIX）
 *
 * 本示例涵盖：
 *   1. getenv() 读取环境变量（跨平台）
 *   2. putenv() / setenv() / _putenv() 设置环境变量（带平台判断）
 *   3. 遍历 environ 环境变量列表（POSIX / Windows 兼容方式）
 *   4. 处理环境变量不存在的情况（默认值策略）
 *
 * 编译：gcc 06_environment_vars.c -o 06_environment_vars.exe -std=c11 -Wall
 * 运行：.\06_environment_vars.exe
 * ============================================================================
 */

#include "../common/charset.h"
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <stdbool.h>

/*
 * 平台兼容性处理：
 *
 * Windows 和 POSIX 系统在环境变量操作上有差异：
 *
 *   | 操作   | POSIX (Linux/macOS)      | Windows                 |
 *   |--------|--------------------------|--------------------------|
 *   | 读取   | getenv()                 | getenv()                |
 *   | 设置   | setenv() 或 putenv()     | _putenv()               |
 *   | 删除   | unsetenv()               | _putenv("NAME=")        |
 *   | 遍历   | extern char **environ    | GetEnvironmentStrings() |
 *
 * 通过条件编译实现跨平台兼容：
 *   _WIN32 在 Windows 编译环境下自动定义
 */
#if defined(_WIN32)
    /* Windows 平台：使用 _putenv() */
    #include <process.h>      /* 提供 getpid() 声明 */
    #define SET_ENV(name, value)  _putenv(name "=" value)
    #define UNSET_ENV(name)       _putenv(name "=")
#else
    /* POSIX 平台：使用 setenv()（推荐，避免内存泄漏） */
    #include <unistd.h>       /* 提供 getpid(), setenv(), unsetenv() 声明 */
    #define SET_ENV(name, value)  setenv(name, value, 1)
    #define UNSET_ENV(name)       unsetenv(name)
#endif

/* ========================== 工具函数 ========================== */

/**
 * 读取环境变量（带默认值）
 * 功能：读取指定的环境变量，如果不存在则返回默认值
 * 参数 name：环境变量名称
 * 参数 defaultValue：环境变量不存在时返回的默认值
 * 返回值：环境变量的值，或默认值
 *
 * 这是最常用的模式——很多程序在读取环境变量时都会提供默认值
 */
const char* getEnvOrDefault(const char *name, const char *defaultValue) {
    const char *value = getenv(name);

    if (value != NULL) {
        return value;  /* 环境变量存在，返回其值 */
    } else {
        return defaultValue;  /* 环境变量不存在，返回默认值 */
    }
}

/**
 * 读取环境变量（带布尔状态）
 * 功能：读取环境变量，并通过 bool 指针指示是否找到
 * 参数 name：环境变量名称
 * 参数 value：用于输出值的缓冲区
 * 参数 bufSize：缓冲区大小
 * 返回值：找到返回 true，未找到返回 false
 *
 * 不同于 getEnvOrDefault，这种方式让调用者知道
 * 环境变量是否真的存在（而不是使用了默认值）
 */
bool getEnvChecked(const char *name, char *value, size_t bufSize) {
    const char *envValue = getenv(name);

    if (envValue == NULL) {
        return false;  /* 环境变量不存在 */
    }

    /* 将值复制到输出缓冲区，确保不会溢出 */
    strncpy(value, envValue, bufSize - 1);
    value[bufSize - 1] = '\0';  /* 确保字符串以 null 结尾 */
    return true;
}

/* ========================== 演示函数 ========================== */

/**
 * 演示 1：读取常见环境变量
 * 功能：读取系统中最常用的环境变量并显示
 *       演示 getenv() 的基本用法和默认值策略
 */
void demoReadCommonVars(void) {
    printf("========================================\n");
    printf("  演示 1：读取常见环境变量\n");
    printf("========================================\n\n");

    /*
     * 跨平台环境变量名称差异：
     *
     *   Windows 使用 USERPROFILE 表示用户目录
     *   Linux/macOS 使用 HOME 表示用户目录
     *
     * 这里先尝试其中一个，失败时尝试另一个
     */
    const char *home = getenv("USERPROFILE");

    if (home == NULL) {
        /* Windows 没有 USERPROFILE？试试 HOME */
        home = getenv("HOME");
    }
    if (home == NULL) {
        home = getenv("HOMEDRIVE");
    }

    printf("  用户主目录  : %s\n",
           home != NULL ? home : "(未设置)");

    /* 读取 PATH 环境变量 */
    const char *path = getenv("PATH");
    printf("  PATH         : %s\n",
           path != NULL ? path : "(未设置)");

    /* 读取操作系统名称 */
    const char *os = getenv("OS");
    printf("  操作系统     : %s\n",
           os != NULL ? os : "(未设置)");

    /* 读取临时文件目录 */
    const char *temp = getenv("TEMP");
    if (temp == NULL) {
        temp = getenv("TMP");  /* 另一种常见的临时目录变量名 */
    }
    printf("  临时目录     : %s\n",
           temp != NULL ? temp : "(未设置)");

    /* 读取计算机名称 */
    const char *compName = getenv("COMPUTERNAME");
    if (compName == NULL) {
        compName = getenv("HOSTNAME");  /* POSIX 系统的计算机名 */
    }
    printf("  计算机名     : %s\n\n",
           compName != NULL ? compName : "(未设置)");
}

/**
 * 演示 2：带默认值的安全读取
 * 功能：展示 getEnvOrDefault 和 getEnvChecked 的用法
 */
void demoDefaultValues(void) {
    printf("========================================\n");
    printf("  演示 2：默认值策略\n");
    printf("========================================\n\n");

    /*
     * 使用带默认值的版本 —— 这是实际开发中最常用的方式
     * 即使环境变量不存在，程序也能正常继续运行
     */

    /* 读取语言设置（不存在时默认英文） */
    const char *lang = getEnvOrDefault("LANG", "en_US.UTF-8");
    printf("  语言设置       : %s\n", lang);

    /* 读取编辑器设置（不存在时默认 notepad / vi） */
#if defined(_WIN32)
    const char *defaultEditor = "notepad.exe";
#else
    const char *defaultEditor = "vi";
#endif
    const char *editor = getEnvOrDefault("EDITOR", defaultEditor);
    printf("  默认编辑器     : %s\n", editor);

    /* 读取日志级别（不存在时默认 info） */
    /*
     * 很多程序支持通过 MYAPP_LOG_LEVEL 这样的自定义环境变量
     * 来控制日志详细程度
     */
    const char *logLevel = getEnvOrDefault("MYAPP_LOG_LEVEL", "info");
    printf("  日志级别       : %s\n\n", logLevel);

    /* 使用带状态检查的版本 */
    printf("  --- getEnvChecked 演示 ---\n");

    char buffer[256];
    bool found = getEnvChecked("PATH", buffer, sizeof(buffer));

    if (found) {
        printf("  读取 PATH 成功，长度：%zu 字节\n", strlen(buffer));
        if (strlen(buffer) > 60) {
            /* 如果 PATH 太长，只显示前 60 个字符 */
            printf("  PATH (前60字符) : %.60s...\n", buffer);
        } else {
            printf("  PATH             : %s\n", buffer);
        }
    } else {
        printf("  PATH 环境变量不存在\n");
    }

    /* 检查一个肯定不会存在的变量 */
    found = getEnvChecked("THIS_VAR_SHOULD_NOT_EXIST_12345",
                          buffer, sizeof(buffer));
    printf("  检查不存在的变量: %s\n",
           found ? "找到了（意外）" : "未找到（符合预期）");
    printf("\n");
}

/**
 * 演示 3：设置和修改环境变量
 * 功能：展示如何设置新的环境变量或修改已有的环境变量
 *
 * 注意：
 *   - setenv()/putenv() 修改的是当前进程的环境变量
 *   - 不会影响父进程（shell）的环境变量
 *   - 对于子进程：通过 exec() 创建的子进程会继承修改后的环境变量
 *   - 这是环境变量的一个重要特性：每个进程都有自己独立的副本
 */
void demoSetEnvVar(void) {
    printf("========================================\n");
    printf("  演示 3：设置/修改环境变量\n");
    printf("========================================\n\n");

    /*
     * 设置自定义环境变量
     * 这里设置一个只对当前进程有效的 MYAPP_CONFIG 变量
     */
    printf("  设置 MYAPP_CONFIG = /etc/myapp/config.ini\n");

    /*
     * SET_ENV 宏根据平台自动选择正确的函数：
     *   Windows: _putenv("MYAPP_CONFIG=/etc/myapp/config.ini")
     *   POSIX:   setenv("MYAPP_CONFIG", "/etc/myapp/config.ini", 1)
     *
     * 注意：putenv() 在 POSIX 中也可以使用，
     * 但 putenv() 不会复制字符串（可能导致野指针问题）
     * 推荐使用 setenv()（POSIX）或 _putenv()（Windows）
     */
    int result = SET_ENV("MYAPP_CONFIG", "/etc/myapp/config.ini");

    if (result == 0) {
        printf("  设置成功！\n");
    } else {
        printf("  设置失败（错误码：%d）\n", result);
    }

    /* 验证设置是否生效 */
    const char *verify = getenv("MYAPP_CONFIG");
    printf("  验证读取 : %s\n",
           verify != NULL ? verify : "(读取失败)");

    /*
     * 修改已有环境变量
     * 在修改 PATH 时一定要小心！
     * 错误的修改可能导致程序找不到重要的系统命令
     */
    printf("\n  修改已有变量 MYAPP_CONFIG...\n");
    SET_ENV("MYAPP_CONFIG", "/opt/myapp/config.json");

    verify = getenv("MYAPP_CONFIG");
    printf("  修改后读取 : %s\n", verify);

    /* 注意：这种修改只对当前进程和它的子进程有效 */
    printf("\n  > 重要提示：环境变量修改仅影响当前进程！\n");
    printf("  > 退出程序后，shell 中的环境变量保持原样\n");
    printf("  > 通过 system() 启动的子进程会继承修改后的环境变量\n\n");
}

/**
 * 演示 4：通过 system() 观察环境变量传递
 * 功能：启动子进程并观察环境变量如何传递给子进程
 */
void demoChildProcess(void) {
    printf("========================================\n");
    printf("  演示 4：子进程继承环境变量\n");
    printf("========================================\n\n");

    /* 先设置一个变量 */
    SET_ENV("MYAPP_MODE", "debug");

    /*
     * system() 函数创建一个子进程执行命令
     * 子进程会继承当前进程的环境变量（包括刚设置的 MYAPP_MODE）
     *
     * Windows: cmd /c echo %MYAPP_MODE%
     * POSIX:   sh -c echo $MYAPP_MODE
     */
#if defined(_WIN32)
    printf("  通过子进程读取 MYAPP_MODE：\n");
    system("cmd /c echo   子进程输出：MYAPP_MODE = %MYAPP_MODE%");
#else
    printf("  通过子进程读取 MYAPP_MODE：\n");
    system("echo 子进程输出：MYAPP_MODE = $MYAPP_MODE");
#endif
    printf("  证明：子进程继承了当前进程的环境变量！\n\n");
}

/**
 * 演示 5：遍历所有环境变量（仅显示前 10 个）
 * 功能：使用 environ 全局变量遍历所有环境变量
 *
 * 注意：
 *   POSIX 中可以直接使用 extern char **environ
 *   Windows 中没有 environ，但可以使用 GetEnvironmentStrings()
 *   但为了跨平台简单，这里用另一种方法：通过 system() 调用
 *   或者直接打印环境变量列表的一部分
 */
void demoEnvironVar(void) {
    printf("========================================\n");
    printf("  演示 5：遍历所有环境变量（部分）\n");
    printf("========================================\n\n");

    /*
     * 方法1：使用 system() 调用系统命令
     *   Windows: set 命令输出所有环境变量
     *   POSIX:   env 命令输出所有环境变量
     *
     * 这里只显示前 10 行，避免输出过多
     */
#if defined(_WIN32)
    printf("  执行 set 命令（显示前 20 行）:\n");
    system("cmd /c set 2>&1 | head -20");
#else
    printf("  执行 env 命令（显示前 20 行）:\n");
    system("env 2>&1 | head -20");
#endif

    printf("\n  ... (更多环境变量未显示) ...\n");
    printf("\n  > 提示：完整列表可以用 system(\"set\") 查看\n");
    printf("  > 环境变量数量通常有 20-50 个\n\n");
}

/**
 * 演示 6：环境变量配置程序行为
 * 功能：展示一个常用模式——通过环境变量控制程序行为
 *
 * 这是一个模拟场景：程序根据环境变量调整行为
 * 类似于 DEBUG 模式、详细输出模式等
 */
void demoConfigBehavior(void) {
    printf("========================================\n");
    printf("  演示 6：环境变量配置程序行为\n");
    printf("========================================\n\n");

    /*
     * 模拟：根据环境变量配置程序行为
     * 这是一种非常常见的实践，例如：
     *   - DB_HOST：数据库主机地址
     *   - DB_PORT：数据库端口
     *   - DEBUG：是否开启调试模式
     *   - LOG_LEVEL：日志级别
     */

    printf("  程序配置（从环境变量读取）：\n");

    /* 调试模式：存在且值为 1 时开启 */
    const char *debug = getenv("MYAPP_DEBUG");
    bool debugMode = (debug != NULL && strcmp(debug, "1") == 0);
    printf("    调试模式      : %s\n", debugMode ? "开启 ✓" : "关闭 ✗");

    /* 端口配置：默认 8080 */
    const char *port = getEnvOrDefault("MYAPP_PORT", "8080");
    printf("    监听端口      : %s\n", port);

    /* 数据库连接字符串 */
    const char *dbHost = getEnvOrDefault("MYAPP_DB_HOST", "localhost");
    const char *dbPort = getEnvOrDefault("MYAPP_DB_PORT", "3306");
    const char *dbName = getEnvOrDefault("MYAPP_DB_NAME", "mydb");
    printf("    数据库         : %s:%s/%s\n", dbHost, dbPort, dbName);

    /* 最大连接数 */
    const char *maxConn = getEnvOrDefault("MYAPP_MAX_CONNECTIONS", "100");
    printf("    最大连接数    : %s\n", maxConn);

    /* 缓存大小 */
    const char *cacheSize = getEnvOrDefault("MYAPP_CACHE_SIZE", "256MB");
    printf("    缓存大小      : %s\n", cacheSize);

    printf("\n  > 提示：可以通过在运行前设置环境变量来配置程序：\n");
#if defined(_WIN32)
    printf("  >   set MYAPP_DEBUG=1 && .\\06_environment_vars.exe\n");
#else
    printf("  >   MYAPP_DEBUG=1 ./06_environment_vars\n");
#endif
    printf("\n");
}

/**
 * 演示 7：删除环境变量
 * 功能：删除已有的环境变量
 */
void demoDeleteEnvVar(void) {
    printf("========================================\n");
    printf("  演示 7：删除环境变量\n");
    printf("========================================\n\n");

    /* 先确认变量存在 */
    printf("  检查 MYAPP_CONFIG 是否存在...\n");
    const char *val = getenv("MYAPP_CONFIG");

    if (val != NULL) {
        printf("  当前值：%s\n", val);
    } else {
        printf("  MYAPP_CONFIG 不存在，先创建一个...\n");
        SET_ENV("MYAPP_CONFIG", "temporary_value");
        printf("  已创建，值：%s\n", getenv("MYAPP_CONFIG"));
    }

    /* 删除环境变量 */
    printf("\n  删除 MYAPP_CONFIG...\n");
    UNSET_ENV("MYAPP_CONFIG");

    /* 验证 */
    val = getenv("MYAPP_CONFIG");
    printf("  删除后读取：%s\n",
           val == NULL ? "(已删除，值为 NULL)" : val);
    printf("\n");
}

/* ========================== 主函数 ========================== */

int main(void) {
    printf("============================================================\n");
    printf("  环境变量操作演示程序\n");
    printf("============================================================\n\n");

#if defined(_WIN32)
    printf("  平台：Windows\n");
#else
    printf("  平台：POSIX (Linux/Unix/macOS)\n");
#endif
    printf("  进程 ID：%d\n\n", (int)getpid());

    /*
     * 环境变量的核心特性：
     *
     *   1. 继承性：子进程继承父进程的环境变量副本
     *   2. 独立性：每个进程有独立的环境变量副本
     *   3. 持久性：修改不影响其他进程（包括父进程）
     *   4. 全局性：同一进程的所有线程共享环境变量
     *
     * 本程序将演示这些特性以及常用的环境变量操作函数
     */

    /* 运行各演示函数 */
    demoReadCommonVars();
    demoDefaultValues();
    demoSetEnvVar();
    demoChildProcess();
    demoEnvironVar();
    demoConfigBehavior();
    demoDeleteEnvVar();

    printf("========================================\n");
    printf("  总结\n");
    printf("========================================\n\n");
    printf("  1. getenv() 读取环境变量，推荐配合默认值使用\n");
    printf("  2. putenv()/_putenv()/setenv() 设置环境变量\n");
    printf("  3. 环境变量修改仅影响当前进程和子进程\n");
    printf("  4. 使用默认值策略可以提高程序的健壮性\n");
    printf("  5. 环境变量是轻量级的程序配置方式\n");
    printf("  6. 自定义环境变量可以方便地控制程序行为\n\n");
    printf("  演示结束。\n");

    return 0;
}
