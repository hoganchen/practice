// ============================================================
// Rust 知识点：HashMap<K, V> 哈希表（键值对存储）
// 编译：rustc 003_hashmap.rs && .\003_hashmap.exe
// ============================================================

use std::collections::HashMap;

fn main() {
    // ---- 创建 HashMap ----
    // 方法1：new + insert
    let mut scores = HashMap::new();
    scores.insert(String::from("Blue"), 10);
    scores.insert(String::from("Yellow"), 50);

    // 方法2：从迭代器构建
    let teams = vec![String::from("Red"), String::from("Green")];
    let initial_scores = vec![30, 40];
    let team_scores: HashMap<_, _> = teams.iter().zip(initial_scores.iter()).collect();

    println!("scores = {:?}", scores);
    println!("team_scores = {:?}", team_scores);

    // ---- 访问元素 ----
    // get 方法返回 Option<&V>
    match scores.get("Blue") {
        Some(score) => println!("Blue 分数: {}", score),
        None => println!("Blue 队伍不存在"),
    }

    // ---- 插入与更新 ----
    let mut map = HashMap::new();

    // insert：覆盖已有值
    map.insert(String::from("a"), 1);
    map.insert(String::from("a"), 2); // 覆盖
    println!("insert 覆盖: {:?}", map);

    // entry + or_insert：只在键不存在时插入
    map.entry(String::from("b")).or_insert(3);
    map.entry(String::from("a")).or_insert(99); // 不插入，a 已存在
    println!("entry + or_insert: {:?}", map);

    // ---- 基于现有值更新 ----
    let text = "hello world hello rust world hello";
    let mut word_count = HashMap::new();

    for word in text.split_whitespace() {
        let count = word_count.entry(word).or_insert(0);
        *count += 1; // 解引用并自增
    }
    println!("词频统计: {:?}", word_count);

    // ---- 所有权 ----
    let field_name = String::from("favorite_color");
    let field_value = String::from("blue");

    let mut map2 = HashMap::new();
    map2.insert(field_name, field_value);
    // field_name 和 field_value 的所有权已转移到 HashMap
    // println!("{}", field_name); // 编译错误！

    // 如果插入引用，不会转移所有权
    let key = "name";
    let value = "Alice";
    let mut map3 = HashMap::new();
    map3.insert(key, value); // &str，不转移所有权
    println!("key 仍有效: {}", key);

    // ---- 遍历 ----
    for (key, value) in &scores {
        println!("{}: {}", key, value);
    }

    // ---- 大小与容量 ----
    println!("map 长度: {}", map.len());
    map.shrink_to_fit(); // 缩小容量
    println!("map 容量: {}", map.capacity());
}
