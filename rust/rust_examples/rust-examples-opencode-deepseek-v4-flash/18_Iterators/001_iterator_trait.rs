// ============================================================
// Rust 知识点：迭代器（Iterator Trait）—— 遍历集合
// 编译：rustc 001_iterator_trait.rs && .\001_iterator_trait.exe
// ============================================================

fn main() {
    // ---- 使用迭代器 ----
    let numbers = vec![1, 2, 3, 4, 5];

    // 创建迭代器
    let iter = numbers.iter(); // 返回 Option<&T>

    // for 循环在幕后使用迭代器
    println!("for 循环遍历:");
    for num in iter {
        print!("{} ", num);
    }
    println!();

    // ---- Iterator trait 方法 ----
    // next —— 手动推进迭代器
    let mut iter = numbers.iter();
    println!("next: {:?}", iter.next()); // Some(1)
    println!("next: {:?}", iter.next()); // Some(2)
    println!("next: {:?}", iter.next()); // Some(3)

    // ---- 三种迭代器 ----
    // iter() —— 不可变引用
    let v = vec![1, 2, 3];
    for val in v.iter() {
        // &i32
        print!("{} ", val);
    }
    println!();

    // iter_mut() —— 可变引用
    let mut v = vec![1, 2, 3];
    for val in v.iter_mut() {
        *val *= 2;
    }
    println!("iter_mut 后: {:?}", v);

    // into_iter() —— 获取所有权
    let v = vec![1, 2, 3];
    for val in v.into_iter() {
        // i32（所有权）
        print!("{} ", val);
    }
    // println!("{:?}", v); // v 已被消费
    println!();

    // ---- 消费适配器（Consuming Adaptors） ----
    let v = vec![1, 2, 3, 4, 5];

    // sum：求和
    let total: i32 = v.iter().sum();
    println!("sum = {}", total);

    // count：计数
    let count = v.iter().count();
    println!("count = {}", count);

    // collect：收集到集合
    let doubled: Vec<i32> = v.iter().map(|x| x * 2).collect();
    println!("collect: {:?}", doubled);

    // for_each：对每个元素执行操作
    v.iter().for_each(|x| print!("{} ", x));
    println!();

    // ---- 迭代器适配器（Iterator Adaptors） ----
    let v = vec![1, 2, 3, 4, 5, 6];

    // map：对每个元素执行转换
    // filter：过滤元素
    // take：只取前 n 个
    // skip：跳过前 n 个
    // chain：连接两个迭代器
    // zip：将两个迭代器压缩为一个

    let result: Vec<_> = v.iter()
        .map(|x| x * 2)
        .filter(|x| x > 5)
        .take(3)
        .collect();
    println!("链式操作: {:?}", result); // [6, 8, 10]
}
