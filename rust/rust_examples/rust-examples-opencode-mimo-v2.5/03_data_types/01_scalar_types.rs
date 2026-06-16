// ============================================
// 知识点：标量类型
// 难度：入门
// ============================================

// Rust 有四种标量类型：
// 1. 整数类型
// 2. 浮点数类型
// 3. 布尔类型
// 4. 字符类型

fn main() {
    // ==================== 整数类型 ====================
    // Rust 的整数类型分为有符号和无符号两种
    // 有符号：i8, i16, i32, i64, i128, isize
    // 无符号：u8, u16, u32, u64, u128, usize
    
    // 有符号整数（可以是负数）
    let a: i8 = -128;        // -128 到 127
    let b: i16 = -32768;     // -32768 到 32767
    let c: i32 = -2147483648; // -2147483648 到 2147483647
    let d: i64 = -9223372036854775808;
    let e: i128 = -170141183460469231731687303715884105728;
    
    println!("i8 最小值: {}", a);
    println!("i16 最小值: {}", b);
    println!("i32 最小值: {}", c);
    println!("i64 最小值: {}", d);
    println!("i128 最小值: {}", e);
    
    // 无符号整数（只能是 0 或正数）
    let f: u8 = 255;         // 0 到 255
    let g: u16 = 65535;      // 0 到 65535
    let h: u32 = 4294967295; // 0 到 4294967295
    let i: u64 = 18446744073709551615;
    let j: u128 = 340282366920938463463374607431768211455;
    
    println!("u8 最大值: {}", f);
    println!("u16 最大值: {}", g);
    println!("u32 最大值: {}", h);
    println!("u64 最大值: {}", i);
    println!("u128 最大值: {}", j);
    
    // isize 和 usize 依赖于计算机架构
    // 在 64 位系统上相当于 i64 和 u64
    let k: isize = -42;
    let l: usize = 42;
    println!("isize: {}", k);
    println!("usize: {}", l);
    
    // ==================== 整数字面量 ====================
    // 十进制
    let decimal = 98_222;  // 下划线可以提高可读性
    println!("十进制: {}", decimal);
    
    // 十六进制（0x 前缀）
    let hex = 0xff;
    println!("十六进制: {}", hex);
    
    // 八进制（0o 前缀）
    let octal = 0o77;
    println!("八进制: {}", octal);
    
    // 二进制（0b 前缀）
    let binary = 0b1111_0000;
    println!("二进制: {}", binary);
    
    // 字节（仅限 u8，前缀 b）
    let byte = b'A';
    println!("字节: {}", byte);
    
    // ==================== 浮点数类型 ====================
    // Rust 有两种浮点数类型：f32 和 f64
    // 默认使用 f64，因为它在现代 CPU 上与 f32 一样快
    
    let x = 2.0;       // 默认 f64
    let y: f32 = 3.0;  // 显式指定 f32
    
    println!("f64: {}", x);
    println!("f32: {}", y);
    
    // 浮点数运算
    let sum = 5.0 + 10.0;
    let difference = 95.5 - 4.3;
    let product = 4.0 * 30.0;
    let quotient = 56.7 / 32.2;
    let remainder = 43.0 % 5.0;
    
    println!("加法: {}", sum);
    println!("减法: {}", difference);
    println!("乘法: {}", product);
    println!("除法: {}", quotient);
    println!("取余: {}", remainder);
    
    // 特殊浮点值
    let infinity = f64::INFINITY;
    let negative_infinity = f64::NEG_INFINITY;
    let nan = f64::NAN;
    
    println!("正无穷: {}", infinity);
    println!("负无穷: {}", negative_infinity);
    println!("NaN: {}", nan);
    
    // ==================== 布尔类型 ====================
    // bool 类型只有两个值：true 和 false
    // 占用 1 个字节
    
    let t = true;
    let f: bool = false;
    
    println!("true: {}", t);
    println!("false: {}", f);
    
    // 布尔运算
    let and_result = true && false;  // 逻辑与
    let or_result = true || false;   // 逻辑或
    let not_result = !true;          // 逻辑非
    
    println!("true && false = {}", and_result);
    println!("true || false = {}", or_result);
    println!("!true = {}", not_result);
    
    // ==================== 字符类型 ====================
    // char 类型表示一个 Unicode 标量值
    // 使用单引号，占用 4 个字节
    
    let c = 'z';
    let z = 'ℤ';
    let heart = '❤';
    let chinese = '中';
    
    println!("char z: {}", c);
    println!("char ℤ: {}", z);
    println!("char ❤: {}", heart);
    println!("char 中: {}", chinese);
    
    // char 大小
    println!("char 大小: {} 字节", std::mem::size_of::<char>());
    
    // 转义字符
    let newline = '\n';
    let tab = '\t';
    let backslash = '\\';
    let single_quote = '\'';
    let unicode_escape = '\u{1F600}';  // 😊
    
    println!("换行符: {:?}", newline);
    println!("制表符: {:?}", tab);
    println!("反斜杠: {:?}", backslash);
    println!("单引号: {:?}", single_quote);
    println!("Unicode 转义: {}", unicode_escape);
    
    // ==================== 类型转换 ====================
    // Rust 不会自动转换类型，必须使用 as 关键字显式转换
    
    let integer = 57;
    let float = integer as f64;
    println!("整数转浮点数: {} -> {}", integer, float);
    
    let float_val = 3.99;
    let truncated = float_val as i32;
    println!("浮点数转整数（截断）: {} -> {}", float_val, truncated);
    
    // 注意：类型转换可能会丢失精度或导致溢出
    let large: i32 = 1000;
    let small: i8 = large as i8;  // 溢出：1000 % 256 = 232，但 i8 最大是 127
    println!("大数转小类型: {} -> {}", large, small);
}

// ============================================
// 编译和运行方法：
// 
// Windows:
//   rustc 01_scalar_types.rs -o 01_scalar_types.exe
//   01_scalar_types.exe
//
// Linux/macOS:
//   rustc 01_scalar_types.rs -o 01_scalar_types
//   ./01_scalar_types
// ============================================
