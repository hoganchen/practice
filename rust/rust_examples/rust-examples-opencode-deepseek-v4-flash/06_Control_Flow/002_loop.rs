// ============================================================
// Rust 知识点：loop 循环 —— 无限循环与 break 返回值
// 编译：rustc 002_loop.rs && .\002_loop.exe
// ============================================================

fn main() {
    // ---- 基本无限循环（用 break 退出） ----
    let mut counter = 0;
    loop {
        counter += 1;
        println!("循环第 {} 次", counter);
        if counter >= 3 {
            break; // 退出循环
        }
    }

    // ---- loop 表达式可以有返回值 ----
    let mut guess = 0;
    let result = loop {
        guess += 1;
        if guess == 5 {
            break guess * 2; // break 后面跟表达式作为 loop 的返回值
        }
    };
    println!("loop 返回值：{}", result); // 10

    // ---- 嵌套循环与标签 ----
    let mut count = 0;
    'outer: loop {
        'inner: loop {
            count += 1;
            if count == 3 {
                break 'outer; // 跳出外层循环
            }
            if count == 2 {
                continue; // 跳过本次迭代，继续内层循环
            }
            println!("内层循环: count = {}", count);
        }
        println!("这行不会被执行到");
    }
    println!("跳出外层循环后 count = {}", count);

    // ---- while 循环（后面有专门例子） ----
    // loop 是最灵活的循环，while 和 for 只是 loop 的语法糖

    // ---- 经典应用：重试操作 ----
    let mut attempts = 0;
    let success = loop {
        attempts += 1;
        if attempts >= 3 {
            break false; // 重试 3 次失败
        }
        // 模拟可能失败的操作
        if attempts == 2 {
            break true; // 第 2 次成功了
        }
    };
    println!("操作是否成功: {}", success);
}
