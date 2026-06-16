// ============================================
// 知识点：Trait Bounds 详解
// 难度：高级
// ============================================

// Trait Bounds 用于约束泛型参数必须实现特定的 trait

use std::fmt::{Debug, Display};
use std::ops::Add;

fn main() {
    // ==================== 基础 Trait Bounds ====================
    println!("=== 基础 Trait Bounds ===");
    
    // 使用 where 子句
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
    
    // ==================== 多个 Trait Bounds ====================
    println!("\n=== 多个 Trait Bounds ===");
    
    // 使用 + 语法
    fn print_debug_display<T: Debug + Display>(item: &T) {
        println!("Debug: {:?}", item);
        println!("Display: {}", item);
    }
    
    print_debug_display(&42);
    
    // 使用 where 子句
    fn process<T>(item: &T)
    where
        T: Debug + Display + Clone,
    {
        let cloned = item.clone();
        println!("处理: {:?} -> {}", item, cloned);
    }
    
    process(&"Hello");
    
    // ==================== Trait Bounds 与结构体 ====================
    println!("\n=== Trait Bounds 与结构体 ===");
    
    #[derive(Debug)]
    struct Wrapper<T: Display> {
        value: T,
    }
    
    impl<T: Display> Wrapper<T> {
        fn new(value: T) -> Self {
            Wrapper { value }
        }
        
        fn display(&self) {
            println!("包装值: {}", self.value);
        }
    }
    
    let wrapper = Wrapper::new(42);
    wrapper.display();
    
    // ==================== Trait Bounds 与方法 ====================
    println!("\n=== Trait Bounds 与方法 ===");
    
    struct Pair<T> {
        first: T,
        second: T,
    }
    
    impl<T: PartialOrd> Pair<T> {
        fn larger(&self) -> &T {
            if self.first >= self.second {
                &self.first
            } else {
                &self.second
            }
        }
    }
    
    impl<T: Debug> Pair<T> {
        fn debug_display(&self) {
            println!("Pair({:?}, {:?})", self.first, self.second);
        }
    }
    
    let pair = Pair { first: 10, second: 20 };
    println!("较大的值: {}", pair.larger());
    pair.debug_display();
    
    // ==================== Trait Bounds 与枚举 ====================
    println!("\n=== Trait Bounds 与枚举 ===");
    
    enum Either<L, R> {
        Left(L),
        Right(R),
    }
    
    impl<L: Display, R: Display> Either<L, R> {
        fn display(&self) {
            match self {
                Either::Left(l) => println!("Left: {}", l),
                Either::Right(r) => println!("Right: {}", r),
            }
        }
    }
    
    let left: Either<i32, &str> = Either::Left(42);
    let right: Either<i32, &str> = Either::Right("hello");
    
    left.display();
    right.display();
    
    // ==================== 高级 Trait Bounds ====================
    println!("\n=== 高级 Trait Bounds ===");
    
    // 使用关联类型
    trait Container {
        type Item;
        fn get(&self) -> &Self::Item;
    }
    
    struct NumberContainer(i32);
    
    impl Container for NumberContainer {
        type Item = i32;
        
        fn get(&self) -> &i32 {
            &self.0
        }
    }
    
    fn print_container<C: Container>(container: &C)
    where
        C::Item: Display,
    {
        println!("容器值: {}", container.get());
    }
    
    let container = NumberContainer(42);
    print_container(&container);
    
    // ==================== Trait Bounds 与迭代器 ====================
    println!("\n=== Trait Bounds 与迭代器 ===");
    
    fn sum_with_bound<T>(iter: T) -> i32
    where
        T: Iterator<Item = i32>,
    {
        iter.sum()
    }
    
    let numbers = vec![1, 2, 3, 4, 5];
    let sum = sum_with_bound(numbers.iter().cloned());
    println!("求和: {}", sum);
    
    // ==================== Trait Bounds 与闭包 ====================
    println!("\n=== Trait Bounds 与闭包 ===");
    
    fn apply_to_vec<T, U, F>(vec: &[T], f: F) -> Vec<U>
    where
        F: Fn(&T) -> U,
    {
        vec.iter().map(f).collect()
    }
    
    let numbers = vec![1, 2, 3, 4, 5];
    let strings = apply_to_vec(&numbers, |x| x.to_string());
    println!("字符串: {:?}", strings);
    
    // ==================== Trait Bounds 与生命周期 ====================
    println!("\n=== Trait Bounds 与生命周期 ===");
    
    fn longest_with_trait<'a, T: Display>(x: &'a str, y: &'a str, _item: T) -> &'a str {
        println!("泛型参数: {}", _item);
        if x.len() > y.len() { x } else { y }
    }
    
    let result = longest_with_trait("hello", "hi", 42);
    println!("更长的字符串: {}", result);
    
    // ==================== 条件实现 ====================
    println!("\n=== 条件实现 ===");
    
    struct Pair2<T> {
        first: T,
        second: T,
    }
    
    impl<T> Pair2<T> {
        fn new(first: T, second: T) -> Self {
            Pair2 { first, second }
        }
    }
    
    // 只有当 T 实现了 Display 时才有 display 方法
    impl<T: Display> Pair2<T> {
        fn display(&self) {
            println!("({}, {})", self.first, self.second);
        }
    }
    
    // 只有当 T 实现了 PartialOrd 时才有 cmp 方法
    impl<T: PartialOrd> Pair2<T> {
        fn cmp(&self) -> &T {
            if self.first >= self.second {
                &self.first
            } else {
                &self.second
            }
        }
    }
    
    let pair = Pair2::new(10, 20);
    pair.display();
    println!("较大的: {}", pair.cmp());
    
    // ==================== Trait Bounds 与泛型 ====================
    println!("\n=== Trait Bounds 与泛型 ===");
    
    fn zip_with<F, A, B, C>(iter_a: A, iter_b: B, f: F) -> Vec<C>
    where
        A: IntoIterator,
        B: IntoIterator,
        F: Fn(A::Item, B::Item) -> C,
    {
        iter_a.into_iter().zip(iter_b.into_iter()).map(|(a, b)| f(a, b)).collect()
    }
    
    let a = vec![1, 2, 3];
    let b = vec![4, 5, 6];
    let result = zip_with(a, b, |x, y| x + y);
    println!("Zip 求和: {:?}", result);
    
    // ==================== 实际应用 ====================
    println!("\n=== 实际应用 ===");
    
    // 可比较的容器
    trait Summarizable {
        fn summary(&self) -> String;
    }
    
    struct Article {
        title: String,
        content: String,
    }
    
    impl Summarizable for Article {
        fn summary(&self) -> String {
            format!("{}: {}...", self.title, &self.content[..50.min(self.content.len())])
        }
    }
    
    fn notify<T: Summarizable>(item: &T) {
        println!("通知: {}", item.summary());
    }
    
    let article = Article {
        title: String::from("Rust 学习"),
        content: String::from("Rust 是一门系统编程语言，注重安全、速度和并发性。"),
    };
    
    notify(&article);
    
    println!("\nTrait Bounds 详解演示完成!");
}

// ============================================
// 编译和运行方法：
// 
// Windows:
//   rustc 01_trait_bounds.rs -o 01_trait_bounds.exe
//   01_trait_bounds.exe
//
// Linux/macOS:
//   rustc 01_trait_bounds.rs -o 01_trait_bounds
//   ./01_trait_bounds
// ============================================
