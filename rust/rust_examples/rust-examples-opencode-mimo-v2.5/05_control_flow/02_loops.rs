// ============================================
// 知识点：循环
// 难度：入门
// ============================================

// Rust 有三种循环：
// 1. loop：无限循环
// 2. while：条件循环
// 3. for：迭代循环

fn main() {
    // ==================== loop 无限循环 ====================
    // loop 创建一个无限循环
    // 使用 break 退出循环
    // loop 是表达式，可以返回值
    
    let mut counter = 0;
    
    loop {
        counter += 1;
        if counter == 5 {
            println!("达到 5，退出循环");
            break;
        }
        println!("counter: {}", counter);
    }
    
    // loop 返回值
    let mut result = 0;
    let loop_result = loop {
        result += 1;
        if result == 10 {
            break result * 2;  // 返回 result * 2
        }
    };
    println!("loop 返回值: {}", loop_result);
    
    // ==================== while 条件循环 ====================
    // while 在条件为真时执行循环
    
    let mut number = 3;
    while number != 0 {
        println!("{}!", number);
        number -= 1;
    }
    println!("发射!");
    
    // while 与数组
    let a = [10, 20, 30, 40, 50];
    let mut index = 0;
    
    while index < a.len() {
        println!("a[{}] = {}", index, a[index]);
        index += 1;
    }
    
    // ==================== for 迭代循环 ====================
    // for 循环是最常用的循环方式
    
    // 遍历范围
    println!("\n遍历范围 (1..5):");
    for i in 1..5 {
        println!("i = {}", i);
    }
    
    // 包含右端点
    println!("\n遍历范围 (1..=5):");
    for i in 1..=5 {
        println!("i = {}", i);
    }
    
    // 遍历数组
    let a = [10, 20, 30, 40, 50];
    println!("\n遍历数组:");
    for element in &a {
        println!("值: {}", element);
    }
    
    // 带索引的遍历
    println!("\n带索引遍历:");
    for (index, value) in a.iter().enumerate() {
        println!("a[{}] = {}", index, value);
    }
    
    // 反向遍历
    println!("\n反向遍历 (10..=1):");
    for i in (1..=10).rev() {
        println!("{}", i);
    }
    
    // ==================== 循环标签 ====================
    // 使用标签区分嵌套循环
    
    println!("\n循环标签:");
    'outer: for i in 0..5 {
        for j in 0..5 {
            if i == 2 && j == 2 {
                println!("在 i={}, j={} 时退出外层循环", i, j);
                break 'outer;  // 退出外层循环
            }
            println!("i={}, j={}", i, j);
        }
    }
    
    // 标签与 loop 结合
    let mut x = 0;
    'search: loop {
        x += 1;
        for y in 0..10 {
            if x * y == 42 {
                println!("找到: x={}, y={}", x, y);
                break 'search;
            }
        }
    }
    
    // ==================== 循环与迭代器 ====================
    // 使用迭代器方法代替循环
    
    let numbers = vec![1, 2, 3, 4, 5];
    
    // map：转换每个元素
    let doubled: Vec<i32> = numbers.iter().map(|&x| x * 2).collect();
    println!("翻倍: {:?}", doubled);
    
    // filter：过滤元素
    let evens: Vec<&i32> = numbers.iter().filter(|&&x| x % 2 == 0).collect();
    println!("偶数: {:?}", evens);
    
    // fold：累加
    let sum = numbers.iter().fold(0, |acc, &x| acc + x);
    println!("总和: {}", sum);
    
    // for_each：执行操作
    println!("\n使用 for_each:");
    numbers.iter().for_each(|x| println!("  值: {}", x));
    
    // ==================== 循环与模式匹配 ====================
    // 在循环中使用模式匹配
    
    let data = vec![
        Some(1),
        None,
        Some(3),
        None,
        Some(5),
    ];
    
    println!("\n处理 Option 列表:");
    for (i, item) in data.iter().enumerate() {
        match item {
            Some(value) => println!("  索引 {}: 值 {}", i, value),
            None => println!("  索引 {}: 无值", i),
        }
    }
    
    // ==================== 循环与错误处理 ====================
    let inputs = vec!["42", "abc", "123", "xyz", "789"];
    
    println!("\n解析输入:");
    for input in &inputs {
        match input.parse::<i32>() {
            Ok(number) => println!("  '{}' -> {}", input, number),
            Err(e) => println!("  '{}' -> 错误: {}", input, e),
        }
    }
    
    // ==================== 性能考虑 ====================
    // for 循环通常比 while 循环更高效
    // 因为迭代器可以进行零成本抽象
    
    let mut sum = 0;
    for i in 0..1000 {
        sum += i;
    }
    println!("\n0 到 999 的和: {}", sum);
    
    // 使用迭代器
    let sum: i32 = (0..1000).sum();
    println!("使用迭代器: {}", sum);
    
    // ==================== 循环与集合操作 ====================
    let mut names = vec![
        "Alice".to_string(),
        "Bob".to_string(),
        "Charlie".to_string(),
    ];
    
    // 修改集合
    for name in &mut names {
        name.push_str(" Smith");
    }
    
    println!("\n修改后的名字: {:?}", names);
    
    // 消费集合
    let numbers = vec![1, 2, 3, 4, 5];
    let doubled: Vec<i32> = numbers.into_iter().map(|x| x * 2).collect();
    println!("翻倍后: {:?}", doubled);
    // println!("{:?}", numbers);  // 错误：numbers 已被移动
}

// ============================================
// 编译和运行方法：
// 
// Windows:
//   rustc 02_loops.rs -o 02_loops.exe
//   02_loops.exe
//
// Linux/macOS:
//   rustc 02_loops.rs -o 02_loops
//   ./02_loops
// ============================================
