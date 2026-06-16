// ============================================
// 知识点：模式匹配
// 难度：中级
// ============================================

// 模式匹配是 Rust 的强大特性
// 用于解构数据和控制流程
// 比 if-else 更安全、更表达力

fn main() {
    // ==================== 字面量匹配 ====================
    let x = 1;
    
    match x {
        1 => println!("一"),
        2 => println!("二"),
        3 => println!("三"),
        _ => println!("其他"),
    }
    
    // ==================== 多个模式 ====================
    let x = 'c';
    
    match x {
        'a' | 'b' | 'c' => println!("a 到 c 之间"),
        'd' | 'e' | 'f' => println!("d 到 f 之间"),
        _ => println!("其他字符"),
    }
    
    // ==================== 范围匹配 ====================
    let x = 5;
    
    match x {
        1..=5 => println!("1 到 5 之间"),
        6..=10 => println!("6 到 10 之间"),
        _ => println!("其他数字"),
    }
    
    // 字符范围
    let ch = 'd';
    
    match ch {
        'a'..='j' => println!("前十个字母"),
        'k'..='z' => println!("后十六个字母"),
        _ => println!("非字母"),
    }
    
    // ==================== 变量绑定 ====================
    let x = 5;
    
    match x {
        n @ 1..=5 => println!("1 到 5 之间: {}", n),
        n @ 6..=10 => println!("6 到 10 之间: {}", n),
        n => println!("其他: {}", n),
    }
    
    // ==================== 解构元组 ====================
    let point = (3, -5);
    
    match point {
        (0, 0) => println!("原点"),
        (x, 0) => println!("x 轴上: {}", x),
        (0, y) => println!("y 轴上: {}", y),
        (x, y) => println!("点 ({}, {})", x, y),
    }
    
    // ==================== 解构枚举 ====================
    enum Message {
        Quit,
        Move { x: i32, y: i32 },
        Write(String),
        ChangeColor(i32, i32, i32),
    }
    
    let msg = Message::ChangeColor(0, 160, 255);
    
    match msg {
        Message::Quit => println!("退出"),
        Message::Move { x, y } => println!("移动到 ({}, {})", x, y),
        Message::Write(text) => println!("消息: {}", text),
        Message::ChangeColor(r, g, b) => {
            println!("颜色: ({}, {}, {})", r, g, b)
        }
    }
    
    // ==================== 解构嵌套结构 ====================
    struct Point {
        x: i32,
        y: i32,
    }
    
    struct Rectangle {
        top_left: Point,
        bottom_right: Point,
    }
    
    let rect = Rectangle {
        top_left: Point { x: 0, y: 10 },
        bottom_right: Point { x: 10, y: 0 },
    };
    
    match rect {
        Rectangle {
            top_left: Point { x: 0, y: y },
            ..
        } => println!("左上角在 y 轴上: y = {}", y),
        Rectangle {
            bottom_right: Point { x: x, y: 0 },
            ..
        } => println!("右下角在 x 轴上: x = {}", x),
        Rectangle {
            top_left: Point { x: x1, y: y1 },
            bottom_right: Point { x: x2, y: y2 },
        } => println!("矩形: ({}, {}) 到 ({}, {})", x1, y1, x2, y2),
    }
    
    // ==================== 忽略值 ====================
    let some_value = Some(5);
    
    match some_value {
        Some(_) => println!("有值"),
        None => println!("无值"),
    }
    
    // 忽略多个值
    let numbers = (1, 2, 3, 4, 5);
    
    match numbers {
        (first, _, third, _, fifth) => {
            println!("第一个: {}, 第三个: {}, 第五个: {}", first, third, fifth)
        }
    }
    
    // 使用 .. 忽略剩余值
    let numbers = (1, 2, 3, 4, 5);
    
    match numbers {
        (first, ..) => println!("第一个: {}", first),
    }
    
    match numbers {
        (.., last) => println!("最后一个: {}", last),
    }
    
    match numbers {
        (first, .., last) => println!("第一个: {}, 最后一个: {}", first, last),
    }
    
    // ==================== 匹配守卫 ====================
    let num = Some(4);
    
    match num {
        Some(x) if x < 0 => println!("负数: {}", x),
        Some(x) if x == 0 => println!("零"),
        Some(x) if x % 2 == 0 => println!("正偶数: {}", x),
        Some(x) => println!("正奇数: {}", x),
        None => println!("无值"),
    }
    
    // ==================== @ 绑定 ====================
    enum Message2 {
        Hello { id: i32 },
    }
    
    let msg = Message2::Hello { id: 5 };
    
    match msg {
        Message2::Hello { id: id_var @ 3..=7 } => {
            println!("找到 id: {}", id_var)
        }
        Message2::Hello { id: 10..=12 } => {
            println!("找到另一个范围的 id")
        }
        Message2::Hello { id } => {
            println!("其他 id: {}", id)
        }
    }
    
    // ==================== 解构结构体 ====================
    struct Point3D {
        x: i32,
        y: i32,
        z: i32,
    }
    
    let point = Point3D { x: 0, y: -7, z: 14 };
    
    match point {
        Point3D { x, y: 0, z } => {
            println!("在 xz 平面上: ({}, {}, {})", x, y, z)
        }
        Point3D { x: 0, y, z } => {
            println!("在 yz 平面上: ({}, {}, {})", x, y, z)
        }
        Point3D { x, y, z: 0 } => {
            println!("在 xy 平面上: ({}, {}, {})", x, y, z)
        }
        Point3D { x, y, z } => {
            println!("不在任何平面上: ({}, {}, {})", x, y, z)
        }
    }
    
    // ==================== 解构引用 ====================
    let reference = &4;
    
    match reference {
        &val => println!("解构引用: {}", val),
    }
    
    // 自动解引用
    match reference {
        val => println!("自动解引用: {}", val),
    }
    
    // ==================== 匹配与所有权 ====================
    let optional_name: Option<String> = Some(String::from("Alice"));
    
    // 使用引用匹配以避免移动
    match &optional_name {
        Some(name) => println!("名字: {}", name),
        None => println!("无名字"),
    }
    
    // optional_name 仍然可用
    println!("optional_name: {:?}", optional_name);
    
    // ==================== 匹配与迭代器 ====================
    let data = vec![Some(1), None, Some(3), None, Some(5)];
    
    for (i, item) in data.iter().enumerate() {
        match item {
            Some(value) => println!("索引 {}: 值 {}", i, value),
            None => println!("索引 {}: 无值", i),
        }
    }
    
    // ==================== match 表达式 ====================
    let condition = true;
    
    let value = if condition { 5 } else { 6 };
    println!("条件表达式: {}", value);
    
    // match 也可以返回值
    let x = 1;
    
    let description = match x {
        1 => "一",
        2 => "二",
        3 => "三",
        _ => "其他",
    };
    println!("描述: {}", description);
    
    // ==================== 性能考虑 ====================
    // 模式匹配被编译为高效的跳转表
    // 编译器可以进行深度优化
    
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
//   rustc 01_pattern_matching.rs -o 01_pattern_matching.exe
//   01_pattern_matching.exe
//
// Linux/macOS:
//   rustc 01_pattern_matching.rs -o 01_pattern_matching
//   ./01_pattern_matching
// ============================================
