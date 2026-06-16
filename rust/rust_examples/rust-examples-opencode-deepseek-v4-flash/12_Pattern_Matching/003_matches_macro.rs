// ============================================================
// Rust 知识点：matches! 宏 —— 简洁的模式匹配表达式
// 编译：rustc 003_matches_macro.rs && .\003_matches_macro.exe
// ============================================================

enum Status {
    Active,
    Inactive,
    Pending(String),
}

#[derive(Debug)]
enum Value {
    Integer(i32),
    Float(f64),
    Text(String),
}

fn main() {
    // ---- matches! 基础 ----
    // matches!(表达式, 模式) 返回 bool

    let x = Some(42);
    assert!(matches!(x, Some(_)));
    assert!(matches!(x, Some(42)));
    assert!(!matches!(x, None));
    println!("matches! 基本用法: OK");

    // ---- 带守卫的匹配 ----
    let y = Some(5);
    assert!(matches!(y, Some(n) if n > 3));
    assert!(!matches!(y, Some(n) if n > 10));
    println!("matches! 带守卫: OK");

    // ---- 匹配多个模式 ----
    let status = Status::Pending(String::from("审核中"));
    assert!(matches!(status, Status::Pending(_)));
    assert!(matches!(
        status,
        Status::Active | Status::Inactive | Status::Pending(_)
    ));

    // ---- 与 Option 结合 ----
    let values: Vec<Option<i32>> = vec![Some(1), None, Some(3), None, Some(5)];

    // 使用 matches! 过滤
    let some_values: Vec<&Option<i32>> = values.iter().filter(|v| matches!(v, Some(_))).collect();
    println!("过滤 Some: {:?}", some_values);

    let big_values: Vec<&Option<i32>> = values
        .iter()
        .filter(|v| matches!(v, Some(n) if *n > 2))
        .collect();
    println!("过滤 >2: {:?}", big_values);

    // ---- 与 Result 结合 ----
    let results: Vec<Result<i32, String>> = vec![Ok(1), Err("err".to_string()), Ok(3)];

    let ok_count = results.iter().filter(|r| matches!(r, Ok(_))).count();
    let err_count = results.iter().filter(|r| matches!(r, Err(_))).count();
    println!("Ok 数量: {}, Err 数量: {}", ok_count, err_count);

    // ---- 匹配枚举变体 ----
    let vals = vec![
        Value::Integer(42),
        Value::Float(3.14),
        Value::Text(String::from("hello")),
        Value::Integer(100),
    ];

    // 只处理 Integer 变体
    let integers: Vec<i32> = vals
        .iter()
        .filter_map(|v| match v {
            Value::Integer(n) => Some(*n),
            _ => None,
        })
        .collect();
    println!("Integer 值: {:?}", integers);

    // 使用 matches! 简化判断
    for val in &vals {
        if matches!(val, Value::Integer(_)) {
            println!("是整数");
        } else if matches!(val, Value::Text(t) if t == "hello") {
            println!("是 hello 文本");
        } else {
            println!("其他: {:?}", val);
        }
    }

    // ---- 实际应用场景 ----
    // 1. 测试断言
    let result: Result<i32, String> = Ok(42);
    assert!(matches!(result, Ok(n) if n > 0));

    // 2. 条件检查
    fn is_valid_status(status: &Status) -> bool {
        matches!(status, Status::Active | Status::Pending(_))
    }

    println!(
        "Active 有效: {}",
        is_valid_status(&Status::Active)
    );

    // 3. 集合过滤
    let data = vec![1, 2, 3, 4, 5, 6];
    let even: Vec<i32> = data.into_iter().filter(|n| matches!(n % 2, 0)).collect();
    println!("偶数: {:?}", even);

    // ---- matches! 与 assert_matches! ----
    // assert_matches!(x, Some(42)); // 需要 assert_matches crate
    // Rust 标准库中没有 assert_matches!
    // 使用 matches! + assert! 替代
    assert!(matches!(Some(42), Some(42)));
    assert_eq!(matches!(None::<i32>, Some(_)), false);
}
