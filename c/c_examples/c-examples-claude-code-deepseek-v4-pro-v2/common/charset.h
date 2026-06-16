/**
 * ============================================================
 *  charset.h —— 控制台字符集兼容性处理
 *
 *  用途：解决 Windows 控制台中文乱码问题。
 *        源码为 UTF-8 编码，Windows 终端默认使用 GBK（CP936），
 *        导致 printf 输出的中文显示为乱码。
 *
 *  原理：利用 GCC __attribute__((constructor)) 机制，
 *        在 main() 执行之前自动调用 system("chcp 65001")，
 *        将控制台代码页切换为 UTF-8。
 *
 *  使用方法：
 *    在 .c 文件中添加 #include "../common/charset.h"
 *    即可自动生效，无需修改任何代码。
 *
 *  兼容性：
 *    - Windows（MinGW GCC）：自动执行 chcp 65001 切换编码
 *    - Linux/macOS（GCC/Clang）：空操作，终端原生支持 UTF-8
 *    - MSVC：不支持 __attribute__，需手动在 main() 开头添加
 *             system("chcp 65001 > nul");
 *
 *  注意：不依赖 windows.h，因此不会引发任何命名冲突。
 * ============================================================
 */

#ifndef COMMON_CHARSET_H
#define COMMON_CHARSET_H

#ifdef _WIN32
    /*
     * GCC __attribute__((constructor))
     * 这是 GCC 扩展属性，指示编译器在 main() 函数执行之前
     * 自动调用被修饰的函数。MinGW-w64 和 Linux GCC 均支持。
     *
     * IDE 的 IntelliSense 可能不认识此语法（显示红色波浪线），
     * 但 MinGW GCC 编译完全正常，无任何警告或错误。
     */
    #include <stdlib.h>

    static void __attribute__((constructor)) _common_charset_init(void)
    {
        /*
         * chcp 65001 将 Windows 控制台的活动代码页设为 UTF-8。
         * "> nul" 重定向抑制命令本身的输出信息。
         * 65001 是 UTF-8 代码页的编号（CP_UTF8）。
         */
        system("chcp 65001 > nul");
    }
#else
    /* Linux / macOS：终端原生支持 UTF-8，无需任何处理 */
#endif

#endif /* COMMON_CHARSET_H */
