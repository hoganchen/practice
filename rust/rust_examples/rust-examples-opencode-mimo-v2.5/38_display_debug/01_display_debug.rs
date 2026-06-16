// ============================================
// 知识点：Display 和 Debug Trait
// 难度：中级
// ============================================

// Display trait 用于用户友好的输出
// Debug trait 用于调试输出

use std::fmt;

fn main() {
    // ==================== 基础 Debug ====================
    println!("=== 基础 Debug ===");
    
    // 使用 #[derive(Debug)] 自动实现
    #[derive(Debug)]
    struct Point {
        x: f64,
        y: f64,
    }
    
    let point = Point { x: 1.0, y: 2.0 };
    
    // 使用 {:?} 格式化
    println!("点: {:?}", point);
    
    // 使用 {:#?} 格式化（美化输出）
    println!("点（美化）: {:#?}", point);
    
    // ==================== 基础 Display ====================
    println!("\n=== 基础 Display ===");
    
    struct Color {
        r: u8,
        g: u8,
        b: u8,
    }
    
    impl fmt::Display for Color {
        fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
            write!(f, "#{:02X}{:02X}{:02X}", self.r, self.g, self.b)
        }
    }
    
    let color = Color { r: 255, g: 128, b: 0 };
    println!("颜色: {}", color);
    
    // ==================== Debug 宏 ====================
    println!("\n=== Debug 宏 ===");
    
    let x = 42;
    let s = "hello";
    let v = vec![1, 2, 3];
    
    dbg!(x);
    dbg!(s);
    dbg!(&v);
    
    // ==================== 自定义 Debug ====================
    println!("\n=== 自定义 Debug ===");
    
    struct Secret {
        data: String,
    }
    
    impl fmt::Debug for Secret {
        fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
            f.debug_struct("Secret")
                .field("data", &"[REDACTED]")
                .finish()
        }
    }
    
    let secret = Secret {
        data: String::from("sensitive"),
    };
    
    println!("Secret: {:?}", secret);
    
    // ==================== Display 格式化 ====================
    println!("\n=== Display 格式化 ===");
    
    struct Temperature {
        celsius: f64,
    }
    
    impl fmt::Display for Temperature {
        fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
            write!(f, "{:.1}°C", self.celsius)
        }
    }
    
    let temp = Temperature { celsius: 36.6 };
    println!("温度: {}", temp);
    
    // ==================== Debug 格式化选项 ====================
    println!("\n=== Debug 格式化选项 ===");
    
    #[derive(Debug)]
    struct Data {
        values: Vec<i32>,
        name: String,
    }
    
    let data = Data {
        values: vec![1, 2, 3, 4, 5],
        name: String::from("测试数据"),
    };
    
    // 基本 Debug
    println!("基本: {:?}", data);
    
    // 美化 Debug
    println!("美化:\n{:#?}", data);
    
    // ==================== Display 与迭代器 ====================
    println!("\n=== Display 与迭代器 ===");
    
    struct NumberList(Vec<i32>);
    
    impl fmt::Display for NumberList {
        fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
            let items: Vec<String> = self.0.iter().map(|n| n.to_string()).collect();
            write!(f, "[{}]", items.join(", "))
        }
    }
    
    let list = NumberList(vec![1, 2, 3, 4, 5]);
    println!("列表: {}", list);
    
    // ==================== Debug 与集合 ====================
    println!("\n=== Debug 与集合 ===");
    
    use std::collections::HashMap;
    
    let mut map = HashMap::new();
    map.insert("key1", "value1");
    map.insert("key2", "value2");
    
    println!("HashMap: {:?}", map);
    println!("HashMap 美化:\n{:#?}", map);
    
    // ==================== Display 与错误 ====================
    println!("\n=== Display 与错误 ===");
    
    #[derive(Debug)]
    enum AppError {
        NotFound,
        PermissionDenied,
        Custom(String),
    }
    
    impl fmt::Display for AppError {
        fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
            match self {
                AppError::NotFound => write!(f, "未找到"),
                AppError::PermissionDenied => write!(f, "权限拒绝"),
                AppError::Custom(msg) => write!(f, "{}", msg),
            }
        }
    }
    
    impl std::error::Error for AppError {}
    
    let error = AppError::Custom(String::from("自定义错误"));
    println!("错误: {}", error);
    println!("调试: {:?}", error);
    
    // ==================== Display 与结构体 ====================
    println!("\n=== Display 与结构体 ===");
    
    struct Person {
        name: String,
        age: u32,
    }
    
    impl fmt::Display for Person {
        fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
            write!(f, "{} ({}岁)", self.name, self.age)
        }
    }
    
    impl fmt::Debug for Person {
        fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
            f.debug_struct("Person")
                .field("name", &self.name)
                .field("age", &self.age)
                .finish()
        }
    }
    
    let person = Person {
        name: String::from("Alice"),
        age: 30,
    };
    
    println!("Display: {}", person);
    println!("Debug: {:?}", person);
    
    // ==================== Debug 与枚举 ====================
    println!("\n=== Debug 与枚举 ===");
    
    #[derive(Debug)]
    enum Shape {
        Circle(f64),
        Rectangle(f64, f64),
        Triangle { a: f64, b: f64, c: f64 },
    }
    
    let shapes = vec![
        Shape::Circle(5.0),
        Shape::Rectangle(10.0, 5.0),
        Shape::Triangle {
            a: 3.0,
            b: 4.0,
            c: 5.0,
        },
    ];
    
    for shape in &shapes {
        println!("形状: {:?}", shape);
    }
    
    // ==================== Display 与泛型 ====================
    println!("\n=== Display 与泛型 ===");
    
    struct Wrapper<T: fmt::Display> {
        value: T,
    }
    
    impl<T: fmt::Display> fmt::Display for Wrapper<T> {
        fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
            write!(f, "Wrapper({})", self.value)
        }
    }
    
    let int_wrapper = Wrapper { value: 42 };
    let str_wrapper = Wrapper {
        value: String::from("hello"),
    };
    
    println!("整数包装: {}", int_wrapper);
    println!("字符串包装: {}", str_wrapper);
    
    // ==================== 实际应用 ====================
    println!("\n=== 实际应用 ===");
    
    struct LogEntry {
        timestamp: String,
        level: String,
        message: String,
    }
    
    impl fmt::Display for LogEntry {
        fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
            write!(f, "[{}] {}: {}", self.timestamp, self.level, self.message)
        }
    }
    
    impl fmt::Debug for LogEntry {
        fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
            f.debug_struct("LogEntry")
                .field("timestamp", &self.timestamp)
                .field("level", &self.level)
                .field("message", &self.message)
                .finish()
        }
    }
    
    let log = LogEntry {
        timestamp: String::from("2024-01-15 10:30:00"),
        level: String::from("INFO"),
        message: String::from("用户登录成功"),
    };
    
    println!("日志: {}", log);
    println!("调试: {:?}", log);
    
    println!("\nDisplay 和 Debug Trait 演示完成!");
}

// ============================================
// 编译和运行方法：
// 
// Windows:
//   rustc 01_display_debug.rs -o 01_display_debug.exe
//   01_display_debug.exe
//
// Linux/macOS:
//   rustc 01_display_debug.rs -o 01_display_debug
//   ./01_display_debug
// ============================================
