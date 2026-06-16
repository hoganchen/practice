// ============================================================
// Rust 知识点：迭代器适配器详解 —— 链式编程
// 编译：rustc 002_iterator_adaptors.rs && .\002_iterator_adaptors.exe
// ============================================================

fn main() {
    let data = vec![1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

    // ---- map：变换 ----
    let squares: Vec<i32> = data.iter().map(|x| x * x).collect();
    println!("平方: {:?}", squares);

    // ---- filter：过滤 ----
    let evens: Vec<&i32> = data.iter().filter(|x| *x % 2 == 0).collect();
    println!("偶数: {:?}", evens);

    // ---- filter_map：过滤 + 变换一步完成 ----
    let strings = vec!["1", "2", "abc", "3", "def"];
    let parsed: Vec<i32> = strings.iter()
        .filter_map(|s| s.parse::<i32>().ok())
        .collect();
    println!("filter_map 解析: {:?}", parsed);

    // ---- flat_map：展平嵌套集合 ----
    let nested = vec![vec![1, 2], vec![3, 4], vec![5, 6]];
    let flat: Vec<i32> = nested.iter().flat_map(|v| v.iter()).copied().collect();
    println!("flat_map 展平: {:?}", flat);

    // ---- flatten：展平 Option/Result ----
    let options = vec![Some(1), None, Some(3), None, Some(5)];
    let flattened: Vec<i32> = options.iter().flatten().copied().collect();
    println!("flatten: {:?}", flattened);

    // ---- take & skip ----
    let first_3: Vec<_> = data.iter().take(3).collect();
    println!("take(3): {:?}", first_3);

    let after_5: Vec<_> = data.iter().skip(5).collect();
    println!("skip(5): {:?}", after_5);

    // ---- chain：连接迭代器 ----
    let v1 = vec![1, 2, 3];
    let v2 = vec![4, 5, 6];
    let chained: Vec<_> = v1.iter().chain(v2.iter()).collect();
    println!("chain: {:?}", chained);

    // ---- zip：配对 ----
    let names = vec!["Alice", "Bob", "Charlie"];
    let scores = vec![85, 92, 78];
    let paired: Vec<_> = names.iter().zip(scores.iter()).collect();
    println!("zip: {:?}", paired);

    // ---- enumerate：带索引 ----
    for (index, value) in data.iter().enumerate().take(5) {
        println!("索引 {}: {}", index, value);
    }

    // ---- fold：归约 ----
    let sum = data.iter().fold(0, |acc, x| acc + x);
    println!("fold 求和: {}", sum);

    // ---- any / all：条件检查 ----
    let has_even = data.iter().any(|x| x % 2 == 0);
    let all_positive = data.iter().all(|x| x > &0);
    println!("有偶数? {}", has_even);
    println!("都为正? {}", all_positive);

    // ---- find / position：查找 ----
    let found = data.iter().find(|&&x| x == 5);
    let position = data.iter().position(|&x| x == 5);
    println!("find: {:?}, position: {}", found, position.unwrap());

    // ---- cycle：循环迭代 ----
    let colors = vec!["红", "绿", "蓝"];
    let cycling: Vec<_> = colors.iter().cycle().take(7).collect();
    println!("cycle: {:?}", cycling);
}
