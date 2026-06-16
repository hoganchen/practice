// ============================================
// 知识点：Drop Trait 详解
// 难度：高级
// ============================================

// Drop trait 允许在值被丢弃时执行自定义代码
// 类似于其他语言的析构函数

use std::ops::Drop;

fn main() {
    // ==================== 基础 Drop ====================
    println!("=== 基础 Drop ===");
    
    struct MyStruct {
        name: String,
    }
    
    impl Drop for MyStruct {
        fn drop(&mut self) {
            println!("丢弃 MyStruct: {}", self.name);
        }
    }
    
    let s1 = MyStruct {
        name: String::from("第一个"),
    };
    let s2 = MyStruct {
        name: String::from("第二个"),
    };
    
    println!("创建了两个结构体");
    drop(s1);  // 手动丢弃
    println!("s1 已被丢弃");
    
    // ==================== Drop 顺序 ====================
    println!("\n=== Drop 顺序 ===");
    
    struct DropOrder {
        id: u32,
    }
    
    impl Drop for DropOrder {
        fn drop(&mut self) {
            println!("丢弃 DropOrder: {}", self.id);
        }
    }
    
    let a = DropOrder { id: 1 };
    let b = DropOrder { id: 2 };
    let c = DropOrder { id: 3 };
    
    println!("创建了 a, b, c");
    // 丢弃顺序与创建顺序相反
    // c, b, a
    
    // ==================== Drop 与所有权 ====================
    println!("\n=== Drop 与所有权 ===");
    
    struct Resource {
        name: String,
    }
    
    impl Drop for Resource {
        fn drop(&mut self) {
            println!("释放资源: {}", self.name);
        }
    }
    
    {
        let r1 = Resource {
            name: String::from("文件句柄"),
        };
        let r2 = Resource {
            name: String::from("网络连接"),
        };
        
        println!("在作用域内: {:?}, {:?}", r1.name, r2.name);
    }
    println!("离开作用域后，资源自动释放");
    
    // ==================== Drop 与智能指针 ====================
    println!("\n=== Drop 与智能指针 ===");
    
    use std::rc::Rc;
    use std::sync::{Arc, Mutex};
    use std::thread;
    
    // Rc 的 Drop
    let rc1 = Rc::new(String::from("共享数据"));
    let rc2 = Rc::clone(&rc1);
    
    println!("Rc 引用计数: {}", Rc::strong_count(&rc1));
    drop(rc2);
    println!("drop rc2 后引用计数: {}", Rc::strong_count(&rc1));
    
    // ==================== Drop 与错误处理 ====================
    println!("\n=== Drop 与错误处理 ===");
    
    struct DatabaseConnection {
        name: String,
    }
    
    impl Drop for DatabaseConnection {
        fn drop(&mut self) {
            println!("关闭数据库连接: {}", self.name);
        }
    }
    
    impl DatabaseConnection {
        fn execute(&self, query: &str) -> Result<String, String> {
            if query.contains("error") {
                Err(String::from("查询错误"))
            } else {
                Ok(format!("执行: {}", query))
            }
        }
    }
    
    {
        let conn = DatabaseConnection {
            name: String::from("主数据库"),
        };
        
        match conn.execute("SELECT * FROM users") {
            Ok(result) => println!("成功: {}", result),
            Err(e) => println!("失败: {}", e),
        }
    }
    println!("连接已关闭");
    
    // ==================== Drop 与 RAII ====================
    println!("\n=== Drop 与 RAII ===");
    
    struct Lock {
        name: String,
    }
    
    impl Lock {
        fn new(name: &str) -> Self {
            println!("获取锁: {}", name);
            Lock {
                name: name.to_string(),
            }
        }
        
        fn execute(&self, f: impl FnOnce()) {
            println!("在锁内执行: {}", self.name);
            f();
        }
    }
    
    impl Drop for Lock {
        fn drop(&mut self) {
            println!("释放锁: {}", self.name);
        }
    }
    
    {
        let lock = Lock::new("互斥锁");
        lock.execute(|| {
            println!("执行临界区代码");
        });
    }
    println!("锁已自动释放");
    
    // ==================== Drop 与资源管理 ====================
    println!("\n=== Drop 与资源管理 ===");
    
    struct TempFile {
        path: String,
    }
    
    impl TempFile {
        fn new(path: &str) -> Self {
            println!("创建临时文件: {}", path);
            // 实际应用中会创建文件
            TempFile {
                path: path.to_string(),
            }
        }
        
        fn write(&self, data: &str) {
            println!("写入文件 {}: {}", self.path, data);
        }
    }
    
    impl Drop for TempFile {
        fn drop(&mut self) {
            println!("删除临时文件: {}", self.path);
            // 实际应用中会删除文件
        }
    }
    
    {
        let file = TempFile::new("/tmp/test.txt");
        file.write("Hello, World!");
    }
    println!("临时文件已自动删除");
    
    // ==================== Drop 与性能 ====================
    println!("\n=== Drop 与性能 ===");
    
    struct Buffer {
        data: Vec<u8>,
    }
    
    impl Buffer {
        fn new(size: usize) -> Self {
            println!("分配 {} 字节缓冲区", size);
            Buffer {
                data: vec![0; size],
            }
        }
    }
    
    impl Drop for Buffer {
        fn drop(&mut self) {
            println!("释放 {} 字节缓冲区", self.data.len());
        }
    }
    
    {
        let buffer = Buffer::new(1024);
        println!("使用缓冲区");
    }
    println!("缓冲区已释放");
    
    // ==================== Drop 与自定义清理 ====================
    println!("\n=== Drop 与自定义清理 ===");
    
    struct Cache {
        data: std::collections::HashMap<String, String>,
        name: String,
    }
    
    impl Cache {
        fn new(name: &str) -> Self {
            println!("创建缓存: {}", name);
            Cache {
                data: std::collections::HashMap::new(),
                name: name.to_string(),
            }
        }
        
        fn set(&mut self, key: &str, value: &str) {
            self.data.insert(key.to_string(), value.to_string());
        }
        
        fn get(&self, key: &str) -> Option<&str> {
            self.data.get(key).map(|s| s.as_str())
        }
    }
    
    impl Drop for Cache {
        fn drop(&mut self) {
            println!("清理缓存: {} ({} 个条目)", self.name, self.data.len());
            // 实际应用中会清理缓存
        }
    }
    
    {
        let mut cache = Cache::new("用户缓存");
        cache.set("user:1", "Alice");
        cache.set("user:2", "Bob");
        
        if let Some(user) = cache.get("user:1") {
            println!("获取用户: {}", user);
        }
    }
    println!("缓存已清理");
    
    // ==================== Drop 与线程 ====================
    println!("\n=== Drop 与线程 ===");
    
    struct ThreadPool {
        name: String,
    }
    
    impl ThreadPool {
        fn new(name: &str, size: usize) -> Self {
            println!("创建线程池: {} ({} 个线程)", name, size);
            ThreadPool {
                name: name.to_string(),
            }
        }
    }
    
    impl Drop for ThreadPool {
        fn drop(&mut self) {
            println!("关闭线程池: {}", self.name);
            // 实际应用中会等待所有任务完成并关闭线程
        }
    }
    
    {
        let pool = ThreadPool::new("工作线程池", 4);
        println!("使用线程池执行任务");
    }
    println!("线程池已关闭");
    
    println!("\nDrop Trait 详解演示完成!");
}

// ============================================
// 编译和运行方法：
// 
// Windows:
//   rustc 01_drop_trait.rs -o 01_drop_trait.exe
//   01_drop_trait.exe
//
// Linux/macOS:
//   rustc 01_drop_trait.rs -o 01_drop_trait
//   ./01_drop_trait
// ============================================
