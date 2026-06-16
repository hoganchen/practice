// ============================================================
// Rust 知识点：match 模式匹配 —— 强大而安全的匹配
// match 必须穷举所有可能性（exhaustive）
// 编译：rustc 004_match.rs && .\004_match.exe
// ============================================================

fn main() {
    // ---- 基础匹配 ----
    let number = 3;
    match number {
        1 => println!("一"),
        2 => println!("二"),
        3 => println!("三"),
        _ => println!("其他"), // _ 通配符，匹配所有剩余情况
    }

    // ---- match 是表达式（有返回值） ----
    let val = 42;
    let desc = match val {
        0 => "零",
        1..=10 => "一到十",     // 范围匹配
        11..=99 => "十一到九十九",
        100 => "一百",
        _ => "很大或很小",
    };
    println!("{}: {}", val, desc);

    // ---- 匹配多个模式 ----
    let x = 4;
    match x {
        1 | 2 | 3 => println!("1, 2, 或 3"),
        4..=6 => println!("4 到 6"),
        _ => println!("其他"),
    }

    // ---- 解构匹配 ----
    let pair = (10, 20);
    match pair {
        (0, 0) => println!("原点"),
        (x, 0) => println!("X 轴上: x={}", x),
        (0, y) => println!("Y 轴上: y={}", y),
        (x, y) => println!("点 ({}, {})", x, y),
    }

    // ---- 带守卫的匹配 ----
    let age = 18;
    match age {
        0 => println!("新生儿"),
        n if n < 18 => println!("未成年人: {}", n),
        n if n >= 60 => println!("老年人: {}", n),
        n => println!("成年人: {}", n),
    }

    // ---- 匹配枚举 ----
    enum Color {
        Red,
        Green,
        Blue,
        Custom(u8, u8, u8),
    }
    let color = Color::Custom(100, 200, 50);
    match color {
        Color::Red => println!("红色"),
        Color::Green => println!("绿色"),
        Color::Blue => println!("蓝色"),
        Color::Custom(r, g, b) => println!("自定义: RGB({}, {}, {})", r, g, b),
    }

    // ---- 绑定（@ 语法） ----
    let num = 5;
    match num {
        n @ 1..=10 => println!("1-10 之间的数: {}", n),
        n @ 11..=20 => println!("11-20 之间的数: {}", n),
        _ => println!("其他"),
    }
}
