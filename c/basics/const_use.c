#include <stdio.h>

const int g_int_init = 10;  // rodata
const int g_int_noinit;     // bss

int const int_g_init = 100; // rodata
int const int_g_noinit;     // bss

int g_init = 100;           // bss
int g_noinit;               // bss

/*
修饰一般变量
一般变量是指简单类型的只读变量，这种只读变量在定义时，修饰符const可以用在类型说明符前，也可以用在类型说明符后。例如：
int const i = 2; 或 const int i = 2;

修饰数组
定义或说明一个只读数组可采用如下格式：
int const a[5] = {1, 2, 3, 4, 5}; 或 const int a[5] = {1, 2, 3, 4, 5};

修饰指针
const int *p;           // p可变，p指向的对象不可变(p可以指向别的地址，但是不能通过该指针修改指向对象的值)
int const *p;           // p可变，p指向的对象不可变(p可以指向别的地址，但是不能通过该指针修改指向对象的值)
int * const p;          // p不可变，p指向的对象可变(p不能指向别的地址，但是可以通过该指针修改指向对象的值)
const int * const p;    // 指针p和p指向的对象都不可变(p不能指向别的地址，也不能通过该指针修改指向对象的值)

记忆和理解的方法：先忽略类型名(编译器解析的时候也是忽略类型名)，我们看const离哪个近，“近水楼台先得月”，离谁近就修饰谁。
const int *p; -> const *p;                  // const修饰*p，p是指针，*p是指针指向的对象，不可变，即p可以指向别的地址，但是不能通过该指针修改指向对象的值
int const *p; -> const *p;                  // const修饰*p，p是指针，*p是指针指向的对象，不可变，即p可以指向别的地址，但是不能通过该指针修改指向对象的值
int * const p; -> const p;                  // const修饰p，p是指针不可变，p指向的对象可变，即p不能指向别的地址，但是可以通过该指针修改指向对象的值
const int * const p;; -> const * const p;   // 前一个const修改*p，后一个const修饰p，指针p和p指向的对象都不可变，即p不能指向别的地址，也不能通过该指针修改指向对象的值

修饰函数的参数
const修饰符也可以修饰函数的参数，当不希望这个参数值在函数体内被意外改变时使用。例如：
void func(const int *p)
告诉编译器*p在函数体内不能改变，从而防止了使用者的一些无意的或错误的修改。

修饰函数的返回值
const修饰符也可以修饰函数的返回值，返回值不可被改变。例如：
const int func(void);
*/

int main(void)
{
    // 可通过readelf -S a.out命令查看变量是位于那个段
    printf("&g_int_init = %p, g_int_init = %d\n", &g_int_init, g_int_init);
    printf("&g_int_noinit = %p, g_int_noinit = %d\n", &g_int_noinit, g_int_noinit);
    printf("\n");

    // 表达式必须是可修改的左值
    // g_int_init = 20;
    // g_int_noinit = 20;

    printf("&int_g_init = %p, int_g_init = %d\n", &int_g_init, int_g_init);
    printf("&int_g_noinit = %p, int_g_noinit = %d\n", &int_g_noinit, int_g_noinit);
    printf("\n");

    printf("&g_init = %p, g_init = %d\n", &g_init, g_init);
    printf("&g_noinit = %p, g_noinit = %d\n", &g_noinit, g_noinit);
    printf("\n");

    // error: assignment of read-only variable ‘int_g_init’
    // int_g_init = 20;
    // int_g_noinit = 20;

    // const int *p_const_int = NULL;
    // printf("p_const_int = %p, *p_const_int = %d\n", p_const_int, *p_const_int); // segmentation fault, 不能打印NULL地址的值

    // p_const_int可以指向别的地址，但是不能通过该指针修改所指向地址的值，别的指针或变量可以
    const int *p_const_int = &g_int_noinit;
    int *p_int = &g_int_noinit;

    printf("p_const_int = %p, *p_const_int = %d\n", p_const_int, *p_const_int);
    // *p_const_int = 100; // error: assignment of read-only location ‘*p_const_int’
    // printf("p_const_int = %p, *p_const_int = %d\n", p_const_int, *p_const_int);
    *p_int = 20;
    printf("p_int = %p, *p_int = %d\n", p_int, *p_int);
    printf("p_const_int = %p, *p_const_int = %d\n", p_const_int, *p_const_int);
    printf("\n");

    p_const_int = &g_int_init;
    p_int = &g_int_init;
    printf("p_const_int = %p, *p_const_int = %d\n", p_const_int, *p_const_int);
    // *p_const_int = 1000; // error: assignment of read-only location ‘*p_const_int’
    // printf("p_const_int = %p, *p_const_int = %d\n", p_const_int, *p_const_int);
    // *p_int = 20; // 由于g_int_init变量位于rodata段，所以对它的修改都会引起segmentation fault
    // printf("p_int = %p, *p_int = %d\n", p_int, *p_int);
    // printf("p_const_int = %p, *p_const_int = %d\n", p_const_int, *p_const_int);
    printf("\n");

    p_const_int = &g_init;
    p_int = &g_init;
    printf("p_const_int = %p, *p_const_int = %d\n", p_const_int, *p_const_int);
    // *p_const_int = 1000; // error: assignment of read-only location ‘*p_const_int’
    // printf("p_const_int = %p, *p_const_int = %d\n", p_const_int, *p_const_int);
    *p_int = 20;
    printf("p_int = %p, *p_int = %d\n", p_int, *p_int);
    printf("p_const_int = %p, *p_const_int = %d\n", p_const_int, *p_const_int);
    printf("\n");

    return 0;
}
