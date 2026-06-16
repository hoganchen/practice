// ============================================================
// Rust 知识点：函数定义 —— fn、参数、返回值
// 编译：rustc 001_function_basics.rs && .\001_function_basics.exe
// ============================================================

// ---- 函数定义语法 ----
// `fn` 函数名(参数列表) -> 返回值类型 { 函数体 }
fn add(x: i32, y: i32) -> i32 {
    // 表达式（不带分号）作为返回值
    x + y
}

// 没有返回值的函数（返回 () 单元类型）
fn greet(name: &str) {
    println!("你好，{}！", name);
    // 相当于 return ();
}

// ---- 提前返回 ----
fn divide(a: f64, b: f64) -> f64 {
    if b == 0.0 {
        return f64::NAN; // 提前返回
    }
    a / b // 最后一个表达式作为返回值
}

fn main() {
    // 调用函数
    let sum = add(5, 3);
    println!("5 + 3 = {}", sum);

    greet("Rust");
    greet("World");

    let result = divide(10.0, 3.0);
    println!("10 / 3 = {:.4}", result);

    let invalid = divide(1.0, 0.0);
    println!("1 / 0 = {}", invalid);

    // ---- 函数指针 ----
    let func_ptr: fn(i32, i32) -> i32 = add;
    println!("通过函数指针调用: {}", func_ptr(7, 8));
}
