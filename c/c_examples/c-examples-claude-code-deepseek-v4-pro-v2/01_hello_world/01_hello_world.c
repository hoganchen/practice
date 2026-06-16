/*
 * ============================================================
 *  知识点: Hello World —— 第一个C语言程序
 *
 *  本文件覆盖以下核心概念:
 *    1. #include 预处理指令 —— 引入标准输入输出头文件 stdio.h
 *    2. main() 函数 —— C程序的入口点
 *    3. printf() —— 标准输出函数
 *    4. return 0; —— 向操作系统返回退出状态
 *
 *  编译指令:
 *    gcc 01_hello_world.c -o 01_hello_world.exe -std=c11 -Wall
 *
 *  运行指令:
 *    ./01_hello_world.exe
 * ============================================================
 */

/*
 *  #include <stdio.h>
 *  这是一个"预处理指令"（preprocessor directive）。
 *  在编译之前，预处理器会将 stdio.h 文件的内容复制到这里。
 *  stdio.h 全称是 Standard Input Output Header（标准输入输出头文件），
 *  它声明了 printf()、scanf()、getchar() 等函数。
 *  如果忘记包含这个头文件，编译器会发出"隐式声明"警告或错误。
 */
#include "../common/charset.h"
#include <stdio.h>

/*
 *  int main(void)
 *  main 是 C 程序的入口点（entry point）。
 *  操作系统启动程序时，会调用 main() 函数。
 *  "int" 表示该函数返回一个整数值给操作系统。
 *  "void" 表示该函数不接受任何参数（也可以写作 main()，但带 void 更明确）。
 *  标准规定 main() 有两种标准签名:
 *    - int main(void)            —— 不接受命令行参数
 *    - int main(int argc, char *argv[]) —— 接受命令行参数
 */
int main(void)
{
    /*
     *  printf("Hello, World!\n");
     *  printf 是 "print formatted" 的缩写，即"格式化打印"。
     *  它定义在 <stdio.h> 中，用于向标准输出（通常是屏幕）输出文本。
     *  双引号内的内容是"字符串字面量"（string literal）。
     *  \n 是一个"转义序列"（escape sequence），表示换行符（newline）。
     *  其他常见转义序列:
     *    \t  —— 水平制表符（tab）
     *    \\  —— 反斜杠本身
     *    \"  —— 双引号本身
     */
    printf("Hello, World!\n");

    /*
     *  return 0;
     *  return 语句从 main() 函数返回一个值给操作系统。
     *  返回 0 通常表示程序成功执行（success）。
     *  返回非零值（如 1）表示程序遇到错误（failure）。
     *  在 shell 中可以用 echo $? 查看上一个程序的返回值。
     *  注意: C99 标准之后，如果 main() 没有 return 语句，
     *  编译器会自动在末尾插入 return 0; —— 但显式写出是更好的习惯。
     */
    return 0;

    /*
     * 程序执行流程总结:
     *   1. 预处理器处理 #include <stdio.h>
     *   2. 编译器将源代码编译成目标代码
     *   3. 链接器链接标准库，生成可执行文件
     *   4. 操作系统加载并执行程序
     *   5. 程序从 main() 开始执行
     *   6. printf() 输出 "Hello, World!" 到屏幕
     *   7. return 0; 结束程序并返回状态码 0
     */
}
