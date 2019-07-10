#include <stdio.h>

long long fibonacci(int n) {
    int i = 0;
    long long x = 0, y = 1, temp = 0;

    if (0) {
        if (n < 2) {
            return n;
        }

        return fibonacci(n - 1) + fibonacci(n - 2);
    } else {
        for (i = 0; i < n; i++) {
            // printf("x = %lld\n", x);
            temp = x;
            x = y;
            y = temp + y;
        }
    }

    return x;
}

int main() {
    int i = 0;
    int *p = (int *)(0x7ffec30f4d1c);

    // Segmentation fault (core dumped)
    // printf("p = %p, *p = %x\n", p, *p);
    printf("p = %p\n", p);
    printf("i address: %p\n", &i);
    printf("fibonacci(%d) = %lld\n", 100, fibonacci(100));

    return 0;
}
