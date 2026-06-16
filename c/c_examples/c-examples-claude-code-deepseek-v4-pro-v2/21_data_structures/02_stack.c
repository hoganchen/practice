/*
 * 知识点：栈 (Stack) —— 后进先出 (LIFO)
 *
 * 编译指令：gcc 02_stack.c -o 02_stack.exe -std=c11 -Wall
 * 运行指令：./02_stack.exe
 *
 * 本文件演示基于数组的栈实现：
 *   - push()    — 压栈（入栈）
 *   - pop()     — 弹栈（出栈）
 *   - peek()    — 查看栈顶元素（不移除）
 *   - isEmpty() — 判断栈是否为空
 *   - isFull()  — 判断栈是否已满
 *
 * 栈的应用：
 *   - 函数调用栈
 *   - 表达式求值（中缀转后缀）
 *   - 括号匹配检查
 *   - 浏览器的前进后退
 *   - 撤销操作 (Undo)
 */

#include "../common/charset.h"
#include <stdio.h>
#include <stdlib.h>
#include <stdbool.h>  /* C99 引入的 bool 类型 */

/* ===== 栈的定义 ===== */

/* 栈的最大容量 */
#define STACK_CAPACITY 10

/* 栈结构体 */
typedef struct {
    int data[STACK_CAPACITY];  /* 存储数据的数组 */
    int top;                    /* 栈顶索引（-1 表示空栈） */
} Stack;

/* ===== 基本操作 ===== */

/**
 * 初始化栈
 * stack: 指向栈结构体的指针
 * 将栈顶指针设为 -1，表示空栈
 */
void init_stack(Stack *stack) {
    stack->top = -1;
    printf("  栈已初始化，容量: %d\n", STACK_CAPACITY);
}

/**
 * 判断栈是否为空
 * stack: 指向栈结构体的指针
 * 返回值: true 表示为空，false 表示非空
 */
bool is_empty(const Stack *stack) {
    return stack->top == -1;
}

/**
 * 判断栈是否已满
 * stack: 指向栈结构体的指针
 * 返回值: true 表示已满，false 表示未满
 */
bool is_full(const Stack *stack) {
    return stack->top >= STACK_CAPACITY - 1;
}

/**
 * 压栈（入栈操作）
 * stack: 指向栈结构体的指针
 * value: 要压入的数据
 * 返回值: true 表示成功，false 表示栈满
 *
 * 栈溢出：当栈已满时再 push 会溢出
 * 我们通过 is_full 检查来防止溢出
 */
bool push(Stack *stack, int value) {
    if (is_full(stack)) {
        printf("  错误：栈已满！无法压入 %d (栈溢出)\n", value);
        return false;
    }

    /* 先移动栈顶指针，再存入数据 */
    stack->top++;
    stack->data[stack->top] = value;
    printf("  入栈: %d (栈顶位置: %d)\n", value, stack->top);
    return true;
}

/**
 * 弹栈（出栈操作）
 * stack: 指向栈结构体的指针
 * value: 输出参数，接收弹出的数据
 * 返回值: true 表示成功，false 表示栈空
 *
 * 栈下溢：当栈为空时再 pop 会下溢
 */
bool pop(Stack *stack, int *value) {
    if (is_empty(stack)) {
        printf("  错误：栈已为空！无法弹出 (栈下溢)\n");
        return false;
    }

    /* 取出数据，再移动栈顶指针 */
    *value = stack->data[stack->top];
    stack->top--;
    printf("  出栈: %d (栈顶位置: %d)\n", *value, stack->top);
    return true;
}

/**
 * 查看栈顶元素（不弹出）
 * stack: 指向栈结构体的指针
 * 返回值: 栈顶元素的值
 * 注意：如果栈为空，行为是未定义的
 */
int peek(const Stack *stack) {
    return stack->data[stack->top];
}

/**
 * 获取栈中元素个数
 * stack: 指向栈结构体的指针
 * 返回值: 元素个数
 */
int size(const Stack *stack) {
    return stack->top + 1;
}

/**
 * 打印栈的内容（从栈底到栈顶）
 * stack: 指向栈结构体的指针
 */
void print_stack(const Stack *stack) {
    printf("  栈内容 (底 -> 顶): [");

    if (is_empty(stack)) {
        printf("空栈");
    } else {
        for (int i = 0; i <= stack->top; i++) {
            printf("%d", stack->data[i]);
            if (i < stack->top) {
                printf(", ");
            }
        }
    }

    printf("] (共 %d 个元素)\n", size(stack));
}

/* ===== 栈的应用：括号匹配检查 ===== */

