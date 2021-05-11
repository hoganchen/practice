#include <stdio.h>

int bar(int c, int d)
{
	int e = c + d;
	return e;
}

int foo(int a, int b)
{
	return bar(a, b);
}

/*
http://docs.linuxtone.org/ebooks/C&CPP/c/ch19s01.html

如果在编译时加上-g选项（在第 10 章 gdb讲过-g选项），那么用objdump反汇编时可以把C代码和汇编代码穿插起来显示，
这样C代码和汇编代码的对应关系看得更清楚。反汇编的结果很长，以下只列出我们关心的部分。

$ gcc main.c -g
$ objdump -dS a.out

要查看编译后的汇编代码，其实还有一种办法是gcc -S main.c，这样只生成汇编代码main.s，而不生成二进制的目标文件。

整个程序的执行过程是main调用foo，foo调用bar，我们用gdb跟踪程序的执行，
直到bar函数中的int e = c + d;语句执行完毕准备返回时，这时在gdb中打印函数栈帧。

chenlianghong@chenlianghong-Latitude-E5270:~/Documents/Docs/language_study/c$ gdb a.out
GNU gdb (Ubuntu 7.11.1-0ubuntu1~16.5) 7.11.1
Copyright (C) 2016 Free Software Foundation, Inc.
License GPLv3+: GNU GPL version 3 or later <http://gnu.org/licenses/gpl.html>
This is free software: you are free to change and redistribute it.
There is NO WARRANTY, to the extent permitted by law.  Type "show copying"
and "show warranty" for details.
This GDB was configured as "x86_64-linux-gnu".
Type "show configuration" for configuration details.
For bug reporting instructions, please see:
<http://www.gnu.org/software/gdb/bugs/>.
Find the GDB manual and other documentation resources online at:
<http://www.gnu.org/software/gdb/documentation/>.
For help, type "help".
Type "apropos word" to search for commands related to "word"...
Reading symbols from a.out...done.
(gdb) start
Temporary breakpoint 1 at 0x400513: file c_call_stack.c, line 129.
Starting program: /home/chenlianghong/Documents/Docs/language_study/c/a.out

Temporary breakpoint 1, main () at c_call_stack.c:129
129             foo(2, 3);
(gdb) s
foo (a=2, b=3) at c_call_stack.c:11
11              return bar(a, b);
(gdb) s
bar (c=2, d=3) at c_call_stack.c:5
5               int e = c + d;
(gdb) disassemble
Dump of assembler code for function bar:
   0x00000000004004d6 <+0>:     push   %rbp
   0x00000000004004d7 <+1>:     mov    %rsp,%rbp
   0x00000000004004da <+4>:     mov    %edi,-0x14(%rbp)
   0x00000000004004dd <+7>:     mov    %esi,-0x18(%rbp)
=> 0x00000000004004e0 <+10>:    mov    -0x14(%rbp),%edx
   0x00000000004004e3 <+13>:    mov    -0x18(%rbp),%eax
   0x00000000004004e6 <+16>:    add    %edx,%eax
   0x00000000004004e8 <+18>:    mov    %eax,-0x4(%rbp)
   0x00000000004004eb <+21>:    mov    -0x4(%rbp),%eax
   0x00000000004004ee <+24>:    pop    %rbp
   0x00000000004004ef <+25>:    retq
End of assembler dump.
(gdb) si
0x00000000004004e3      5               int e = c + d;
(gdb) si
0x00000000004004e6      5               int e = c + d;
(gdb) si
0x00000000004004e8      5               int e = c + d;
(gdb) si
6               return e;
(gdb) si
7       }
(gdb) bt
#0  bar (c=2, d=3) at c_call_stack.c:7
#1  0x000000000040050d in foo (a=2, b=3) at c_call_stack.c:11
#2  0x0000000000400522 in main () at c_call_stack.c:129
(gdb) info registers
rax            0x5      5
rbx            0x0      0
rcx            0x0      0
rdx            0x2      2
rsi            0x3      3
rdi            0x2      2
rbp            0x7fffffffd858   0x7fffffffd858
rsp            0x7fffffffd858   0x7fffffffd858
r8             0x4005a0 4195744
r9             0x7ffff7de7af0   140737351940848
r10            0x846    2118
r11            0x7ffff7a2d750   140737348032336
r12            0x4003e0 4195296
r13            0x7fffffffd960   140737488345440
r14            0x0      0
r15            0x0      0
rip            0x4004ee 0x4004ee <bar+24>
eflags         0x206    [ PF IF ]
cs             0x33     51
---Type <return> to continue, or q <return> to quit---
ss             0x2b     43
ds             0x0      0
es             0x0      0
fs             0x0      0
gs             0x0      0
(gdb) x/20 $esp
0xffffffffffffd858:     Cannot access memory at address 0xffffffffffffd858
(gdb) x/20 $rsp
0x7fffffffd858: -10128  32767   4195597 0
0x7fffffffd868: 3       2       -10112  32767
0x7fffffffd878: 4195618 0       4195632 0
0x7fffffffd888: -140322752      32767   1       0
0x7fffffffd898: -9880   32767   -134230880      1
(gdb)

这里又用到几个新的gdb命令。disassemble可以反汇编当前函数或者指定的函数，单独用disassemble命令是反汇编当前函数，
如果disassemble命令后面跟函数名或地址则反汇编指定的函数。以前我们讲过step命令可以一行代码一行代码地单步调试，
而这里用到的si命令可以一条指令一条指令地单步调试。info registers可以显示所有寄存器的当前值。在gdb中表示寄存器名时前面要加个$，
例如p $esp可以打印esp寄存器的值，在上例中esp寄存器的值是0xbff1c3f4，所以x/20 $esp命令查看内存中从0xbff1c3f4地址开始的20个32位数。
在执行程序时，操作系统为进程分配一块栈空间来存储函数栈帧，esp寄存器总是指向栈顶，在x86平台上这个栈是从高地址向低地址增长的，
我们知道每次调用一个函数都要分配一个栈帧来存储参数和局部变量，现在我们详细分析这些数据是怎么存储的，根据gdb的输出结果图示如下[27]：
*/
int main(void)
{
	foo(2, 3);
	return 0;
}
