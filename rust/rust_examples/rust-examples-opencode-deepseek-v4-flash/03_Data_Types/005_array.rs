// ============================================================
// Rust 知识点：数组（Array）—— 固定长度、同类型元素
// 数组在栈上分配，编译时长度必须确定
// 编译：rustc 005_array.rs && .\005_array.exe
// ============================================================

fn main() {
    // ---- 创建数组 ----
    // 数组用方括号 `[ ]` 创建，所有元素类型必须相同
    let numbers: [i32; 5] = [1, 2, 3, 4, 5];
    //           ^类型  ^长度

    // 类型推断
    let arr = [10, 20, 30, 40];

    // 初始化固定值的数组：[初始值; 长度]
    let zeros = [0; 10]; // 创建 10 个 0
    let threes = [3; 5]; // [3, 3, 3, 3, 3]

    // ---- 访问数组元素 ----
    println!("第一个元素：{}", numbers[0]);
    println!("第三个元素：{}", numbers[2]);

    // ---- 修改数组元素（需要 mut） ----
    let mut mutable_arr = [1, 2, 3];
    mutable_arr[1] = 99;
    println!("修改后的数组：{:?}", mutable_arr);

    // ---- 遍历数组 ----
    for num in numbers.iter() {
        print!("{} ", num);
    }
    println!();

    // 带索引的遍历
    for (index, value) in numbers.iter().enumerate() {
        println!("索引 {} 的值是 {}", index, value);
    }

    // ---- 数组长度 ----
    println!("numbers 数组长度：{}", numbers.len());

    // ---- 数组切片（Slice） ----
    // 切片是数组一部分的引用，没有固定长度
    let slice: &[i32] = &numbers[1..4]; // 取索引 1 到 3
    println!("切片（索引 1..4）：{:?}", slice);

    // 完整切片
    let full_slice = &numbers[..];
    println!("完整切片：{:?}", full_slice);

    // ---- 越界访问 ----
    // Rust 会在运行时检查边界！
    // 取消下面这行注释会 panic
    // println!("越界：{}", numbers[10]);
}
