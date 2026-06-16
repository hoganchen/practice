// ============================================================
// Rust 知识点：if let 与 while let —— 简洁的模式匹配
// 当你只关心某一个模式时，比 match 更简洁
// 编译：rustc 005_if_let_while_let.rs && .\005_if_let_while_let.exe
// ============================================================

fn main() {
    // ========== if let ==========
    // 用于只匹配一种模式的情况

    let optional = Some(7);

    // 使用 match（冗余）
    match optional {
        Some(x) => println!("match: 值为 {}", x),
        None => (), // 必须处理所有情况
    }

    // 使用 if let（简洁）
    if let Some(x) = optional {
        println!("if let: 值为 {}", x);
    }
    // 不需要处理 None 分支

    // if let 也可以带 else
    let none_value: Option<i32> = None;
    if let Some(x) = none_value {
        println!("不会执行: {}", x);
    } else {
        println!("值为 None");
    }

    // 复杂模式匹配
    enum Status {
        Active,
        Inactive,
        Pending(String),
    }
    let status = Status::Pending("审核中".to_string());

    if let Status::Pending(reason) = status {
        println!("状态挂起: {}", reason);
    }

    // if let 与逻辑运算符结合
    let a = Some(1);
    let b = Some(2);
    if let (Some(x), Some(y)) = (a, b) {
        println!("两个都有值: {} 和 {}", x, y);
    }

    // ========== while let ==========
    // 反复匹配模式直到失败

    let mut numbers = vec![1, 2, 3, 4, 5];
    println!("pop 出所有元素:");
    while let Some(top) = numbers.pop() {
        println!("  {}", top);
    }
    println!("数组为空: {:?}", numbers);

    // ---- 实际应用场景 ----
    // 解析字符串
    let mut tokens = "1,2,3,4,5".split(',');
    while let Some(token) = tokens.next() {
        print!("{} ", token);
    }
    println!("(解析完成)");

    // ---- let-else（Rust 1.65+） ----
    // 解构或提前返回
    let name = Some("Alice");
    let Some(n) = name else {
        println!("没有名字");
        return;
    };
    println!("名字: {}", n);
}
