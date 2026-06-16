// ============================================================
// Rust 知识点：错误处理 —— Result<T, E> 与 ? 运算符
// 编译：rustc 001_result_and_propagation.rs && .\001_result_and_propagation.exe
// ============================================================

use std::fs::File;
use std::io::{self, Read};

// ---- 使用 Result 类型的函数 ----
fn read_username_from_file(path: &str) -> Result<String, io::Error> {
    // ? 运算符：如果 Result 是 Err，则提前返回 Err
    // 如果是 Ok，则取出 Ok 中的值
    let mut file = File::open(path)?;
    let mut username = String::new();
    file.read_to_string(&mut username)?;
    Ok(username)
}

// ---- 链式调用 ? 运算符 ----
fn read_username_chain(path: &str) -> Result<String, io::Error> {
    let mut username = String::new();
    File::open(path)?.read_to_string(&mut username)?;
    Ok(username)
}

// ---- 自定义错误处理 ----
fn divide(numerator: f64, denominator: f64) -> Result<f64, String> {
    if denominator == 0.0 {
        Err(String::from("除数不能为零"))
    } else {
        Ok(numerator / denominator)
    }
}

fn main() {
    // ---- 处理 Result ----
    let result = divide(10.0, 2.0);
    match result {
        Ok(val) => println!("结果: {}", val),
        Err(e) => println!("错误: {}", e),
    }

    // ---- unwrap 和 expect ----
    // unwrap: Ok 时取值，Err 时 panic
    let val = divide(10.0, 2.0).unwrap();
    println!("unwrap: {}", val);

    // expect: 自定义 panic 消息
    let val = divide(10.0, 2.0).expect("计算失败");
    println!("expect: {}", val);

    // ---- unwrap_or 提供默认值 ----
    let safe_val = divide(1.0, 0.0).unwrap_or(0.0);
    println!("安全除法的默认值: {}", safe_val);

    // ---- map 和 map_err ----
    let ok_result = divide(10.0, 2.0);
    let mapped = ok_result.map(|v| v * 2.0);
    println!("map 后的值: {:?}", mapped);

    let err_result = divide(1.0, 0.0);
    let mapped_err = err_result.map_err(|e| format!("计算错误: {}", e));
    println!("map_err 后的错误: {:?}", mapped_err);

    // ---- ? 运算符在 main 中使用 ----
    // main 函数可以返回 Result
    // let username = read_username_from_file("Cargo.toml")?;
    // println!("用户名: {}", username);

    // ---- 在闭包中使用 ----
    let numbers = vec!["1", "2", "invalid", "4"];
    let parsed: Vec<_> = numbers
        .iter()
        .filter_map(|s| s.parse::<i32>().ok())
        .collect();
    println!("成功解析的数字: {:?}", parsed);
}
