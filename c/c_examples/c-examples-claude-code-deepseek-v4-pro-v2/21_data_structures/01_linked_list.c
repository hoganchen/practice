/*
 * 知识点：单向链表 (Singly Linked List)
 *
 * 编译指令：gcc 01_linked_list.c -o 01_linked_list.exe -std=c11 -Wall
 * 运行指令：./01_linked_list.exe
 *
 * 本文件演示单向链表的实现和操作：
 *   - 节点结构体：数据域 + 指针域（指向下一个节点）
 *   - 插入节点：头插法、尾插法
 *   - 删除节点：按值删除
 *   - 遍历打印
 *   - 查找节点
 *   - 释放所有节点（防止内存泄漏）
 *
 * 链表 vs 数组：
 *   优点：动态大小，插入/删除快（O(1) 在已知位置时）
 *   缺点：不支持随机访问，需要额外内存存储指针
 */

#include "../common/charset.h"
#include <stdio.h>
#include <stdlib.h>

/* ===== 链表节点定义 ===== */

/* 节点结构体
 * data: 存储数据（这里用整数）
 * next: 指向下一个节点的指针 */
typedef struct Node {
    int data;           /* 数据域 */
    struct Node *next;  /* 指针域：指向下一个节点 */
} Node;

/* ===== 基本操作 ===== */

/**
 * 创建新节点
 * data: 节点数据
 * 返回值: 新节点的指针，失败返回 NULL
 */
Node *create_node(int data) {
    Node *new_node = (Node *)malloc(sizeof(Node));
    if (new_node == NULL) {
        fprintf(stderr, "内存分配失败！\n");
        return NULL;
    }
    new_node->data = data;
    new_node->next = NULL;
    return new_node;
}

/**
 * 在链表头部插入新节点（头插法）
 * head: 指向头指针的指针（因为需要修改头指针）
 * data: 新节点的数据
 * 时间复杂度: O(1)
 */
void insert_at_beginning(Node **head, int data) {
    Node *new_node = create_node(data);
    if (new_node == NULL) return;

    /* 新节点的 next 指向原来的头节点 */
    new_node->next = *head;
    /* 头指针指向新节点 */
    *head = new_node;

    printf("  头插 %d\n", data);
}

/**
 * 在链表尾部插入新节点（尾插法）
 * head: 指向头指针的指针
 * data: 新节点的数据
 * 时间复杂度: O(n) —— 需要遍历到尾部
 */
void insert_at_end(Node **head, int data) {
    Node *new_node = create_node(data);
    if (new_node == NULL) return;

    /* 如果链表为空，新节点就是头节点 */
    if (*head == NULL) {
        *head = new_node;
        printf("  尾插 %d (空列表)\n", data);
        return;
    }

    /* 遍历到最后一个节点 */
    Node *current = *head;
    while (current->next != NULL) {
        current = current->next;
    }

    /* 最后一个节点的 next 指向新节点 */
    current->next = new_node;
    printf("  尾插 %d\n", data);
}

/**
 * 在指定位置插入新节点（在第 pos 个节点后插入）
 * head: 指向头指针的指针
 * data: 新节点的数据
 * pos: 插入位置（从 0 开始计数）
 */
void insert_at_position(Node **head, int data, int pos) {
    if (pos < 0) {
        printf("  无效位置 %d\n", pos);
        return;
    }

    /* 如果插入到头部 */
    if (pos == 0) {
        insert_at_beginning(head, data);
        return;
    }

    Node *new_node = create_node(data);
    if (new_node == NULL) return;

    /* 遍历到第 pos-1 个节点 */
    Node *current = *head;
    for (int i = 0; i < pos - 1; i++) {
        if (current == NULL) {
            printf("  位置 %d 超出链表范围\n", pos);
            free(new_node);
            return;
        }
        current = current->next;
    }

    if (current == NULL) {
        printf("  位置 %d 超出链表范围\n", pos);
        free(new_node);
        return;
    }

    /* 在 current 之后插入新节点 */
    new_node->next = current->next;
    current->next = new_node;
    printf("  在位置 %d 插入 %d\n", pos, data);
}

/**
 * 删除第一个匹配指定数据的节点
 * head: 指向头指针的指针
 * data: 要删除的节点数据
 */
void delete_node(Node **head, int data) {
    if (*head == NULL) {
        printf("  链表为空，无法删除\n");
        return;
    }

    Node *current = *head;
    Node *prev = NULL;

    /* 如果要删除的是头节点 */
    if (current->data == data) {
        *head = current->next;  /* 头指针指向下一个节点 */
        free(current);           /* 释放原头节点 */
        printf("  删除头节点 %d\n", data);
        return;
    }

    /* 遍历查找要删除的节点 */
    while (current != NULL && current->data != data) {
        prev = current;
        current = current->next;
    }

    if (current == NULL) {
        printf("  未找到 %d\n", data);
        return;
    }

    /* 将前一个节点的 next 跳过当前节点 */
    prev->next = current->next;
    free(current);  /* 释放删除的节点 */
    printf("  删除 %d\n", data);
}

