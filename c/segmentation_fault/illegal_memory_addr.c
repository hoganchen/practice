#include<stdio.h>
#include<stdlib.h>

/*
这里的怎么回事呢？因为p3指向的是一个随便的内存，注意的是这里的0x.....504代表的不是实际内存，而是虚拟内存，那么当进行地址转换后，发现两种可能：
1.新地址非法，出现段错误（除了 堆区，栈区，全局变量区，只读数据区之外的地址都是非法地址）。

2.发现没有这个地址，于是到交换空间中找，发现也没有，出现段错误。
*/
void main()
{
    int *p3=(int *)0x7fff5f55d504;
    // *p3 = 5;
    printf("p3 adr = %p\n",p3);
    printf("p3 value = 0x%08x\n", *p3);
}