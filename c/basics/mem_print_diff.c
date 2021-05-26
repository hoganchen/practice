#include <stdio.h>

int const len = 32;
static int i = 0;
static int *pi = NULL;
static unsigned char *pc = NULL;

int main(void)
{
    int x = 0xffffffff;
    // int len = 32;
    // int i = 0;

    /*
    本程序打印栈上内容，由于len, i, pi, pc等变量都在栈上分配，所以存在通过单字节打印与4字节打印的结果不同。
    不同原因在于，上述变量在栈上分配，在执行打印过程，i变量的值发生了变化，所以通过一个字节逐个打印和4个字节逐个打印的结果不一致的情况。
    把这些作为全局变量，全局变量是在全局存储区，而不是栈上分配，这样打印就一致了
    */
    // int *pi = (int *)(&x);
    // unsigned char *pc = (unsigned char *)(&x);
    pi = (int *)(&x);
    pc = (unsigned char *)(&x);

    printf("x address: %p, pi address: %p, pc address: %p\n", &x, pi, pc);
    printf("pi address: %p, pc address: %p\n", &pi, &pc);
    printf("len address: %p, i address: %p\n\n", &len, &i);

    printf("%p ", pc);
    for(i = 0; i < len; i++)
    {
        printf("%02x%02x%02x%02x ", *pc, *(pc+1), *(pc+2), *(pc+3));
        pc += 4;

        if(3 == i % 4)
        {
            printf("\n");
            printf("%p ", pc);
        }
    }
    printf("\n\n");

    printf("%p ", pi);
    for(i = 0; i < len; i++)
    {
        printf("%08x ", *pi);
        pi++;

        if(3 == i % 4)
        {
            printf("\n");
            printf("%p ", pi);
        }
    }
    printf("\n\n");

    return 0;
}
