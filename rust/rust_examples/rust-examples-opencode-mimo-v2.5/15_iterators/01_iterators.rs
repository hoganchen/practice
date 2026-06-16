// ============================================
// 知识点：迭代器
// 难度：中级
// ============================================

// 迭代器是 Rust 处理序列数据的核心抽象
// 实现 Iterator trait 的类型可以产生一系列值

fn main() {
    // ==================== 基础迭代器 ====================
    let numbers = vec![1, 2, 3, 4, 5];
    
    // 创建迭代器
    let mut iter = numbers.iter();
    
    // 使用 next 方法
    println!("第一个: {:?}", iter.next());
    println!("第二个: {:?}", iter.next());
    println!("第三个: {:?}", iter.next());
    println!("第四个: {:?}", iter.next());
    println!("第五个: {:?}", iter.next());
    println!("第六个: {:?}", iter.next());  // None
    
    // ==================== 迭代器适配器 ====================
    // map：转换每个元素
    let doubled: Vec<i32> = numbers.iter().map(|&x| x * 2).collect();
    println!("翻倍: {:?}", doubled);
    
    // filter：过滤元素
    let evens: Vec<&i32> = numbers.iter().filter(|&&x| x % 2 == 0).collect();
    println!("偶数: {:?}", evens);
    
    // filter_map：过滤并转换
    let results: Vec<i32> = numbers
        .iter()
        .filter_map(|&x| if x % 2 == 0 { Some(x * 10) } else { None })
        .collect();
    println!("过滤并转换: {:?}", results);
    
    // enumerate：添加索引
    for (i, &num) in numbers.iter().enumerate() {
        println!("索引 {}: 值 {}", i, num);
    }
    
    // zip：合并两个迭代器
    let names = vec!["Alice", "Bob", "Charlie"];
    let ages = vec![25, 30, 35];
    let people: Vec<(&str, &i32)> = names.iter().zip(ages.iter()).collect();
    println!("合并: {:?}", people);
    
    // chain：连接两个迭代器
    let a = vec![1, 2, 3];
    let b = vec![4, 5, 6];
    let combined: Vec<&i32> = a.iter().chain(b.iter()).collect();
    println!("连接: {:?}", combined);
    
    // take：取前 n 个元素
    let first_three: Vec<&i32> = numbers.iter().take(3).collect();
    println!("前三个: {:?}", first_three);
    
    // skip：跳过前 n 个元素
    let skip_two: Vec<&i32> = numbers.iter().skip(2).collect();
    println!("跳过两个: {:?}", skip_two);
    
    // ==================== 消费适配器 ====================
    // sum：求和
    let sum: i32 = numbers.iter().sum();
    println!("总和: {}", sum);
    
    // product：求积
    let product: i32 = numbers.iter().product();
    println!("乘积: {}", product);
    
    // count：计数
    let count = numbers.iter().count();
    println!("元素数量: {}", count);
    
    // first：第一个元素
    let first = numbers.iter().first();
    println!("第一个: {:?}", first);
    
    // last：最后一个元素
    let last = numbers.iter().last();
    println!("最后一个: {:?}", last);
    
    // max：最大值
    let max = numbers.iter().max();
    println!("最大值: {:?}", max);
    
    // min：最小值
    let min = numbers.iter().min();
    println!("最小值: {:?}", min);
    
    // any：是否存在满足条件的元素
    let has_even = numbers.iter().any(|&x| x % 2 == 0);
    println!("存在偶数: {}", has_even);
    
    // all：是否所有元素都满足条件
    let all_positive = numbers.iter().all(|&x| x > 0);
    println!("全为正数: {}", all_positive);
    
    // find：查找第一个满足条件的元素
    let first_even = numbers.iter().find(|&&x| x % 2 == 0);
    println!("第一个偶数: {:?}", first_even);
    
    // position：查找位置
    let position = numbers.iter().position(|&x| x == 3);
    println!("3 的位置: {:?}", position);
    
    // ==================== fold：累加器 ====================
    // fold 是最通用的消费适配器
    
    let sum = numbers.iter().fold(0, |acc, &x| acc + x);
    println!("fold 求和: {}", sum);
    
    // 使用 fold 构建字符串
    let sentence = numbers.iter().fold(String::new(), |mut acc, &x| {
        if !acc.is_empty() {
            acc.push_str(", ");
        }
        acc.push_str(&x.to_string());
        acc
    });
    println!("fold 构建字符串: {}", sentence);
    
    // ==================== 自定义迭代器 ====================
    struct Counter {
        count: u32,
        max: u32,
    }
    
    impl Counter {
        fn new(max: u32) -> Self {
            Counter { count: 0, max }
        }
    }
    
    impl Iterator for Counter {
        type Item = u32;
        
        fn next(&mut self) -> Option<Self::Item> {
            if self.count < self.max {
                self.count += 1;
                Some(self.count)
            } else {
                None
            }
        }
    }
    
    // 使用自定义迭代器
    let counter = Counter::new(5);
    for num in counter {
        print!("{} ", num);
    }
    println!();
    
    // 使用迭代器适配器
    let sum: u32 = Counter::new(5).sum();
    println!("Counter 总和: {}", sum);
    
    let doubled: Vec<u32> = Counter::new(5).map(|x| x * 2).collect();
    println!("Counter 翻倍: {:?}", doubled);
    
    // ==================== 迭代器与所有权 ====================
    let names = vec![
        String::from("Alice"),
        String::from("Bob"),
        String::from("Charlie"),
    ];
    
    // iter()：借用
    for name in names.iter() {
        println!("借用: {}", name);
    }
    println!("names 仍然可用: {:?}", names);
    
    // into_iter()：消耗
    for name in names {
        println!("消耗: {}", name);
    }
    // println!("{:?}", names);  // 错误：names 已被移动
    
    // ==================== 迭代器与闭包 ====================
    let numbers = vec![1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    
    // 链式调用
    let result: Vec<i32> = numbers
        .iter()
        .filter(|&&x| x % 2 == 0)
        .map(|&x| x * x)
        .collect();
    println!("偶数平方: {:?}", result);
    
    // ==================== 迭代器性能 ====================
    // 迭代器是零成本抽象
    // 编译器会内联闭包和优化迭代器链
    
    let numbers: Vec<i32> = (1..=1000).collect();
    
    // 高效的迭代器链
    let sum: i32 = numbers.iter().filter(|&&x| x % 2 == 0).sum();
    println!("高效迭代器: {}", sum);
    
    // ==================== 实际应用 ====================
    
    // 文本处理
    let text = "Hello, World! This is Rust.";
    let word_count = text.split_whitespace().count();
    println!("单词数量: {}", word_count);
    
    // 数字处理
    let numbers = vec![1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    let evens_sum: i32 = numbers.iter().filter(|&&x| x % 2 == 0).sum();
    println!("偶数和: {}", evens_sum);
    
    // 集合操作
    let set1: std::collections::HashSet<i32> = vec![1, 2, 3, 4, 5].into_iter().collect();
    let set2: std::collections::HashSet<i32> = vec![4, 5, 6, 7, 8].into_iter().collect();
    let intersection: Vec<&i32> = set1.iter().filter(|x| set2.contains(x)).collect();
    println!("交集: {:?}", intersection);
    
    println!("\n迭代器演示完成!");
}

// ============================================
// 编译和运行方法：
// 
// Windows:
//   rustc 01_iterators.rs -o 01_iterators.exe
//   01_iterators.exe
//
// Linux/macOS:
//   rustc 01_iterators.rs -o 01_iterators
//   ./01_iterators
// ============================================
