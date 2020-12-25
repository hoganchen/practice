#include <stdio.h>

void increase_cnt(int x) {
    printf("increase_cnt function: &x = %p, x = %d\n", &x, x);
    x += 1;
}

void increase_cnt_with_pointer(int *x) {
    printf("increase_cnt_with_pointer function: &x = %p, x = %p, *x = %d\n", &x, x, *x);
    *x += 1;
}

/*
main function: &x = 0x7fff79cfeaec, x = 10
increase_cnt function: &x = 0x7fff79cfeacc, x = 10
main function: &x = 0x7fff79cfeaec, x = 10
main function: &p = 0x7fff79cfeaf0, p = 0x7fff79cfeaec, *p = 10
increase_cnt_with_pointer function: &x = 0x7fff79cfeac8, x = 0x7fff79cfeaec, *x = 10
main function: &p = 0x7fff79cfeaf0, p = 0x7fff79cfeaec, *p = 11
main function: &x = 0x7fff79cfeaec, x = 11

由如上打印看出，C语言函数的参数传递都是值传递，在调用函数前，在内存中创建实参的拷贝，然后传递给函数，并在函数调用完成后销毁
在main函数中，指针p的地址为0x7fff79cfeaf0，而在函数中，该地址则为0x7fff79cfeac8，但是这两个地址的值都是val的地址，即0x7fff79cfeaec
可得出在函数调用前，创建了p变量的拷贝，值一样，然后在函数调用中，传递的是原始值的拷贝
*/
int main(void)
{
    int x = 10;
    printf("main function: &x = %p, x = %d\n", &x, x);
    increase_cnt(x);
    printf("main function: &x = %p, x = %d\n", &x, x);

    int *p = &x;
    printf("main function: &p = %p, p = %p, *p = %d\n", &p, p, *p);
    increase_cnt_with_pointer(p);
    printf("main function: &p = %p, p = %p, *p = %d\n", &p, p, *p);
    printf("main function: &x = %p, x = %d\n", &x, x);

    return 0;
}
