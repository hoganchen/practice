#include <stdio.h>


int main() {
    int a[10];

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

    return 0;
}