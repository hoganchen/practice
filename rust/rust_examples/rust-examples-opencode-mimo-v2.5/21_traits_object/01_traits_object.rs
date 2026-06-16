// ============================================
// 知识点：Trait 对象
// 难度：高级
// ============================================

// Trait 对象允许运行时多态
// 使用 dyn Trait 语法

fn main() {
    // ==================== 基础 Trait 对象 ====================
    trait Animal {
        fn speak(&self) -> &str;
        fn name(&self) -> &str;
    }
    
    struct Dog {
        name: String,
    }
    
    impl Animal for Dog {
        fn speak(&self) -> &str {
            "汪汪!"
        }
        
        fn name(&self) -> &str {
            &self.name
        }
    }
    
    struct Cat {
        name: String,
    }
    
    impl Animal for Cat {
        fn speak(&self) -> &str {
            "喵喵!"
        }
        
        fn name(&self) -> &str {
            &self.name
        }
    }
    
    // 使用 Box<dyn Animal>
    let animals: Vec<Box<dyn Animal>> = vec![
        Box::new(Dog { name: String::from("旺财") }),
        Box::new(Cat { name: String::from("咪咪") }),
        Box::new(Dog { name: String::from("小黑") }),
    ];
    
    for animal in &animals {
        println!("{} 说: {}", animal.name(), animal.speak());
    }
    
    // ==================== Trait 对象作为函数参数 ====================
    fn make_speak(animal: &dyn Animal) {
        println!("{} 说: {}", animal.name(), animal.speak());
    }
    
    let dog = Dog {
        name: String::from("大黄"),
    };
    let cat = Cat {
        name: String::from("小白"),
    };
    
    make_speak(&dog);
    make_speak(&cat);
    
    // ==================== Trait 对象与生命周期 ====================
    trait Summary {
        fn summarize(&self) -> String;
    }
    
    struct Article {
        title: String,
        author: String,
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
    
    // 返回 Trait 对象
    fn create_summary() -> Box<dyn Summary> {
        Box::new(Article {
            title: String::from("Rust Trait 对象"),
            author: String::from("Alice"),
        })
    }
    
    let summary = create_summary();
    println!("摘要: {}", summary.summarize());
    
    // ==================== 静态分发 vs 动态分发 ====================
    
    // 静态分发（编译时）
    fn notify_static(item: &impl Summary) {
        println!("静态: {}", item.summarize());
    }
    
    // 动态分发（运行时）
    fn notify_dynamic(item: &dyn Summary) {
        println!("动态: {}", item.summarize());
    }
    
    let article = Article {
        title: String::from("示例文章"),
        author: String::from("Bob"),
    };
    
    notify_static(&article);
    notify_dynamic(&article);
    
    // ==================== 对象安全 ====================
    // 不是所有 trait 都可以作为 trait 对象
    // 必须满足对象安全条件
    
    trait Clone {
        fn clone_self(&self) -> Self;
    }
    
    // 这个 trait 是对象安全的
    trait ObjectSafe {
        fn method(&self);
    }
    
    struct MyStruct;
    
    impl ObjectSafe for MyStruct {
        fn method(&self) {
            println!("ObjectSafe 方法");
        }
    }
    
    // 可以使用
    let obj: Box<dyn ObjectSafe> = Box::new(MyStruct);
    obj.method();
    
    // ==================== Trait 对象与枚举 ====================
    enum Shape {
        Circle(f64),
        Rectangle(f64, f64),
        Triangle(f64, f64, f64),
    }
    
    impl Shape {
        fn area(&self) -> f64 {
            match self {
                Shape::Circle(radius) => std::f64::consts::PI * radius * radius,
                Shape::Rectangle(width, height) => width * height,
                Shape::Triangle(a, b, c) => {
                    let s = (a + b + c) / 2.0;
                    (s * (s - a) * (s - b) * (s - c)).sqrt()
                }
            }
        }
        
        fn describe(&self) -> String {
            match self {
                Shape::Circle(r) => format!("圆形，半径: {}", r),
                Shape::Rectangle(w, h) => format!("矩形: {}x{}", w, h),
                Shape::Triangle(a, b, c) => format!("三角形: {}, {}, {}", a, b, c),
            }
        }
    }
    
    let shapes: Vec<Box<dyn std::fmt::Display>> = vec![
        Box::new(Shape::Circle(5.0)),
        Box::new(Shape::Rectangle(10.0, 5.0)),
        Box::new(Shape::Triangle(3.0, 4.0, 5.0)),
    ];
    
    for shape in &shapes {
        println!("{}", shape);
    }
    
    // ==================== 多重 Trait 约束 ====================
    trait Printable {
        fn print(&self);
    }
    
    trait Loggable {
        fn log(&self);
    }
    
    struct Data {
        value: i32,
    }
    
    impl Printable for Data {
        fn print(&self) {
            println!("Data: {}", self.value);
        }
    }
    
    impl Loggable for Data {
        fn log(&self) {
            println!("[LOG] Data value: {}", self.value);
        }
    }
    
    // 同时使用多个 trait
    fn process(item: &(impl Printable + Loggable)) {
        item.print();
        item.log();
    }
    
    let data = Data { value: 42 };
    process(&data);
    
    // ==================== Trait 对象与集合 ====================
    let mut items: Vec<Box<dyn Printable>> = vec![
        Box::new(Data { value: 1 }),
        Box::new(Data { value: 2 }),
        Box::new(Data { value: 3 }),
    ];
    
    for item in &items {
        item.print();
    }
    
    // 添加新元素
    items.push(Box::new(Data { value: 4 }));
    
    println!("\n添加后:");
    for item in &items {
        item.print();
    }
    
    // ==================== 实际应用：插件系统 ====================
    trait Plugin {
        fn name(&self) -> &str;
        fn execute(&self, input: &str) -> String;
    }
    
    struct UpperCasePlugin;
    
    impl Plugin for UpperCasePlugin {
        fn name(&self) -> &str {
            "UpperCase"
        }
        
        fn execute(&self, input: &str) -> String {
            input.to_uppercase()
        }
    }
    
    struct ReversePlugin;
    
    impl Plugin for ReversePlugin {
        fn name(&self) -> &str {
            "Reverse"
        }
        
        fn execute(&self, input: &str) -> String {
            input.chars().rev().collect()
        }
    }
    
    struct PluginManager {
        plugins: Vec<Box<dyn Plugin>>,
    }
    
    impl PluginManager {
        fn new() -> Self {
            PluginManager {
                plugins: Vec::new(),
            }
        }
        
        fn register(&mut self, plugin: Box<dyn Plugin>) {
            println!("注册插件: {}", plugin.name());
            self.plugins.push(plugin);
        }
        
        fn execute_all(&self, input: &str) {
            for plugin in &self.plugins {
                let output = plugin.execute(input);
                println!("{}: {} -> {}", plugin.name(), input, output);
            }
        }
    }
    
    let mut manager = PluginManager::new();
    manager.register(Box::new(UpperCasePlugin));
    manager.register(Box::new(ReversePlugin));
    
    println!("\n插件执行:");
    manager.execute_all("hello");
    
    // ==================== 性能考虑 ====================
    // 动态分发有轻微的运行时开销（虚函数表）
    // 在性能关键路径中，优先考虑静态分发
    
    println!("\nTrait 对象演示完成!");
}

// ============================================
// 编译和运行方法：
// 
// Windows:
//   rustc 01_traits_object.rs -o 01_traits_object.exe
//   01_traits_object.exe
//
// Linux/macOS:
//   rustc 01_traits_object.rs -o 01_traits_object
//   ./01_traits_object
// ============================================
