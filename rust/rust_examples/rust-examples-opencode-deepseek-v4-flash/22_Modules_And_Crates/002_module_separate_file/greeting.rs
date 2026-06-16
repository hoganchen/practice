// ============================================================
// 这是 greeting 模块的文件
// 对应的模块声明在 main.rs 中：mod greeting;
// ============================================================

pub fn hello() -> String {
    String::from("你好！")
}

pub fn farewell() -> String {
    String::from("再见！")
}

// 私有函数，仅在模块内可见
fn _internal() {
    println!("内部函数");
}
