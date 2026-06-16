// ============================================================
// Rust 知识点：格式化输出 —— println! 的多种用法
// 编译：rustc 003_print_formatting.rs && .\003_print_formatting.exe
// ============================================================

fn main() {
    let name = "Alice";
    let age = 30;
    let height = 1.75;

    // 基本占位符 `{}` —— 实现 Display trait 的类型
    println!("姓名：{}，年龄：{}", name, age);

    // 调试占位符 `{:?}` —— 实现 Debug trait 的类型
    println!("调试输出：{:?}", (name, age, height));

    // 美观调试占位符 `{:#?}` —— 带缩进和换行的 Debug 输出
    println!("美观调试：{:#?}", vec![1, 2, 3]);

    // 指定位置参数
    println!("{0} 是 {1}，{0} 今年 {2} 岁", name, "女生", age);

    // 具名参数
    println!("{name} 今年 {age} 岁", name = "Bob", age = 25);

    // 数值格式化
    println!("保留两位小数：{:.2}", height);        // 1.75
    println!("宽度10右对齐：|{:>10}|", "你好");     // 右对齐
    println!("宽度10左对齐：|{:<10}|", "你好");     // 左对齐
    println!("宽度10居中  ：|{:^10}|", "你好");     // 居中
    println!("补零对齐    ：|{:0>5}|", 42);         // 00042

    // 数字进制
    let n = 255;
    println!("二进制：{:b}", n);   // 11111111
    println!("八进制：{:o}", n);   // 377
    println!("十六进制：{:x}", n); // ff
    println!("十六进制大写：{:X}", n); // FF

    // `eprintln!` 输出到标准错误流（stderr）
    eprintln!("错误信息输出到 stderr");
}
