/**
 * ============================================================================
 * 知识主题：二分搜索树 (Binary Search Tree, BST)
 *
 * 核心特性：
 *   1. 每个节点最多有两个子节点（左子节点、右子节点）
 *   2. 左子树所有节点的值 < 根节点的值
 *   3. 右子树所有节点的值 > 根节点的值
 *   4. 左右子树也都是二分搜索树
 *   5. 中序遍历可以得到从小到大排序的序列
 *
 * 时间复杂度 (平均情况)：
 *   - 插入：O(log n)
 *   - 查找：O(log n)
 *   - 删除：O(log n)
 *   - 最坏情况（退化链表）：O(n)
 *
 * 编译：gcc 04_binary_tree.c -o 04_binary_tree.exe -std=c11 -Wall
 * 运行：.\04_binary_tree.exe
 * ============================================================================
 */

#include "../common/charset.h"
#include <stdio.h>
#include <stdlib.h>
#include <stdbool.h>

/* ========================== 结构体定义 ========================== */

/**
 * 二叉树节点结构体
 * data  - 节点存储的整型数据
 * left  - 指向左子节点的指针（左子树所有值均小于当前节点值）
 * right - 指向右子节点的指针（右子树所有值均大于当前节点值）
 */
typedef struct TreeNode {
    int data;                /* 节点数据 */
    struct TreeNode *left;   /* 左子节点指针 */
    struct TreeNode *right;  /* 右子节点指针 */
} TreeNode;

/* ========================== 基本操作函数 ========================== */

/**
 * 创建新节点
 * 功能：分配内存并初始化一个新节点
 * 参数 data：要存储的数据值
 * 返回值：指向新创建的节点的指针，失败时返回 NULL
 * 说明：新节点的左右子节点指针均初始化为 NULL
 */
TreeNode* createNode(int data) {
    /* 为节点分配内存 */
    TreeNode *newNode = (TreeNode*)malloc(sizeof(TreeNode));

    /* 检查内存分配是否成功 */
    if (newNode == NULL) {
        printf("错误：内存分配失败！\n");
        return NULL;
    }

    /* 初始化节点成员 */
    newNode->data = data;
    newNode->left = NULL;   /* 新节点没有左子节点 */
    newNode->right = NULL;  /* 新节点没有右子节点 */

    return newNode;
}

/**
 * 插入节点（递归实现）
 * 功能：将一个新值插入到二叉搜索树中的正确位置
 * 参数 root：当前子树的根节点
 * 参数 data：要插入的数据值
 * 返回值：插入后子树的根节点
 *
 * 算法说明：
 *   1. 如果树为空，直接创建并返回新节点
 *   2. 如果要插入的值小于当前节点，递归插入到左子树
 *   3. 如果要插入的值大于等于当前节点，递归插入到右子树
 *   4. 重复值可插入右侧（也可约定不插入重复值）
 */
TreeNode* insert(TreeNode *root, int data) {
    /* 基本情况：树为空，创建新节点作为根 */
    if (root == NULL) {
        return createNode(data);
    }

    /* 递归插入到合适的子树 */
    if (data < root->data) {
        /* 值小于当前节点，插入左子树 */
        root->left = insert(root->left, data);
    } else {
        /* 值大于等于当前节点，插入右子树 */
        root->right = insert(root->right, data);
    }

    return root;
}

/**
 * 查找节点（递归实现）
 * 功能：在二叉搜索树中搜索指定的值
 * 参数 root：当前子树的根节点
 * 参数 target：要查找的目标值
 * 返回值：如果找到返回 true，否则返回 false
 *
 * 算法说明：
 *   1. 如果树为空，说明没有找到，返回 false
 *   2. 如果当前节点的值等于目标值，找到，返回 true
 *   3. 如果目标值小于当前节点，递归在左子树中查找
 *   4. 如果目标值大于当前节点，递归在右子树中查找
 */
bool search(TreeNode *root, int target) {
    /* 基本情况1：树为空，未找到 */
    if (root == NULL) {
        return false;
    }

    /* 基本情况2：找到了目标值 */
    if (root->data == target) {
        printf("找到节点 %d\n", target);
        return true;
    }

    /* 根据值的大小决定搜索方向 */
    if (target < root->data) {
        return search(root->left, target);   /* 在左子树中继续查找 */
    } else {
        return search(root->right, target);  /* 在右子树中继续查找 */
    }
}

/**
 * 查找最小值节点
 * 功能：找到以 root 为根的子树中的最小值节点
 * 参数 root：子树的根节点
 * 返回值：指向最小值节点的指针
 *
 * 原理：BST 的最小值位于最左侧的节点
 * 即一直沿着 left 指针走到 NULL 为止
 */
TreeNode* findMin(TreeNode *root) {
    /* 空树没有最小值 */
    if (root == NULL) {
        return NULL;
    }

    /* 一直向左走，直到没有左子节点 */
    while (root->left != NULL) {
        root = root->left;
    }

    return root;
}

