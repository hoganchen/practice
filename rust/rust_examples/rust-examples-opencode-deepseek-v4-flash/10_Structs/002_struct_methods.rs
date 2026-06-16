// ============================================================
// Rust 知识点：结构体方法（impl 块）
// 编译：rustc 002_struct_methods.rs && .\002_struct_methods.exe
// ============================================================

// ---- 定义一个矩形结构体 ----
struct Rectangle {
    width: u32,
    height: u32,
}

// ---- impl 块：实现方法 ----
impl Rectangle {
    // 关联函数（不接收 self）：构造器
    // 调用方式：Rectangle::new(10, 20)
    fn new(width: u32, height: u32) -> Rectangle {
        Rectangle { width, height }
    }

    // 方法：&self（只读）
    fn area(&self) -> u32 {
        self.width * self.height
    }

    fn width(&self) -> u32 {
        self.width
    }

    fn can_hold(&self, other: &Rectangle) -> bool {
        self.width >= other.width && self.height >= other.height
    }

    // 方法：&mut self（修改）
    fn scale(&mut self, factor: u32) {
        self.width *= factor;
        self.height *= factor;
    }

    // 方法：self（消费所有权）
    fn to_tuple(self) -> (u32, u32) {
        (self.width, self.height)
    }

    // 关联函数（静态方法）
    fn square(size: u32) -> Rectangle {
        Rectangle {
            width: size,
            height: size,
        }
    }
}

// ---- 多个 impl 块 ----
// 一个结构体可以有多个 impl 块
impl Rectangle {
    fn is_square(&self) -> bool {
        self.width == self.height
    }
}

fn main() {
    // 使用关联函数创建实例
    let rect = Rectangle::new(30, 50);
    println!("矩形: {}x{}", rect.width(), rect.height());
    println!("面积: {}", rect.area());
    println!("是正方形: {}", rect.is_square());

    // 可变方法
    let mut rect2 = Rectangle::new(10, 20);
    rect2.scale(2);
    println!("缩放后: {}x{}", rect2.width(), rect2.height());

    // 借用方法
    let rect3 = Rectangle::new(40, 60);
    println!("rect2 能容纳 rect3? {}", rect2.can_hold(&rect3));

    // 消费方法
    let tuple = rect.to_tuple();
    // println!("{}", rect); // 编译错误！rect 已被消费

    // 正方形
    let square = Rectangle::square(15);
    println!("正方形面积: {}", square.area());
}
