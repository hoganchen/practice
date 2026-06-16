// ============================================
// 知识点：条件语句
// 难度：入门
// ============================================

// Rust 使用 if/else if/else 作为条件分支
// 条件必须是 bool 类型
// if 是表达式，可以返回值

fn main() {
    // ==================== 基础 if 语句 ====================
    let number = 7;
    
    if number > 5 {
        println!("{} 大于 5", number);
    }
    
    // if-else 语句
    let age = 20;
    if age >= 18 {
        println!("你已成年");
    } else {
        println!("你还未成年");
    }
    
    // if-else if-else 语句
    let score = 85;
    if score >= 90 {
        println!("优秀");
    } else if score >= 80 {
        println!("良好");
    } else if score >= 70 {
        println!("中等");
    } else if score >= 60 {
        println!("及格");
    } else {
        println!("不及格");
    }
    
    // ==================== 条件表达式 ====================
    // if 是表达式，可以返回值
    let condition = true;
    let value = if condition { 5 } else { 6 };
    println!("条件表达式值: {}", value);
    
    // 类型必须一致
    let number = if condition { 5 } else { 6 };
    println!("数字: {}", number);
    
    // ==================== 嵌套 if ====================
    let x = 10;
    let y = 20;
    
    if x > 5 {
        if y > 15 {
            println!("x > 5 且 y > 15");
        } else {
            println!("x > 5 但 y <= 15");
        }
    } else {
        println!("x <= 5");
    }
    
    // ==================== 逻辑运算符 ====================
    let a = true;
    let b = false;
    
    // 逻辑与（AND）
    if a && b {
        println!("a AND b 为真");
    } else {
        println!("a AND b 为假");
    }
    
    // 逻辑或（OR）
    if a || b {
        println!("a OR b 为真");
    } else {
        println!("a OR b 为假");
    }
    
    // 逻辑非（NOT）
    if !b {
        println!("NOT b 为真");
    }
    
    // 复杂条件
    let age = 25;
    let has_id = true;
    let has_ticket = true;
    
    if age >= 18 && has_id && has_ticket {
        println!("允许入场");
    } else {
        println!("不允许入场");
    }
    
    // ==================== 条件链 ====================
    let day = "Monday";
    
    let day_type = match day {
        "Monday" | "Tuesday" | "Wednesday" | "Thursday" | "Friday" => "工作日",
        "Saturday" | "Sunday" => "周末",
        _ => "未知",
    };
    
    println!("{} 是 {}", day, day_type);
    
    // ==================== 条件赋值 ====================
    let temperature = 25;
    let weather = if temperature > 30 {
        "炎热"
    } else if temperature > 20 {
        "温暖"
    } else if temperature > 10 {
        "凉爽"
    } else {
        "寒冷"
    };
    
    println!("温度 {}°C，天气{}", temperature, weather);
    
    // ==================== 复杂条件表达式 ====================
    let number = 42;
    
    let description = if number % 2 == 0 {
        "偶数"
    } else {
        "奇数"
    };
    
    let sign = if number > 0 {
        "正数"
    } else if number < 0 {
        "负数"
    } else {
        "零"
    };
    
    println!("{} 是 {} {}", number, sign, description);
    
    // ==================== 条件与范围匹配 ====================
    let score = 85;
    
    let grade = if (90..=100).contains(&score) {
        'A'
    } else if (80..90).contains(&score) {
        'B'
    } else if (70..80).contains(&score) {
        'C'
    } else if (60..70).contains(&score) {
        'D'
    } else {
        'F'
    };
    
    println!("分数 {} 对应等级 {}", score, grade);
    
    // ==================== 条件与选项 ====================
    let optional_value: Option<i32> = Some(42);
    
    // 使用 if let 进行模式匹配
    if let Some(value) = optional_value {
        println!("Option 的值: {}", value);
    } else {
        println!("Option 为空");
    }
    
    // 使用 while let
    let mut stack = vec![1, 2, 3];
    println!("\n弹出栈元素:");
    while let Some(top) = stack.pop() {
        println!("  弹出: {}", top);
    }
    
    // ==================== 条件与迭代 ====================
    let numbers = vec![1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    
    println!("\n数字分类:");
    for &num in &numbers {
        if num % 2 == 0 {
            println!("  {} 是偶数", num);
        } else {
            println!("  {} 是奇数", num);
        }
    }
    
    // 使用 filter
    let evens: Vec<&i32> = numbers.iter().filter(|&&x| x % 2 == 0).collect();
    println!("偶数: {:?}", evens);
    
    // ==================== 条件与错误处理 ====================
    let input = "42";
    
    // 使用 match 进行条件匹配
    match input.parse::<i32>() {
        Ok(number) => println!("解析成功: {}", number),
        Err(e) => println!("解析失败: {}", e),
    }
    
    // 使用 if let 处理 Result
    if let Ok(number) = input.parse::<i32>() {
        println!("数字: {}", number);
    }
}

// ============================================
// 编译和运行方法：
// 
// Windows:
//   rustc 01_conditionals.rs -o 01_conditionals.exe
//   01_conditionals.exe
//
// Linux/macOS:
//   rustc 01_conditionals.rs -o 01_conditionals
//   ./01_conditionals
// ============================================
