// ============================================
// 知识点：测试
// 难度：中级
// ============================================

// Rust 内置测试框架
// 使用 #[test] 属性标记测试函数

// ==================== 基础测试 ====================
#[test]
fn test_addition() {
    assert_eq!(2 + 2, 4);
}

#[test]
fn test_string() {
    assert!("hello".contains("ell"));
}

// ==================== 断言宏 ====================
#[test]
fn test_assertions() {
    // assert!：断言为真
    assert!(true);
    assert!(!false);
    
    // assert_eq!：断言相等
    assert_eq!(2 + 2, 4);
    
    // assert_ne!：断言不相等
    assert_ne!(2 + 2, 5);
    
    // 自定义消息
    assert_eq!(2 + 2, 4, "2 + 2 应该等于 4");
}

// ==================== 测试函数 ====================
fn is_even(n: i32) -> bool {
    n % 2 == 0
}

#[test]
fn test_is_even() {
    assert!(is_even(2));
    assert!(is_even(4));
    assert!(!is_even(1));
    assert!(!is_even(3));
}

// ==================== 测试与 Result ====================
#[test]
fn test_with_result() -> Result<(), String> {
    let result = 2 + 2;
    if result == 4 {
        Ok(())
    } else {
        Err(format!("2 + 2 = {}，不是 4", result))
    }
}

// ==================== 测试与 panic ====================
#[test]
#[should_panic]
fn test_panic() {
    panic!("预期的 panic");
}

#[test]
#[should_panic(expected = "除以零")]
fn test_panic_with_message() {
    let _x: i32 = 1 / 0;  // 会 panic: "attempt to divide by zero"
}

// ==================== 测试组织 ====================
#[cfg(test)]
mod tests {
    use super::*;
    
    #[test]
    fn test_basic() {
        assert_eq!(1 + 1, 2);
    }
    
    #[test]
    fn test_string_operations() {
        let s = String::from("hello");
        assert_eq!(s.len(), 5);
        assert_eq!(s.to_uppercase(), "HELLO");
    }
    
    #[test]
    fn test_vector() {
        let mut v = vec![1, 2, 3];
        v.push(4);
        assert_eq!(v, vec![1, 2, 3, 4]);
    }
    
    // 测试辅助函数
    fn helper_function() -> i32 {
        42
    }
    
    #[test]
    fn test_with_helper() {
        assert_eq!(helper_function(), 42);
    }
}

// ==================== 测试与迭代器 ====================
#[test]
fn test_iterator() {
    let numbers = vec![1, 2, 3, 4, 5];
    
    let sum: i32 = numbers.iter().sum();
    assert_eq!(sum, 15);
    
    let doubled: Vec<i32> = numbers.iter().map(|&x| x * 2).collect();
    assert_eq!(doubled, vec![2, 4, 6, 8, 10]);
}

// ==================== 测试与错误处理 ====================
fn divide(a: f64, b: f64) -> Result<f64, String> {
    if b == 0.0 {
        Err(String::from("除数不能为零"))
    } else {
        Ok(a / b)
    }
}

#[test]
fn test_divide() {
    assert_eq!(divide(10.0, 2.0), Ok(5.0));
    assert_eq!(divide(10.0, 0.0), Err(String::from("除数不能为零")));
}

// ==================== 测试与结构体 ====================
#[derive(Debug, PartialEq)]
struct Point {
    x: f64,
    y: f64,
}

impl Point {
    fn distance_from_origin(&self) -> f64 {
        (self.x.powi(2) + self.y.powi(2)).sqrt()
    }
}

#[test]
fn test_point() {
    let p = Point { x: 3.0, y: 4.0 };
    assert_eq!(p.distance_from_origin(), 5.0);
    
    let p1 = Point { x: 1.0, y: 2.0 };
    let p2 = Point { x: 1.0, y: 2.0 };
    assert_eq!(p1, p2);
}

// ==================== 测试与枚举 ====================
#[derive(Debug, PartialEq)]
enum Color {
    Red,
    Green,
    Blue,
}

