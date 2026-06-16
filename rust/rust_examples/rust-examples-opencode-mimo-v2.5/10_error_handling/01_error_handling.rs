// ============================================
// 知识点：错误处理
// 难度：中级
// ============================================

// Rust 使用 Result<T, E> 和 Option<T> 处理错误
// 不使用异常机制

use std::fs;
use std::io;
use std::num::ParseIntError;

// ==================== 自定义错误类型 ====================
#[derive(Debug)]
enum AppError {
    IoError(io::Error),
    ParseError(ParseIntError),
    CustomError(String),
}

impl From<io::Error> for AppError {
    fn from(error: io::Error) -> Self {
        AppError::IoError(error)
    }
}

impl From<ParseIntError> for AppError {
    fn from(error: ParseIntError) -> Self {
        AppError::ParseError(error)
    }
}

impl std::fmt::Display for AppError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            AppError::IoError(e) => write!(f, "IO 错误: {}", e),
            AppError::ParseError(e) => write!(f, "解析错误: {}", e),
            AppError::CustomError(e) => write!(f, "自定义错误: {}", e),
        }
    }
}

// ==================== 函数返回错误 ====================
fn read_number_from_file(path: &str) -> Result<i32, AppError> {
    let content = fs::read_to_string(path)?;
    let number = content.trim().parse::<i32>()?;
    Ok(number)
}

fn divide(a: f64, b: f64) -> Result<f64, String> {
    if b == 0.0 {
        Err(String::from("除数不能为零"))
    } else {
        Ok(a / b)
    }
}

// ==================== 错误传播 ====================
fn process_file(path: &str) -> Result<i32, AppError> {
    let number = fs::read_to_string(path)?;
    let parsed = number.trim().parse::<i32>()?;
    Ok(parsed * 2)
}

// ==================== 主函数 ====================
fn main() {
    // ==================== Option 处理 ====================
    let numbers = vec![1, 2, 3, 4, 5];
    
    // find 返回 Option
    let found = numbers.iter().find(|&&x| x == 3);
    match found {
        Some(n) => println!("找到: {}", n),
        None => println!("未找到"),
    }
    
    // unwrap_or 提供默认值
    let value = found.unwrap_or(&0);
    println!("值: {}", value);
    
    // map 转换
    let doubled = found.map(|&x| x * 2);
    println!("翻倍: {:?}", doubled);
    
    // and_then 链式处理
    let result = found.and_then(|&x| {
        if x > 0 {
            Some(x * 3)
        } else {
            None
        }
    });
    println!("and_then: {:?}", result);
    
    // ==================== Result 处理 ====================
    println!("\nResult 处理:");
    
    // 基础 Result 使用
    let good_result: Result<i32, String> = Ok(42);
    let bad_result: Result<i32, String> = Err(String::from("错误"));
    
    match good_result {
        Ok(v) => println!("成功: {}", v),
        Err(e) => println!("失败: {}", e),
    }
    
    // unwrap（会 panic）
    // let value = bad_result.unwrap();
    
    // unwrap_or（提供默认值）
    let value = bad_result.unwrap_or(0);
    println!("unwrap_or: {}", value);
    
    // unwrap_or_else（懒计算默认值）
    let value = bad_result.unwrap_or_else(|e| {
        println!("处理错误: {}", e);
        -1
    });
    println!("unwrap_or_else: {}", value);
    
    // map 转换成功值
    let result = good_result.map(|v| v * 2);
    println!("map: {:?}", result);
    
    // map_err 转换错误值
    let result = bad_result.map_err(|e| format!("新错误: {}", e));
    println!("map_err: {:?}", result);
    
    // ==================== ? 运算符 ====================
    println!("\n? 运算符:");
    
    // ? 运算符自动传播错误
    fn parse_and_double(s: &str) -> Result<i32, ParseIntError> {
        let n = s.parse::<i32>()?;
        Ok(n * 2)
    }
    
    match parse_and_double("21") {
        Ok(v) => println!("结果: {}", v),
        Err(e) => println!("错误: {}", e),
    }
    
    match parse_and_double("abc") {
        Ok(v) => println!("结果: {}", v),
        Err(e) => println!("错误: {}", e),
    }
    
    // ==================== 自定义错误 ====================
    println!("\n自定义错误:");
    
    fn validate_age(age: i32) -> Result<i32, AppError> {
        if age < 0 {
            Err(AppError::CustomError("年龄不能为负数".to_string()))
        } else if age > 150 {
            Err(AppError::CustomError("年龄不合理".to_string()))
        } else {
            Ok(age)
        }
    }
    
    match validate_age(25) {
        Ok(age) => println!("有效年龄: {}", age),
        Err(e) => println!("验证失败: {}", e),
    }
    
    match validate_age(-5) {
        Ok(age) => println!("有效年龄: {}", age),
        Err(e) => println!("验证失败: {}", e),
    }
    
    // ==================== 错误组合 ====================
    println!("\n错误组合:");
    
    fn combine_results(results: Vec<Result<i32, String>>) -> Result<Vec<i32>, String> {
        let mut values = Vec::new();
        for result in results {
            values.push(result?);
        }
        Ok(values)
    }
    
    let results = vec![Ok(1), Ok(2), Ok(3)];
    match combine_results(results) {
        Ok(values) => println!("所有值: {:?}", values),
        Err(e) => println!("错误: {}", e),
    }
    
    let results = vec![Ok(1), Err("错误".to_string()), Ok(3)];
    match combine_results(results) {
        Ok(values) => println!("所有值: {:?}", values),
        Err(e) => println!("错误: {}", e),
    }
    
    // ==================== 实际应用 ====================
    println!("\n实际应用:");
    
    // 除法错误处理
    match divide(10.0, 3.0) {
        Ok(result) => println!("10 / 3 = {:.2}", result),
        Err(e) => println!("错误: {}", e),
    }
    
    match divide(10.0, 0.0) {
        Ok(result) => println!("10 / 0 = {:.2}", result),
        Err(e) => println!("错误: {}", e),
    }
    
    // 文件操作（如果文件存在）
    let result = fs::read_to_string("nonexistent.txt");
    match result {
        Ok(content) => println!("文件内容: {}", content),
        Err(e) => println!("文件读取失败: {}", e),
    }
    
    // ==================== 错误处理最佳实践 ====================
    println!("\n最佳实践:");
    
    // 1. 使用 ? 运算符简化错误传播
    fn read_config(path: &str) -> Result<String, io::Error> {
        let content = fs::read_to_string(path)?;
        Ok(content)
    }
    
    // 2. 使用 map_err 转换错误类型
    fn parse_config(s: &str) -> Result<i32, AppError> {
        let n = s.parse::<i32>().map_err(AppError::ParseError)?;
        Ok(n)
    }
    
    // 3. 使用 unwrap_or_else 提供有意义的默认值
    let default_value = None::<i32>.unwrap_or_else(|| {
        println!("使用默认值");
        42
    });
    println!("默认值: {}", default_value);
    
    // 4. 使用 match 显式处理每个错误
    let result: Result<i32, String> = Ok(42);
    match result {
        Ok(v) => println!("成功: {}", v),
        Err(e) => println!("失败: {}", e),
    }
    
    println!("\n错误处理演示完成!");
}

// ============================================
// 编译和运行方法：
// 
// Windows:
//   rustc 01_error_handling.rs -o 01_error_handling.exe
//   01_error_handling.exe
//
// Linux/macOS:
//   rustc 01_error_handling.rs -o 01_error_handling
//   ./01_error_handling
// ============================================
