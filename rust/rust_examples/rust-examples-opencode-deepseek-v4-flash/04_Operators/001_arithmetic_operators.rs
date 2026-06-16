// ============================================================
// Rust 知识点：算术运算符 —— 加减乘除取余
// 编译：rustc 001_arithmetic_operators.rs && .\001_arithmetic_operators.exe
// ============================================================

fn main() {
    let a = 10;
    let b = 3;

    // 基本四则运算
    println!("加法: {} + {} = {}", a, b, a + b);
    println!("减法: {} - {} = {}", a, b, a - b);
    println!("乘法: {} * {} = {}", a, b, a * b);
    println!("除法(整数): {} / {} = {}", a, b, a / b); // 整数除法截断
    println!("取余: {} % {} = {}", a, b, a % b);

    // 浮点数除法
    let x = 10.0;
    let y = 3.0;
    println!("浮点除法: {} / {} = {:.4}", x, y, x / y);

    // 负数
    let neg = -5;
    println!("负数: {}", neg);

    // 复合赋值
    let mut n = 5;
    n += 3;  // n = n + 3
    println!("n += 3: {}", n);
    n -= 2;  // n = n - 2
    println!("n -= 2: {}", n);
    n *= 4;  // n = n * 4
    println!("n *= 4: {}", n);
    n /= 2;  // n = n / 2
    println!("n /= 2: {}", n);
    n %= 3;  // n = n % 3
    println!("n %= 3: {}", n);

    // 不同类型运算需要显式转换
    let int_val = 10;
    let float_val = 3.5;
    // int_val + float_val  // 编译错误！类型不匹配
    let result = int_val as f64 + float_val;
    println!("类型转换后相加: {}", result);
}
