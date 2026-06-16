// ============================================================
// Rust 知识点：常量（const）和静态变量（static）
// 编译：rustc 003_constants.rs && .\003_constants.exe
// ============================================================

// `const` 声明常量：编译期求值，全大写命名，必须标注类型
// 常量没有固定的内存地址，每次使用都会被内联
const MAX_POINTS: u32 = 100_000; // 下划线可增加数字可读性
const PI: f64 = 3.1415926535;

// `static` 声明静态变量：有固定内存地址，全大写命名
// 静态变量可以是可变的（但不安全，需用 unsafe）
static APP_NAME: &str = "Rust示例程序";
static mut COUNTER: u32 = 0; // 可变静态变量（unsafe）

fn main() {
    // 使用常量
    println!("最大分数：{}", MAX_POINTS);
    println!("圆周率：{:.4}", PI);

    // 使用静态变量
    println!("应用名称：{}", APP_NAME);

    // 访问或修改可变静态变量是不安全操作
    unsafe {
        COUNTER += 1;
        println!("计数器：{}", COUNTER);
    }

    // const 与 let 的区别：
    // 1. const 必须标注类型，let 可以推断
    // 2. const 在编译期求值，let 在运行时
    // 3. const 的作用域是全局的，let 是块级作用域
    // 4. const 不能被 mut 修饰
}
