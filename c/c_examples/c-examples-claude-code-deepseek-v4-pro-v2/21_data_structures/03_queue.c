/*
 * 知识点：队列 (Queue) —— 先进先出 (FIFO) 环形缓冲区
 *
 * 编译指令：gcc 03_queue.c -o 03_queue.exe -std=c11 -Wall
 * 运行指令：./03_queue.exe
 *
 * 本文件演示基于环形缓冲区的队列实现：
 *   - enqueue()  — 入队（从队尾添加）
 *   - dequeue()  — 出队（从队首移除）
 *   - front()    — 查看队首元素（不移除）
 *   - isEmpty()  — 判断队列是否为空
 *   - isFull()   — 判断队列是否已满
 *
 * 环形缓冲区（Circular Buffer）的优势：
 *   普通数组实现的队列在出队后，前面的空间无法复用
 *   环形缓冲区通过取模运算复用已出队的空间
 *
 * 队列的应用：
 *   - 打印机任务队列
 *   - 消息队列 / 事件循环
 *   - BFS（广度优先搜索）
 *   - 缓冲区（如键盘输入缓冲区）
 */

#include "../common/charset.h"
#include <stdio.h>
#include <stdlib.h>
#include <stdbool.h>

/* ===== 队列定义 ===== */

/* 队列容量（环形缓冲区大小）
 * 实际最多存储 QUEUE_CAPACITY - 1 个元素
 * 留一个空位用于区分空和满 */
#define QUEUE_CAPACITY 6

/* 队列结构体（环形缓冲区）*/
typedef struct {
    int data[QUEUE_CAPACITY];  /* 存储数据的数组 */
    int front;                  /* 队首索引（指向第一个元素）*/
    int rear;                   /* 队尾索引（指向最后一个元素的下一个位置）*/
    int count;                  /* 当前元素个数（可选，方便统计）*/
} Queue;

/* ===== 基本操作 ===== */

/**
 * 初始化队列
 * queue: 指向队列结构体的指针
 *
 * 初始状态：
 *   front = 0, rear = 0, count = 0
 *   队列为空时 front == rear
 */
void init_queue(Queue *queue) {
    queue->front = 0;
    queue->rear  = 0;
    queue->count = 0;
    printf("  队列已初始化，容量: %d (实际可用: %d)\n",
           QUEUE_CAPACITY, QUEUE_CAPACITY - 1);
}

/**
 * 判断队列是否为空
 * queue: 指向队列结构体的指针
 * 返回值: true 表示空，false 表示非空
 */
bool is_empty(const Queue *queue) {
    /* 当 front == rear 时队列为空 */
    return queue->front == queue->rear;
}

/**
 * 判断队列是否已满
 * queue: 指向队列结构体的指针
 * 返回值: true 表示已满，false 表示未满
 *
 * 判断满的方式： (rear + 1) % QUEUE_CAPACITY == front
 * 即队尾指针的下一个位置是队首指针，表示没有可用空间
 * 这种实现会浪费一个元素的空间来区分空和满
 */
bool is_full(const Queue *queue) {
    return (queue->rear + 1) % QUEUE_CAPACITY == queue->front;
}

/**
 * 获取队列中元素个数
 * queue: 指向队列结构体的指针
 * 返回值: 元素个数
 */
int size(const Queue *queue) {
    return queue->count;
}

/**
 * 入队（从队尾添加元素）
 * queue: 指向队列结构体的指针
 * value: 要入队的值
 * 返回值: true 表示成功，false 表示队列已满
 */
bool enqueue(Queue *queue, int value) {
    if (is_full(queue)) {
        printf("  错误：队列已满！无法入队 %d\n", value);
        return false;
    }

    /* 在 rear 位置插入数据 */
    queue->data[queue->rear] = value;

    /* rear 指针循环前进一位
     * 取模运算实现环形：到达数组末尾后回到开头 */
    queue->rear = (queue->rear + 1) % QUEUE_CAPACITY;

    queue->count++;
    printf("  入队: %d (front=%d, rear=%d, count=%d)\n",
           value, queue->front, queue->rear, queue->count);
    return true;
}

/**
 * 出队（从队首移除元素）
 * queue: 指向队列结构体的指针
 * value: 输出参数，接收出队的元素
 * 返回值: true 表示成功，false 表示队列已空
 */
bool dequeue(Queue *queue, int *value) {
    if (is_empty(queue)) {
        printf("  错误：队列已空！无法出队\n");
        return false;
    }

    /* 取出 front 位置的数据 */
    *value = queue->data[queue->front];

    /* front 指针循环前进一位（环形）*/
    queue->front = (queue->front + 1) % QUEUE_CAPACITY;

    queue->count--;
    printf("  出队: %d (front=%d, rear=%d, count=%d)\n",
           *value, queue->front, queue->rear, queue->count);
    return true;
}

/**
 * 查看队首元素（不出队）
 * queue: 指向队列结构体的指针
 * 返回值: 队首元素的值
 * 注意：调用前需确保队列非空
 */