/**
 * 查找最大值节点
 * 功能：找到以 root 为根的子树中的最大值节点
 * 参数 root：子树的根节点
 * 返回值：指向最大值节点的指针
 *
 * 原理：BST 的最大值位于最右侧的节点
 * 即一直沿着 right 指针走到 NULL 为止
 */
TreeNode* findMax(TreeNode *root) {
    if (root == NULL) {
        return NULL;
    }

    /* 一直向右走，直到没有右子节点 */
    while (root->right != NULL) {
        root = root->right;
    }

    return root;
}

/**
 * 删除节点
 * 功能：从二叉搜索树中删除指定值的节点
 * 参数 root：当前子树的根节点
 * 参数 data：要删除的数据值
 * 返回值：删除操作后子树的根节点
 *
 * 三种情况分析：
 *   情况1：要删除的节点是叶子节点（没有子节点）
 *        -> 直接释放该节点，返回 NULL 给父节点
 *
 *   情况2：要删除的节点只有一个子节点
 *        -> 用该子节点替代被删除的节点
 *
 *   情况3：要删除的节点有两个子节点
 *        -> 找到右子树中的最小节点（或左子树中的最大节点）
 *        -> 用该节点的值替代要删除的节点的值
 *        -> 删除那个最小（或最大）节点（递归）
 */
TreeNode* deleteNode(TreeNode *root, int data) {
    /* 基本情况：树为空 */
    if (root == NULL) {
        return NULL;
    }

    /* 先找到要删除的节点 */
    if (data < root->data) {
        /* 目标在左子树中 */
        root->left = deleteNode(root->left, data);
    } else if (data > root->data) {
        /* 目标在右子树中 */
        root->right = deleteNode(root->right, data);
    } else {
        /* 找到要删除的节点，即 root->data == data */

        /* ---- 情况1：叶子节点（没有子节点） ---- */
        if (root->left == NULL && root->right == NULL) {
            printf("情况1：删除叶子节点 %d\n", data);
            free(root);       /* 释放内存 */
            return NULL;      /* 返回 NULL，父节点对应指针变为 NULL */
        }

        /* ---- 情况2：只有一个子节点 ---- */
        else if (root->left == NULL) {
            /* 只有右子节点，用右子节点替代当前节点 */
            printf("情况2：删除只有一个右子节点的节点 %d\n", data);
            TreeNode *temp = root->right;
            free(root);       /* 释放当前节点 */
            return temp;      /* 返回右子节点给父节点 */
        }
        else if (root->right == NULL) {
            /* 只有左子节点，用左子节点替代当前节点 */
            printf("情况2：删除只有一个左子节点的节点 %d\n", data);
            TreeNode *temp = root->left;
            free(root);       /* 释放当前节点 */
            return temp;      /* 返回左子节点给父节点 */
        }

        /* ---- 情况3：有两个子节点 ---- */
        else {
            /*
             * 策略：找到右子树中的最小节点（后继节点）
             * 用后继节点的值覆盖当前节点的值
             * 然后递归删除右子树中的后继节点
             */
            printf("情况3：删除有两个子节点的节点 %d\n", data);
            TreeNode *temp = findMin(root->right);  /* 找到右子树的最小节点 */

            /* 用后继节点的值覆盖当前节点的值 */
            root->data = temp->data;

            /* 递归删除右子树中的后继节点 */
            root->right = deleteNode(root->right, temp->data);
        }
    }

    return root;
}

/* ========================== 遍历操作 ========================== */

/**
 * 前序遍历（Pre-order Traversal）
 * 访问顺序：根节点 -> 左子树 -> 右子树
 * 用途：用于复制树的结构，或输出树的前缀表达式
 *
 * 参数 root：当前子树的根节点
 */
void preorderTraversal(TreeNode *root) {
    if (root == NULL) {
        return;  /* 空节点，直接返回 */
    }

    /* 1. 访问根节点 */
    printf("%d ", root->data);

    /* 2. 递归遍历左子树 */
    preorderTraversal(root->left);

    /* 3. 递归遍历右子树 */
    preorderTraversal(root->right);
}

/**
 * 中序遍历（In-order Traversal）
 * 访问顺序：左子树 -> 根节点 -> 右子树
 * 用途：对 BST 进行中序遍历可以得到升序排列的结果
 *
 * 参数 root：当前子树的根节点
 */
void inorderTraversal(TreeNode *root) {
    if (root == NULL) {
        return;  /* 空节点，直接返回 */
    }

    /* 1. 递归遍历左子树（所有比根节点小的值） */
    inorderTraversal(root->left);

    /* 2. 访问根节点 */
    printf("%d ", root->data);

    /* 3. 递归遍历右子树（所有比根节点大的值） */
    inorderTraversal(root->right);
}

