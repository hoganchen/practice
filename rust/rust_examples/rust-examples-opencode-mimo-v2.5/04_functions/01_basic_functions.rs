// ============================================
// 知识点：基础函数
// 难度：入门
// ============================================

// Rust 使用 fn 关键字定义函数
// 函数名使用 snake_case 命名规范
// 参数必须标注类型
// 返回值类型在箭头 -> 后标注

fn main() {
    // 调用无参数函数
    greet();
    
    // 调用有参数的函数
    greet_person("Alice");
    greet_person("Bob");
    
    // 调用有返回值的函数
    let sum = add(5, 3);
    println!("5 + 3 = {}", sum);
    
    // 调用有多个返回值的函数（通过元组）
    let (quotient, remainder) = divide(17, 5);
    println!("17 ÷ 5 = {} 余 {}", quotient, remainder);
    
    // 使用函数返回值
    let result = calculate_area(10.0, 5.0);
    println!("面积: {}", result);
    
    // 函数作为表达式（最后一行没有分号）
    let squared = square(7);
    println!("7 的平方: {}", squared);
    
    // 嵌套函数调用
    let nested_result = add(square(3), square(4));
    println!("3² + 4² = {}", nested_result);
}

// 无参数、无返回值的函数
fn greet() {
    println!("你好，欢迎学习 Rust!");
}

// 有参数的函数
// 参数类型必须标注
fn greet_person(name: &str) {
    println!("你好，{}!", name);
}

// 有返回值的函数
// 使用 -> 指定返回类型
// 最后一个表达式自动成为返回值（不需要 return 关键字）
fn add(a: i32, b: i32) -> i32 {
    a + b  // 注意：没有分号，这是一个表达式
}

// 返回多个值（使用元组）
fn divide(a: i32, b: i32) -> (i32, i32) {
    let quotient = a / b;
    let remainder = a % b;
    (quotient, remainder)  // 返回元组
}

// 使用显式 return 关键字
fn calculate_area(width: f64, height: f64) -> f64 {
    return width * height;  // 显式返回
}

// 函数作为表达式
fn square(x: i32) -> i32 {
    x * x  // 这是一个表达式，它的值就是函数的返回值
}

// 没有返回值的函数
// 返回空元组 ()，也可以省略返回类型
fn do_nothing() {
    // 这个函数什么都不做
    // 它的返回类型是 ()（单元类型）
}

// 有副作用的函数
fn print_sum(a: i32, b: i32) {
    println!("{} + {} = {}", a, b, a + b);
}

// 函数可以接受多个参数
fn calculate_volume(length: f64, width: f64, height: f64) -> f64 {
    length * width * height
}

// 参数可以是任意类型（只要实现了相应的 trait）
fn print_value<T: std::fmt::Display>(value: T) {
    println!("值: {}", value);
}

// 递归函数
fn factorial(n: u64) -> u64 {
    if n <= 1 {
        1
    } else {
        n * factorial(n - 1)
    }
}

// 测试递归函数
fn test_recursion() {
    println!("\n阶乘计算:");
    for i in 0..=10 {
        println!("{}! = {}", i, factorial(i));
    }
}

// 多返回路径
fn classify_number(n: i32) -> &'static str {
    if n > 0 {
        "正数"
    } else if n < 0 {
        "负数"
    } else {
        "零"
    }
}

// 测试函数
fn test_classify() {
    println!("\n数字分类:");
    let numbers = [-5, 0, 10, -3, 7];
    for &num in &numbers {
        println!("{} 是 {}", num, classify_number(num));
    }
}

// 高阶函数：接受函数作为参数
fn apply_operation(a: i32, b: i32, operation: fn(i32, i32) -> i32) -> i32 {
    operation(a, b)
}

// 用于高阶函数的函数
fn multiply(a: i32, b: i32) -> i32 {
    a * b
}

fn subtract(a: i32, b: i32) -> i32 {
    a - b
}

// 测试高阶函数
fn test_higher_order() {
    println!("\n高阶函数:");
    let sum = apply_operation(5, 3, add);
    let product = apply_operation(5, 3, multiply);
    let diff = apply_operation(5, 3, subtract);
    
    println!("5 + 3 = {}", sum);
    println!("5 × 3 = {}", product);
    println!("5 - 3 = {}", diff);
}

// 在 main 中调用测试函数
// 注意：由于 Rust 的作用域规则，这些函数需要在 main 之前定义
// 或者在 main 中直接调用

// 重新组织 main 函数以包含所有测试
fn main_with_tests() {
    greet();
    greet_person("Alice");
    
    let sum = add(5, 3);
    println!("5 + 3 = {}", sum);
    
    let (quotient, remainder) = divide(17, 5);
    println!("17 ÷ 5 = {} 余 {}", quotient, remainder);
    
    let result = calculate_area(10.0, 5.0);
    println!("面积: {}", result);
    
    let squared = square(7);
    println!("7 的平方: {}", squared);
    
    let nested_result = add(square(3), square(4));
    println!("3² + 4² = {}", nested_result);
    
    // 调用测试函数
    test_recursion();
    test_classify();
    test_higher_order();
}

// ============================================
// 编译和运行方法：
// 
// Windows:
//   rustc 01_basic_functions.rs -o 01_basic_functions.exe
//   01_basic_functions.exe
//
// Linux/macOS:
//   rustc 01_basic_functions.rs -o 01_basic_functions
//   ./01_basic_functions
// ============================================
