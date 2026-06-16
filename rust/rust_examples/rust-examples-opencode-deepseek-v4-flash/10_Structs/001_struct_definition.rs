// ============================================================
// Rust 知识点：结构体定义与实例化
// 编译：rustc 001_struct_definition.rs && .\001_struct_definition.exe
// ============================================================

// ---- 定义结构体 ----
struct User {
    username: String,  // 字段名: 字段类型
    email: String,
    sign_in_count: u64,
    active: bool,
}

// ---- 元组结构体（Tuple Struct） ----
// 字段没有名称，只有类型
struct Color(i32, i32, i32);  // RGB 颜色
struct Point(i32, i32, i32);  // 3D 坐标

// 即使字段类型相同，Color 和 Point 也是不同类型

// ---- 单元结构体（Unit-like Struct） ----
// 没有任何字段，用于实现 trait
struct AlwaysEqual;

fn main() {
    // ---- 创建结构体实例 ----
    // 必须为所有字段赋值
    let user1 = User {
        email: String::from("alice@example.com"),
        username: String::from("alice"),
        active: true,
        sign_in_count: 1,
    };
    println!("用户: {}", user1.username);

    // ---- 可变实例 ----
    let mut user2 = User {
        email: String::from("bob@example.com"),
        username: String::from("bob"),
        active: false,
        sign_in_count: 1,
    };
    user2.active = true; // 只修改个别字段
    println!("活跃状态: {}", user2.active);

    // ---- 结构体更新语法（..） ----
    let user3 = User {
        email: String::from("charlie@example.com"),
        username: String::from("charlie"),
        ..user1 // 从 user1 复制其他字段（sign_in_count 和 active）
    };
    // 注意：String 类型的字段会移动所有权
    // 所以 user1 不再可用（email 和 username 被移动）
    println!("user3: {}", user3.username);

    // ---- 元组结构体使用 ----
    let black = Color(0, 0, 0);
    let origin = Point(0, 0, 0);
    println!("黑色: ({}, {}, {})", black.0, black.1, black.2);
    println!("原点: ({}, {}, {})", origin.0, origin.1, origin.2);

    // ---- 单元结构体使用 ----
    let equal = AlwaysEqual;
    // 可用于 trait 实现
    println!("单元结构体创建成功");
}

// ---- 返回结构体的函数 ----
fn build_user(email: String, username: String) -> User {
    User {
        // 字段名与变量名相同时可简写
        email,    // 相当于 email: email
        username, // 相当于 username: username
        active: true,
        sign_in_count: 1,
    }
}
