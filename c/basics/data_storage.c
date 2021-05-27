#include <stdio.h>

/*
readelf -a const_use > const_use.log

Section Headers:
  [Nr] Name              Type             Address           Offset
       Size              EntSize          Flags  Link  Info  Align
  [ 0]                   NULL             0000000000000000  00000000
       0000000000000000  0000000000000000           0     0     0
  [ 1] .interp           PROGBITS         0000000000400238  00000238
       000000000000001c  0000000000000000   A       0     0     1
  [ 2] .note.ABI-tag     NOTE             0000000000400254  00000254
       0000000000000020  0000000000000000   A       0     0     4
  [ 3] .note.gnu.build-i NOTE             0000000000400274  00000274
       0000000000000024  0000000000000000   A       0     0     4
  [ 4] .gnu.hash         GNU_HASH         0000000000400298  00000298
       000000000000001c  0000000000000000   A       5     0     8
  [ 5] .dynsym           DYNSYM           00000000004002b8  000002b8
       0000000000000090  0000000000000018   A       6     1     8
  [ 6] .dynstr           STRTAB           0000000000400348  00000348
       0000000000000062  0000000000000000   A       0     0     1
  [ 7] .gnu.version      VERSYM           00000000004003aa  000003aa
       000000000000000c  0000000000000002   A       5     0     2
  [ 8] .gnu.version_r    VERNEED          00000000004003b8  000003b8
       0000000000000030  0000000000000000   A       6     1     8
  [ 9] .rela.dyn         RELA             00000000004003e8  000003e8
       0000000000000018  0000000000000018   A       5     0     8
  [10] .rela.plt         RELA             0000000000400400  00000400
       0000000000000060  0000000000000018  AI       5    24     8
  [11] .init             PROGBITS         0000000000400460  00000460
       000000000000001a  0000000000000000  AX       0     0     4
  [12] .plt              PROGBITS         0000000000400480  00000480
       0000000000000050  0000000000000010  AX       0     0     16
  [13] .plt.got          PROGBITS         00000000004004d0  000004d0
       0000000000000008  0000000000000000  AX       0     0     8
  [14] .text             PROGBITS         00000000004004e0  000004e0
       00000000000003c2  0000000000000000  AX       0     0     16
  [15] .fini             PROGBITS         00000000004008a4  000008a4
       0000000000000009  0000000000000000  AX       0     0     4
  [16] .rodata           PROGBITS         00000000004008b0  000008b0
       00000000000001f6  0000000000000000   A       0     0     8
  [17] .eh_frame_hdr     PROGBITS         0000000000400aa8  00000aa8
       0000000000000034  0000000000000000   A       0     0     4
  [18] .eh_frame         PROGBITS         0000000000400ae0  00000ae0
       00000000000000f4  0000000000000000   A       0     0     8
  [19] .init_array       INIT_ARRAY       0000000000600e10  00000e10
       0000000000000008  0000000000000000  WA       0     0     8
  [20] .fini_array       FINI_ARRAY       0000000000600e18  00000e18
       0000000000000008  0000000000000000  WA       0     0     8
  [21] .jcr              PROGBITS         0000000000600e20  00000e20
       0000000000000008  0000000000000000  WA       0     0     8
  [22] .dynamic          DYNAMIC          0000000000600e28  00000e28
       00000000000001d0  0000000000000010  WA       6     0     8
  [23] .got              PROGBITS         0000000000600ff8  00000ff8
       0000000000000008  0000000000000008  WA       0     0     8
  [24] .got.plt          PROGBITS         0000000000601000  00001000
       0000000000000038  0000000000000008  WA       0     0     8
  [25] .data             PROGBITS         0000000000601038  00001038
       0000000000000038  0000000000000000  WA       0     0     8
  [26] .bss              NOBITS           0000000000601080  00001070
       0000000000000120  0000000000000000  WA       0     0     32
  [27] .comment          PROGBITS         0000000000000000  00001070
       0000000000000035  0000000000000001  MS       0     0     1
  [28] .shstrtab         STRTAB           0000000000000000  00001c8d
       000000000000010c  0000000000000000           0     0     1
  [29] .symtab           SYMTAB           0000000000000000  000010a8
       0000000000000858  0000000000000018          30    55     8
  [30] .strtab           STRTAB           0000000000000000  00001900
       000000000000038d  0000000000000000           0     0     1
Key to Flags:
  W (write), A (alloc), X (execute), M (merge), S (strings), l (large)
  I (info), L (link order), G (group), T (TLS), E (exclude), x (unknown)
  O (extra OS processing required) o (OS specific), p (processor specific)
*/

