// ============================================================
// Rust 知识点：HashSet<T> 和 BTreeMap<K, V>
// HashSet：无序不重复集合
// BTreeMap：有序键值对
// 编译：rustc 004_hashset_btreemap.rs && .\004_hashset_btreemap.exe
// ============================================================

use std::collections::{BTreeMap, HashSet};

fn main() {
    // ========== HashSet<T> ==========
    // 存储不重复元素，基于哈希表，无序

    let mut set = HashSet::new();
    set.insert(1);
    set.insert(2);
    set.insert(3);
    set.insert(2); // 不会重复插入

    println!("HashSet: {:?}", set);
    println!("长度: {}", set.len());
    println!("包含 2? {}", set.contains(&2));

    // 移除元素
    set.remove(&2);
    println!("移除 2 后: {:?}", set);

    // ---- 集合运算 ----
    let set1: HashSet<i32> = [1, 2, 3, 4].iter().cloned().collect();
    let set2: HashSet<i32> = [3, 4, 5, 6].iter().cloned().collect();

    // 并集
    let union: HashSet<_> = set1.union(&set2).cloned().collect();
    println!("并集: {:?}", union);

    // 交集
    let intersection: HashSet<_> = set1.intersection(&set2).cloned().collect();
    println!("交集: {:?}", intersection);

    // 差集（set1 中有但 set2 中没有）
    let difference: HashSet<_> = set1.difference(&set2).cloned().collect();
    println!("差集: {:?}", difference);

    // 对称差
    let sym_diff: HashSet<_> = set1.symmetric_difference(&set2).cloned().collect();
    println!("对称差: {:?}", sym_diff);

    // ========== BTreeMap<K, V> ==========
    // 键值对，按键排序存储，基于 B 树
    // 适用于需要按顺序遍历键值对的场景

    let mut btree = BTreeMap::new();
    btree.insert("c", 3);
    btree.insert("a", 1);
    btree.insert("b", 2);

    // 自动按键排序
    println!("BTreeMap: {:?}", btree);

    // 范围查询
    let mut range = btree.range("a"..="c");
    while let Some((key, val)) = range.next() {
        println!("  {}: {}", key, val);
    }

    // 第一个/最后一个条目
    println!("第一个: {:?}", btree.first_entry());
    println!("最后一个: {:?}", btree.last_entry());

    // ---- HashMap vs BTreeMap 选择 ----
    // HashMap：更快的查找 O(1) ，无序
    // BTreeMap：较慢的查找 O(log n) ，按 key 排序
}