#[test]
fn test_color() {
    assert_eq!(Color::Red, Color::Red);
    assert_ne!(Color::Red, Color::Blue);
}

// ==================== 性能测试 ====================
#[test]
fn test_performance() {
    let start = std::time::Instant::now();
    
    let mut sum = 0;
    for i in 0..1000000 {
        sum += i;
    }
    
    let duration = start.elapsed();
    println!("计算耗时: {:?}", duration);
    
    // 确保在合理时间内完成
    assert!(duration < std::time::Duration::from_secs(1));
}

// ==================== 测试与泛型 ====================
fn largest<T: PartialOrd>(list: &[T]) -> &T {
    let mut largest = &list[0];
    for item in &list[1..] {
        if item > largest {
            largest = item;
        }
    }
    largest
}

#[test]
fn test_largest() {
    let numbers = vec![34, 50, 25, 100, 65];
    assert_eq!(largest(&numbers), &100);
    
    let chars = vec!['y', 'm', 'a', 'q'];
    assert_eq!(largest(&chars), &'y');
}

// ==================== 测试与生命周期 ====================
fn first_word(s: &str) -> &str {
    let bytes = s.as_bytes();
    for (i, &item) in bytes.iter().enumerate() {
        if item == b' ' {
            return &s[0..i];
        }
    }
    &s[..]
}

#[test]
fn test_first_word() {
    assert_eq!(first_word("hello world"), "hello");
    assert_eq!(first_word("hello"), "hello");
    assert_eq!(first_word(""), "");
}

// ==================== 测试与闭包 ====================
#[test]
fn test_closures() {
    let add = |a, b| a + b;
    assert_eq!(add(2, 3), 5);
    
    let numbers = vec![1, 2, 3, 4, 5];
    let evens: Vec<&i32> = numbers.iter().filter(|&&x| x % 2 == 0).collect();
    assert_eq!(evens, vec![&2, &4]);
}

// ==================== 测试与错误处理 ====================
#[test]
fn test_option() {
    let some_value: Option<i32> = Some(42);
    let no_value: Option<i32> = None;
    
    assert_eq!(some_value.unwrap(), 42);
    assert_eq!(no_value.unwrap_or(0), 0);
}

#[test]
fn test_result() {
    let ok_result: Result<i32, String> = Ok(42);
    let err_result: Result<i32, String> = Err(String::from("错误"));
    
    assert_eq!(ok_result.unwrap(), 42);
    assert_eq!(err_result.unwrap_or(0), 0);
}

// ==================== 集成测试 ====================
// 集成测试放在 tests/ 目录下
// 每个文件都是独立的 crate

// tests/integration_test.rs:
// use my_crate;
// 
// #[test]
// fn test_integration() {
//     assert_eq!(my_crate::add(2, 3), 5);
// }

// ==================== 文档测试 ====================
/// 将两个数字相加
/// 
/// # 示例
/// ```
/// let result = my_crate::add(2, 3);
/// assert_eq!(result, 5);
/// ```
fn add(a: i32, b: i32) -> i32 {
    a + b
}

// ==================== 测试覆盖率 ====================
// 使用 cargo-tarpaulin 生成测试覆盖率报告
// cargo install cargo-tarpaulin
// cargo tarpaulin

// ==================== 基准测试 ====================
// 使用 criterion 进行基准测试
// cargo install criterion
// 在 benches/ 目录下创建基准测试

fn main() {
    println!("测试示例运行中...");
    println!("使用 'cargo test' 运行所有测试");
    println!("使用 'cargo test -- --nocapture' 查看测试输出");
}

// ============================================
// 编译和运行方法：
// 
// Windows:
//   rustc 01_testing.rs -o 01_testing.exe
//   01_testing.exe
//
// Linux/macOS:
//   rustc 01_testing.rs -o 01_testing
//   ./01_testing
//
// 运行测试：
//   cargo test
//   cargo test -- --nocapture
//   cargo test -- --test-threads=1
// ============================================
