/*
 * ============================================
 * 知识点：单向链表
 * 说明：
 *   链表是动态数据结构，每个节点包含数据
 *   和指向下一个节点的指针。与数组相比，
 *   链表可以动态增长，插入/删除更高效。
 *
 *   缺点：不支持随机访问，需要额外的
 *   存储空间存储指针。
 *
 * 编译方法：
 *   gcc 01_singly_linked_list.c -o 01_singly_linked_list
 * ============================================
 */

#include <stdio.h>
#include "../utf8fix.h"
#include <stdlib.h>
#include <string.h>

// ========== 链表节点定义 ==========
typedef struct Node {
    int data;               // 数据域
    struct Node *next;      // 指针域：指向下一个节点
} Node;

// ========== 链表结构 ==========
typedef struct {
    Node *head;             // 头指针
    int size;               // 节点数量
} LinkedList;

// ========== 创建链表 ==========
LinkedList* list_create(void) {
    LinkedList *list = (LinkedList*)malloc(sizeof(LinkedList));
    if (list != NULL) {
        list->head = NULL;
        list->size = 0;
    }
    return list;
}

// ========== 创建节点 ==========
Node* create_node(int data) {
    Node *node = (Node*)malloc(sizeof(Node));
    if (node != NULL) {
        node->data = data;
        node->next = NULL;
    }
    return node;
}

// ========== 头部插入 ==========
void list_push_front(LinkedList *list, int data) {
    Node *node = create_node(data);
    if (node == NULL) return;

    node->next = list->head;  // 新节点指向原头节点
    list->head = node;        // 头指针指向新节点
    list->size++;
}

// ========== 尾部插入 ==========
void list_push_back(LinkedList *list, int data) {
    Node *node = create_node(data);
    if (node == NULL) return;

    if (list->head == NULL) {
        // 空链表，新节点就是头节点
        list->head = node;
    } else {
        // 找尾节点
        Node *current = list->head;
        while (current->next != NULL) {
            current = current->next;
        }
        current->next = node;  // 尾节点指向新节点
    }
    list->size++;
}

// ========== 在指定位置插入 ==========
int list_insert(LinkedList *list, int index, int data) {
    if (index < 0 || index > list->size) return 0;  // 越界

    if (index == 0) {
        list_push_front(list, data);
        return 1;
    }

    Node *node = create_node(data);
    if (node == NULL) return 0;

    // 找到 index-1 位置的节点
    Node *prev = list->head;
    for (int i = 0; i < index - 1; i++) {
        prev = prev->next;
    }

    node->next = prev->next;  // 新节点指向原 index 节点
    prev->next = node;        // 前一个节点指向新节点
    list->size++;
    return 1;
}

// ========== 删除头节点 ==========
int list_pop_front(LinkedList *list) {
    if (list->head == NULL) return 0;

    Node *temp = list->head;
    list->head = list->head->next;  // 头指针后移
    free(temp);
    list->size--;
    return 1;
}

// ========== 删除指定值的节点 ==========
int list_remove(LinkedList *list, int data) {
    if (list->head == NULL) return 0;

    // 如果要删除的是头节点
    if (list->head->data == data) {
        return list_pop_front(list);
    }

    Node *prev = list->head;
    Node *current = list->head->next;

    while (current != NULL) {
        if (current->data == data) {
            prev->next = current->next;  // 跳过 current
            free(current);
            list->size--;
            return 1;
        }
        prev = current;
        current = current->next;
    }
    return 0;  // 没找到
}

// ========== 查找元素 ==========
Node* list_find(LinkedList *list, int data) {
    Node *current = list->head;
    while (current != NULL) {
        if (current->data == data) {
            return current;
        }
        current = current->next;
    }
    return NULL;
}

// ========== 获取第 index 个元素（从0开始） ==========
int list_get(LinkedList *list, int index, int *value) {
    if (index < 0 || index >= list->size) return 0;

    Node *current = list->head;
    for (int i = 0; i < index; i++) {
        current = current->next;
    }
    *value = current->data;
    return 1;
}

