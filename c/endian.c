#include <stdio.h>

//return 1 : little-endian
//       0 : big-endian
int checkCPUendian()
{
    union {
        unsigned int a;
        unsigned char b;
    } c;

    c.a = 1;
    return (c.b == 1);
}

/*
http://blog.cuicc.com/blog/2011/06/11/host-endian-and-net-endian/

字节序(endian)是指存放多个字节的顺序，典型的字节序分类为主机字节序和网络字节序。
主机字节序(host endian)是指整数在内存中存放的顺序，有大端字节序(big-endian)和小端字节序(little-endian)两种。
网络字节序(net endian)是指TCP/IP中规定的数据表示格式，与CPU、OS无关，采用大端字节序(big-endian)存放方式。

大端字节序(big-endian)

大端字节序是指将高位字节存储在低地址空间中，也就是地址低位存储值的高位，地址高位存储值的低位。这种存储方式比较直观，阅读方便。
以四字节16进制0x01020304在内存中的存储顺序为例，假设起始地址为1000:
1000    1001    1002    1003
01  |   02  |   03  |   04

小端字节序(little-endian)

小端字节序是指将低位字节存储在低地址空间中，也就是地址低位存储值的低位，地址高位存储值的高位。这种存储方式符合我们的思维方式，比如珠算。
同样以0x01020304为例:
1000    1001    1002    1003
04  |   03  |   02  |   01

PC中的CPU大多数是以小端字节序处理多字节数据的，而网络传输时TCP/IP中是以大端字节序存储数据的。
所以在使用socket处理主机到网络或网络到主机的数据时需要大小端字节序转换。转换函数htons(), htonl(), ntohs(), ntohl().
*/
int main(void)
{
    int x = 0x12345678;

#if 0
    char *p = (char *)&x;

    printf("p = %02x\n", *p);

    if(0x78 == *p) {
        printf("Little Endian\n");
    } else {
        printf("Big Endian\n");
    }
#else
    char y = *(char *)&x;

    if(0x78 == y) {
        printf("Little Endian\n");
    } else {
        printf("Big Endian\n");
    }
#endif

    if (checkCPUendian()) {
        printf("Little Endian\n");
    } else {
        printf("Big Endian\n");
    }

    /* code */
    return 0;
}