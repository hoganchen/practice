// ============================================================
// Rust 知识点：比较运算符与逻辑运算符
// 编译：rustc 002_comparison_logical.rs && .\002_comparison_logical.exe
// ============================================================

fn main() {
    // ========== 比较运算符 ==========
    // 返回 bool 类型
    let a = 10;
    let b = 20;

    println!("比较运算符：");
    println!("{} == {} : {}", a, b, a == b);  // 等于
    println!("{} != {} : {}", a, b, a != b);  // 不等于
    println!("{} >  {} : {}", a, b, a >  b);  // 大于
    println!("{} <  {} : {}", a, b, a <  b);  // 小于
    println!("{} >= {} : {}", a, b, a >= b);  // 大于等于
    println!("{} <= {} : {}", a, b, a <= b);  // 小于等于

    // 浮点数比较（注意精度问题）
    let f1 = 0.1 + 0.2;
    let f2 = 0.3;
    println!("\n浮点数比较：0.1+0.2 == 0.3 ? {}", f1 == f2); // false！
    // 浮点数比较应使用差值法
    let epsilon = f64::EPSILON;
    println!("使用 epsilon 比较: {}", (f1 - f2).abs() < epsilon);

    // ========== 逻辑运算符 ==========
    let t = true;
    let f = false;

    println!("\n逻辑运算符：");
    println!("true && false: {}", t && f);  // 逻辑与（AND）
    println!("true || false: {}", t || f);  // 逻辑或（OR）
    println!("!true: {}", !t);              // 逻辑非（NOT）

    // 短路求值
    let x = 1;
    let y = 0;
    // && 短路：如果左侧 false，右侧不会执行
    let result = false && (x / y > 0); // 不会触发除以0
    println!("短路与: {}", result);

    // || 短路：如果左侧 true，右侧不会执行
    let result2 = true || (x / y > 0); // 不会触发除以0
    println!("短路或: {}", result2);
}
