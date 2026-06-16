// ============================================
// 知识点：枚举
// 难度：中级
// ============================================

// 枚举是一种类型，其值只能是若干变体之一
// 使用 enum 关键字定义
// 枚举可以携带数据

fn main() {
    // ==================== 基础枚举 ====================
    enum Direction {
        North,
        South,
        East,
        West,
    }
    
    let direction = Direction::North;
    
    // 使用 match 处理枚举
    match direction {
        Direction::North => println!("向北"),
        Direction::South => println!("向南"),
        Direction::East => println!("向东"),
        Direction::West => println!("向西"),
    }
    
    // ==================== 携带数据的枚举 ====================
    enum Message {
        Quit,
        Move { x: i32, y: i32 },
        Write(String),
        ChangeColor(i32, i32, i32),
    }
    
    let messages = vec![
        Message::Quit,
        Message::Move { x: 10, y: 20 },
        Message::Write(String::from("hello")),
        Message::ChangeColor(255, 128, 0),
    ];
    
    for msg in &messages {
        match msg {
            Message::Quit => println!("退出"),
            Message::Move { x, y } => println!("移动到 ({}, {})", x, y),
            Message::Write(text) => println!("写入: {}", text),
            Message::ChangeColor(r, g, b) => {
                println!("改变颜色: ({}, {}, {})", r, g, b)
            }
        }
    }
    
    // ==================== 枚举方法 ====================
    enum TrafficLight {
        Red,
        Yellow,
        Green,
    }
    
    impl TrafficLight {
        fn duration(&self) -> u32 {
            match self {
                TrafficLight::Red => 60,
                TrafficLight::Yellow => 10,
                TrafficLight::Green => 45,
            }
        }
        
        fn next(&self) -> Self {
            match self {
                TrafficLight::Red => TrafficLight::Green,
                TrafficLight::Green => TrafficLight::Yellow,
                TrafficLight::Yellow => TrafficLight::Red,
            }
        }
    }
    
    let light = TrafficLight::Red;
    println!("红灯持续 {} 秒", light.duration());
    
    let next_light = light.next();
    println!("下一个灯的持续时间: {} 秒", next_light.duration());
    
    // ==================== Option 枚举 ====================
    // Option<T> 表示一个值可能存在或不存在
    // 这是 Rust 处理空值的方式
    
    let some_number: Option<i32> = Some(42);
    let no_number: Option<i32> = None;
    
    // 使用 match 处理 Option
    match some_number {
        Some(n) => println!("Some: {}", n),
        None => println!("None"),
    }
    
    // 使用 if let 简化
    if let Some(n) = no_number {
        println!("值: {}", n);
    } else {
        println!("没有值");
    }
    
    // Option 的常用方法
    let x: Option<i32> = Some(5);
    let y: Option<i32> = None;
    
    // unwrap：获取值，如果是 None 则 panic
    // let val = y.unwrap();  // 会 panic
    
    // unwrap_or：如果是 None 则返回默认值
    let val = y.unwrap_or(0);
    println!("unwrap_or: {}", val);
    
    // map：转换 Some 中的值
    let doubled = x.map(|n| n * 2);
    println!("map: {:?}", doubled);
    
    // and_then：链式处理
    let result = x.and_then(|n| {
        if n > 0 {
            Some(n * 2)
        } else {
            None
        }
    });
    println!("and_then: {:?}", result);
    
    // ==================== Result 枚举 ====================
    // Result<T, E> 表示操作可能成功或失败
    
    use std::num::ParseIntError;
    
    fn parse_number(s: &str) -> Result<i32, ParseIntError> {
        s.parse::<i32>()
    }
    
    let good_result = parse_number("42");
    let bad_result = parse_number("abc");
    
    match good_result {
        Ok(n) => println!("解析成功: {}", n),
        Err(e) => println!("解析失败: {}", e),
    }
    
    match bad_result {
        Ok(n) => println!("解析成功: {}", n),
        Err(e) => println!("解析失败: {}", e),
    }
    
    // 使用 ? 运算符传播错误
    fn parse_and_double(s: &str) -> Result<i32, ParseIntError> {
        let n = s.parse::<i32>()?;
        Ok(n * 2)
    }
    
    println!("解析并翻倍: {:?}", parse_and_double("21"));
    println!("解析并翻倍: {:?}", parse_and_double("abc"));
    
    // ==================== 枚举与泛型 ====================
    enum Pair<T> {
        Both(T, T),
        FirstOnly(T),
        SecondOnly(T),
        Neither,
    }
    
    impl<T: std::fmt::Display> Pair<T> {
        fn display(&self) {
            match self {
                Pair::Both(a, b) => println!("Both: {} and {}", a, b),
                Pair::FirstOnly(a) => println!("First only: {}", a),
                Pair::SecondOnly(b) => println!("Second only: {}", b),
                Pair::Neither => println!("Neither"),
            }
        }
    }
    
    let pair = Pair::Both(10, 20);
    pair.display();
    
    // ==================== 枚举与模式匹配 ====================
    #[derive(Debug)]
    enum Shape {
        Circle(f64),
        Rectangle(f64, f64),
        Triangle { a: f64, b: f64, c: f64 },
    }
    
    impl Shape {
        fn area(&self) -> f64 {
            match self {
                Shape::Circle(radius) => std::f64::consts::PI * radius * radius,
                Shape::Rectangle(width, height) => width * height,
                Shape::Triangle { a, b, c } => {
                    let s = (a + b + c) / 2.0;
                    (s * (s - a) * (s - b) * (s - c)).sqrt()
                }
            }
        }
        
        fn describe(&self) -> String {
            match self {
                Shape::Circle(r) => format!("圆形，半径: {}", r),
                Shape::Rectangle(w, h) => format!("矩形，宽度: {}，高度: {}", w, h),
                Shape::Triangle { a, b, c } => {
                    format!("三角形，边长: {}, {}, {}", a, b, c)
                }
            }
        }
    }
    
    let shapes = vec![
        Shape::Circle(5.0),
        Shape::Rectangle(10.0, 5.0),
        Shape::Triangle {
            a: 3.0,
            b: 4.0,
            c: 5.0,
        },
    ];
    
    for shape in &shapes {
        println!("{}: 面积 = {:.2}", shape.describe(), shape.area());
    }
    
    // ==================== 枚举与位标志 ====================
    #[derive(Clone, Copy)]
    struct Permissions(u8);
    
    impl Permissions {
        const READ: Self = Self(1);
        const WRITE: Self = Self(2);
        const EXECUTE: Self = Self(4);
        
        fn has(&self, other: Self) -> bool {
            (self.0 & other.0) == other.0
        }
    }
    
    let mut perms = Permissions::READ;
    println!("有读权限: {}", perms.has(Permissions::READ));
    println!("有写权限: {}", perms.has(Permissions::WRITE));
    
    perms = Permissions(Permissions::READ.0 | Permissions::WRITE.0);
    println!("有写权限: {}", perms.has(Permissions::WRITE));
    
    // ==================== 枚举与序列化 ====================
    // 实际项目中，枚举常与 serde 库一起使用进行序列化
    
    #[derive(Debug)]
    enum Status {
        Active,
        Inactive,
        Pending,
    }
    
    impl Status {
        fn to_string(&self) -> &str {
            match self {
                Status::Active => "active",
                Status::Inactive => "inactive",
                Status::Pending => "pending",
            }
        }
        
        fn from_string(s: &str) -> Option<Self> {
            match s {
                "active" => Some(Status::Active),
                "inactive" => Some(Status::Inactive),
                "pending" => Some(Status::Pending),
                _ => None,
            }
        }
    }
    
    let status = Status::Active;
    let status_str = status.to_string();
    let parsed_status = Status::from_string(status_str);
    
    println!("状态: {:?}", status);
    println!("字符串: {}", status_str);
    println!("解析: {:?}", parsed_status);
}

// ============================================
// 编译和运行方法：
// 
// Windows:
//   rustc 01_enums.rs -o 01_enums.exe
//   01_enums.exe
//
// Linux/macOS:
//   rustc 01_enums.rs -o 01_enums
//   ./01_enums
// ============================================
