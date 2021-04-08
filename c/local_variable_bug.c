#include <stdio.h>

void addr();
void loop();

long *p;
int main() {
    addr();
    loop();
}

void addr() {
    long k;
    k = 0;
    p = &k;
}

void loop() {
    long i, j, k;
    // i = 0;
    k = 0;

    // 先执行addr()函数，p指向了栈上一个地址，addr()函数执行完后，该地址被回收，然后在执行loop()函数时，该地址又被分配给k变量，
    // 循环体中，k被+1，然后在循环内部，这个值又被-1，所以就造成了死循环

    // p = 0x7ffc8e29a7f0, &i = 0x7ffc8e29a7e0, &j = 0x7ffc8e29a7e8, &k = 0x7ffc8e29a7f0
    // 由上述打印即可看出，局部变量在栈上分配，函数内部定义的最后一个局部变量在栈底
    printf("p = %p, &i = %p, &j = %p, &k = %p\n", p, &i, &j, &k);

    for (k = 0; k < 10; k++){
        (*p)--;
        k  ;
        printf("%ld\n", k);

        // i += 1;
        // if(i >= 10)
        // {
        //     break;
        // }
    }
}