/*
g_noinit: 0x601188
g_init: 0x601048
g_iarr_noinit: 0x601120
g_iarr_init: 0x6010a0
g_carr_noinit: 0x601148
g_carr_init: 0x601050

g_static_noinit: 0x6010c8
g_static_init: 0x60105c
g_iarr_static_noinit: 0x6010e0
g_iarr_static_init: (nil)
g_carr_static_noinit: 0x601110
g_carr_static_init: 0x601060

g_const_noinit: 0x60119c
g_const_init: 0x4008b8
g_iarr_const_noinit: 0x601160
g_iarr_const_init: (nil)
g_carr_const_noinit: 0x601190
g_carr_const_init: 0x4008c0

l_noinit: 0x7ffd649fe908
l_init: 0x7ffd649fe90c
l_static_noinit: 0x60111c
l_static_init: 0x60106c
l_const_noinit: 0x7ffd649fe910
l_const_init: 0x7ffd649fe914
*/

/*
1. Stack段：局部变量存放区域。
2. heap段：用户动态分配内存区域。
3. bss段：存放未初始化的全局或静态变量内存区域。(Block Started by Symbol)
4. 数据段：通常指存放已初始化的全局变量或静态变量的内存区域。(data segment)
5. 文本段：分成rodata与code段，code段存放程序指令，rodata段是程序中的常量值，如全局常量、字符串常量。可执行文件的文本段包含程序的指令，链接器把指令直接从可执行文件拷贝到内存中，形成文本段。
6. 代码段：通常指存放程序执行代码的一块内存区域，存在于文本段中的一块区域。代码段一般是只读的，程序执行时不能随意更改指令，也是为了进行隔离保护。(code segment/text segment)
*/
int g_noinit;                                               // bss
int g_init = 10;                                            // data
int g_iarr_noinit[10];                                      // bss
int g_iarr_init[10] = {0};
unsigned char g_carr_noinit[10];
unsigned char g_carr_init[10] = {'h', 'e', 'l', 'l', '\0'};

static int g_static_noinit;
static int g_static_init = 20;
static int g_iarr_static_noinit[10];
static int g_iarr_static_init = {0};
static unsigned char g_carr_static_noinit[10];
static unsigned char g_carr_static_init[10] = {'h', 'e', 'l', 'l', '\0'};

const int g_const_noinit;
const int g_const_init = 30;
const int g_iarr_const_noinit[10];
const int g_iarr_const_init = {0};
const unsigned char g_carr_const_noinit[10];
const unsigned char g_carr_const_init[10] = {'h', 'e', 'l', 'l', '\0'};

int main(void)
{
    int l_noinit;
    int l_init = 100;
    static int l_static_noinit;
    static int l_static_init = 200;
    const int l_const_noinit;           //栈上分配
    const int l_const_init = 300;       //栈上分配

    printf("g_noinit: %p\n", &g_noinit);
    printf("g_init: %p\n", &g_init);
    printf("g_iarr_noinit: %p\n", g_iarr_noinit);
    printf("g_iarr_init: %p\n", g_iarr_init);
    printf("g_carr_noinit: %p\n", g_carr_noinit);
    printf("g_carr_init: %p\n", g_carr_init);
    printf("\n");

    printf("g_static_noinit: %p\n", &g_static_noinit);
    printf("g_static_init: %p\n", &g_static_init);
    printf("g_iarr_static_noinit: %p\n", g_iarr_static_noinit);
    printf("g_iarr_static_init: %p\n", g_iarr_static_init);
    printf("g_carr_static_noinit: %p\n", g_carr_static_noinit);
    printf("g_carr_static_init: %p\n", g_carr_static_init);
    printf("\n");

    printf("g_const_noinit: %p\n", &g_const_noinit);
    printf("g_const_init: %p\n", &g_const_init);
    printf("g_iarr_const_noinit: %p\n", g_iarr_const_noinit);
    printf("g_iarr_const_init: %p\n", g_iarr_const_init);
    printf("g_carr_const_noinit: %p\n", g_carr_const_noinit);
    printf("g_carr_const_init: %p\n", g_carr_const_init);
    printf("\n");

    printf("l_noinit: %p\n", &l_noinit);
    printf("l_init: %p\n", &l_init);
    printf("l_static_noinit: %p\n", &l_static_noinit);
    printf("l_static_init: %p\n", &l_static_init);
    printf("l_const_noinit: %p\n", &l_const_noinit);
    printf("l_const_init: %p\n", &l_const_init);

    return 0;
}
