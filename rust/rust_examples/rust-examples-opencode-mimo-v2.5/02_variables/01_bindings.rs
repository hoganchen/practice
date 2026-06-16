// ============================================
// 知识点：变量绑定
// 难度：入门
// ============================================

// Rust 使用 let 关键字来绑定值到变量名
// 变量默认是不可变的（immutable）
// 如果要使变量可变，需要使用 mut 关键字

fn main() {
    // 不可变变量：默认情况
    let x = 5;
    println!("x 的值是: {}", x);
    
    // 下面这行会编译错误，因为 x 是不可变的
    // x = 6;  // 错误：不能对不可变变量二次赋值
    
    // 可变变量：使用 mut 关键字
    let mut y = 10;
    println!("y 的值是: {}", y);
    
    // 可以修改可变变量的值
    y = 20;
    println!("y 修改后的值是: {}", y);
    
    // 变量遮蔽（Shadowing）：可以用相同的名字重新声明变量
    // 这会创建一个新的变量，遮蔽之前的变量
    let z = 15;
    println!("z 的值是: {}", z);
    
    // 重新声明 z，遮蔽之前的 z
    let z = z + 5;
    println!("z 修改后的值是: {}", z);
    
    // 遮蔽允许改变变量的类型
    let spaces = "   ";  // 字符串类型
    let spaces = spaces.len();  // 现在是 usize 类型
    println!("空格数量: {}", spaces);
    
    // 常量：使用 const 关键字
    // 常量必须显式标注类型，且值必须是编译时可计算的常量表达式
    const MAX_POINTS: u32 = 100_000;
    println!("最大点数: {}", MAX_POINTS);
    
    // 常量可以在全局作用域声明
    // const GLOBAL_CONST: i32 = 42;
    
    // 使用下划线增强数字可读性
    let million = 1_000_000;
    let billion = 1_000_000_000;
    println!("一百万: {}", million);
    println!("十亿: {}", billion);
    
    // 变量的作用域
    {
        let inner_var = 10;
        println!("内部变量: {}", inner_var);
    }
    // inner_var 在这里已经不存在了
    // println!("{}", inner_var);  // 编译错误
    
    // 变量遮蔽的作用
    let value = "hello";
    println!("值: {}", value);
    
    // 遮蔽允许我们重用变量名
    // 这在处理复杂转换时很有用
    let value = value.to_uppercase();
    println!("大写值: {}", value);
    
    // 绑定模式
    let (a, b, c) = (1, 2.0, "三");
    println!("解构绑定: {} {} {}", a, b, c);
    
    // 忽略不需要的值
    let (first, _, third) = (1, 2, 3);
    println!("第一个和第三个: {} {}", first, third);
    
    // 使用 .. 忽略剩余值
    let (x, ..) = (1, 2, 3, 4, 5);
    println!("第一个值: {}", x);
}

// ============================================
// 编译和运行方法：
// 
// Windows:
//   rustc 01_bindings.rs -o 01_bindings.exe
//   01_bindings.exe
//
// Linux/macOS:
//   rustc 01_bindings.rs -o 01_bindings
//   ./01_bindings
// ============================================
