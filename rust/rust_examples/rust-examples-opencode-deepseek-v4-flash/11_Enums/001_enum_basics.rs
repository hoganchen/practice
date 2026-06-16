// ============================================================
// Rust 知识点：枚举定义与使用
// 枚举可以关联数据，比 C 语言的枚举强大得多
// 编译：rustc 001_enum_basics.rs && .\001_enum_basics.exe
// ============================================================

// ---- 简单枚举（类似 C 风格） ----
enum Direction {
    North,  // 变体（variant）
    South,
    East,
    West,
}

// ---- 带数据的枚举变体 ----
#[derive(Debug)]
enum IpAddr {
    V4(u8, u8, u8, u8),     // 元组形式关联数据
    V6(String),              // 每个变体可以有不同的类型
}

// ---- 结构体风格的枚举变体 ----
#[derive(Debug)]
enum Message {
    Quit,                                 // 无数据
    Move { x: i32, y: i32 },             // 匿名结构体
    Write(String),                        // 元组
    ChangeColor(i32, i32, i32),           // 元组
}

impl Message {
    fn call(&self) {
        match self {
            Message::Quit => println!("退出消息"),
            Message::Move { x, y } => println!("移动到 ({}, {})", x, y),
            Message::Write(text) => println!("写入: {}", text),
            Message::ChangeColor(r, g, b) => println!("变色: ({}, {}, {})", r, g, b),
        }
    }
}

fn main() {
    // ---- 使用枚举 ----
    let go_north = Direction::North;
    let go_south = Direction::South;

    // 匹配枚举
    match go_north {
        Direction::North => println!("向北"),
        Direction::South => println!("向南"),
        Direction::East => println!("向东"),
        Direction::West => println!("向西"),
    }

    // ---- 带数据的枚举 ----
    let home = IpAddr::V4(127, 0, 0, 1);
    let loopback = IpAddr::V6(String::from("::1"));

    println!("home: {:?}", home);
    println!("loopback: {:?}", loopback);

    // 解构枚举
    if let IpAddr::V4(a, b, c, d) = home {
        println!("IPv4 地址: {}.{}.{}.{}", a, b, c, d);
    }

    // ---- 枚举方法 ----
    let msg1 = Message::Write(String::from("Hello"));
    let msg2 = Message::Move { x: 10, y: 20 };
    let msg3 = Message::ChangeColor(255, 0, 0);
    let msg4 = Message::Quit;

    msg1.call();
    msg2.call();
    msg3.call();
    msg4.call();

    // ---- 使用标准库 Option<T> ----
    let some_number = Some(5);          // Option<i32>
    let some_string = Some("hello");    // Option<&str>
    let absent_number: Option<i32> = None; // 需要标注类型

    println!("some_number: {:?}", some_number);
    println!("absent_number: {:?}", absent_number);
}
