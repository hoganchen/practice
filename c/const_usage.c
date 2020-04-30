#include <stdio.h>

int main(void)
{
    int ui = 0x10;
    int uj = 0x20;
    const int ci = 10;

    printf("ci = 0x%x\n", ci);

    // const变量不可重新赋值, error: assignment of read-only variable ‘ci’
    // ci = 20;
    // print("ci = %x\n", ci);

    // p_cj可以指向别的地址，但是地址的值是不可修改的，不可修改是该p_cj指针不可修改所指地址的值，但别的变量或者指针可以，以下两种写法都是相同效果
    const int *p_cj = &uj;  // const的对象是*p，即是P所指地址的值不可修改
    // int const *p_cj = &uj;
    printf("p_cj: %p, *p_cj: 0x%x\n", p_cj, *p_cj);
    p_cj = &ui;
    printf("p_cj: %p, *p_cj: 0x%x\n", p_cj, *p_cj);
    // error: assignment of read-only location ‘*p_cj’
    // *p_cj = 0x40;
    // printf("p_cj: %p, *p_cj: 0x%x\n", p_cj, *p_cj);
    ui = 0x40;
    printf("p_cj: %p, *p_cj: 0x%x\n", p_cj, *p_cj);

    int const *p_ck = &uj;
    printf("p_ck: %p, *p_ck: 0x%x\n", p_ck, *p_ck);
    p_ck = &ui;
    printf("p_ck: %p, *p_ck: 0x%x\n", p_ck, *p_ck);

    // p_cm不能指向别的地址，但是可以用*p_cm修改所指地址的值
    int * const p_cm = &uj;  // const的对象是p，即是P不可指向别的地址
    printf("p_cm: %p, *p_cm: 0x%x\n", p_cm, *p_cm);
    // error: assignment of read-only variable ‘p_cm’
    // p_cm = &ui;
    // printf("p_cm: %p, *p_cm: 0x%x\n", p_cm, *p_cm);
    uj = 0x30;
    printf("p_cm: %p, *p_cm: 0x%x\n", p_cm, *p_cm);
    *p_cm = 0x40;
    printf("p_cm: %p, *p_cm: 0x%x\n", p_cm, *p_cm);

    // p_cn不能指向别的地址，并且也不可以用*p_cm修改所指地址的值，但别的变量或者指针可以修改该地址的值
    const int * const p_cn = &uj;
    printf("p_cn: %p, *p_cn: 0x%x\n", p_cn, *p_cn);
    // error: assignment of read-only variable ‘p_cn’
    // p_cn = &ui;
    // printf("p_cn: %p, *p_cn: 0x%x\n", p_cn, *p_cn);
    uj = 0x30;
    printf("p_cn: %p, *p_cn: 0x%x\n", p_cn, *p_cn);
    // error: assignment of read-only location ‘*p_cn’
    // *p_cn = 0x40;
    // printf("p_cn: %p, *p_cn: 0x%x\n", p_cn, *p_cn);

    return 0;
}