// ============================================
// 知识点：宏
// 难度：高级
// ============================================

// Rust 有两种宏：
// 1. 声明宏（macro_rules!）
// 2. 过程宏

fn main() {
    // ==================== 基础 macro_rules! ====================
    // 声明宏使用模式匹配
    
    // 定义一个简单的宏
    macro_rules! say_hello {
        () => {
            println!("Hello!");
        };
    }
    
    say_hello!();
    
    // 带参数的宏
    macro_rules! greet {
        ($name:expr) => {
            println!("Hello, {}!", $name);
        };
    }
    
    greet!("Rust");
    greet!("World");
    
    // 多个参数
    macro_rules! calculate {
        ($a:expr, $b:expr, $op:tt) => {
            match $op {
                "+" => println!("{} + {} = {}", $a, $b, $a + $b),
                "-" => println!("{} - {} = {}", $a, $b, $a - $b),
                "*" => println!("{} * {} = {}", $a, $b, $a * $b),
                "/" => println!("{} / {} = {}", $a, $b, $a / $b),
                _ => println!("未知操作符"),
            }
        };
    }
    
    calculate!(10, 5, "+");
    calculate!(10, 5, "-");
    calculate!(10, 5, "*");
    calculate!(10, 5, "/");
    
    // ==================== 重复模式 ====================
    // 使用 $(...) 重复
    
    // 创建 Vec
    macro_rules! vec_of_strings {
        ($($x:expr),* $(,)?) => {
            vec![$($x.to_string()),*]
        };
    }
    
    let strings = vec_of_strings!["hello", "world", "rust"];
    println!("字符串列表: {:?}", strings);
    
    // 创建 HashMap
    macro_rules! hashmap {
        ($($key:expr => $value:expr),* $(,)?) => {
            {
                let mut map = std::collections::HashMap::new();
                $(map.insert($key, $value);)*
                map
            }
        };
    }
    
    let scores = hashmap! {
        "Alice" => 95,
        "Bob" => 87,
        "Charlie" => 92,
    };
    println!("分数: {:?}", scores);
    
    // ==================== 条件匹配 ====================
    macro_rules! check_type {
        ($val:expr, $t:ty) => {
            if std::any::TypeId::of::<$t>() == std::any::TypeId::of::<_>() {
                println!("类型匹配");
            } else {
                println!("类型不匹配");
            }
        };
    }
    
    let x = 42;
    check_type!(x, i32);
    
    // ==================== 递归宏 ====================
    macro_rules! count {
        () => (0usize);
        ($head:tt $($tail:tt)*) => (1usize + count!($($tail)*));
    }
    
    println!("参数数量: {}", count!(a b c d e));
    
    // ==================== 实际应用宏 ====================
    
    // 调试宏
    macro_rules! debug_print {
        ($($arg:tt)*) => {
            if cfg!(debug_assertions) {
                eprintln!("[DEBUG] {}:{}", file!(), line!());
                eprintln!($($arg)*);
            }
        };
    }
    
    debug_print!("值: {}", 42);
    
    // 时间测量宏
    macro_rules! time_it {
        ($label:expr, $block:block) => {
            {
                let start = std::time::Instant::now();
                let result = $block;
                let duration = start.elapsed();
                println!("{}: {:?}", $label, duration);
                result
            }
        };
    }
    
    let result = time_it!("计算", {
        let mut sum = 0;
        for i in 0..1000 {
            sum += i;
        }
        sum
    });
    println!("结果: {}", result);
    
    // ==================== 测试宏 ====================
    macro_rules! assert_eq_approx {
        ($left:expr, $right:expr, $epsilon:expr) => {
            let left = $left;
            let right = $right;
            let epsilon = $epsilon;
            assert!(
                (left - right).abs() < epsilon,
                "断言失败: {} ≈ {} (误差: {})",
                left,
                right,
                epsilon
            );
        };
    }
    
    assert_eq_approx!(3.14, 3.14159, 0.01);
    println!("近似相等断言通过");
    
    // ==================== 过程宏概念 ====================
    // 过程宏是更强大的宏类型
    // 包括：derive 宏、属性宏、函数宏
    
    // derive 宏示例（使用标准库的）
    #[derive(Debug, Clone, PartialEq)]
    struct Point {
        x: f64,
        y: f64,
    }
    
    let p1 = Point { x: 1.0, y: 2.0 };
    let p2 = p1.clone();
    println!("点: {:?}", p1);
    println!("相等: {}", p1 == p2);
    
    // ==================== 宏与迭代器 ====================
    macro_rules! iter_through {
        ($($x:expr),* $(,)?) => {
            {
                let mut items = Vec::new();
                $(items.push($x);)*
                items
            }
        };
    }
    
    let numbers = iter_through![1, 2, 3, 4, 5];
    let sum: i32 = numbers.iter().sum();
    println!("总和: {}", sum);
    
    // ==================== 宏与模式匹配 ====================
    macro_rules! match_value {
        ($value:expr, $($pattern:pat => $result:expr),* $(,)?) => {
            match $value {
                $($pattern => $result,)*
            }
        };
    }
    
    let x = 2;
    let result = match_value!(x, 1 => "一", 2 => "二", 3 => "三", _ => "其他");
    println!("匹配结果: {}", result);
    
    // ==================== 宏与类型 ====================
    macro_rules! type_of {
        ($val:expr) => {
            std::any::type_name_of_val(&$val)
        };
    }
    
    let x = 42;
    let s = "hello";
    let v = vec![1, 2, 3];
    
    println!("x 的类型: {}", type_of!(x));
    println!("s 的类型: {}", type_of!(s));
    println!("v 的类型: {}", type_of!(v));
    
    // ==================== 宏与错误处理 ====================
    macro_rules! try_or_return {
        ($expr:expr, $err:expr) => {
            match $expr {
                Ok(val) => val,
                Err(e) => {
                    eprintln!("错误: {}: {}", $err, e);
                    return;
                }
            }
        };
    }
    
    fn example_function() -> Result<(), Box<dyn std::error::Error>> {
        let _x: i32 = try_or_return!("42".parse(), "解析失败");
        println!("解析成功: {}", _x);
        Ok(())
    }
    
    if let Err(e) = example_function() {
        println!("函数错误: {}", e);
    }
    
    // ==================== 宏调试 ====================
    // 使用 cargo expand 查看宏展开结果
    
    println!("\n宏演示完成!");
    println!("提示：使用 cargo expand 可以查看宏展开结果");
}

// ============================================
// 编译和运行方法：
// 
// Windows:
//   rustc 01_macro_rules.rs -o 01_macro_rules.exe
//   01_macro_rules.exe
//
// Linux/macOS:
//   rustc 01_macro_rules.rs -o 01_macro_rules
//   ./01_macro_rules
//
// 查看宏展开：
//   cargo install cargo-expand
//   cargo expand
// ============================================
