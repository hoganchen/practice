// ============================================================
// Rust 知识点：高级模式匹配 —— 解构、守卫、绑定
// 编译：rustc 001_match_advanced.rs && .\001_match_advanced.exe
// ============================================================

struct Point {
    x: i32,
    y: i32,
}

enum Shape {
    Circle(Point, f64),
    Rectangle(Point, Point),
}

fn main() {
    // ---- 解构结构体 ----
    let p = Point { x: 10, y: 20 };
    // 方法1：let 解构
    let Point { x: a, y: b } = p;
    println!("a={}, b={}", a, b);

    // 方法2：简写解构
    let Point { x, y } = p;
    println!("x={}, y={}", x, y);

    // ---- 解构 enum ----
    let circle = Shape::Circle(Point { x: 0, y: 0 }, 5.0);
    match circle {
        Shape::Circle(center, radius) => {
            println!("圆心 ({}, {}), 半径 {}", center.x, center.y, radius);
        }
        Shape::Rectangle(..) => println!("矩形"),
    }

    // ---- 匹配守卫（match guards） ----
    let pair = (10, 20);
    match pair {
        (x, y) if x == y => println!("相等"),
        (x, y) if x + y == 30 => println!("和为 30"),
        (x, _) if x % 2 == 0 => println!("第一个是偶数"),
        _ => println!("其他情况"),
    }

    // ---- @ 绑定 ----
    // 在匹配时同时绑定值到变量
    let msg = Some(42);
    match msg {
        Some(n @ 0..=10) => println!("小数字: {}", n),
        Some(n @ 11..=100) => println!("中数字: {}", n),
        Some(n) => println!("大数字: {}", n),
        None => println!("无值"),
    }

    // ---- 匹配多个模式 ----
    let x = 3;
    match x {
        1 | 2 => println!("1 或 2"),           // | 表示或
        3..=5 => println!("3 到 5"),            // ..= 范围
        _ => println!("其他"),
    }

    // ---- 解构引用 ----
    let val = 42;
    let ref_val = &val;

    match ref_val {
        &n => println!("解构引用: {}", n),     // 手动解引用
    }
    // 或使用 ref 关键字
    let ref_val2 = &val;
    match ref_val2 {
        n => println!("自动解引用: {}", n),    // 自动解引用
    }

    // ---- ref 和 ref mut ----
    let mut s = String::from("hello");
    // ref 模式：借用引用而非移动
    match s {
        ref r => println!("借用: {}", r),      // r: &String
    }
    // 此时 s 仍然可用
    println!("s 仍有效: {}", s);

    match s {
        ref mut r => r.push_str(", world"),     // r: &mut String
    }
    println!("修改后: {}", s);
}
