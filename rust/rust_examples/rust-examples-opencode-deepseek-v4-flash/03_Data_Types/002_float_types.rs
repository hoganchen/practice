// ============================================================
// Rust 知识点：浮点数类型 —— f32（单精度）、f64（双精度）
// 编译：rustc 002_float_types.rs && .\002_float_types.exe
// ============================================================

fn main() {
    // f64（双精度）—— 默认浮点类型
    // 在大多数现代 CPU 上与 f32 速度相当但精度更高
    let x = 2.0; // 默认是 f64
    let y: f64 = 3.141592653589793;

    // f32（单精度）
    let z: f32 = 1.0; // 需显式标注

    // 科学计数法
    let big = 1.5e5;  // 150000.0
    let small = 2.5e-3; // 0.0025

    // 特殊值
    let inf = f64::INFINITY;
    let neg_inf = f64::NEG_INFINITY;
    let nan = f64::NAN; // Not a Number
    let min = f64::MIN;
    let max = f64::MAX;

    println!("f64: {}", y);
    println!("f32: {}", z);
    println!("科学计数法：{} 和 {}", big, small);
    println!("无穷大：{}", inf);
    println!("负无穷：{}", neg_inf);
    println!("NaN：{}", nan);
    println!("f64 最小值：{}", min);
    println!("f64 最大值：{}", max);

    // ---- 浮点数运算 ----
    let a = 10.0;
    let b = 3.0;
    println!("加法：{}", a + b);
    println!("减法：{}", a - b);
    println!("乘法：{}", a * b);
    println!("除法：{}", a / b);  // 3.333...
    println!("取余：{}", a % b);  // 1.0

    // ---- 浮点数比较注意 ----
    // NaN 不等于任何值，包括自身
    println!("NaN == NaN：{}", f64::NAN == f64::NAN); // false
    // 应该用 is_nan() 方法判断
    println!("f64::NAN.is_nan()：{}", f64::NAN.is_nan()); // true
}
