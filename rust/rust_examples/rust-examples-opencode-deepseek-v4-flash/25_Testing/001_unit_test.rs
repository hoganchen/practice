// ============================================================
// Rust 知识点：单元测试 —— #[cfg(test)] 和 #[test]
// 编译：rustc --test 001_unit_test.rs && .\001_unit_test.exe
// 或：cargo test
// ============================================================

// ---- 被测试的函数 ----
fn add(a: i32, b: i32) -> i32 {
    a + b
}

fn divide(a: f64, b: f64) -> Result<f64, String> {
    if b == 0.0 {
        Err("除数不能为零".to_string())
    } else {
        Ok(a / b)
    }
}

fn is_even(n: i32) -> bool {
    n % 2 == 0
}

// ---- 测试模块 ----
#[cfg(test)] // 仅在 cargo test 时编译
mod tests {
    // 导入父模块的 items
    use super::*;

    #[test]
    fn test_add() {
        assert_eq!(add(2, 3), 5);
        assert_eq!(add(-1, 1), 0);
        assert_ne!(add(1, 1), 3); // assert_ne：不相等
    }

    #[test]
    fn test_divide_ok() {
        let result = divide(10.0, 2.0).unwrap();
        assert_eq!(result, 5.0);
    }

    #[test]
    fn test_divide_err() {
        let result = divide(1.0, 0.0);
        assert!(result.is_err());
    }

    #[test]
    #[should_panic(expected = "越界")] // 期望 panic
    fn test_panic() {
        panic!("越界访问");
    }

    #[test]
    fn test_is_even() {
        assert!(is_even(2));
        assert!(is_even(0));
        assert!(!is_even(3));
    }

    // ---- 使用 Result 的测试 ----
    #[test]
    fn test_with_result() -> Result<(), String> {
        if add(1, 1) == 2 {
            Ok(())
        } else {
            Err(String::from("加法错误"))
        }
    }

    // ---- 忽略测试 ----
    #[test]
    #[ignore = "这个测试太慢了"]
    fn slow_test() {
        // 测试慢操作
        assert!(true);
    }
}

// ---- 文档测试（doc test） ----
/// 将两个数相加
///
/// # 示例
///
/// ```
/// use crate::add;
/// assert_eq!(add(2, 3), 5);
/// ```
fn _documented_add() {}

fn main() {
    println!("运行测试：cargo test 或 rustc --test 本文件");
    println!("运行的测试包括：");
    println!("- test_add");
    println!("- test_divide_ok");
    println!("- test_divide_err");
    println!("- test_panic (期望 panic)");
    println!("- test_is_even");
    println!("- test_with_result (返回 Result)");
}
