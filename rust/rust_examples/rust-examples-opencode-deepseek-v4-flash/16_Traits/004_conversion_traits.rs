// ============================================================
// Rust 知识点：类型转换 —— From/Into/TryFrom/TryInto
// 编译：rustc 004_conversion_traits.rs && .\004_conversion_traits.exe
// ============================================================

// ---- From/Into 基础 ----
// From: 定义如何从类型 A 转换为 Self
// Into: 自动反向（如果实现了 From，Into 自动获得）

// 自定义类型的 From 实现
struct Point {
    x: i32,
    y: i32,
}

// 从元组转换
impl From<(i32, i32)> for Point {
    fn from(tuple: (i32, i32)) -> Self {
        Point {
            x: tuple.0,
            y: tuple.1,
        }
    }
}

// 从数组转换
impl From<[i32; 2]> for Point {
    fn from(arr: [i32; 2]) -> Self {
        Point {
            x: arr[0],
            y: arr[1],
        }
    }
}

// ---- TryFrom/TryInto —— 可能失败的转换 ----
use std::convert::{TryFrom, TryInto};

#[derive(Debug)]
struct EvenNumber(i32);

impl TryFrom<i32> for EvenNumber {
    type Error = String;

    fn try_from(value: i32) -> Result<Self, Self::Error> {
        if value % 2 == 0 {
            Ok(EvenNumber(value))
        } else {
            Err(format!("{} 不是偶数", value))
        }
    }
}

// ---- 标准库的常见转换 ----
fn standard_conversions() {
    // &str -> String
    let s: String = "hello".into();
    let s2 = String::from("world");

    // 数字类型转换
    let i: i32 = 42;
    let f: f64 = i.into(); // i32 -> f64
    // let i2: i32 = f.into(); // 编译错误！f64 -> i32 可能丢失精度
    let i2: i32 = f as i32; // 需要用 as

    // 字符串解析
    let num: i32 = "42".parse().unwrap();
    let num2 = i32::from_str_radix("ff", 16).unwrap();
    println!("解析: {}, hex: {}", num, num2);
}

fn main() {
    // ---- From/Into 使用 ----
    // 使用 From
    let p1 = Point::from((10, 20));
    let p2 = Point::from([30, 40]);

    // 使用 Into（自动实现）
    let tuple: (i32, i32) = (100, 200);
    let p3: Point = tuple.into();
    let p4: Point = [50, 60].into();

    println!("From 元组: ({}, {})", p1.x, p1.y);
    println!("From 数组: ({}, {})", p2.x, p2.y);
    println!("Into 元组: ({}, {})", p3.x, p3.y);
    println!("Into 数组: ({}, {})", p4.x, p4.y);

    // ---- TryFrom/TryInto 使用 ----
    let even = EvenNumber::try_from(42);
    let odd = EvenNumber::try_from(7);

    println!("\nTryFrom 42: {:?}", even);
    println!("TryFrom 7: {:?}", odd);

    // 使用 Into 版本
    let result: Result<EvenNumber, String> = 100_i32.try_into();
    println!("try_into 100: {:?}", result);

    // ---- 函数中的 Into 参数 ----
    // 可以接受多种类型的参数
    fn accept_string<S: Into<String>>(s: S) -> String {
        s.into()
    }

    println!("\nInto 参数: {}", accept_string("&str 转 String"));
    println!("Into 参数: {}", accept_string(String::from("String 不变")));

    // ---- 标准库转换 ----
    println!("\n标准库转换:");
    standard_conversions();

    // ---- 为引用实现转换 ----
    // &str -> String 的转换是常见的
    let greeting: String = "你好".into();
    println!("&str -> String: {}", greeting);

    // ---- 数组/切片转换为 Vec ----
    let arr = [1, 2, 3, 4, 5];
    let vec: Vec<i32> = arr.into();
    println!("数组 -> Vec: {:?}", vec);
}
