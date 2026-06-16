// ============================================================
// Rust 知识点：模式语法大全 —— 各种模式示例
// 编译：rustc 002_pattern_syntax.rs && .\002_pattern_syntax.exe
// ============================================================

fn main() {
    // === 1. 字面量匹配 ===
    let x = 5;
    match x {
        1 => println!("1"),
        5 => println!("5"),
        _ => println!("其他"),
    }

    // === 2. 命名变量匹配 ===
    let x = Some(5);
    match x {
        Some(y) => println!("匹配到: {}", y), // y 绑定到 Some 内的值
        None => (),
    }

    // === 3. 多模式匹配（|） ===
    let x = 2;
    match x {
        1 | 2 => println!("1 或 2"),
        3 => println!("3"),
        _ => println!("其他"),
    }

    // === 4. 范围匹配（..=） ===
    let x = 5;
    match x {
        1..=5 => println!("1 到 5"),
        _ => println!("其他"),
    }

    // char 范围
    let c = 'e';
    match c {
        'a'..='j' => println!("a 到 j 之间的字母"),
        'k'..='z' => println!("k 到 z 之间的字母"),
        _ => println!("非字母"),
    }

    // === 5. 解构匹配 ===
    // 元组
    let triple = (1, 2, 3);
    match triple {
        (1, y, z) => println!("第一个是 1, y={}, z={}", y, z),
        (_, _, 3) => println!("最后一个元素是 3"),
        _ => println!("其他"),
    }

    // 数组
    let arr = [1, 2, 3, 4, 5];
    match arr {
        [first, .., last] => println!("第一个: {}, 最后一个: {}", first, last),
    }

    // === 6. .. 忽略剩余部分 ===
    struct Point { x: i32, y: i32, z: i32 }
    let p = Point { x: 1, y: 2, z: 3 };
    let Point { x, .. } = p;
    println!("x: {}", x);

    // === 7. 匹配守卫（if） ===
    let num = Some(7);
    match num {
        Some(x) if x < 5 => println!("小于 5: {}", x),
        Some(x) => println!("大于等于 5: {}", x),
        None => (),
    }

    // === 8. @ 绑定 ===
    match 15 {
        n @ 1..=10 => println!("小: {}", n),
        n @ 11..=20 => println!("中: {}", n),
        n => println!("大: {}", n),
    }

    // === 9. 匹配枚举变体 ===
    enum Animal {
        Dog(String),
        Cat { name: String, age: u8 },
    }
    let pet = Animal::Cat {
        name: String::from("咪咪"),
        age: 3,
    };
    match pet {
        Animal::Dog(name) => println!("狗: {}", name),
        Animal::Cat { name, age } => println!("猫: {}, {}岁", name, age),
    }

    // === 10. 备选模式中的绑定 ===
    // let x = 1;
    // match x {
    //     1 | 2 => println!("1 或 2"),
    //     _ => (),
    // }
}
