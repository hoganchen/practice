// ============================================================
// Rust 知识点：while 和 for 循环
// 编译：rustc 003_while_for.rs && .\003_while_for.exe
// ============================================================

fn main() {
    // ========== while 循环 ==========
    let mut count = 3;
    while count > 0 {
        println!("倒计时: {}", count);
        count -= 1;
    }
    println!("发射！\n");

    // ---- while let（模式匹配循环） ----
    let mut stack = vec![1, 2, 3];
    while let Some(top) = stack.pop() {
        println!("弹出: {}", top);
    }
    println!();

    // ========== for 循环 ==========
    // ---- 遍历范围（Range） ----
    // 1..5 是左闭右开：1, 2, 3, 4
    print!("1..5: ");
    for i in 1..5 {
        print!("{} ", i);
    }
    println!();

    // 1..=5 是闭区间：1, 2, 3, 4, 5
    print!("1..=5: ");
    for i in 1..=5 {
        print!("{} ", i);
    }
    println!("\n");

    // ---- 遍历数组/集合 ----
    let arr = [10, 20, 30, 40, 50];
    print!("数组遍历: ");
    for elem in arr.iter() {
        print!("{} ", elem);
    }
    println!();

    // 带索引的遍历
    print!("带索引: ");
    for (index, value) in arr.iter().enumerate() {
        print!("({}:{}) ", index, value);
    }
    println!("\n");

    // ---- 字符串遍历 ----
    let s = "你好 Rust";
    print!("字符遍历: ");
    for c in s.chars() {
        print!("{} ", c);
    }
    println!();

    // ---- 循环中的控制流 ----
    // break：跳出循环
    // continue：跳过本次迭代
    for i in 0..10 {
        if i == 3 {
            continue; // 跳过 3
        }
        if i == 7 {
            break; // 到 7 就停止
        }
        print!("{} ", i);
    }
    println!(" (跳过了 3，在 7 停止)");
}
