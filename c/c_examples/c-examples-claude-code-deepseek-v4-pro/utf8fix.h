/*
 * ============================================
 * 辅助头文件：解决 Windows 控制台中文输出乱码
 * 说明：
 *   Windows 控制台默认使用 ANSI 代码页（如 GBK），
 *   而本教程源代码为 UTF-8 编码，导致中文显示乱码。
 *
 *   本文件直接声明 Win32 API（不引入 windows.h）
 *   在程序启动时将控制台切换为 UTF-8 编码。
 *
 * 使用方法（二选一）：
 *   1. 在 main() 所在文件头部添加：
 *        #include "_utf8fix.h"
 *   2. 编译时指定：
 *        gcc -include _utf8fix.h 源文件.c -o 输出
 * ============================================
 */

#ifndef _UTF8FIX_H
#define _UTF8FIX_H

#ifdef _WIN32
    /* 直接声明 SetConsoleOutputCP，不引入 <windows.h> 以免宏冲突 */
    __declspec(dllimport) int __stdcall SetConsoleOutputCP(unsigned int);

    /* 使用 GCC 构造函数属性在 main() 之前自动执行 */
    __attribute__((constructor))
    static void __utf8fix_init(void) {
        SetConsoleOutputCP(65001);  // CP_UTF8 = 65001
    }
#else
    /* Linux/macOS 终端默认使用 UTF-8，无需额外设置 */
#endif

#endif /* _UTF8FIX_H */
