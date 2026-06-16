// ============================================
// 知识点：闭包详解
// 难度：中级
// ============================================

// 闭包是匿名函数，可以捕获环境中的变量
// 闭包有三种类型：Fn, FnMut, FnOnce

fn main() {
    // ==================== 闭包语法 ====================
    // 基础闭包
    let add = |a, b| a + b;
    println!("1 + 2 = {}", add(1, 2));
    
    // 带类型标注的闭包
    let multiply = |a: i32, b: i32| -> i32 { a * b };
    println!("3 × 4 = {}", multiply(3, 4));
    
    // 单行闭包（隐式返回）
    let square = |x| x * x;
    println!("5² = {}", square(5));
    
    // 多行闭包
    let complex = |x: i32| {
        let doubled = x * 2;
        let added = doubled + 10;
        added
    };
    println!("complex(5) = {}", complex(5));
    
    // ==================== 闭包捕获环境 ====================
    let offset = 10;
    let add_offset = |x| x + offset;  // 不可变借用
    println!("5 + 10 = {}", add_offset(5));
    
    // 可变借用
    let mut count = 0;
    let mut increment = || {
        count += 1;
        count
    };
    
    println!("count: {}", increment());
    println!("count: {}", increment());
    println!("count: {}", increment());
    
    // 所有权转移
    let name = String::from("Alice");
    let greet = move || {
        println!("Hello, {}!", name);
    };
    greet();
    // println!("{}", name);  // 错误：name 已被移动
    
    // ==================== Fn, FnMut, FnOnce ====================
    
    // Fn：不可变借用（可多次调用）
    let name = String::from("Bob");
    let print_name = || println!("名字: {}", name);  // 借用 name
    print_name();
    print_name();
    println!("name 仍然可用: {}", name);
    
    // FnMut：可变借用（可多次调用）
    let mut numbers = vec![1, 2, 3];
    let mut push = || numbers.push(4);  // 可变借用
    push();
    push();
    println!("numbers: {:?}", numbers);
    
    // FnOnce：获取所有权（只能调用一次）
    let name = String::from("Charlie");
    let consume = || {
        let _name = name;  // 获取所有权
        println!("消耗: {}", _name);
    };
    consume();
    // consume();  // 错误：不能多次调用
    // println!("{}", name);  // 错误：name 已被移动
    
    // ==================== 闭包作为参数 ====================
    fn apply<F: Fn(i32) -> i32>(f: F, x: i32) -> i32 {
        f(x)
    }
    
    let double = |x| x * 2;
    let add_ten = |x| x + 10;
    
    println!("apply(double, 5) = {}", apply(double, 5));
    println!("apply(add_ten, 5) = {}", apply(add_ten, 5));
    
    // 接受闭包的函数
    fn for_each<F: FnMut(i32)>(items: &[i32], mut f: F) {
        for &item in items {
            f(item);
        }
    }
    
    let numbers = vec![1, 2, 3, 4, 5];
    let mut sum = 0;
    
    for_each(&numbers, |x| sum += x);
    println!("总和: {}", sum);
    
    // ==================== 闭包作为返回值 ====================
    fn make_adder(n: i32) -> impl Fn(i32) -> i32 {
        move |x| x + n  // 使用 move 转移所有权
    }
    
    let add5 = make_adder(5);
    let add10 = make_adder(10);
    
    println!("add5(3) = {}", add5(3));
    println!("add10(3) = {}", add10(3));
    
    // 返回闭包的函数
    fn create_multipliers() -> Vec<Box<dyn Fn(i32) -> i32>> {
        let mut multipliers = Vec::new();
        for i in 1..=5 {
            let multiplier = Box::new(move |x: i32| x * i);
            multipliers.push(multiplier);
        }
        multipliers
    }
    
    let multipliers = create_multipliers();
    for (i, multiplier) in multipliers.iter().enumerate() {
        println!("{} × 10 = {}", i + 1, multiplier(10));
    }
    
    // ==================== 闭包与迭代器 ====================
    let numbers = vec![1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    
    // map：转换
    let doubled: Vec<i32> = numbers.iter().map(|&x| x * 2).collect();
    println!("翻倍: {:?}", doubled);
    
    // filter：过滤
    let evens: Vec<&i32> = numbers.iter().filter(|&&x| x % 2 == 0).collect();
    println!("偶数: {:?}", evens);
    
    // fold：累加
    let sum = numbers.iter().fold(0, |acc, &x| acc + x);
    println!("总和: {}", sum);
    
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
    let position = numbers.iter().position(|&x| x == 5);
    println!("5 的位置: {:?}", position);
    
    // ==================== 闭包与性能 ====================
    // 闭包是零成本抽象
    
    let numbers: Vec<i32> = (1..=1000).collect();
    
    // 使用闭包
    let sum: i32 = numbers.iter().filter(|&&x| x % 2 == 0).sum();
    println!("偶数和: {}", sum);
    
    // ==================== 闭包与所有权 ====================
    
    // 不可变借用
    let name = String::from("Alice");
    let print = || println!("名字: {}", name);
    print();
    println!("name 仍然可用: {}", name);
    
    // 可变借用
    let mut vec = vec![1, 2, 3];
    let mut push = || vec.push(4);
    push();
    println!("vec: {:?}", vec);
    
    // 所有权转移
    let name = String::from("Bob");
    let consume = move || {
        println!("消耗: {}", name);
    };
    consume();
    // println!("{}", name);  // 错误
    
    // ==================== 闭包与生命周期 ====================
    fn create_greeting<'a>(name: &'a str) -> impl Fn() -> String + 'a {
        move || format!("Hello, {}!", name)
    }
    
    let name = String::from("Charlie");
    let greeting = create_greeting(&name);
    println!("{}", greeting());
    
    // ==================== 闭包与错误处理 ====================
    fn try_parse<F>(input: &str, parser: F) -> Result<i32, String>
    where
        F: Fn(&str) -> Result<i32, std::num::ParseIntError>,
    {
        parser(input).map_err(|e| e.to_string())
    }
    
    let result = try_parse("42", |s| s.parse::<i32>());
    println!("解析结果: {:?}", result);
    
    let result = try_parse("abc", |s| s.parse::<i32>());
    println!("解析错误: {:?}", result);
    
    // ==================== 闭包与并发 ====================
    use std::sync::{Arc, Mutex};
    use std::thread;
    
    let counter = Arc::new(Mutex::new(0));
    let mut handles = vec![];
    
    for _ in 0..10 {
        let counter = Arc::clone(&counter);
        let handle = thread::spawn(move || {
            let mut num = counter.lock().unwrap();
            *num += 1;
        });
        handles.push(handle);
    }
    
    for handle in handles {
        handle.join().unwrap();
    }
    
    println!("计数器: {}", *counter.lock().unwrap());
    
    // ==================== 闭包与函数指针 ====================
    fn apply_fn_ptr(f: fn(i32) -> i32, x: i32) -> i32 {
        f(x)
    }
    
    fn double(x: i32) -> i32 {
        x * 2
    }
    
    println!("函数指针: {}", apply_fn_ptr(double, 5));
    
    // 闭包也可以转换为函数指针（如果它不捕获环境）
    let triple: fn(i32) -> i32 = |x| x * 3;
    println!("三倍: {}", apply_fn_ptr(triple, 5));
    
    println!("\n闭包详解演示完成!");
}

// ============================================
// 编译和运行方法：
// 
// Windows:
//   rustc 01_closures.rs -o 01_closures.exe
//   01_closures.exe
//
// Linux/macOS:
//   rustc 01_closures.rs -o 01_closures
//   ./01_closures
// ============================================
