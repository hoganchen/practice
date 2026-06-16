// ============================================================
// Rust 知识点：声明宏（Declarative Macros）—— macro_rules!
// 编译：rustc 001_declarative_macros.rs && .\001_declarative_macros.exe
// ============================================================

// ---- 创建简单的宏 ----
// macro_rules! 宏名 { ... }
macro_rules! say_hello {
    // () 表示匹配空参数
    () => {
        println!("你好！")
    };
}

// ---- 带参数的宏 ----
macro_rules! greet {
    ($name:expr) => {
        // $name 是表达式参数
        println!("你好，{}！", $name)
    };
}

// ---- 带多个参数的宏 ----
macro_rules! create_function {
    ($func_name:ident, $val:expr) => {
        fn $func_name() {
            println!("函数 {} 被调用，值为: {}", stringify!($func_name), $val);
        }
    };
}

// 使用宏创建函数
create_function!(foo, 42);
create_function!(bar, "hello");

// ---- 重复模式 ----
macro_rules! vec_of_strings {
    // $(...),* 表示重复零次或多次
    ($($x:expr),*) => {
        {
            let mut v = Vec::new();
            $(
                v.push($x.to_string());
            )*
            v
        }
    };
}

// ---- 计算宏（类似最小函数） ----
macro_rules! calc {
    (add $a:expr, $b:expr) => {
        $a + $b
    };
    (sub $a:expr, $b:expr) => {
        $a - $b
    };
    (mul $a:expr, $b:expr) => {
        $a * $b
    };
    (div $a:expr, $b:expr) => {
        $a / $b
    };
}

// ---- 递归宏 ----
macro_rules! sum {
    // 基础情况：单个数值
    ($x:expr) => {
        $x
    };
    // 递归情况：x + sum(...)
    ($x:expr, $($rest:expr),*) => {
        $x + sum!($($rest),*)
    };
}

fn main() {
    // 使用宏
    say_hello!();
    greet!("Alice");
    greet!(String::from("Bob"));

    // 调用宏创建的函数
    foo();
    bar();

    // 重复模式宏
    let v = vec_of_strings!("a", "b", "c");
    println!("字符串向量: {:?}", v);

    // 计算宏
    println!("add: {}", calc!(add 10, 20));
    println!("sub: {}", calc!(sub 100, 30));
    println!("mul: {}", calc!(mul 6, 7));
    println!("div: {}", calc!(div 42, 2));

    // 递归宏
    println!("sum: {}", sum!(1, 2, 3, 4, 5)); // 15

    // ---- 标准库中的常用宏 ----
    println!(); // 打印
    let v = vec![1, 2, 3]; // 创建 Vec
    println!("vec! 宏: {:?}", v);
    println!("concat! 宏: {}", concat!("a", "b", "c")); // "abc"
    println!("stringify! 宏: {}", stringify!(1 + 2)); // "1 + 2"
    println!("include_str! 包含文件");
    // let s = include_str!("Cargo.toml"); // 编译时包含文件内容
}
