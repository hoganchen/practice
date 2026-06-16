// ============================================================
// Rust 知识点：Drop trait 与 RAII（资源获取即初始化）
// Drop 在值离开作用域时自动调用，释放资源
// 编译：rustc 006_drop_trait.rs && .\006_drop_trait.exe
// ============================================================

// ---- 实现 Drop trait ----
struct DatabaseConnection {
    url: String,
}

impl Drop for DatabaseConnection {
    fn drop(&mut self) {
        // 自动清理：关闭连接、释放文件句柄等
        println!("[Drop] 关闭数据库连接: {}", self.url);
    }
}

// ---- Drop 与作用域 ----
struct Resource {
    name: String,
}

impl Drop for Resource {
    fn drop(&mut self) {
        println!("[Drop] {} 被释放", self.name);
    }
}

// ---- std::mem::drop —— 提前释放 ----
// 标准库的 drop 函数，等价于 {} 作用域结束

fn main() {
    // ---- RAII 基础 ----
    println!("=== RAII 基础 ===");
    let _db = DatabaseConnection {
        url: String::from("postgres://localhost/mydb"),
    };
    println!("数据库连接已建立");
    // _db 离开作用域时自动调用 drop

    println!();

    // ---- Drop 顺序：后创建的先释放 ----
    println!("=== Drop 顺序 ===");
    let _a = Resource {
        name: String::from("资源A"),
    };
    let _b = Resource {
        name: String::from("资源B"),
    };
    println!("作用域结束前");
    // 输出顺序：先 B 后 A（栈顺序）

    println!();

    // ---- std::mem::drop 提前释放 ----
    println!("=== mem::drop 提前释放 ===");
    let c = Resource {
        name: String::from("资源C"),
    };
    std::mem::drop(c); // 立即释放
    // println!("{}", c.name); // 编译错误！c 已被释放
    println!("资源C 已提前释放");

    println!();

    // ---- 实现 Drop 的常见类型 ----
    // Box, Vec, String, File, MutexGuard 等都实现了 Drop
    {
        let _s = String::from("临时字符串");
        // String::drop 在这里自动释放堆内存
        println!("字符串作用域内");
    }
    println!("字符串已自动释放");

    // ---- Drop 与 Copy 不能共存 ----
    // 实现了 Drop 的类型不能同时实现 Copy trait
    // struct NoDrop; // 这个可以实现 Copy
    // struct HasDrop; impl Drop for HasDrop {} // 不能实现 Copy

    // ---- ManuallyDrop —— 阻止 Drop ----
    println!("\n=== ManuallyDrop 阻止自动释放 ===");
    use std::mem::ManuallyDrop;
    let md = ManuallyDrop::new(Resource {
        name: String::from("手动管理资源"),
    });
    // ManuallyDrop 不会自动调用 drop
    // 需要手动取回所有权
    let _inner = ManuallyDrop::into_inner(md); // 手动触发 drop
}
