// ============================================================
// Rust 知识点：if/else 条件判断
// if 是表达式（有返回值），不是语句
// 编译：rustc 001_if_else.rs && .\001_if_else.exe
// ============================================================

fn main() {
    let number = 7;

    // ---- 基本 if/else ----
    if number < 5 {
        println!("number 小于 5");
    } else if number < 10 {
        println!("number 在 5 到 9 之间");
    } else {
        println!("number 大于等于 10");
    }

    // ---- if 作为表达式使用 ----
    // 所有分支必须返回相同类型
    let condition = true;
    let value = if condition { 42 } else { 0 };
    println!("if 表达式返回值: {}", value);

    // ---- 三元表达式风格 ----
    let max = if a > b { a } else { b };
    println!("较大值: {}", max);

    // ---- 条件必须是 bool 类型 ----
    // Rust 不会自动将非 bool 值转为 bool
    // if 1 { }         // 编译错误！
    // if "hello" { }   // 编译错误！
    if true {           // 必须显式使用 bool
        println!("条件必须是 bool 类型");
    }

    // ---- if let（用于模式匹配） ----
    let optional = Some(42);
    if let Some(value) = optional {
        println!("optional 有值: {}", value);
    }

    // ---- 嵌套 if ----
    let x = 15;
    let y = 20;
    if x > 10 {
        if y > 15 {
            println!("x > 10 且 y > 15");
        } else {
            println!("x > 10 但 y <= 15");
        }
    }

    let a = 30;
    let b = 20;
}
