// ============================================
// 知识点：注释
// 难度：入门
// ============================================

// 这是单行注释，编译器会忽略这些内容
// 单行注释以 // 开头

/* 
   这是多行注释
   可以跨越多行
   但通常建议使用单行注释
*/

/* 
   多行注释也可以这样写：
*/  // 注意：多行注释结束符后面可以跟单行注释

/// 这是文档注释，用于生成 API 文档
/// 支持 Markdown 格式
/// 
/// # 示例
/// ```
/// let x = 42;
/// ```
fn example_function() {
    // 文档注释也可以用在函数内部
    // 但通常用在函数、结构体等的定义上方
    
    let x = 5; // 行内注释：变量赋值
    
    // 注释对于解释复杂逻辑很有用
    // 尤其是在算法实现中
    
    println!("x 的值是: {}", x);
}

/// 带有详细文档的函数示例
/// 
/// 这个函数演示了 Rust 的文档注释功能
/// 
/// # 参数
/// * `name` - 要问候的名字
/// * `times` - 问候的次数
/// 
/// # 返回值
/// 返回问候字符串
/// 
/// # 示例
/// ```
/// let greeting = greet("Alice", 2);
/// assert!(greeting.contains("Alice"));
/// ```
fn greet(name: &str, times: u32) -> String {
    let mut result = String::new();
    for _ in 0..times {
        result.push_str(&format!("Hello, {}! ", name));
    }
    result
}

/// 模块级文档注释（通常放在文件顶部）
/// 
/// 这个模块包含注释示例代码
/// 
/// # 模块结构
/// 
/// - `example_function`: 简单的函数示例
/// - `greet`: 带有详细文档的函数示例

fn main() {
    // 调用带有文档的函数
    let greeting = greet("Rust 学习者", 3);
    println!("{}", greeting);
    
    // 注释的最佳实践：
    // 1. 解释为什么这样做，而不是做了什么
    // 2. 保持注释与代码同步更新
    // 3. 避免显而易见的注释
    // 4. 使用文档注释为公共 API 编写文档
    
    println!("请查看源代码中的注释示例");
}

// ============================================
// 编译和运行方法：
// 
// Windows:
//   rustc 02_comments.rs -o 02_comments.exe
//   02_comments.exe
//
// Linux/macOS:
//   rustc 02_comments.rs -o 02_comments
//   ./02_comments
//
// 生成文档（需要安装 rust-docs）：
//   rustdoc 02_comments.rs
//   open index.html
// ============================================