/**
 * 后序遍历（Post-order Traversal）
 * 访问顺序：左子树 -> 右子树 -> 根节点
 * 用途：用于删除树（先释放子节点，再释放根节点）
 *
 * 参数 root：当前子树的根节点
 */
void postorderTraversal(TreeNode *root) {
    if (root == NULL) {
        return;  /* 空节点，直接返回 */
    }

    /* 1. 递归遍历左子树 */
    postorderTraversal(root->left);

    /* 2. 递归遍历右子树 */
    postorderTraversal(root->right);

    /* 3. 访问根节点 */
    printf("%d ", root->data);
}

/**
 * 释放整棵树
 * 功能：递归释放二叉树中所有节点的内存
 * 参数 root：树的根节点
 *
 * 说明：使用后序遍历的顺序释放，确保子节点先被释放
 *       避免先释放父节点导致子节点无法访问
 */
void freeTree(TreeNode *root) {
    if (root == NULL) {
        return;
    }

    /* 先递归释放左子树 */
    freeTree(root->left);

    /* 再递归释放右子树 */
    freeTree(root->right);

    /* 最后释放当前节点（后序遍历） */
    printf("释放节点：%d\n", root->data);
    free(root);
}

/* ========================== 辅助函数 ========================== */

/**
 * 打印二叉树信息
 * 功能：打印树的三种遍历结果和最小/最大值
 * 参数 root：树的根节点
 */
void printTreeInfo(TreeNode *root) {
    printf("\n========== 树的信息 ==========\n");

    printf("前序遍历（根-左-右）：");
    preorderTraversal(root);
    printf("\n");

    printf("中序遍历（左-根-右）：");
    inorderTraversal(root);
    printf("  【注意：BST 中序遍历为升序序列】\n");

    printf("后序遍历（左-右-根）：");
    postorderTraversal(root);
    printf("\n");

    /* 查找并打印最小值和最大值 */
    TreeNode *minNode = findMin(root);
    TreeNode *maxNode = findMax(root);
    if (minNode != NULL) {
        printf("最小值：%d\n", minNode->data);
    }
    if (maxNode != NULL) {
        printf("最大值：%d\n", maxNode->data);
    }
    printf("===============================\n\n");
}

/* ========================== 主函数 ========================== */

int main(void) {
    printf("============================================================\n");
    printf("  二分搜索树（Binary Search Tree）演示程序\n");
    printf("============================================================\n\n");

    /* ---- 初始化空树 ---- */
    TreeNode *root = NULL;

    /* ---- 插入节点 ---- */
    printf("【1】插入节点：50, 30, 70, 20, 40, 60, 80, 10, 25, 55\n");
    printf("    插入顺序会影响树的形状，但不影响 BST 性质\n\n");

    int insertValues[] = {50, 30, 70, 20, 40, 60, 80, 10, 25, 55};
    int n = sizeof(insertValues) / sizeof(insertValues[0]);

    for (int i = 0; i < n; i++) {
        printf("  插入 %d", insertValues[i]);
        root = insert(root, insertValues[i]);
        printf(" ... 完成\n");
    }

    /* ---- 展示树结构 ---- */
    printTreeInfo(root);

    /* ---- 查找操作示例 ---- */
    printf("【2】查找操作：\n");

    int searchValues[] = {25, 100, 40, 99};
    int searchCount = sizeof(searchValues) / sizeof(searchValues[0]);

    for (int i = 0; i < searchCount; i++) {
        printf("  查找 %d：", searchValues[i]);
        bool found = search(root, searchValues[i]);
        if (!found) {
            printf("未找到节点 %d\n", searchValues[i]);
        }
    }
    printf("\n");

    /* ---- 删除操作示例 ---- */
    printf("【3】删除操作演示：\n\n");

    /* 删除叶子节点（10 是叶子节点） */
    printf("  删除叶子节点 10：\n");
    root = deleteNode(root, 10);
    printTreeInfo(root);

    /* 删除只有一个子节点的节点（20 只有右子节点 25） */
    printf("  删除只有一个子节点的节点 20：\n");
    root = deleteNode(root, 20);
    printTreeInfo(root);

    /* 删除有两个子节点的节点（50 是根节点，有两个子节点） */
    printf("  删除有两个子节点的节点 50（根节点）：\n");
    root = deleteNode(root, 50);
    printTreeInfo(root);

    /* ---- 最终验证 ---- */
    printf("【4】最终树的状态验证：\n");
    printf("  中序遍历是否仍然有序：");
    inorderTraversal(root);
    printf("\n");
    printf("  结论：删除操作后 BST 性质保持不变 ✓\n\n");

    /* ---- 释放内存 ---- */
    printf("【5】释放整棵树的内存：\n");
    freeTree(root);
    root = NULL;  /* 避免野指针 */
    printf("\n所有内存已释放，程序结束。\n");

    return 0;
}
