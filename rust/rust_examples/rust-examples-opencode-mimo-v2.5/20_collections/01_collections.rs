// ============================================
// 知识点：集合类型
// 难度：中级
// ============================================

// Rust 提供了多种集合类型
// 包括 Vec、HashMap、HashSet 等

use std::collections::{HashMap, HashSet, LinkedList, VecDeque};

fn main() {
    // ==================== Vec<T>：动态数组 ====================
    println!("=== Vec<T> ===");
    
    // 创建 Vec
    let mut numbers: Vec<i32> = Vec::new();
    numbers.push(1);
    numbers.push(2);
    numbers.push(3);
    println!("Vec: {:?}", numbers);
    
    // 使用 vec! 宏
    let fruits = vec!["苹果", "香蕉", "橙子"];
    println!("水果: {:?}", fruits);
    
    // 访问元素
    println!("第一个: {}", numbers[0]);
    println!("使用 get: {:?}", numbers.get(1));
    
    // 修改元素
    numbers[0] = 10;
    println!("修改后: {:?}", numbers);
    
    // Vec 操作
    numbers.push(4);
    numbers.insert(1, 5);
    println!("插入后: {:?}", numbers);
    
    let popped = numbers.pop();
    println!("弹出: {:?}", popped);
    
    let removed = numbers.remove(1);
    println!("移除: {}", removed);
    println!("移除后: {:?}", numbers);
    
    // Vec 与迭代器
    let doubled: Vec<i32> = numbers.iter().map(|&x| x * 2).collect();
    println!("翻倍: {:?}", doubled);
    
    let sum: i32 = numbers.iter().sum();
    println!("总和: {}", sum);
    
    // Vec 排序
    let mut unsorted = vec![5, 2, 8, 1, 9, 3];
    unsorted.sort();
    println!("排序后: {:?}", unsorted);
    
    // Vec 去重
    let mut with_duplicates = vec![1, 2, 2, 3, 3, 3, 4];
    with_duplicates.dedup();
    println!("去重后: {:?}", with_duplicates);
    
    // ==================== HashMap<K, V>：哈希映射 ====================
    println!("\n=== HashMap ===");
    
    // 创建 HashMap
    let mut scores: HashMap<String, i32> = HashMap::new();
    scores.insert(String::from("Alice"), 95);
    scores.insert(String::from("Bob"), 87);
    scores.insert(String::from("Charlie"), 92);
    
    println!("分数: {:?}", scores);
    
    // 访问元素
    println!("Alice 的分数: {:?}", scores.get("Alice"));
    
    // 遍历
    for (name, score) in &scores {
        println!("{}: {}", name, score);
    }
    
    // 更新值
    scores.insert(String::from("Alice"), 98);
    println!("更新后: {:?}", scores);
    
    // entry API
    scores
        .entry(String::from("David"))
        .or_insert(85);
    println!("添加 David: {:?}", scores);
    
    // 根据旧值更新
    let text = "hello world wonderful world";
    let mut word_count = HashMap::new();
    
    for word in text.split_whitespace() {
        let count = word_count.entry(word).or_insert(0);
        *count += 1;
    }
    
    println!("单词计数: {:?}", word_count);
    
    // HashMap 与迭代器
    let high_scores: Vec<&String> = scores
        .iter()
        .filter(|&(_, &score)| score >= 90)
        .map(|(name, _)| name)
        .collect();
    println!("高分学生: {:?}", high_scores);
    
    // ==================== HashSet<T>：哈希集合 ====================
    println!("\n=== HashSet ===");
    
    // 创建 HashSet
    let mut fruits_set: HashSet<&str> = HashSet::new();
    fruits_set.insert("苹果");
    fruits_set.insert("香蕉");
    fruits_set.insert("橙子");
    fruits_set.insert("苹果");  // 重复，不会插入
    
    println!("水果集合: {:?}", fruits_set);
    println!("集合大小: {}", fruits_set.len());
    
    // 检查元素
    println!("包含苹果: {}", fruits_set.contains("苹果"));
    
    // 集合操作
    let set_a: HashSet<i32> = vec![1, 2, 3, 4, 5].into_iter().collect();
    let set_b: HashSet<i32> = vec![4, 5, 6, 7, 8].into_iter().collect();
    
    // 并集
    let union: Vec<&i32> = set_a.union(&set_b).collect();
    println!("并集: {:?}", union);
    
    // 交集
    let intersection: Vec<&i32> = set_a.intersection(&set_b).collect();
    println!("交集: {:?}", intersection);
    
    // 差集
    let difference: Vec<&i32> = set_a.difference(&set_b).collect();
    println!("差集 (A-B): {:?}", difference);
    
    // 对称差集
    let symmetric_difference: Vec<&i32> = set_a.symmetric_difference(&set_b).collect();
    println!("对称差集: {:?}", symmetric_difference);
    
    // ==================== VecDeque<T>：双端队列 ====================
    println!("\n=== VecDeque ===");
    
    let mut deque = VecDeque::new();
    
    // 两端操作
    deque.push_back(1);
    deque.push_back(2);
    deque.push_front(0);
    println!("双端队列: {:?}", deque);
    
    // 两端弹出
    let front = deque.pop_front();
    let back = deque.pop_back();
    println!("弹出: {:?}, {:?}", front, back);
    println!("剩余: {:?}", deque);
    
    // 循环缓冲区
    let mut circular = VecDeque::with_capacity(3);
    circular.push_back(1);
    circular.push_back(2);
    circular.push_back(3);
    circular.push_back(4);  // 会覆盖第一个元素
    
    println!("循环缓冲区: {:?}", circular);
    
    // ==================== LinkedList<T>：链表 ====================
    println!("\n=== LinkedList ===");
    
    let mut list = LinkedList::new();
    list.push_back(1);
    list.push_back(2);
    list.push_front(0);
    println!("链表: {:?}", list);
    
    // 链表操作
    let popped = list.pop_front();
    println!("弹出: {:?}", popped);
    println!("剩余: {:?}", list);
    
    // 链表连接
    let mut list1 = LinkedList::new();
    list1.push_back(1);
    list1.push_back(2);
    
    let mut list2 = LinkedList::new();
    list2.push_back(3);
    list2.push_back(4);
    
    list1.append(&mut list2);
    println!("连接后: {:?}", list1);
    println!("list2: {:?}", list2);  // 现在为空
    
    // ==================== BTreeMap/BTreeSet ====================
    println!("\n=== BTreeMap ===");
    
    use std::collections::BTreeMap;
    
    let mut btree = BTreeMap::new();
    btree.insert(3, "三");
    btree.insert(1, "一");
    btree.insert(2, "二");
    
    // BTreeMap 按键排序
    for (key, value) in &btree {
        println!("{}: {}", key, value);
    }
    
    // 范围查询
    let range: Vec<(&i32, &&str)> = btree.range(1..=2).collect();
    println!("范围 1-2: {:?}", range);
    
    // ==================== 集合性能比较 ====================
    println!("\n=== 集合性能比较 ===");
    
    // Vec：随机访问 O(1)，插入/删除 O(n)
    // HashMap：查找 O(1)，插入/删除 O(1) 平均
    // HashSet：查找 O(1)，插入/删除 O(1) 平均
    // BTreeMap：查找 O(log n)，插入/删除 O(log n)
    // LinkedList：插入/删除 O(1)，查找 O(n)
    
    println!("Vec: 适合随机访问和顺序访问");
    println!("HashMap: 适合键值对存储");
    println!("HashSet: 适合唯一值存储");
    println!("BTreeMap: 适合有序键值对");
    println!("LinkedList: 适合频繁插入/删除");
    
    // ==================== 实际应用示例 ====================
    println!("\n=== 实际应用 ===");
    
    // 学生成绩管理系统
    let mut students: HashMap<String, Vec<i32>> = HashMap::new();
    
    // 添加成绩
    students
        .entry("Alice".to_string())
        .or_insert_with(Vec::new)
        .push(95);
    students
        .entry("Alice".to_string())
        .or_insert_with(Vec::new)
        .push(87);
    students
        .entry("Bob".to_string())
        .or_insert_with(Vec::new)
        .push(92);
    
    // 计算平均分
    for (name, grades) in &students {
        let avg: f64 = grades.iter().sum::<i32>() as f64 / grades.len() as f64;
        println!("{}: 平均分 {:.1}", name, avg);
    }
    
    // 文本分析
    let text = "the quick brown fox jumps over the lazy dog";
    let mut char_count: HashMap<char, usize> = HashMap::new();
    
    for c in text.chars() {
        *char_count.entry(c).or_insert(0) += 1;
    }
    
    // 按频率排序
    let mut chars: Vec<(char, &usize)> = char_count.iter().map(|(&c, &count)| (c, count)).collect();
    chars.sort_by(|a, b| b.1.cmp(a.1));
    
    println!("\n字符频率:");
    for (c, count) in chars.iter().take(5) {
        println!("  '{}': {}", c, count);
    }
    
    println!("\n集合类型演示完成!");
}

// ============================================
// 编译和运行方法：
// 
// Windows:
//   rustc 01_collections.rs -o 01_collections.exe
//   01_collections.exe
//
// Linux/macOS:
//   rustc 01_collections.rs -o 01_collections
//   ./01_collections
// ============================================
