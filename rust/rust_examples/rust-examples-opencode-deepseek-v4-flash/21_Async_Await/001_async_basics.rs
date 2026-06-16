// ============================================================
// Rust 知识点：Async/Await 基础
// Rust 原生支持异步编程（不需要第三方运行时也能定义 async fn）
// 实际执行需要运行时（如 tokio、async-std）
// 编译：rustc --edition 2021 001_async_basics.rs && .\001_async_basics.exe
// ============================================================

// ---- 定义 async 函数 ----
async fn say_hello() -> String {
    // async 函数返回的是 Future，需要执行器来 poll
    String::from("你好，异步世界！")
}

// ---- async 块 ----
fn get_future() -> impl std::future::Future<Output = i32> {
    async {
        println!("async 块执行中");
        42
    }
}

// ---- async 函数中的 .await ----
async fn async_sequence() -> String {
    let msg1 = say_hello().await; // .await 会 yield 控制权
    let msg2 = say_hello().await;

    format!("{} {}", msg1, msg2)
}

// ---- 使用 block_on 执行（无需第三方运行时） ----
// futures 库中的 executor::block_on 可以执行 Future

fn main() {
    // 方式1：使用 futures crate 的 block_on
    // let result = futures::executor::block_on(say_hello());
    // println!("{}", result);

    // 方式2：手动阻塞执行（简化演示）
    // 注意：实际项目中建议使用 tokio::main
    println!("async 函数已定义，执行需要运行时支持");
    println!("使用方式：");
    println!("1. 添加 tokio 依赖");
    println!("2. 在 main 函数上添加 #[tokio::main]");
    println!("3. 或使用 futures::executor::block_on");

    // ---- 演示 async block ----
    let future = get_future();
    println!("Future 已创建，尚未执行（惰性）");

    // ---- 多个 Future 并发 ----
    // let result = futures::future::join(say_hello(), say_hello()).await;
    println!("多个 Future 可以并发执行");

    // ---- async move ----
    let data = vec![1, 2, 3];
    let future = async move {
        // move 关键字将 data 所有权移入 async 块
        println!("async 块中: {:?}", data);
        data.len()
    };
    // println!("{:?}", data); // 编译错误！data 已移入 future

    // _future 是 Future，不会执行直到被 poll
    let _ = future;
}
