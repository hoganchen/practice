// ============================================================
// Rust 知识点：表达式（Expression）vs 语句（Statement）
// Rust 是表达式语言 —— 几乎所有东西都是表达式
// 编译：rustc 002_expressions_vs_statements.rs && .\002_expressions_vs_statements.exe
// ============================================================

fn main() {
    // ---- 语句（Statement） ----
    // 执行操作但不返回值
    let x = 5;                    // let 语句
    println!("语句执行");          // 宏调用语句
    fn inner() {}                 // 函数定义语句
    // x = 6;                     // 赋值语句

    // ---- 表达式（Expression） ----
    // 求值并返回值，末尾没有分号

    // 字面量是表达式
    let _ = 42;

    // 代码块是表达式（最后一个表达式的值就是返回值）
    let y = {
        let a = 1;
        let b = 2;
        a + b  // 没有分号！这就是代码块的返回值
    };
    println!("代码块表达式的值: {}", y); // 3

    // if 也是表达式
    let condition = true;
    let value = if condition { 10 } else { 20 };
    println!("if 表达式的值: {}", value); // 10

    // match 也是表达式
    let num = 3;
    let description = match num {
        1 => "一",
        2 => "二",
        3 => "三",
        _ => "其他",
    };
    println!("match 表达式的值: {}", description);

    // ---- 分号的重要作用 ----
    // 加上分号将表达式变为语句
    let result = {
        42  // 表达式，返回值 42
    };
    println!("表达式（无分号）: {}", result);

    let result2 = {
        42; // 语句！返回 ()
    };
    println!("语句（有分号）: {:?}", result2); // ()

    // ---- 发散函数（返回 !） ----
    fn diverging() -> ! {
        panic!("这个函数永远不返回");
    }
    // diverging(); // 取消注释会 panic
}