/**
 * 检查表达式中的括号是否匹配
 * expr: 要检查的表达式字符串
 * 返回值: true 表示括号匹配，false 表示不匹配
 *
 * 算法：遍历字符，遇到左括号入栈，遇到右括号出栈检查是否匹配
 */
bool check_brackets(const char *expr) {
    Stack stack;
    init_stack(&stack);

    printf("  检查表达式: %s\n", expr);

    for (int i = 0; expr[i] != '\0'; i++) {
        char ch = expr[i];

        /* 左括号入栈 */
        if (ch == '(' || ch == '[' || ch == '{') {
            /* 将 char 作为 int 压栈 */
            push(&stack, (int)ch);
        }
        /* 右括号与栈顶匹配 */
        else if (ch == ')' || ch == ']' || ch == '}') {
            if (is_empty(&stack)) {
                printf("  第 %d 字符 '%c': 多余右括号！\n", i, ch);
                return false;
            }

            int top_char;
            pop(&stack, &top_char);

            /* 检查括号类型是否匹配 */
            if ((ch == ')' && top_char != '(') ||
                (ch == ']' && top_char != '[') ||
                (ch == '}' && top_char != '{')) {
                printf("  第 %d 字符 '%c': 括号不匹配！\n", i, ch);
                return false;
            }
        }
    }

    if (!is_empty(&stack)) {
        printf("  有 %d 个左括号未匹配！\n", size(&stack));
        return false;
    }

    printf("  -- 括号匹配！\n");
    return true;
}

/* ===== 主函数 ===== */

int main() {
    printf("============================================\n");
    printf("  栈 (Stack) 操作演示\n");
    printf("============================================\n\n");

    /* ===== 1. 初始化 ===== */
    printf("----- 1. 初始化栈 -----\n");

    Stack stack;
    init_stack(&stack);
    print_stack(&stack);
    printf("\n");

    /* ===== 2. 入栈操作 ===== */
    printf("----- 2. 入栈操作 (push) -----\n");

    push(&stack, 10);
    push(&stack, 20);
    push(&stack, 30);
    push(&stack, 40);
    push(&stack, 50);
    print_stack(&stack);
    printf("\n");

    /* ===== 3. 查看栈顶 ===== */
    printf("----- 3. 查看栈顶 (peek) -----\n");

    if (!is_empty(&stack)) {
        printf("  栈顶元素: %d\n", peek(&stack));
    }
    print_stack(&stack);
    printf("\n");

    /* ===== 4. 出栈操作 ===== */
    printf("----- 4. 出栈操作 (pop) -----\n");

    while (!is_empty(&stack)) {
        int value;
        pop(&stack, &value);
        printf("  弹出值: %d\n", value);
    }
    print_stack(&stack);
    printf("\n");

    /* ===== 5. 栈溢出演示 ===== */
    printf("----- 5. 栈溢出演示 -----\n");

    printf("  尝试压入 %d 个元素（容量 %d）:\n",
           STACK_CAPACITY + 2, STACK_CAPACITY);
    for (int i = 1; i <= STACK_CAPACITY + 2; i++) {
        push(&stack, i * 10);
    }
    print_stack(&stack);

    /* 清空栈 */
    printf("\n  清空栈：\n");
    while (!is_empty(&stack)) {
        int val;
        pop(&stack, &val);
    }
    printf("\n");

    /* ===== 6. 栈下溢演示 ===== */
    printf("----- 6. 栈下溢演示 -----\n");

    int val;
    pop(&stack, &val);  /* 尝试在空栈上弹出 */
    printf("\n");

    /* ===== 7. 栈的应用：括号匹配 ===== */
    printf("----- 7. 栈的应用：括号匹配检查 -----\n");

    check_brackets("(1 + 2) * (3 - 4)");
    printf("\n");

    check_brackets("{[()]}");
    printf("\n");

    check_brackets("({[}]");    /* 缺少括号 */
    printf("\n");

    check_brackets("(1 + 2))");  /* 多余右括号 */
    printf("\n");

    /* ===== 8. 使用注意事项 ===== */
    printf("----- 8. 注意事项 -----\n");

    printf("1) 数组实现有固定容量，使用时需注意边界\n");
    printf("2) 空栈不可 pop 或 peek\n");
    printf("3) 栈的 push/pop 时间复杂度均为 O(1)\n");
    printf("4) 动态栈（链表实现）可避免容量限制\n");
    printf("5) 函数调用栈有大小限制（栈溢出 crash）\n");

    printf("\n============================================\n");
    printf("  程序结束\n");
    printf("============================================\n");

    return 0;
}
