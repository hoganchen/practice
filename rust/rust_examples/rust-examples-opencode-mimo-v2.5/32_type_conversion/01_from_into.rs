// ============================================
// 知识点：From/Into 类型转换
// 难度：中级
// ============================================

// Rust 提供了 From 和 Into trait 用于类型转换
// 实现 From 会自动获得 Into

use std::convert::From;
use std::fmt;

fn main() {
    // ==================== 基础 From/Into ====================
    println!("=== 基础 From/Into ===");
    
    // From trait
    #[derive(Debug)]
    struct Celsius(f64);
    
    #[derive(Debug)]
    struct Fahrenheit(f64);
    
    impl From<Celsius> for Fahrenheit {
        fn from(c: Celsius) -> Self {
            Fahrenheit(c.0 * 9.0 / 5.0 + 32.0)
        }
    }
    
    let boiling = Celsius(100.0);
    let f: Fahrenheit = boiling.into();  // 自动使用 From
    println!("100°C = {:?}°F", f);
    
    // Into trait（通常不需要手动实现）
    let freezing = Celsius(0.0);
    let f: Fahrenheit = freezing.into();
    println!("0°C = {:?}°F", f);
    
    // ==================== 字符串转换 ====================
    println!("\n=== 字符串转换 ===");
    
    // 数字转字符串
    let s = String::from(42);
    println!("i32 -> String: {}", s);
    
    let s = String::from(3.14);
    println!("f64 -> String: {}", s);
    
    // 字符串转数字
    let n: i32 = "42".parse().unwrap();
    println!("String -> i32: {}", n);
    
    // ==================== 自定义类型转换 ====================
    println!("\n=== 自定义类型转换 ===");
    
    #[derive(Debug, Clone, Copy)]
    struct Meters(f64);
    
    #[derive(Debug, Clone, Copy)]
    struct Kilometers(f64);
    
    impl From<Meters> for Kilometers {
        fn from(m: Meters) -> Self {
            Kilometers(m.0 / 1000.0)
        }
    }
    
    impl From<Kilometers> for Meters {
        fn from(k: Kilometers) -> Self {
            Meters(k.0 * 1000.0)
        }
    }
    
    let distance = Meters(5000.0);
    let km: Kilometers = distance.into();
    println!("5000m = {:?}km", km);
    
    let km = Kilometers(2.5);
    let m: Meters = km.into();
    println!("2.5km = {:?}m", m);
    
    // ==================== 枚举转换 ====================
    println!("\n=== 枚举转换 ===");
    
    #[derive(Debug)]
    enum Color {
        Red,
        Green,
        Blue,
        RGB(u8, u8, u8),
    }
    
    impl From<&str> for Color {
        fn from(s: &str) -> Self {
            match s.to_lowercase().as_str() {
                "red" => Color::Red,
                "green" => Color::Green,
                "blue" => Color::Blue,
                _ => Color::RGB(0, 0, 0),
            }
        }
    }
    
    impl From<(u8, u8, u8)> for Color {
        fn from(tuple: (u8, u8, u8)) -> Self {
            Color::RGB(tuple.0, tuple.1, tuple.2)
        }
    }
    
    let color: Color = "red".into();
    println!("字符串 -> 颜色: {:?}", color);
    
    let color: Color = (255, 128, 0).into();
    println!("元组 -> 颜色: {:?}", color);
    
    // ==================== 结构体转换 ====================
    println!("\n=== 结构体转换 ===");
    
    #[derive(Debug)]
    struct Person {
        name: String,
        age: u32,
    }
    
    #[derive(Debug)]
    struct User {
        username: String,
        years_old: u32,
    }
    
    impl From<Person> for User {
        fn from(p: Person) -> Self {
            User {
                username: p.name,
                years_old: p.age,
            }
        }
    }
    
    let person = Person {
        name: String::from("Alice"),
        age: 30,
    };
    
    let user: User = person.into();
    println!("Person -> User: {:?}", user);
    
    // ==================== TryFrom/TryInto ====================
    println!("\n=== TryFrom/TryInto ===");
    
    use std::convert::TryFrom;
    use std::convert::TryInto;
    
    // 尝试转换，可能失败
    let big_number: Result<i32, _> = i32::try_from(1000i64);
    println!("1000i64 -> i32: {:?}", big_number);
    
    let too_big: Result<i32, _> = i32::try_from(100000000i64);
    println!("100000000i64 -> i32: {:?}", too_big);
    
    // 字符串转数字
    let n: Result<i32, _> = "42".try_into();
    println!("\"42\" -> i32: {:?}", n);
    
    let n: Result<i32, _> = "abc".try_into();
    println!("\"abc\" -> i32: {:?}", n);
    
    // ==================== FromStr ====================
    println!("\n=== FromStr ===");
    
    use std::str::FromStr;
    
    #[derive(Debug)]
    struct Point {
        x: f64,
        y: f64,
    }
    
    impl FromStr for Point {
        type Err = String;
        
        fn from_str(s: &str) -> Result<Self, Self::Err> {
            let parts: Vec<&str> = s.split(',').collect();
            if parts.len() != 2 {
                return Err(String::from("格式错误，应为 'x,y'"));
            }
            
            let x = parts[0].parse().map_err(|e| e.to_string())?;
            let y = parts[1].parse().map_err(|e| e.to_string())?;
            
            Ok(Point { x, y })
        }
    }
    
    let point: Point = "1.5,2.5".parse().unwrap();
    println!("解析点: {:?}", point);
    
    let point: Result<Point, _> = "invalid".parse();
    println!("解析失败: {:?}", point);
    
    // ==================== Display 和 ToString ====================
    println!("\n=== Display 和 ToString ===");
    
    struct Color2 {
        r: u8,
        g: u8,
        b: u8,
    }
    
    impl fmt::Display for Color2 {
        fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
            write!(f, "#{:02X}{:02X}{:02X}", self.r, self.g, self.b)
        }
    }
    
    let color = Color2 { r: 255, g: 128, b: 0 };
    println!("Display: {}", color);
    println!("ToString: {}", color.to_string());
    
    // ==================== AsRef/AsMut ====================
    println!("\n=== AsRef/AsMut ===");
    
    fn print_ref(s: impl AsRef<str>) {
        println!("值: {}", s.as_ref());
    }
    
    let s = String::from("Hello");
    print_ref(&s);  // String 实现了 AsRef<str>
    print_ref("World");  // &str 实现了 AsRef<str>
    
    // ==================== 实际应用 ====================
    println!("\n=== 实际应用 ===");
    
    // 配置解析
    #[derive(Debug)]
    struct Config {
        host: String,
        port: u16,
    }
    
    impl From<&str> for Config {
        fn from(s: &str) -> Self {
            let parts: Vec<&str> = s.split(':').collect();
            let host = parts[0].to_string();
            let port = parts.get(1)
                .and_then(|p| p.parse().ok())
                .unwrap_or(8080);
            
            Config { host, port }
        }
    }
    
    let config: Config = "localhost:3000".into();
    println!("配置: {:?}", config);
    
    println!("\nFrom/Into 类型转换演示完成!");
}

// ============================================
// 编译和运行方法：
// 
// Windows:
//   rustc 01_from_into.rs -o 01_from_into.exe
//   01_from_into.exe
//
// Linux/macOS:
//   rustc 01_from_into.rs -o 01_from_into
//   ./01_from_into
// ============================================