// ========== 反转链表 ==========
void list_reverse(LinkedList *list) {
    Node *prev = NULL;
    Node *current = list->head;
    Node *next = NULL;

    while (current != NULL) {
        next = current->next;   // 保存下一个节点
        current->next = prev;   // 反转指针方向
        prev = current;
        current = next;
    }
    list->head = prev;  // 更新头指针
}

// ========== 打印链表 ==========
void list_print(LinkedList *list) {
    printf("List(size=%d): ", list->size);
    Node *current = list->head;
    while (current != NULL) {
        printf("%d", current->data);
        if (current->next != NULL) {
            printf(" -> ");
        }
        current = current->next;
    }
    printf("\n");
}

// ========== 清空链表 ==========
void list_clear(LinkedList *list) {
    Node *current = list->head;
    while (current != NULL) {
        Node *next = current->next;
        free(current);
        current = next;
    }
    list->head = NULL;
    list->size = 0;
}

// ========== 销毁链表 ==========
void list_destroy(LinkedList *list) {
    if (list != NULL) {
        list_clear(list);
        free(list);
    }
}

// ========== main ==========
int main() {
    printf("===== 单向链表 =====\n\n");

    LinkedList *list = list_create();

    // 尾部插入
    printf("--- 尾部插入 1-5 ---\n");
    for (int i = 1; i <= 5; i++) {
        list_push_back(list, i);
    }
    list_print(list);

    // 头部插入
    printf("\n--- 头部插入 0 ---\n");
    list_push_front(list, 0);
    list_print(list);

    // 指定位置插入
    printf("\n--- 在索引 3 处插入 99 ---\n");
    list_insert(list, 3, 99);
    list_print(list);

    // 删除头节点
    printf("\n--- 删除头节点 ---\n");
    list_pop_front(list);
    list_print(list);

    // 删除指定值
    printf("\n--- 删除值为 99 的节点 ---\n");
    list_remove(list, 99);
    list_print(list);

    // 查找
    printf("\n--- 查找值为 3 的节点 ---\n");
    Node *found = list_find(list, 3);
    if (found != NULL) {
        printf("找到节点: data = %d, next = %p\n",
               found->data, (void*)found->next);
    }

    // 索引访问
    printf("\n--- 索引访问 ---\n");
    for (int i = 0; i < list->size; i++) {
        int val;
        if (list_get(list, i, &val)) {
            printf("  [%d] = %d\n", i, val);
        }
    }

    // 反转
    printf("\n--- 反转链表 ---\n");
    list_reverse(list);
    list_print(list);

    // 再次反转
    list_reverse(list);
    printf("再次反转: ");
    list_print(list);

    // 清空
    printf("\n--- 清空链表 ---\n");
    list_clear(list);
    printf("清空后 size = %d\n", list->size);
    list_print(list);

    // 重新插入并销毁
    printf("\n--- 重新插入并销毁 ---\n");
    list_push_back(list, 100);
    list_push_back(list, 200);
    list_push_back(list, 300);
    list_print(list);

    list_destroy(list);
    printf("链表已销毁\n");

    // ========== 数组 vs 链表 ==========
    printf("\n===== 数组 vs 链表总结 =====\n");

    printf("数组:\n");
    printf("  优点: 随机访问 O(1), 内存连续, 缓存友好\n");
    printf("  缺点: 插入/删除 O(n), 大小固定\n");

    printf("\n链表:\n");
    printf("  优点: 动态大小, 插入/删除 O(1)(已知位置)\n");
    printf("  缺点: 随机访问 O(n), 需要额外指针存储\n");

    return 0;
}

/*
 * ============================================
 * 关键点总结：
 *
 * 1. 链表节点包含 data 和 next 指针
 * 2. 头指针标记链表起点
 * 3. 插入/删除需要修改前后节点的指针
 * 4. 注意释放内存避免泄漏
 * 5. 反转链表需要三个指针（prev/current/next）
 * 6. 链表适合频繁插入删除的场景
 * ============================================
 */
