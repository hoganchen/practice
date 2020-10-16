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
    long i, j;
    j = 0;

    // 先执行addr()函数，p指向了栈上一个地址，addr()函数执行完后，该地址被回收，然后在执行loop()函数时，该地址又被分配给j变量，
    // 循环体中，j被+1，然后在循环内部，这个值又被-1，所以就造成了死循环
    printf("p = %p, &i = %p, &j = %p\n", p, &i, &j);

    for (j = 0; j < 10; j++){
        (*p)--;
        j  ;
        printf("%ld\n", j);
    }
}