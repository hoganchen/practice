// ============================================
// 知识点：泛型
// 难度：中级
// ============================================

// 泛型允许编写适用于多种类型的代码
// 零成本抽象：编译时单态化，无运行时开销

fn main() {
    // ==================== 泛型函数 ====================
    fn largest<T: PartialOrd>(list: &[T]) -> &T {
        let mut largest = &list[0];
        
        for item in &list[1..] {
            if item > largest {
                largest = item;
            }
        }
        
        largest
    }
    
    let numbers = vec![34, 50, 25, 100, 65];
    println!("最大数字: {}", largest(&numbers));
    
    let chars = vec!['y', 'm', 'a', 'q'];
    println!("最大字符: {}", largest(&chars));
    
    // ==================== 泛型结构体 ====================
    struct Point<T> {
        x: T,
        y: T,
    }
    
    // 为泛型结构体实现方法
    impl<T> Point<T> {
        fn new(x: T, y: T) -> Self {
            Point { x, y }
        }
        
        fn x(&self) -> &T {
            &self.x
        }
        
        fn y(&self) -> &T {
            &self.y
        }
    }
    
    // 为特定类型实现方法
    impl Point<f64> {
        fn distance_from_origin(&self) -> f64 {
            (self.x.powi(2) + self.y.powi(2)).sqrt()
        }
    }
    
    let integer_point = Point::new(5, 10);
    let float_point = Point::new(1.0, 4.0);
    
    println!("整数点: ({}, {})", integer_point.x(), integer_point.y());
    println!("浮点点: ({}, {})", float_point.x(), float_point.y());
    println!("到原点距离: {:.2}", float_point.distance_from_origin());
    
    // ==================== 泛型枚举 ====================
    enum Option<T> {
        Some(T),
        None,
    }
    
    enum Result<T, E> {
        Ok(T),
        Err(E),
    }
    
    // 使用泛型枚举
    let some_number: Option<i32> = Option::Some(42);
    let some_string: Option<String> = Option::Some(String::from("hello"));
    
    match some_number {
        Option::Some(n) => println!("Some: {}", n),
        Option::None => println!("None"),
    }
    
    // ==================== 多泛型参数 ====================
    struct Pair<T, U> {
        first: T,
        second: U,
    }
    
    impl<T, U> Pair<T, U> {
        fn new(first: T, second: U) -> Self {
            Pair { first, second }
        }
        
        fn first(&self) -> &T {
            &self.first
        }
        
        fn second(&self) -> &U {
            &self.second
        }
    }
    
    // 为特定类型组合实现方法
    impl<T: std::fmt::Display, U: std::fmt::Display> Pair<T, U> {
        fn display(&self) {
            println!("({}, {})", self.first, self.second);
        }
    }
    
    let pair = Pair::new(10, "hello");
    pair.display();
    
    // ==================== 泛型约束 ====================
    fn print_largest<T: PartialOrd + std::fmt::Display>(list: &[T]) {
        let mut largest = &list[0];
        
        for item in &list[1..] {
            if item > largest {
                largest = item;
            }
        }
        
        println!("最大值: {}", largest);
    }
    
    let numbers = vec![34, 50, 25, 100, 65];
    print_largest(&numbers);
    
    // ==================== where 子句 ====================
    fn some_function<T, U>(t: &T, u: &U) -> i32
    where
        T: std::fmt::Display + Clone,
        U: std::fmt::Display + Clone,
    {
        println!("t: {}, u: {}", t, u);
        42
    }
    
    some_function(&"hello", &42);
    
    // ==================== 泛型与 trait ====================
    trait Summary {
        fn summarize(&self) -> String;
    }
    
    struct Article {
        title: String,
        author: String,
        content: String,
    }
    
    impl Summary for Article {
        fn summarize(&self) -> String {
            format!("{}, by {}", self.title, self.author)
        }
    }
    
    struct Tweet {
        username: String,
        content: String,
    }
    
    impl Summary for Tweet {
        fn summarize(&self) -> String {
            format!("{}: {}", self.username, self.content)
        }
    }
    
    // 泛型函数接受实现了 Summary 的类型
    fn notify(item: &impl Summary) {
        println!("通知: {}", item.summarize());
    }
    
    let article = Article {
        title: String::from("Rust 泛型"),
        author: String::from("Alice"),
        content: String::from("泛型允许..."),
    };
    
    let tweet = Tweet {
        username: String::from("bob"),
        content: String::from("学习 Rust!"),
    };
    
    notify(&article);
    notify(&tweet);
    
    // ==================== 泛型与生命周期 ====================
    fn longest<'a, T: std::fmt::Display>(x: &'a str, y: &'a str, _item: T) -> &'a str {
        println!("泛型参数: {}", _item);
        if x.len() > y.len() { x } else { y }
    }
    
    let string1 = String::from("长字符串");
    let string2 = "短";
    let result;
    let item = 42;
    
    result = longest(string1.as_str(), string2, item);
    println!("更长的字符串: {}", result);
    
    // ==================== 泛型与智能指针 ====================
    use std::rc::Rc;
    use std::sync::Arc;
    
    let rc_value = Rc::new(42);
    println!("Rc 值: {}", rc_value);
    
    let arc_value = Arc::new(String::from("共享字符串"));
    println!("Arc 值: {}", arc_value);
    
    // ==================== 泛型与集合 ====================
    use std::collections::HashMap;
    
    fn merge_maps<K: std::hash::Hash + Eq + Clone, V: Clone>(
        map1: &HashMap<K, V>,
        map2: &HashMap<K, V>,
    ) -> HashMap<K, V> {
        let mut result = map1.clone();
        for (key, value) in map2 {
            result.insert(key.clone(), value.clone());
        }
        result
    }
    
    let mut map1 = HashMap::new();
    map1.insert("a", 1);
    map1.insert("b", 2);
    
    let mut map2 = HashMap::new();
    map2.insert("c", 3);
    map2.insert("d", 4);
    
    let merged = merge_maps(&map1, &map2);
    println!("合并后的 map: {:?}", merged);
    
    // ==================== 泛型与迭代器 ====================
    fn double_elements<T: std::ops::Mul<Output = T> + Copy>(items: &[T]) -> Vec<T> {
        items.iter().map(|&x| x * x).collect()  // 注意：这里实际上是平方
    }
    
    let numbers = vec![1, 2, 3, 4, 5];
    let squared = double_elements(&numbers);
    println!("平方: {:?}", squared);
    
    // ==================== 泛型与错误处理 ====================
    fn try_parse<T: std::str::FromStr>(input: &str) -> Result<T, T::Err> {
        input.parse()
    }
    
    let parsed: Result<i32, _> = try_parse("42");
    println!("解析结果: {:?}", parsed);
    
    let parsed: Result<f64, _> = try_parse("3.14");
    println!("解析结果: {:?}", parsed);
    
    // ==================== 泛型与闭包 ====================
    fn apply_to_vec<T, U, F>(vec: &[T], f: F) -> Vec<U>
    where
        F: Fn(&T) -> U,
    {
        vec.iter().map(f).collect()
    }
    
    let numbers = vec![1, 2, 3, 4, 5];
    let strings = apply_to_vec(&numbers, |x| x.to_string());
    println!("字符串: {:?}", strings);
    
    println!("\n泛型演示完成!");
}

// ============================================
// 编译和运行方法：
// 
// Windows:
//   rustc 01_generics.rs -o 01_generics.exe
//   01_generics.exe
//
// Linux/macOS:
//   rustc 01_generics.rs -o 01_generics
//   ./01_generics
// ============================================
