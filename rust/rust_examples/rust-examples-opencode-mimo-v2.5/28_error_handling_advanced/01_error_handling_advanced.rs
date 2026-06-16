// ============================================
// 知识点：高级错误处理
// 难度：高级
// ============================================

// Rust 提供了多种错误处理方式
// 包括自定义错误类型、thiserror、anyhow 等

use std::fmt;
use std::io;

// ==================== 自定义错误类型 ====================
#[derive(Debug)]
enum AppError {
    Io(io::Error),
    Parse(std::num::ParseIntError),
    Custom(String),
}

impl fmt::Display for AppError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            AppError::Io(e) => write!(f, "IO 错误: {}", e),
            AppError::Parse(e) => write!(f, "解析错误: {}", e),
            AppError::Custom(e) => write!(f, "{}", e),
        }
    }
}

impl std::error::Error for AppError {}

impl From<io::Error> for AppError {
    fn from(error: io::Error) -> Self {
        AppError::Io(error)
    }
}

impl From<std::num::ParseIntError> for AppError {
    fn from(error: std::num::ParseIntError) -> Self {
        AppError::Parse(error)
    }
}

// ==================== 错误上下文 ====================
trait ErrorContext {
    fn with_context(self, context: &str) -> Self;
}

impl<T> ErrorContext for Result<T, AppError> {
    fn with_context(self, context: &str) -> Self {
        self.map_err(|e| AppError::Custom(format!("{}: {}", context, e)))
    }
}

// ==================== 使用 thiserror（注释示例） ====================
// thiserror 是一个用于简化错误定义的 crate
//
// use thiserror::Error;
//
// #[derive(Error, Debug)]
// enum AppError {
//     #[error("IO 错误: {0}")]
//     Io(#[from] io::Error),
//
//     #[error("解析错误: {0}")]
//     Parse(#[from] std::num::ParseIntError),
//
//     #[error("{0}")]
//     Custom(String),
// }

// ==================== 使用 anyhow（注释示例） ====================
// anyhow 提供动态错误类型和错误上下文
//
// use anyhow::{Result, Context};
//
// fn read_config(path: &str) -> Result<Config> {
//     let content = std::fs::read_to_string(path)
//         .context("读取配置文件失败")?;
//     let config: Config = serde_json::from_str(&content)
//         .context("解析配置文件失败")?;
//     Ok(config)
// }

// ==================== 错误转换 ====================
fn parse_and_double(s: &str) -> Result<i32, AppError> {
    let n = s.parse::<i32>()?;
    Ok(n * 2)
}

fn read_number(path: &str) -> Result<i32, AppError> {
    let content = std::fs::read_to_string(path)?;
    let number = content.trim().parse::<i32>()?;
    Ok(number)
}

// ==================== 错误链 ====================
#[derive(Debug)]
struct ErrorChain {
    message: String,
    source: Option<Box<dyn std::error::Error>>,
}

impl fmt::Display for ErrorChain {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "{}", self.message)?;
        if let Some(source) = &self.source {
            write!(f, "\n  Caused by: {}", source)?;
        }
        Ok(())
    }
}

impl std::error::Error for ErrorChain {}

// ==================== Result 组合器 ====================
fn process_data(input: &str) -> Result<String, AppError> {
    let number = input.parse::<i32>()?;
    
    let result = if number > 0 {
        format!("正数: {}", number)
    } else if number < 0 {
        format!("负数: {}", number)
    } else {
        "零".to_string()
    };
    
    Ok(result)
}

// ==================== 错误处理模式 ====================
fn divide(a: f64, b: f64) -> Result<f64, String> {
    if b == 0.0 {
        Err("除数不能为零".to_string())
    } else {
        Ok(a / b)
    }
}

// 使用 ? 运算符传播错误
fn calculate_average(numbers: &[f64]) -> Result<f64, String> {
    if numbers.is_empty() {
        return Err("数组不能为空".to_string());
    }
    
    let sum: f64 = numbers.iter().sum();
    let count = numbers.len() as f64;
    
    divide(sum, count)
}

// ==================== 错误处理与迭代器 ====================
fn parse_numbers(inputs: &[&str]) -> Result<Vec<i32>, String> {
    let mut numbers = Vec::new();
    
    for input in inputs {
        let number = input.parse::<i32>()
            .map_err(|e| format!("解析 '{}' 失败: {}", input, e))?;
        numbers.push(number);
    }
    
    Ok(numbers)
}

// ==================== 错误处理与闭包 ====================
fn apply_to_result<F>(result: Result<i32, String>, f: F) -> Result<i32, String>
where
    F: FnOnce(i32) -> i32,
{
    result.map(f)
}

