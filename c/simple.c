#include <stdio.h>

static int s_a = 0x1f1f;
/*
“.text”区储存指令代码,“.data”区和“.bss”区都储存数据,区别是“.data”区保存有初始值的数据,而“.bss”区则保存没有初始值的数据的信息。

“.bss”区的数据虽然不占用磁盘空间,但链接程序仍然会为它们分配地址。一旦程序被装载到内存开始运行,“.bss”区的数据在内存中一定会占据相应大小的空间。

.bss段存放未初始化的全局变量，将.data和.bss分开的理由是为了节约磁盘空间，.bss不占实际的磁盘空间。

bss是英文block started by symbol的简称，通常是指用来存放程序中未初始化的全局变量的一块内存区域，在程序载入时由内核清0。bss段属于静态内存分配。

BSS是说，放到该段上的变量值是零（如果变量是数类型（char, short, int, long, longlong)，那它的值是0，
如果是指针，它的值也是0，如果是结构体，那它每个成员值都是0，如果是数组，每个元素值都是0）。 因为它的值是零，
这些值就不用放到文件里面，反正都是零，在程序加载时，给他找块内存，清零之后，给他们用就是了。

Linux环境下的C语言里，那些变量放到BSS段里面呢，主要是两类：初始值为零的，没有赋初始值的。
再次说明，变量在BSS段，是说明它的值内存是0，所以这些内存不保存在文件中。但是……但是……变量就是一种符号，
它的描述信息，该有的ELF描述信息（比如地址，类型……）还是要写到ELF上的。

当可执行文件加载运行前，会为BSS段中的变量分配足够的空间并全部自动清理（因此，才有未初始化的全局变量的值为0的说法）

https://blog.csdn.net/qq_26626709/article/details/51887085
在ELF格式的可执行文件中，全局内存包括三种：bss、data 和 rodata。
1. bss是指那些没有初始化的和初始化为0的全局变量。
    1.bss 段不存放在程序文件中
    2.由于 bss 段中的变量不需要初始化成特定值（0除外），所以不需要在程序文件中保存其内容，好处是能减小程序文件的大小而节省存储空间

2. data与bss相比，data就容易明白多了，它的名字就暗示着里面存放着数据。当然，如果数据全是零，为了优化考虑，编译器把它当作bss处理。
通俗的说，data指那些初始化过（非零）的非const的全局变量。
    从运行结果：
    对于 .data 段内数据的初始化，是引导加载器加载程序时，通过将程序文件中 .data 段的数据复制到所对应的内存地址空间，
    从而一次性地完成所有变量的初始化

3. rodata的意义同样明显，ro代表read only，即只读数据(const)。关于rodata类型的数据，要注意以下几点：
    常量不一定就放在rodata里，有的立即数直接编码在指令里，存放在代码段(.text)中。
    对于字符串常量，编译器会自动去掉重复的字符串，保证一个字符串在一个可执行文件(EXE/SO)中只存在一份拷贝。
    rodata是在多个进程间是共享的，这可以提高空间利用率。
    在有的嵌入式系统中，rodata放在ROM(如norflash)里，运行时直接读取ROM内存，无需要加载到RAM内存中。

https://stackoverflow.com/questions/9535250/why-is-the-bss-segment-required
https://www.itranslater.com/qa/details/2325759580103508992
https://www.cnblogs.com/amanlikethis/p/3384743.html
https://blog.csdn.net/absurd/article/details/830164
https://www.zhihu.com/question/293002441
https://github.com/ailiang/apue/wiki/.bss%E4%B8%8D%E5%8D%A0%E7%A3%81%E7%9B%98%E7%A9%BA%E9%97%B4%E7%90%86%E8%A7%A3
https://www.geek-share.com/detail/2559992180.html
https://www.geek-share.com/detail/2702391431.html
https://zhuanlan.zhihu.com/p/96812884
https://zhuanlan.zhihu.com/p/28659560
https://ivanzz1001.github.io/records/post/cplusplus/2018/11/12/cpluscplus-segment

https://my.oschina.net/u/4257246/blog/3578953
*/

/*
https://ivanzz1001.github.io/records/post/cplusplus/2018/11/12/cpluscplus-segment#1-linux%E6%AE%B5%E7%AE%A1%E7%90%86
1） VMA和LMA

我们先简要介绍一下VMA和LMA这两个字段：

    VMA(virtual memory address): 程序区段在执行时期的地址

    LMA(load memory address): 某程序区段加载时的地址。因为我们知道程序运行前要经过：编译、链接、装载、运行等过程。装载到哪里呢？ 没错，就是LMA对应的地址里。

一般情况下，LMA和VMA都是相等的，不等的情况主要发生在一些嵌入式系统上。
*/

// static char a_a[1024 * 1024 * 64] = {'A'};  // a_a in data area, file size over 64M
static char a_a[1024 * 1024 * 64];  // a_a in bss erea, file size less than 1M

// for objdump analysis
// objdump -xd simple
int main(void)
{
    static int s_b = 0x2f2f;
    int a = 0x3f3f;

    printf("s_a = 0x%x, s_b = 0x%x, a = 0x%x\n", s_a, s_b, a);
    printf("&s_a = %p, &s_b = %p, &a = %p\n", &s_a, &s_b, &a);

    return 0;
}
