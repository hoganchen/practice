// ============================================
// 知识点：Trait
// 难度：中级
// ============================================

// Trait 定义了类型可以实现的行为
// 类似于其他语言的接口

fn main() {
    // ==================== 定义 Trait ====================
    trait Summary {
        fn summarize(&self) -> String;
        
        // 默认实现
        fn preview(&self) -> String {
            format!("(阅读更多 {}...)", self.summarize())
        }
    }
    
    // ==================== 为类型实现 Trait ====================
    struct Article {
        title: String,
        author: String,
        content: String,
    }
    
    impl Summary for Article {
        fn summarize(&self) -> String {
            format!("{}, by {}", self.title, self.author)
        }
        
        // 覆盖默认实现
        fn preview(&self) -> String {
            let summary = self.summarize();
            if summary.len() > 50 {
                format!("{}...", &summary[..50])
            } else {
                summary
            }
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
    
    // 使用 Trait
    let article = Article {
        title: String::from("Rust Trait"),
        author: String::from("Alice"),
        content: String::from("Trait 定义了..."),
    };
    
    let tweet = Tweet {
        username: String::from("bob"),
        content: String::from("学习 Rust!"),
    };
    
    println!("文章: {}", article.summarize());
    println!("推文: {}", tweet.summarize());
    
    // 使用默认实现
    println!("文章预览: {}", article.preview());
    println!("推文预览: {}", tweet.preview());
    
    // ==================== Trait 作为参数 ====================
    // 使用 impl Trait 语法
    fn notify(item: &impl Summary) {
        println!("通知: {}", item.summarize());
    }
    
    notify(&article);
    notify(&tweet);
    
    // 使用 Trait Bound 语法
    fn notify2<T: Summary>(item: &T) {
        println!("通知 2: {}", item.summarize());
    }
    
    notify2(&article);
    notify2(&tweet);
    
    // 多个 Trait Bound
    fn display_and_summarize(item: &(impl Summary + std::fmt::Display)) {
        println!("显示: {}", item);
        println!("摘要: {}", item.summarize());
    }
    
    // ==================== 返回 Trait ====================
    // 使用 impl Trait 返回
    fn create_summary() -> impl Summary {
        Tweet {
            username: String::from("rust"),
            content: String::from("新版本发布!"),
        }
    }
    
    let summary = create_summary();
    println!("创建的摘要: {}", summary.summarize());
    
    // ==================== Trait 继承 ====================
    trait Printable: std::fmt::Display {
        fn print(&self) {
            println!("打印: {}", self);
        }
        
        fn print_with_prefix(&self, prefix: &str) {
            println!("{}: {}", prefix, self);
        }
    }
    
    // 为实现了 Display 的类型实现 Printable
    impl<T: std::fmt::Display> Printable for T {}
    
    let number = 42;
    number.print();
    number.print_with_prefix("数字");
    
    // ==================== 常用标准库 Trait ====================
    
    // Display（显示）
    struct Color {
        r: u8,
        g: u8,
        b: u8,
    }
    
    impl std::fmt::Display for Color {
        fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
            write!(f, "#{:02X}{:02X}{:02X}", self.r, self.g, self.b)
        }
    }
    
    let color = Color { r: 255, g: 128, b: 0 };
    println!("颜色: {}", color);
    
    // Debug（调试）
    #[derive(Debug)]
    struct Point {
        x: f64,
        y: f64,
    }
    
    let point = Point { x: 1.0, y: 2.0 };
    println!("点: {:?}", point);
    println!("格式化: {:#?}", point);
    
    // Clone 和 Copy
    #[derive(Debug, Clone, Copy)]
    struct Vector2D {
        x: f64,
        y: f64,
    }
    
    let v1 = Vector2D { x: 1.0, y: 2.0 };
    let v2 = v1;  // Copy
    let v3 = v1.clone();  // Clone
    
    println!("v1: {:?}", v1);
    println!("v2: {:?}", v2);
    println!("v3: {:?}", v3);
    
    // PartialEq 和 Eq
    #[derive(Debug, PartialEq)]
    struct Point2 {
        x: i32,
        y: i32,
    }
    
    let p1 = Point2 { x: 1, y: 2 };
    let p2 = Point2 { x: 1, y: 2 };
    let p3 = Point2 { x: 3, y: 4 };
    
    println!("p1 == p2: {}", p1 == p2);
    println!("p1 == p3: {}", p1 == p3);
    
    // PartialOrd 和 Ord
    #[derive(Debug, PartialEq, PartialOrd)]
    struct Student {
        name: String,
        grade: f64,
    }
    
    let students = vec![
        Student {
            name: "Alice".to_string(),
            grade: 3.8,
        },
        Student {
            name: "Bob".to_string(),
            grade: 3.5,
        },
        Student {
            name: "Charlie".to_string(),
            grade: 3.9,
        },
    ];
    
    let mut sorted_students = students.clone();
    sorted_students.sort_by(|a, b| a.partial_cmp(b).unwrap());
    println!("排序后: {:?}", sorted_students);
    
    // Default
    #[derive(Debug, Default)]
    struct Config {
        width: u32,
        height: u32,
        title: String,
    }
    
    let config = Config::default();
    println!("默认配置: {:?}", config);
    
    // ==================== Trait 与泛型 ====================
    trait Describable {
        fn describe(&self) -> String;
    }
    
    struct Dog {
        name: String,
    }
    
    impl Describable for Dog {
        fn describe(&self) -> String {
            format!("狗: {}", self.name)
        }
    }
    
    struct Cat {
        name: String,
    }
    
    impl Describable for Cat {
        fn describe(&self) -> String {
            format!("猫: {}", self.name)
        }
    }
    
    fn print_description(item: &impl Describable) {
        println!("{}", item.describe());
    }
    
    let dog = Dog {
        name: "旺财".to_string(),
    };
    let cat = Cat {
        name: "咪咪".to_string(),
    };
    
    print_description(&dog);
    print_description(&cat);
    
    // ==================== 动态分发 ====================
    // 使用 dyn Trait 实现动态分发
    
    fn create_animals() -> Vec<Box<dyn Describable>> {
        vec![
            Box::new(Dog {
                name: "小黑".to_string(),
            }),
            Box::new(Cat {
                name: "小白".to_string(),
            }),
        ]
    }
    
    let animals = create_animals();
    for animal in &animals {
        println!("动物: {}", animal.describe());
    }
    
    // ==================== Trait 与生命周期 ====================
    trait SummaryWithLifetime<'a> {
        fn summarize(&'a self) -> String;
    }
    
    struct ArticleWithLifetime {
        title: &'static str,
    }
    
    impl<'a> SummaryWithLifetime<'a> for ArticleWithLifetime {
        fn summarize(&'a self) -> String {
            format!("文章: {}", self.title)
        }
    }
    
    let article = ArticleWithLifetime {
        title: "Rust 生命周期",
    };
    println!("文章摘要: {}", article.summarize());
    
    println!("\nTrait 演示完成!");
}

// ============================================
// 编译和运行方法：
// 
// Windows:
//   rustc 01_traits.rs -o 01_traits.exe
//   01_traits.exe
//
// Linux/macOS:
//   rustc 01_traits.rs -o 01_traits
//   ./01_traits
// ============================================
