#include <stdio.h>
#include <string.h>

void main() {
    float data;
    unsigned long buff;
    int i;
    char s[34];

    // 将0.75以单精度浮点数的形式存储在变量date中。
    data = (float)0.75;

    // 把数据复制到4字节长度的整数变量buff中以逐个提取出每一位。
    memcpy(&buff, &data, 4);

    // 逐一提取出每一位
    for (i = 33; i >= 0; i--) {
        if(i == 1 || i == 10) {
            // 加入破折号来区分符号部分、指数部分和尾数部分。
            s[i] = '-';
       } else {
            // 为各个字节赋值'0'或者'1'。
            if (buff % 2 == 1) {
                s[i] = '1';
            } else {
                s[i] = '0';
            }
            buff /= 2;
        }
    }
    s[34] = '\0';

    // 显示结果。
    printf("%s\n", s);
}