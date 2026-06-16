// ============================================================
// Rust 知识点：Vec<T> 动态数组 —— 最常用的集合类型
// 编译：rustc 001_vector.rs && .\001_vector.exe
// ============================================================

fn main() {
    // ---- 创建 Vec ----
    // 方法1：vec! 宏
    let mut v1 = vec![1, 2, 3, 4, 5];

    // 方法2：Vec::new()
    let mut v2: Vec<i32> = Vec::new();

    // 方法3：从迭代器
    let v3: Vec<i32> = (1..=5).collect();

    // ---- 添加元素 ----
    v2.push(10);
    v2.push(20);
    v2.push(30);

    println!("v1 = {:?}", v1);
    println!("v2 = {:?}", v2);

    // ---- 访问元素 ----
    // 方法1：下标索引（越界会 panic）
    let third = v1[2];
    println!("v1[2] = {}", third);

    // 方法2：get 方法（返回 Option，安全）
    match v1.get(10) {
        Some(val) => println!("v1[10] = {}", val),
        None => println!("v1[10] 不存在"),
    }

    // ---- 修改元素 ----
    v1[0] = 100;
    println!("修改后 v1[0] = {}", v1[0]);

    // ---- 遍历 Vec ----
    print!("遍历（不可变引用）: ");
    for val in &v1 {
        print!("{} ", val);
    }
    println!();

    print!("遍历（可变引用）: ");
    for val in &mut v1 {
        *val *= 2; // 每个元素乘以 2
        print!("{} ", val);
    }
    println!();

    // ---- 常用方法 ----
    println!("长度: {}", v1.len());
    println!("是否为空: {}", v1.is_empty());
    println!("容量: {}", v1.capacity());

    v1.pop(); // 移除并返回最后一个元素
    println!("pop 后: {:?}", v1);

    v1.insert(0, 999); // 在索引 0 处插入
    println!("insert 后: {:?}", v1);

    v1.remove(1); // 移除索引 1 处的元素
    println!("remove 后: {:?}", v1);

    v1.clear(); // 清空所有元素
    println!("clear 后: {:?}", v1);

    // ---- 从 Vec 取所有权 ----
    let collected: Vec<i32> = (0..5).collect();
    // 使用 into_iter 获取所有权
    for val in collected.into_iter() {
        print!("{} ", val);
    }
    // println!("{:?}", collected); // collected 已被消费
    println!();
}
