// ============================================
// 知识点：类型推断
// 难度：入门
// ============================================

// Rust 具有强大的类型推断能力
// 编译器可以根据上下文自动推断变量的类型
// 但有时候需要显式标注类型

fn main() {
    // Rust 编译器可以从字面量推断类型
    let x = 5;  // 推断为 i32（默认整数类型）
    let y = 3.14;  // 推断为 f64（默认浮点数类型）
    let z = true;  // 推断为 bool
    let s = "hello";  // 推断为 &str
    
    println!("x: {} (i32)", x);
    println!("y: {} (f64)", y);
    println!("z: {} (bool)", z);
    println!("s: {} (&str)", s);
    
    // 使用后缀指定类型
    let a = 42i64;  // 显式指定为 i64
    let b = 3.14f32;  // 显式指定为 f32
    let c = 100u8;  // 显式指定为 u8
    
    println!("a: {} (i64)", a);
    println!("b: {} (f32)", b);
    println!("c: {} (u8)", c);
    
    // 使用类型标注
    let d: i16 = 1000;
    let e: f32 = 2.71828;
    let g: char = 'A';
    
    println!("d: {} (i16)", d);
    println!("e: {} (f32)", e);
    println!("g: {} (char)", g);
    
    // 类型推断在函数调用中
    let numbers = vec![1, 2, 3];  // 推断为 Vec<i32>
    let sum: i32 = numbers.iter().sum();  // 显式指定累加类型
    println!("向量和: {}", sum);
    
    // 使用 turbofish 语法指定泛型类型
    let parsed = "42".parse::<i32>().unwrap();
    println!("解析的数字: {}", parsed);
    
    // 类型推断在模式匹配中
    let option: Option<i32> = Some(42);
    match option {
        Some(value) => println!("Some 值: {} (i32)", value),
        None => println!("None"),
    }
    
    // 类型推断在闭包中
    let add = |a, b| a + b;  // 闭包参数类型由调用时推断
    let result = add(5, 3);  // 推断为 i32
    println!("闭包结果: {}", result);
    
    // 当类型无法推断时，需要显式标注
    let empty_vec: Vec<i32> = Vec::new();  // 无法推断，需要标注
    println!("空向量长度: {}", empty_vec.len());
    
    // 使用类型标注来选择正确的解析方法
    let number: u32 = "42".parse().unwrap();
    println!("u32 数字: {}", number);
    
    // 显式指定类型以避免歧义
    let float_num = 5.0;  // 默认 f64
    let int_num = 5;  // 默认 i32
    
    // 需要注意的类型推断情况
    let inferred = [1, 2, 3];  // 推断为 [i32; 3]
    println!("数组长度: {}", inferred.len());
    
    // 类型推断在迭代器中
    let doubled: Vec<i32> = vec![1, 2, 3]
        .iter()
        .map(|x| x * 2)
        .collect();  // collect 需要类型标注
    println!("翻倍数组: {:?}", doubled);
}

// ============================================
// 编译和运行方法：
// 
// Windows:
//   rustc 02_type_inference.rs -o 02_type_inference.exe
//   02_type_inference.exe
//
// Linux/macOS:
//   rustc 02_type_inference.rs -o 02_type_inference
//   ./02_type_inference
// ============================================
