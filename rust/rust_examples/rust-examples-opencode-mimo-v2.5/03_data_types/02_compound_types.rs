// ============================================
// 知识点：复合类型
// 难度：入门
// ============================================

// Rust 有两种复合类型：
// 1. 元组（Tuple）
// 2. 数组（Array）

fn main() {
    // ==================== 元组（Tuple） ====================
    // 元组可以包含不同类型的值
    // 元组有固定的长度，一旦声明就不能改变
    
    // 创建元组
    let tup: (i32, f64, u8) = (500, 6.4, 1);
    println!("元组: {:?}", tup);
    
    // 解构元组：将元组的每个元素绑定到变量
    let (x, y, z) = tup;
    println!("解构后的值: x={}, y={}, z={}", x, y, z);
    
    // 使用索引访问元组元素（索引从 0 开始）
    let first = tup.0;
    let second = tup.1;
    let third = tup.2;
    println!("通过索引访问: first={}, second={}, third={}", first, second, third);
    
    // 空元组（单元类型）
    let unit: () = ();
    println!("空元组: {:?}", unit);
    
    // 元组可以嵌套
    let nested = ((1, 2), (3, 4));
    println!("嵌套元组: {:?}", nested);
    println!("访问嵌套值: {}", nested.0 .1);  // 注意空格
    
    // ==================== 数组（Array） ====================
    // 数组包含相同类型的值
    // 数组有固定的长度，存储在栈上
    
    // 创建数组
    let a = [1, 2, 3, 4, 5];
    println!("数组: {:?}", a);
    
    // 显式指定类型和长度
    let b: [i32; 5] = [1, 2, 3, 4, 5];
    println!("显式类型数组: {:?}", b);
    
    // 使用重复值初始化数组
    let c = [3; 5];  // [3, 3, 3, 3, 3]
    println!("重复值数组: {:?}", c);
    
    // 访问数组元素
    let first = a[0];
    let second = a[1];
    println!("数组元素: first={}, second={}", first, second);
    
    // 数组长度
    println!("数组长度: {}", a.len());
    
    // 修改数组（需要 mut）
    let mut mutable_array = [1, 2, 3];
    println!("修改前: {:?}", mutable_array);
    mutable_array[0] = 10;
    mutable_array[1] = 20;
    mutable_array[2] = 30;
    println!("修改后: {:?}", mutable_array);
    
    // 数组切片（Slice）
    let slice = &a[1..3];  // 从索引 1 到 3（不包含 3）
    println!("切片 [1..3]: {:?}", slice);
    
    let slice_from = &a[2..];  // 从索引 2 到末尾
    println!("切片 [2..]: {:?}", slice_from);
    
    let slice_to = &a[..3];  // 从开头到索引 3（不包含 3）
    println!("切片 [..3]: {:?}", slice_to);
    
    let full_slice = &a[..];  // 整个数组
    println!("完整切片: {:?}", full_slice);
    
    // 数组遍历
    println!("\n数组遍历:");
    for element in &a {
        println!("  元素: {}", element);
    }
    
    // 带索引的遍历
    println!("\n带索引的遍历:");
    for (index, element) in a.iter().enumerate() {
        println!("  索引 {}: 值 {}", index, element);
    }
    
    // ==================== 多维数组 ====================
    // Rust 没有真正的多维数组，但可以使用数组的数组
    
    let matrix: [[i32; 3]; 2] = [
        [1, 2, 3],
        [4, 5, 6],
    ];
    
    println!("\n二维数组:");
    for row in &matrix {
        println!("  {:?}", row);
    }
    
    // 访问二维数组元素
    println!("matrix[0][1] = {}", matrix[0][1]);
    println!("matrix[1][2] = {}", matrix[1][2]);
    
    // ==================== 数组 vs Vec ====================
    // 数组：固定长度，存储在栈上
    // Vec：动态长度，存储在堆上
    
    // 当需要动态长度时，使用 Vec
    let mut vec = Vec::new();
    vec.push(1);
    vec.push(2);
    vec.push(3);
    println!("\nVec: {:?}", vec);
    
    // 使用 vec! 宏创建 Vec
    let vec2 = vec![4, 5, 6];
    println!("Vec 宏: {:?}", vec2);
    
    // ==================== 常用数组方法 ====================
    let numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    
    // 检查元素是否存在
    println!("\n是否存在 5: {}", numbers.contains(&5));
    println!("是否存在 11: {}", numbers.contains(&11));
    
    // 查找元素位置
    if let Some(index) = numbers.iter().position(|&x| x == 5) {
        println!("5 的位置: {}", index);
    }
    
    // 数组排序（需要可变）
    let mut unsorted = [5, 2, 8, 1, 9, 3];
    println!("排序前: {:?}", unsorted);
    unsorted.sort();
    println!("排序后: {:?}", unsorted);
    
    // 数组反转
    let mut reversed = [1, 2, 3, 4, 5];
    println!("反转前: {:?}", reversed);
    reversed.reverse();
    println!("反转后: {:?}", reversed);
    
    // 数组连接
    let array1 = [1, 2, 3];
    let array2 = [4, 5, 6];
    let combined = [array1, array2].concat();
    println!("连接数组: {:?}", combined);
}

// ============================================
// 编译和运行方法：
// 
// Windows:
//   rustc 02_compound_types.rs -o 02_compound_types.exe
//   02_compound_types.exe
//
// Linux/macOS:
//   rustc 02_compound_types.rs -o 02_compound_types
//   ./02_compound_types
// ============================================
