// ============================================
// 知识点：match 表达式
// 难度：中级
// ============================================

// match 是 Rust 的模式匹配表达式
// 类似于 switch，但更强大
// 必须覆盖所有可能的情况

fn main() {
    // ==================== 基础 match ====================
    let number = 3;
    
    match number {
        1 => println!("一"),
        2 => println!("二"),
        3 => println!("三"),
        4 => println!("四"),
        5 => println!("五"),
        _ => println!("其他数字"),  // _ 是通配符，匹配所有情况
    }
    
    // match 是表达式，可以返回值
    let description = match number {
        1 => "一",
        2 => "二",
        3 => "三",
        4 => "四",
        5 => "五",
        _ => "其他",
    };
    println!("{} 是 {}", number, description);
    
    // ==================== 多行分支 ====================
    let score = 85;
    
    let grade = match score {
        90..=100 => {
            println!("优秀成绩!");
            'A'
        }
        80..=89 => {
            println!("良好成绩!");
            'B'
        }
        70..=79 => {
            println!("中等成绩!");
            'C'
        }
        60..=69 => {
            println!("及格成绩!");
            'D'
        }
        _ => {
            println!("不及格!");
            'F'
        }
    };
    println!("分数 {} 对应等级 {}", score, grade);
    
    // ==================== 匹配元组 ====================
    let point = (0, -5);
    
    match point {
        (0, 0) => println!("原点"),
        (x, 0) => println!("x 轴上, x = {}", x),
        (0, y) => println!("y 轴上, y = {}", y),
        (x, y) => println!("({}, {})", x, y),
    }
    
    // ==================== 匹配枚举 ====================
    enum Coin {
        Penny,
        Nickel,
        Dime,
        Quarter,
    }
    
    let coin = Coin::Dime;
    
    let value = match coin {
        Coin::Penny => 1,
        Coin::Nickel => 5,
        Coin::Dime => 10,
        Coin::Quarter => 25,
    };
    println!("硬币价值: {} 美分", value);
    
    // ==================== 匹配 Option ====================
    let some_number: Option<i32> = Some(42);
    let no_number: Option<i32> = None;
    
    match some_number {
        Some(x) => println!("Some: {}", x),
        None => println!("None"),
    }
    
    // 使用 if let 进行简化匹配
    if let Some(x) = no_number {
        println!("值: {}", x);
    } else {
        println!("没有值");
    }
    
    // ==================== 匹配守卫 ====================
    let num = 4;
    
    match num {
        n if n < 0 => println!("{} 是负数", n),
        n if n == 0 => println!("零"),
        n if n % 2 == 0 => println!("{} 是正偶数", n),
        n => println!("{} 是正奇数", n),
    }
    
    // ==================== 绑定变量 ====================
    let message = "hello";
    
    match message.len() {
        0 => println!("空消息"),
        1 => println!("一个字符"),
        2..=5 => println!("短消息: {} 个字符", message.len()),
        n => println!("长消息: {} 个字符", n),
    }
    
    // ==================== 匹配引用 ====================
    let reference = &4;
    
    match reference {
        &val => println!("解构引用: {}", val),
    }
    
    // 使用 ref 创建引用
    let ref_reference = &5;
    
    match ref_reference {
        val => println!("引用值: {}", val),
    }
    
    // ==================== 嵌套匹配 ====================
    enum Color {
        Rgb(u8, u8, u8),
        Hsl(u8, u8, u8),
    }
    
    let color = Color::Rgb(255, 128, 0);
    
    match color {
        Color::Rgb(r, g, b) => {
            println!("RGB: {}, {}, {}", r, g, b);
        }
        Color::Hsl(h, s, l) => {
            println!("HSL: {}, {}, {}", h, s, l);
        }
    }
    
    // ==================== 匹配与范围 ====================
    let number = 15;
    
    match number {
        1..=9 => println!("个位数"),
        10..=99 => println!("两位数"),
        100..=999 => println!("三位数"),
        _ => println!("其他数字"),
    }
    
    // 字符范围
    let grade = 'B';
    
    match grade {
        'A' => println!("优秀"),
        'B' => println!("良好"),
        'C' => println!("中等"),
        'D' => println!("及格"),
        'F' => println!("不及格"),
        _ => println!("无效等级"),
    }
    
    // ==================== 匹配与结构体 ====================
    struct Point {
        x: i32,
        y: i32,
    }
    
    let point = Point { x: 10, y: 20 };
    
    match point {
        Point { x: 0, y: 0 } => println!("原点"),
        Point { x, y: 0 } => println!("x 轴上, x = {}", x),
        Point { x: 0, y } => println!("y 轴上, y = {}", y),
        Point { x, y } => println!("点 ({}, {})", x, y),
    }
    
    // ==================== match 与所有权 ====================
    let some_value = Some(String::from("hello"));
    
    // 使用引用匹配以避免移动
    match &some_value {
        Some(s) => println!("值: {}", s),
        None => println!("无值"),
    }
    
    // some_value 仍然可用
    println!("some_value: {:?}", some_value);
    
    // ==================== 完整性匹配 ====================
    // match 必须覆盖所有可能的情况
    
    enum Direction {
        North,
        South,
        East,
        West,
    }
    
    let direction = Direction::North;
    
    // 使用 _ 确保完整性
    let description = match direction {
        Direction::North => "北",
        Direction::South => "南",
        Direction::East => "东",
        Direction::West => "西",
    };
    println!("方向: {}", description);
    
    // ==================== 性能考虑 ====================
    // match 被编译为跳转表，非常高效
    // 编译器可以优化 match 为高效的机器码
    
    let index = 2;
    let value = match index {
        0 => "零",
        1 => "一",
        2 => "二",
        3 => "三",
        _ => "其他",
    };
    println!("索引 {} 对应: {}", index, value);
}

// ============================================
// 编译和运行方法：
// 
// Windows:
//   rustc 03_match.rs -o 03_match.exe
//   03_match.exe
//
// Linux/macOS:
//   rustc 03_match.rs -o 03_match
//   ./03_match
// ============================================
