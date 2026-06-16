// ============================================================
// Rust 知识点：元组（Tuple）—— 固定长度、可包含不同类型
// 编译：rustc 004_tuple.rs && .\004_tuple.exe
// ============================================================

fn main() {
    // ---- 创建元组 ----
    // 元组用圆括号 `( )` 创建，元素用逗号分隔
    // 每个元素可以是不同的类型
    let person: (&str, u8, bool) = ("Alice", 30, true);

    // 类型标注可以省略（由编译器推断）
    let tuple = (1, 2.5, "hello", 'c');

    // ---- 访问元组元素 ----
    // 方法1：使用下标（点语法）
    println!("姓名：{}", person.0);
    println!("年龄：{}", person.1);
    println!("是否在职：{}", person.2);

    // 方法2：解构（destructuring）
    let (name, age, employed) = person;
    println!("解构得到：{name} {age} {employed}");

    // 方法3：使用 _ 忽略不需要的元素
    let (x, _, z) = (1, 2, 3);
    println!("x={}, z={}", x, z);

    // ---- 只有一个值的元组 ----
    // 注意：必须加逗号，否则会被解析为括号表达式
    let single = (42,);  // 这是元组，类型是 (i32,)
    let not_tuple = (42); // 这是 i32 类型，不是元组！
    println!("单元素元组：{:?}", single);
    println!("普通 i32：{}", not_tuple);

    // ---- 元组的实际应用 ----
    // 1. 函数返回多个值
    let (sum, product) = add_and_multiply(3, 4);
    println!("和={}, 积={}", sum, product);

    // 2. 模式匹配中解构元组
    let pair = (10, 20);
    match pair {
        (a, b) if a > b => println!("a > b"),
        (a, b) if a < b => println!("a < b"),
        _ => println!("相等"),
    }
}

// 函数返回元组（多个返回值）
fn add_and_multiply(a: i32, b: i32) -> (i32, i32) {
    (a + b, a * b)
}
