// ============================================================
// Rust 知识点：泛型基础 —— 泛型函数、结构体、枚举
// 编译：rustc 001_generic_basics.rs && .\001_generic_basics.exe
// ============================================================

use std::fmt::Display;

// ========== 泛型函数 ==========
// T 是类型参数，可以代表任意类型
fn identity<T>(value: T) -> T {
    value
}

// 多个泛型参数
fn swap<T, U>(pair: (T, U)) -> (U, T) {
    (pair.1, pair.0)
}

// 带约束的泛型：T 必须实现 Display
fn print_value<T: Display>(value: T) {
    println!("值: {}", value);
}

// ========== 泛型结构体 ==========
struct Point<T> {
    x: T,
    y: T,
}

// 结构体可以在不同字段使用不同类型
struct Pair<T, U> {
    first: T,
    second: U,
}

// ========== 泛型方法 ==========
impl<T> Point<T> {
    fn x(&self) -> &T {
        &self.x
    }
}

// 为特定类型实现方法
impl Point<f64> {
    fn distance_from_origin(&self) -> f64 {
        (self.x.powi(2) + self.y.powi(2)).sqrt()
    }
}

// ========== 泛型枚举 ==========
enum Option<T> {
    Some(T),
    None,
}

enum Result<T, E> {
    Ok(T),
    Err(E),
}

// ========== const 泛型（编译时常量参数） ==========
struct Array<T, const N: usize> {
    data: [T; N],
}

impl<T: Display, const N: usize> Array<T, N> {
    fn print_all(&self) {
        for item in &self.data {
            print!("{} ", item);
        }
        println!();
    }
}

fn main() {
    // ---- 泛型函数 ----
    let n = identity(42);
    let s = identity("hello");
    println!("identity: {}, {}", n, s);

    let swapped = swap((1, "hello"));
    println!("swap: {:?}", swapped);

    print_value(100);
    print_value("字符串");

    // ---- 泛型结构体 ----
    let int_point = Point { x: 5, y: 10 };
    let float_point = Point { x: 1.0, y: 4.0 };

    let pair = Pair {
        first: "name",
        second: 42,
    };

    println!("Point<int>: ({}, {})", int_point.x, int_point.y);
    println!("Point<f64>: ({}, {})", float_point.x, float_point.y);

    // 调用泛型方法
    println!("x = {}", int_point.x());

    // f64 特化方法
    println!("距离原点: {:.2}", float_point.distance_from_origin());

    // ---- const 泛型 ----
    let arr1 = Array { data: [1, 2, 3] };
    let arr2 = Array { data: [1, 2, 3, 4, 5] };

    arr1.print_all();
    arr2.print_all();
}
