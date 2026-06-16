// ============================================
// 知识点：模块系统
// 难度：中级
// ============================================

// Rust 的模块系统用于组织代码
// 包括：包、 crate、模块、路径

// ==================== 模块定义 ====================
// 使用 mod 关键字定义模块

mod math {
    // 公有函数
    pub fn add(a: i32, b: i32) -> i32 {
        a + b
    }
    
    pub fn subtract(a: i32, b: i32) -> i32 {
        a - b
    }
    
    // 私有函数（默认）
    fn internal_helper(x: i32) -> i32 {
        x * 2
    }
    
    // 公有函数调用私有函数
    pub fn double_and_add(a: i32, b: i32) -> i32 {
        internal_helper(add(a, b))
    }
    
    // 嵌套模块
    pub mod advanced {
        pub fn multiply(a: i32, b: i32) -> i32 {
            a * b
        }
        
        pub fn power(base: i32, exp: u32) -> i32 {
            let mut result = 1;
            for _ in 0..exp {
                result *= base;
            }
            result
        }
    }
}

// ==================== 结构体和枚举的可见性 ====================
mod shapes {
    // 公有结构体
    pub struct Circle {
        pub radius: f64,  // 公有字段
        center: (f64, f64),  // 私有字段
    }
    
    impl Circle {
        // 关联函数
        pub fn new(x: f64, y: f64, radius: f64) -> Self {
            Circle {
                radius,
                center: (x, y),
            }
        }
        
        // 公有方法
        pub fn area(&self) -> f64 {
            std::f64::consts::PI * self.radius * self.radius
        }
        
        // 公有方法访问私有字段
        pub fn center(&self) -> (f64, f64) {
            self.center
        }
    }
    
    // 公有枚举（所有变体自动公有）
    #[derive(Debug)]
    pub enum Color {
        Red,
        Green,
        Blue,
        Custom(u8, u8, u8),
    }
    
    impl Color {
        pub fn to_rgb(&self) -> (u8, u8, u8) {
            match self {
                Color::Red => (255, 0, 0),
                Color::Green => (0, 255, 0),
                Color::Blue => (0, 0, 255),
                Color::Custom(r, g, b) => (*r, *g, *b),
            }
        }
    }
}

// ==================== 使用 use 关键字 ====================
// use 可以将路径引入作用域

use math::add;
use math::subtract;
use math::advanced::{multiply, power};

// 使用别名
use shapes::Color as ShapeColor;

// 使用嵌套路径
use std::io::{self, Read, Write};
use std::collections::{HashMap, HashSet};

fn main() {
    // 使用导入的函数
    println!("10 + 5 = {}", add(10, 5));
    println!("10 - 5 = {}", subtract(10, 5));
    println!("10 × 5 = {}", multiply(10, 5));
    println!("2^10 = {}", power(2, 10));
    
    // 使用完整路径
    println!("10 + 5 = {}", math::add(10, 5));
    println!("10 × 5 = {}", math::advanced::multiply(10, 5));
    
    // 使用 double_and_add
    println!("double_and_add(3, 4) = {}", math::double_and_add(3, 4));
    
    // 使用结构体
    let circle = shapes::Circle::new(0.0, 0.0, 5.0);
    println!("圆面积: {:.2}", circle.area());
    println!("圆心: {:?}", circle.center());
    
    // 使用导入的枚举
    let color = ShapeColor::Custom(255, 128, 0);
    println!("颜色 RGB: {:?}", color.to_rgb());
    
    // 使用导入的集合类型
    let mut scores: HashMap<String, i32> = HashMap::new();
    scores.insert("Alice".to_string(), 95);
    scores.insert("Bob".to_string(), 87);
    println!("分数: {:?}", scores);
    
    let mut unique_numbers: HashSet<i32> = HashSet::new();
    unique_numbers.insert(1);
    unique_numbers.insert(2);
    unique_numbers.insert(3);
    unique_numbers.insert(1);  // 重复，不会插入
    println!("唯一数字: {:?}", unique_numbers);
    
    // ==================== 文件模块 ====================
    // 在实际项目中，模块通常定义在单独的文件中
    // 文件结构：
    // src/
    // ├── main.rs
    // ├── lib.rs
    // ├── math.rs 或 math/
    // │   ├── mod.rs
    // │   ├── add.rs
    // │   └── subtract.rs
    // └── shapes.rs
    
    println!("\n模块系统演示完成!");
}

// ==================== 重导出 ====================
// 使用 pub use 重导出项目

mod utils {
    pub mod strings {
        pub fn to_uppercase(s: &str) -> String {
            s.to_uppercase()
        }
        
        pub fn to_lowercase(s: &str) -> String {
            s.to_lowercase()
        }
    }
    
    pub mod numbers {
        pub fn is_even(n: i32) -> bool {
            n % 2 == 0
        }
        
        pub fn is_odd(n: i32) -> bool {
            n % 2 != 0
        }
    }
    
    // 重导出子模块
    pub use strings::to_uppercase;
    pub use numbers::is_even;
}

// ==================== 条件编译 ====================
// 使用 cfg 属性进行条件编译

#[cfg(target_os = "windows")]
fn platform_specific() {
    println!("运行在 Windows 上");
}

#[cfg(target_os = "linux")]
fn platform_specific() {
    println!("运行在 Linux 上");
}

#[cfg(target_os = "macos")]
fn platform_specific() {
    println!("运行在 macOS 上");
}

// ==================== 测试模块 ====================
#[cfg(test)]
mod tests {
    use super::*;  // 导入父模块的所有内容
    
    #[test]
    fn test_add() {
        assert_eq!(add(2, 3), 5);
    }
    
    #[test]
    fn test_subtract() {
        assert_eq!(subtract(5, 3), 2);
    }
    
    #[test]
    fn test_multiply() {
        assert_eq!(multiply(4, 5), 20);
    }
}

// ============================================
// 编译和运行方法：
// 
// Windows:
//   rustc 01_modules.rs -o 01_modules.exe
//   01_modules.exe
//
// Linux/macOS:
//   rustc 01_modules.rs -o 01_modules
//   ./01_modules
//
// 运行测试：
//   rustc --test 01_modules.rs
//   ./01_modules
// ============================================
