#include <stdio.h>
#include "str.h"

// 切换如下两种变量声明，并比较命令行打印结果
// extern char *buff;
extern char buff[];

/*
因为指针是变量，但凡变量都客观存在，都有一块实际的内存；引用一个变量要两步，先找到它的地址，再通过地址找它；所以若要给指针指向的值赋值，就要：取指针地址，通过指针地址取指针值，用寄存器寻址方式去赋值，所以它有两次LDR。
但是数组名不是变量，所以它不客观存在，它没有地址，引用它，就一步到位找到它的值了。

hogan@hogan$ gcc -o str_main str_main.c str.c -I./
hogan@hogan$ ./str_main
Segmentation fault (core dumped)

*/
int main(void)
{
    printf("buff address: 0x%p\n\n", buff);
    buff[0] = 'a';
    for(int i = 0; i < ARR_LEN; i++) {
        printf("buff[%02d] = 0x%02x\n", i, buff[i]);
    }
    return 0;
}