/**
 * 查找数据所在的节点
 * head: 头指针
 * data: 要查找的数据
 * 返回值: 找到的节点指针，未找到返回 NULL
 */
Node *search(Node *head, int data) {
    Node *current = head;
    int pos = 0;

    while (current != NULL) {
        if (current->data == data) {
            printf("  找到 %d，位置 %d\n", data, pos);
            return current;
        }
        current = current->next;
        pos++;
    }

    printf("  未找到 %d\n", data);
    return NULL;
}

/**
 * 获取链表长度
 * head: 头指针
 * 返回值: 节点个数
 */
int get_length(Node *head) {
    int count = 0;
    Node *current = head;
    while (current != NULL) {
        count++;
        current = current->next;
    }
    return count;
}

/**
 * 遍历并打印链表
 * head: 头指针
 */
void print_list(Node *head) {
    if (head == NULL) {
        printf("  链表为空\n");
        return;
    }

    printf("  链表: ");
    Node *current = head;
    while (current != NULL) {
        printf("%d", current->data);
        if (current->next != NULL) {
            printf(" -> ");  /* 箭头表示链接关系 */
        }
        current = current->next;
    }
    printf(" -> NULL\n");
    printf("  长度: %d\n\n", get_length(head));
}

/**
 * 释放整个链表（防止内存泄漏！）
 * head: 指向头指针的指针
 */
void free_list(Node **head) {
    Node *current = *head;
    int count = 0;

    while (current != NULL) {
        Node *temp = current;
        current = current->next;
        free(temp);  /* 释放当前节点 */
        count++;
    }

    *head = NULL;  /* 头指针置空 */
    printf("  已释放 %d 个节点\n", count);
}

/* ===== 主函数 ===== */

int main() {
    printf("============================================\n");
    printf("  单向链表操作演示\n");
    printf("============================================\n\n");

    /* 初始化空链表：头指针指向 NULL */
    Node *head = NULL;

    /* ===== 1. 尾部插入 ===== */
    printf("----- 1. 尾部插入 -----\n");
    insert_at_end(&head, 10);
    insert_at_end(&head, 20);
    insert_at_end(&head, 30);
    print_list(head);

    /* ===== 2. 头部插入 ===== */
    printf("----- 2. 头部插入 -----\n");
    insert_at_beginning(&head, 5);
    insert_at_beginning(&head, 1);
    print_list(head);

    /* ===== 3. 指定位置插入 ===== */
    printf("----- 3. 指定位置插入 -----\n");
    insert_at_position(&head, 15, 3);  /* 在第 3 个位置后插入 */
    insert_at_position(&head, 99, 0);  /* 在第 0 个位置插入 = 头插 */
    print_list(head);

    /* ===== 4. 查找节点 ===== */
    printf("----- 4. 查找节点 -----\n");
    search(head, 20);
    search(head, 100);  /* 不存在的值 */
    printf("\n");

    /* ===== 5. 删除节点 ===== */
    printf("----- 5. 删除节点 -----\n");
    print_list(head);

    delete_node(&head, 99);  /* 删除头节点 */
    print_list(head);

    delete_node(&head, 15);  /* 删除中间节点 */
    print_list(head);

    delete_node(&head, 30);  /* 删除尾节点 */
    print_list(head);

    delete_node(&head, 999); /* 删除不存在的值 */
    printf("\n");

    /* ===== 6. 释放链表 ===== */
    printf("----- 6. 释放链表内存 -----\n");
    printf("释放前: ");
    print_list(head);

    free_list(&head);

    printf("释放后: ");
    print_list(head);

    /* ===== 7. 注意事项 ===== */
    printf("\n----- 7. 链表的注意事项 -----\n");

    printf("1) 每次 malloc 必须对应一次 free，防止内存泄漏\n");
    printf("2) 删除节点时注意保存 next 指针，避免访问已释放的内存\n");
    printf("3) 修改头指针时，需传递 Node**（指针的指针）\n");
    printf("4) 单链表只能单向遍历，双向链表可解决此问题\n");
    printf("5) 链表操作的时间复杂度：\n");
    printf("   - 头插/头删: O(1)\n");
    printf("   - 尾插/尾删: O(n)\n");
    printf("   - 查找/按位置插入: O(n)\n");

    printf("\n============================================\n");
    printf("  程序结束\n");
    printf("============================================\n");

    return 0;
}
