#include <stdlib.h>
#include <stdio.h>

void fnl(void), fn2(void), fn3(void), fn4(void);

int main(void) {
    // atexit()函数原型为：int atexit(void (*function)(void));
    atexit(fnl);
    atexit(fn2);
    atexit(fn3);
    atexit(fn4);
    printf("This is executed first.\n");

    return 0;
}

void fnl() {  //main退出后执行的函数
    printf("next.\n");
}

void fn2() {
    printf("executed " );
}

void fn3() {
    printf("is ");
}

void fn4() {
    printf("This ");
}
