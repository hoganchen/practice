#include <iostream>
#include <stdio.h>

using namespace std;

void increase_cnt(int x) {
    printf("increase_cnt function: &x = %p, x = %d\n", &x, x);
    x += 1;
}

// 引用传递
void increase_cnt_with_quote(int &x) {
    printf("increase_cnt_with_quote function: &x = %p, x = %d\n", &x, x);
    x += 1;
}

void increase_cnt_with_pointer(int *x) {
    printf("increase_cnt_with_pointer function: &x = %p, x = %p, *x = %d\n", &x, x, *x);
    *x += 1;
}

// g++ -o func_parameter func_parameter.cpp

/*
main function: &x = 0x7ffff39142bc, x = 10
increase_cnt function: &x = 0x7ffff391428c, x = 10
main function: &x = 0x7ffff39142bc, x = 10
increase_cnt_with_quote function: &x = 0x7ffff39142bc, x = 10
main function: &x = 0x7ffff39142bc, x = 11
main function: &p = 0x7ffff39142c0, p = 0x7ffff39142bc, *p = 11
increase_cnt_with_pointer function: &x = 0x7ffff3914288, x = 0x7ffff39142bc, *x = 11
main function: &p = 0x7ffff39142c0, p = 0x7ffff39142bc, *p = 12
main function: &x = 0x7ffff39142bc, x = 12

由上可以看出，引用传递，传递的是实参，而不是实参的拷贝，在函数中，参数的使用是与原始参数一样的使用方式
*/
int main(int argc, char *argv[])
{
    int x = 10;
    printf("main function: &x = %p, x = %d\n", &x, x);
    increase_cnt(x);
    printf("main function: &x = %p, x = %d\n", &x, x);

    increase_cnt_with_quote(x);
    printf("main function: &x = %p, x = %d\n", &x, x);

    int *p = &x;
    printf("main function: &p = %p, p = %p, *p = %d\n", &p, p, *p);
    increase_cnt_with_pointer(p);
    printf("main function: &p = %p, p = %p, *p = %d\n", &p, p, *p);
    printf("main function: &x = %p, x = %d\n", &x, x);

    return 0;
}
