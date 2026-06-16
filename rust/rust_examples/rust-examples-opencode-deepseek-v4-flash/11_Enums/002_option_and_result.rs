// ============================================================
// Rust 知识点：标准库枚举 —— Option<T> 和 Result<T, E>
// Rust 没有 null，使用 Option 表示可能存在或不存在的值
// 编译：rustc 002_option_and_result.rs && .\002_option_and_result.exe
// ============================================================

use std::num::ParseIntError;

fn main() {
    // ========== Option<T> ==========
    // Some(T): 有值
    // None: 无值

    let some_value: Option<i32> = Some(42);
    let no_value: Option<i32> = None;

    // Option 的常用方法
    println!("is_some: {}", some_value.is_some());   // true
    println!("is_none: {}", some_value.is_none());    // false

    // unwrap：获取值，如果是 None 则 panic
    // println!("{}", no_value.unwrap()); // 这行会 panic！

    // unwrap_or：提供默认值
    let val = no_value.unwrap_or(0);
    println!("unwrap_or: {}", val); // 0

    // map：转换内部值
    let doubled = some_value.map(|x| x * 2);
    println!("mapped: {:?}", doubled); // Some(84)

    // and_then：链式处理
    let result = some_value
        .and_then(|x| {
            if x > 10 {
                Some(x - 10)
            } else {
                None
            }
        });
    println!("and_then: {:?}", result); // Some(32)

    // if let 解构
    if let Some(v) = some_value {
        println!("值: {}", v);
    }

    // ========== Result<T, E> ==========
    // Ok(T): 操作成功
    // Err(E): 操作失败

    // 模拟可能失败的操作
    let success: Result<i32, &str> = Ok(42);
    let failure: Result<i32, &str> = Err("出错了");

    // 常用方法
    println!("is_ok: {}", success.is_ok());
    println!("is_err: {}", failure.is_err());

    // unwrap
    // println!("{}", failure.unwrap()); // panic！

    // unwrap_or
    let val = failure.unwrap_or(-1);
    println!("unwrap_or: {}", val); // -1

    // expect：自定义 panic 消息
    let val = success.expect("应该成功");
    println!("expect: {}", val);

    // map：转换 Ok 中的值
    let mapped = success.map(|x| x * 2);
    println!("mapped: {:?}", mapped);

    // map_err：转换 Err 中的值
    let mapped_err = failure.map_err(|e| format!("错误: {}", e));
    println!("mapped_err: {:?}", mapped_err);

    // ----- 实际应用 ----
    let num_str = "42";
    let parsed: Result<i32, ParseIntError> = num_str.parse();

    match parsed {
        Ok(n) => println!("解析成功: {}", n),
        Err(e) => println!("解析失败: {}", e),
    }

    // 链式调用
    let result = "42"
        .parse::<i32>()
        .map(|n| n * 2)
        .unwrap_or(0);
    println!("链式处理: {}", result);
}