int front(const Queue *queue) {
    return queue->data[queue->front];
}

/**
 * 打印队列内容
 * queue: 指向队列结构体的指针
 *
 * 从 front 开始遍历到 rear（循环），
 * 注意环形缓冲区的遍历方式
 */
void print_queue(const Queue *queue) {
    printf("  队列 (front=%d, rear=%d, count=%d): [",
           queue->front, queue->rear, size(queue));

    if (is_empty(queue)) {
        printf("空队列");
    } else {
        /* 从 front 遍历到 rear（环形遍历）*/
        int i = queue->front;
        int elements_printed = 0;

        while (i != queue->rear) {
            printf("%d", queue->data[i]);
            elements_printed++;

            /* 检查是否还有下一个元素 */
            int next = (i + 1) % QUEUE_CAPACITY;
            if (next != queue->rear) {
                printf(", ");
            }

            i = next;

            /* 安全机制：防止无限循环 */
            if (elements_printed > QUEUE_CAPACITY) {
                printf("...");
                break;
            }
        }
    }

    printf("]\n\n");
}

/* ===== 主函数 ===== */

int main() {
    printf("============================================\n");
    printf("  队列 (Queue) 操作演示\n");
    printf("============================================\n\n");

    /* ===== 1. 初始化 ===== */
    printf("----- 1. 初始化队列 -----\n");

    Queue queue;
    init_queue(&queue);
    print_queue(&queue);

    /* ===== 2. 入队操作 ===== */
    printf("----- 2. 入队操作 (enqueue) -----\n");

    enqueue(&queue, 10);
    enqueue(&queue, 20);
    enqueue(&queue, 30);
    print_queue(&queue);

    /* ===== 3. 出队操作 ===== */
    printf("----- 3. 出队操作 (dequeue) -----\n");

    int value;
    dequeue(&queue, &value);
    printf("  出队值: %d\n", value);
    dequeue(&queue, &value);
    printf("  出队值: %d\n", value);
    print_queue(&queue);

    /* ===== 4. 继续入队（演示环形复用） ===== */
    printf("----- 4. 环形缓冲区复用演示 -----\n");

    printf("  虽然出队了两个元素，但空间可复用：\n");
    enqueue(&queue, 40);
    enqueue(&queue, 50);
    enqueue(&queue, 60);
    enqueue(&queue, 70);  /* 队列应该快满了 */
    print_queue(&queue);

    /* ===== 5. 队列满和队空演示 ===== */
    printf("----- 5. 边界情况演示 -----\n");

    /* 尝试继续入队（应该满）*/
    enqueue(&queue, 80);

    /* 出队所有元素 */
    printf("\n  清空队列：\n");
    while (!is_empty(&queue)) {
        dequeue(&queue, &value);
    }
    print_queue(&queue);

    /* 尝试在空队列上出队 */
    dequeue(&queue, &value);
    printf("\n");

    /* ===== 6. 队列的 FIFO 特性验证 ===== */
    printf("----- 6. 验证 FIFO 特性 -----\n");

    int test_data[] = {100, 200, 300, 400, 500};
    int num_items = sizeof(test_data) / sizeof(test_data[0]);

    printf("  入队顺序: ");
    for (int i = 0; i < num_items; i++) {
        printf("%d ", test_data[i]);
        enqueue(&queue, test_data[i]);
    }
    printf("\n");

    printf("  出队顺序: ");
    while (!is_empty(&queue)) {
        dequeue(&queue, &value);
        printf("%d ", value);
    }
    printf("\n");
    printf("  FIFO 验证：入队和出队顺序一致！\n");
    printf("\n");

    /* ===== 7. 环形缓冲区的可视化 ===== */
    printf("----- 7. 环形缓冲区原理 -----\n");

    printf("  数组索引: 0    1    2    3    4    5\n");
    printf("           ┌────┬────┬────┬────┬────┬────┐\n");
    printf("           │    │    │    │    │    │    │\n");
    printf("           └────┴────┴────┴────┴────┴────┘\n");
    printf("              ↑                        ↑\n");
    printf("            front                    rear\n");
    printf("  当指针到达末尾时，通过 %% 运算回到开头\n");
    printf("  (rear + 1) %% %d == front 时表示队列已满\n\n", QUEUE_CAPACITY);

    /* ===== 8. 使用注意事项 ===== */
    printf("----- 8. 注意事项 -----\n");

    printf("1) 环形队列通过浪费一个元素空间来区分空和满\n");
    printf("2) 入队/出队的时间复杂度均为 O(1)\n");
    printf("3) 取模运算 %% 是环形缓冲区的核心\n");
    printf("4) 使用 count 字段可以避免浪费一个空间\n");
    printf("5) 动态队列（链表实现）没有容量限制\n");

    printf("\n============================================\n");
    printf("  程序结束\n");
    printf("============================================\n");

    return 0;
}
