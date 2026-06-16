// ============================================================
// Rust 知识点：方法的声明和调用，以及匿名函数
// 编译：rustc 003_methods_associated_functions.rs && .\003_methods_associated_functions.exe
// ============================================================

// 定义一个结构体用于演示方法
struct Circle {
    radius: f64,
}

// `impl` 块为结构体实现方法
impl Circle {
    // 关联函数（associated function）：没有 &self 参数
    // 类似其他语言的"静态方法"
    fn new(radius: f64) -> Circle {
        Circle { radius }
    }

    // 方法（method）：第一个参数是 &self
    fn area(&self) -> f64 {
        std::f64::consts::PI * self.radius * self.radius
    }

    // 修改 self 的方法（需要 &mut self）
    fn scale(&mut self, factor: f64) {
        self.radius *= factor;
    }

    // 获取 self 所有权的方法（消耗 self）
    fn into_radius(self) -> f64 {
        self.radius
    }
}

fn main() {
    // 使用关联函数（类似构造器）
    let mut c = Circle::new(5.0);

    // 调用方法（自动引用/解引用）
    println!("面积: {:.2}", c.area());

    c.scale(2.0);
    println!("放大后面积: {:.2}", c.area());

    // 消耗 Circle 获取 radius
    let r = c.into_radius();
    println!("半径: {}", r);
    // println!("{:?}", c); // 编译错误！c 的所有权已转移
}
