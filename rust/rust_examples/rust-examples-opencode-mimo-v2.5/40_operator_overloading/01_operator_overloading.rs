// ============================================
// 知识点：运算符重载
// 难度：高级
// ============================================

// Rust 使用 std::ops 中的 trait 进行运算符重载
// 每个运算符对应一个 trait

use std::ops::{Add, Sub, Mul, Div, Neg, Index, IndexMut};
use std::fmt;

fn main() {
    // ==================== 基础加法 ====================
    println!("=== 基础加法 ===");
    
    #[derive(Debug, Clone, Copy)]
    struct Vector2D {
        x: f64,
        y: f64,
    }
    
    impl Add for Vector2D {
        type Output = Vector2D;
        
        fn add(self, other: Vector2D) -> Vector2D {
            Vector2D {
                x: self.x + other.x,
                y: self.y + other.y,
            }
        }
    }
    
    let v1 = Vector2D { x: 1.0, y: 2.0 };
    let v2 = Vector2D { x: 3.0, y: 4.0 };
    let v3 = v1 + v2;
    
    println!("{:?} + {:?} = {:?}", v1, v2, v3);
    
    // ==================== 减法 ====================
    println!("\n=== 减法 ===");
    
    impl Sub for Vector2D {
        type Output = Vector2D;
        
        fn sub(self, other: Vector2D) -> Vector2D {
            Vector2D {
                x: self.x - other.x,
                y: self.y - other.y,
            }
        }
    }
    
    let v3 = v2 - v1;
    println!("{:?} - {:?} = {:?}", v2, v1, v3);
    
    // ==================== 乘法 ====================
    println!("\n=== 乘法 ===");
    
    impl Mul<f64> for Vector2D {
        type Output = Vector2D;
        
        fn mul(self, scalar: f64) -> Vector2D {
            Vector2D {
                x: self.x * scalar,
                y: self.y * scalar,
            }
        }
    }
    
    let v3 = v1 * 2.0;
    println!("{:?} * 2.0 = {:?}", v1, v3);
    
    // ==================== 除法 ====================
    println!("\n=== 除法 ===");
    
    impl Div<f64> for Vector2D {
        type Output = Vector2D;
        
        fn div(self, scalar: f64) -> Vector2D {
            Vector2D {
                x: self.x / scalar,
                y: self.y / scalar,
            }
        }
    }
    
    let v3 = v2 / 2.0;
    println!("{:?} / 2.0 = {:?}", v2, v3);
    
    // ==================== 取反 ====================
    println!("\n=== 取反 ===");
    
    impl Neg for Vector2D {
        type Output = Vector2D;
        
        fn neg(self) -> Vector2D {
            Vector2D {
                x: -self.x,
                y: -self.y,
            }
        }
    }
    
    let v3 = -v1;
    println!("-{:?} = {:?}", v1, v3);
    
    // ==================== 索引 ====================
    println!("\n=== 索引 ===");
    
    struct Matrix {
        data: Vec<Vec<f64>>,
    }
    
    impl Index<usize> for Matrix {
        type Output = Vec<f64>;
        
        fn index(&self, index: usize) -> &Vec<f64> {
            &self.data[index]
        }
    }
    
    impl IndexMut<usize> for Matrix {
        fn index_mut(&mut self, index: usize) -> &mut Vec<f64> {
            &mut self.data[index]
        }
    }
    
    let mut matrix = Matrix {
        data: vec![
            vec![1.0, 2.0, 3.0],
            vec![4.0, 5.0, 6.0],
            vec![7.0, 8.0, 9.0],
        ],
    };
    
    println!("matrix[0][1] = {}", matrix[0][1]);
    matrix[1][1] = 10.0;
    println!("修改后 matrix[1][1] = {}", matrix[1][1]);
    
    // ==================== 自定义运算符 ====================
    println!("\n=== 自定义运算符 ===");
    
    #[derive(Debug, Clone, Copy)]
    struct Complex {
        real: f64,
        imag: f64,
    }
    
    impl Add for Complex {
        type Output = Complex;
        
        fn add(self, other: Complex) -> Complex {
            Complex {
                real: self.real + other.real,
                imag: self.imag + other.imag,
            }
        }
    }
    
    impl Sub for Complex {
        type Output = Complex;
        
        fn sub(self, other: Complex) -> Complex {
            Complex {
                real: self.real - other.real,
                imag: self.imag - other.imag,
            }
        }
    }
    
    impl Mul for Complex {
        type Output = Complex;
        
        fn mul(self, other: Complex) -> Complex {
            Complex {
                real: self.real * other.real - self.imag * other.imag,
                imag: self.real * other.imag + self.imag * other.real,
            }
        }
    }
    
    impl Neg for Complex {
        type Output = Complex;
        
        fn neg(self) -> Complex {
            Complex {
                real: -self.real,
                imag: -self.imag,
            }
        }
    }
    
    impl fmt::Display for Complex {
        fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
            write!(f, "{} + {}i", self.real, self.imag)
        }
    }
    
    let c1 = Complex { real: 1.0, imag: 2.0 };
    let c2 = Complex { real: 3.0, imag: 4.0 };
    
    println!("{} + {} = {}", c1, c2, c1 + c2);
    println!("{} * {} = {}", c1, c2, c1 * c2);
    
    // ==================== 字符串运算符 ====================
    println!("\n=== 字符串运算符 ===");
    
    struct SmartString {
        data: String,
    }
    
    impl Add for SmartString {
        type Output = SmartString;
        
        fn add(self, other: SmartString) -> SmartString {
            SmartString {
                data: self.data + &other.data,
            }
        }
    }
    
    impl fmt::Display for SmartString {
        fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
            write!(f, "{}", self.data)
        }
    }
    
    let s1 = SmartString {
        data: String::from("Hello, "),
    };
    let s2 = SmartString {
        data: String::from("World!"),
    };
    
    println!("{} + {} = {}", s1, s2, s1 + s2);
    
    // ==================== 运算符重载规则 ====================
    println!("\n=== 运算符重载规则 ===");
    
    println!("Rust 运算符重载规则:");
    println!("1. 必须为结构体类型实现");
    println!("2. 不能为基本类型实现");
    println!("3. 至少一个参数是自定义类型");
    println!("4. 使用 std::ops 中的 trait");
    
    // ==================== 实际应用 ====================
    println!("\n=== 实际应用 ===");
    
    // 向量运算
    let v1 = Vector2D { x: 1.0, y: 2.0 };
    let v2 = Vector2D { x: 3.0, y: 4.0 };
    
    println!("向量加法: {:?}", v1 + v2);
    println!("向量减法: {:?}", v2 - v1);
    println!("向量标量乘法: {:?}", v1 * 2.0);
    println!("向量取反: {:?}", -v1);
    
    // 矩阵运算
    let matrix = Matrix {
        data: vec![
            vec![1.0, 2.0],
            vec![3.0, 4.0],
        ],
    };
    
    println!("矩阵第一行: {:?}", matrix[0]);
    println!("矩阵第二行: {:?}", matrix[1]);
    
    println!("\n运算符重载演示完成!");
}

// ============================================
// 编译和运行方法：
// 
// Windows:
//   rustc 01_operator_overloading.rs -o 01_operator_overloading.exe
//   01_operator_overloading.exe
//
// Linux/macOS:
//   rustc 01_operator_overloading.rs -o 01_operator_overloading
//   ./01_operator_overloading
// ============================================
