#include <stdio.h>

struct str{
    int len;
    char s[0];
};

struct foo {
    struct str *a;
};

int main(void) {
    // struct str *a指向了0地址，则成员s指向了0x4地址
    struct foo f={0};

    if (f.a->s) {
        // crush, 访问0x4的地址
        // printf("%s\n", f.a->s);
        // printf("%x\n", f.a->s);

        // no crush, 打印f.a->s的地址
        printf("%p\n", f.a->s);
    }

    return 0;
}