// ==================== 主函数 ====================
fn main() {
    println!("=== 高级错误处理 ===");
    
    // ==================== 基础错误处理 ====================
    println!("\n=== 基础错误处理 ===");
    
    match parse_and_double("21") {
        Ok(result) => println!("结果: {}", result),
        Err(e) => println!("错误: {}", e),
    }
    
    match parse_and_double("abc") {
        Ok(result) => println!("结果: {}", result),
        Err(e) => println!("错误: {}", e),
    }
    
    // ==================== 错误上下文 ====================
    println!("\n=== 错误上下文 ===");
    
    fn read_config(path: &str) -> Result<String, AppError> {
        let content = std::fs::read_to_string(path)
            .map_err(|e| AppError::Custom(format!("读取配置文件 '{}' 失败: {}", path, e)))?;
        Ok(content)
    }
    
    match read_config("config.txt") {
        Ok(content) => println!("配置: {}", content),
        Err(e) => println!("错误: {}", e),
    }
    
    // ==================== 错误链 ====================
    println!("\n=== 错误链 ===");
    
    fn complex_operation() -> Result<(), AppError> {
        let number = "42".parse::<i32>()?;
        println!("解析成功: {}", number);
        Ok(())
    }
    
    match complex_operation() {
        Ok(()) => println!("操作成功"),
        Err(e) => println!("操作失败: {}", e),
    }
    
    // ==================== Result 组合器 ====================
    println!("\n=== Result 组合器 ===");
    
    let result = "42".parse::<i32>()
        .map(|x| x * 2)
        .map_err(|e| e.to_string());
    println!("map: {:?}", result);
    
    let result = "42".parse::<i32>()
        .and_then(|x| {
            if x > 0 {
                Ok(x)
            } else {
                Err("必须为正数".to_string())
            }
        });
    println!("and_then: {:?}", result);
    
    let result: Result<i32, String> = Err("错误".to_string());
    let result = result.unwrap_or(0);
    println!("unwrap_or: {}", result);
    
    // ==================== 错误处理模式 ====================
    println!("\n=== 错误处理模式 ===");
    
    match divide(10.0, 3.0) {
        Ok(result) => println!("10 / 3 = {:.2}", result),
        Err(e) => println!("错误: {}", e),
    }
    
    match divide(10.0, 0.0) {
        Ok(result) => println!("10 / 0 = {:.2}", result),
        Err(e) => println!("错误: {}", e),
    }
    
    let numbers = vec![1.0, 2.0, 3.0, 4.0, 5.0];
    match calculate_average(&numbers) {
        Ok(avg) => println!("平均值: {:.2}", avg),
        Err(e) => println!("错误: {}", e),
    }
    
    // ==================== 错误处理与迭代器 ====================
    println!("\n=== 错误处理与迭代器 ===");
    
    let inputs = vec!["42", "abc", "123", "xyz"];
    match parse_numbers(&inputs) {
        Ok(numbers) => println!("解析结果: {:?}", numbers),
        Err(e) => println!("错误: {}", e),
    }
    
    // ==================== 错误处理与闭包 ====================
    println!("\n=== 错误处理与闭包 ===");
    
    let result = Ok(42);
    let result = apply_to_result(result, |x| x * 2);
    println!("应用闭包: {:?}", result);
    
    let result: Result<i32, String> = Err("错误".to_string());
    let result = apply_to_result(result, |x| x * 2);
    println!("应用闭包（错误）: {:?}", result);
    
    // ==================== 错误转换 ====================
    println!("\n=== 错误转换 ===");
    
    fn read_file(path: &str) -> Result<String, AppError> {
        let content = std::fs::read_to_string(path)?;
        Ok(content)
    }
    
    fn parse_file(path: &str) -> Result<i32, AppError> {
        let content = read_file(path)?;
        let number = content.trim().parse::<i32>()?;
        Ok(number)
    }
    
    match parse_file("number.txt") {
        Ok(n) => println!("文件中的数字: {}", n),
        Err(e) => println!("错误: {}", e),
    }
    
    // ==================== 错误处理最佳实践 ====================
    println!("\n=== 错误处理最佳实践 ===");
    
    println!("1. 使用 ? 运算符简化错误传播");
    println!("2. 为库定义具体的错误类型");
    println!("3. 为应用程序使用 anyhow");
    println!("4. 使用 map_err 添加上下文");
    println!("5. 使用 unwrap_or_else 提供默认值");
    println!("6. 使用 match 显式处理每个错误");
    println!("7. 避免在库中使用 unwrap");
    println!("8. 使用 thiserror 简化错误定义");
    
    // ==================== 实际应用示例 ====================
    println!("\n=== 实际应用示例 ===");
    
    fn load_config(path: &str) -> Result<HashMap<String, String>, AppError> {
        let content = std::fs::read_to_string(path)?;
        
        let mut config = std::collections::HashMap::new();
        for line in content.lines() {
            if let Some((key, value)) = line.split_once('=') {
                config.insert(key.trim().to_string(), value.trim().to_string());
            }
        }
        
        Ok(config)
    }
    
    match load_config("config.txt") {
        Ok(config) => println!("配置: {:?}", config),
        Err(e) => println!("加载配置失败: {}", e),
    }
    
    println!("\n高级错误处理演示完成!");
}

// ============================================
// 编译和运行方法：
// 
// Windows:
//   rustc 01_error_handling_advanced.rs -o 01_error_handling_advanced.exe
//   01_error_handling_advanced.exe
//
// Linux/macOS:
//   rustc 01_error_handling_advanced.rs -o 01_error_handling_advanced
//   ./01_error_handling_advanced
//
// 使用 Cargo 项目：
//   cargo new error_handling_demo
//   cd error_handling_demo
//   cargo add thiserror
//   cargo add anyhow
//   cargo run
// ============================================
