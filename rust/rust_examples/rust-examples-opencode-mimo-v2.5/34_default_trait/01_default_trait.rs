// ============================================
// 知识点：Default Trait
// 难度：中级
// ============================================

// Default trait 允许为类型提供默认值
// 可以使用 #[derive(Default)] 自动实现

use std::collections::HashMap;

fn main() {
    // ==================== 基础 Default ====================
    println!("=== 基础 Default ===");
    
    // 基本类型的默认值
    println!("i32 默认值: {}", i32::default());
    println!("f64 默认值: {}", f64::default());
    println!("bool 默认值: {}", bool::default());
    println!("String 默认值: '{}'", String::default());
    println!("Option 默认值: {:?}", Option::<i32>::default());
    println!("Vec 默认值: {:?}", Vec::<i32>::default());
    
    // ==================== derive Default ====================
    println!("\n=== derive Default ===");
    
    #[derive(Debug, Default)]
    struct Config {
        width: u32,
        height: u32,
        title: String,
        fullscreen: bool,
    }
    
    let config = Config::default();
    println!("默认配置: {:?}", config);
    
    // 部分字段使用默认值
    let config = Config {
        width: 1920,
        height: 1080,
        ..Config::default()
    };
    println!("自定义配置: {:?}", config);
    
    // ==================== 自定义 Default ====================
    println!("\n=== 自定义 Default ===");
    
    #[derive(Debug)]
    struct Color {
        r: u8,
        g: u8,
        b: u8,
        a: u8,
    }
    
    impl Default for Color {
        fn default() -> Self {
            Color {
                r: 0,
                g: 0,
                b: 0,
                a: 255,  // 默认完全不透明
            }
        }
    }
    
    let color = Color::default();
    println!("默认颜色: {:?}", color);
    
    let color = Color {
        r: 255,
        ..Color::default()
    };
    println!("红色: {:?}", color);
    
    // ==================== Default 与 HashMap ====================
    println!("\n=== Default 与 HashMap ===");
    
    let mut map: HashMap<String, Vec<i32>> = HashMap::default();
    map.entry("numbers".to_string())
        .or_default()
        .push(1);
    map.entry("numbers".to_string())
        .or_default()
        .push(2);
    
    println!("HashMap: {:?}", map);
    
    // ==================== Default 与结构体更新 ====================
    println!("\n=== Default 与结构体更新 ===");
    
    #[derive(Debug, Default)]
    struct Server {
        host: String,
        port: u16,
        max_connections: u32,
        timeout: u64,
    }
    
    // 使用 ..Default::default() 设置默认值
    let server = Server {
        host: String::from("localhost"),
        port: 8080,
        ..Server::default()
    };
    
    println!("服务器: {:?}", server);
    
    // ==================== Default 与枚举 ====================
    println!("\n=== Default 与枚举 ===");
    
    #[derive(Debug)]
    enum LogLevel {
        Debug,
        Info,
        Warn,
        Error,
    }
    
    impl Default for LogLevel {
        fn default() -> Self {
            LogLevel::Info
        }
    }
    
    let level = LogLevel::default();
    println!("默认日志级别: {:?}", level);
    
    // ==================== Default 与泛型 ====================
    println!("\n=== Default 与泛型 ===");
    
    struct Container<T: Default> {
        value: T,
    }
    
    impl<T: Default> Container<T> {
        fn new() -> Self {
            Container {
                value: T::default(),
            }
        }
        
        fn get(&self) -> &T {
            &self.value
        }
    }
    
    let container: Container<i32> = Container::new();
    println!("容器值: {}", container.get());
    
    let container: Container<String> = Container::new();
    println!("容器值: '{}'", container.get());
    
    // ==================== Default 与选项 ====================
    println!("\n=== Default 与选项 ===");
    
    #[derive(Debug, Default)]
    struct Options {
        verbose: bool,
        output: String,
        max_retries: u32,
    }
    
    impl Options {
        fn load() -> Self {
            // 模拟从配置文件加载，未设置的使用默认值
            Options {
                verbose: true,
                ..Options::default()
            }
        }
    }
    
    let options = Options::load();
    println!("选项: {:?}", options);
    
    // ==================== Default 与 Builder 模式 ====================
    println!("\n=== Default 与 Builder 模式 ===");
    
    #[derive(Debug, Default)]
    struct Email {
        to: String,
        subject: String,
        body: String,
        cc: Vec<String>,
    }
    
    struct EmailBuilder {
        email: Email,
    }
    
    impl EmailBuilder {
        fn new(to: &str) -> Self {
            EmailBuilder {
                email: Email {
                    to: to.to_string(),
                    ..Email::default()
                },
            }
        }
        
        fn subject(mut self, subject: &str) -> Self {
            self.email.subject = subject.to_string();
            self
        }
        
        fn body(mut self, body: &str) -> Self {
            self.email.body = body.to_string();
            self
        }
        
        fn build(self) -> Email {
            self.email
        }
    }
    
    let email = EmailBuilder::new("user@example.com")
        .subject("测试邮件")
        .body("这是测试内容")
        .build();
    
    println!("邮件: {:?}", email);
    
    // ==================== Default 与配置 ====================
    println!("\n=== Default 与配置 ===");
    
    #[derive(Debug)]
    struct AppConfig {
        database_url: String,
        server_port: u16,
        log_level: String,
        features: Vec<String>,
    }
    
    impl Default for AppConfig {
        fn default() -> Self {
            AppConfig {
                database_url: "localhost:5432".to_string(),
                server_port: 8080,
                log_level: "info".to_string(),
                features: vec!["logging".to_string(), "metrics".to_string()],
            }
        }
    }
    
    let config = AppConfig::default();
    println!("应用配置: {:#?}", config);
    
    // ==================== Default 与性能 ====================
    println!("\n=== Default 与性能 ===");
    
    // 预分配容量
    let vec: Vec<i32> = Vec::with_capacity(100);
    println!("预分配 Vec 容量: {}", vec.capacity());
    
    // 使用 default + 修改
    let mut vec: Vec<i32> = Vec::default();
    vec.extend(0..100);
    println!("扩展后 Vec 长度: {}", vec.len());
    
    println!("\nDefault Trait 演示完成!");
}

// ============================================
// 编译和运行方法：
// 
// Windows:
//   rustc 01_default_trait.rs -o 01_default_trait.exe
//   01_default_trait.exe
//
// Linux/macOS:
//   rustc 01_default_trait.rs -o 01_default_trait
//   ./01_default_trait
// ============================================
