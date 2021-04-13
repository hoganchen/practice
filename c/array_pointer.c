#include <stdio.h>

/*
output:

sizeof(int_array) = 16
int_array         = 0x7ffe1288b0c0
p                 = 0x7ffe1288b0c0
&p                = 0x7ffe1288b0b0
pa                = 0x7ffe1288b0c0
&pa               = 0x7ffe1288b0b8
&int_array        = 0x7ffe1288b0c0
&int_array + 1    = 0x7ffe1288b0d0
(&int_array + 1)  = 0x7ffe1288b0d0
(&int_array + 5)  = 0x7ffe1288b110
p + 1             = 0x7ffe1288b0c4
pa + 1            = 0x7ffe1288b0c4
int_array[0]      = 0x7ffe1288b0c0
int_array[1]      = 0x7ffe1288b0c4

*/
int main(void)
{
    int int_array[] = {1, 2, 3, 4};
#if 1
    int *p = int_array, *pa = (int *)&int_array;
#else
    int *p = NULL, *pa = NULL;
    p = int_array;
    pa = (int *)&int_array;
#endif

    printf("sizeof(int_array) = %ld\n", sizeof(int_array));
    printf("int_array         = %p\n", int_array);          //数组的地址
    printf("p                 = %p\n", p);                  //指针p指向的地址
    printf("&p                = %p\n", &p);                 //指针变量p的地址
    printf("pa                = %p\n", pa);                 //指针pa指向的地址
    printf("&pa               = %p\n", &pa);                //指针变量pa的地址
    printf("&int_array        = %p\n", &int_array);         //数组名的地址，由此可看出，数组的地址，数组名的地址以及数组第一个元素都指向同一个地址
    printf("&int_array + 1    = %p\n", &int_array + 1);     //&int_array + 1的地址为数组的地址 + 1*(sizeof(数组))
    printf("(&int_array + 1)  = %p\n", &int_array + 1);     //&int_array + 1的地址为数组的地址 + 1*(sizeof(数组))
    printf("(&int_array + 5)  = %p\n", &int_array + 5);     //&int_array + 1的地址为数组的地址 + 5*(sizeof(数组))
    printf("p + 1             = %p\n", p + 1);              //p + 1的地址为数组第二个元素的地址
    printf("pa + 1            = %p\n", pa + 1);             //pa + 1的地址为数组第二个元素的地址
    printf("int_array[0]      = %p\n", &int_array[0]);
    printf("int_array[1]      = %p\n", &int_array[1]);

    return 0;
}
