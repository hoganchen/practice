#include <stdio.h>


int main() {
    int a[10];
    char b[16];

    printf("sizeof(int) = %lu\n", sizeof(int));
    printf("sizeof(long) = %lu\n", sizeof(long));
    printf("sizeof(long long) = %lu\n", sizeof(long long));
    printf("sizeof(short) = %lu\n", sizeof(short));
    printf("sizeof(char) = %lu\n", sizeof(char));

    printf("sizeof(int *) = %lu\n", sizeof(int *));
    printf("sizeof(long *) = %lu\n", sizeof(long *));
    printf("sizeof(long long *) = %lu\n", sizeof(long long *));
    printf("sizeof(short *) = %lu\n", sizeof(short *));
    printf("sizeof(char *) = %lu\n", sizeof(char *));

    printf("sizeof(a) = %lu\n", sizeof(a));
    printf("sizeof(&a) = %lu\n", sizeof(&a));

    printf("a address: %p\n", a);
    printf("&a address: %p\n", &a);
    printf("&a+1 address: %p\n", &a+1);

    printf("b address: %p\n", b);
    printf("&b address: %p\n", &b);
    printf("&b+1 address: %p\n", &b+1);

    return 0;
}