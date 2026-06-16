// ============================================
// 知识点：智能指针
// 难度：高级
// ============================================

// 智能指针是像指针一样的数据结构
// 但具有额外的元数据和功能

use std::cell::RefCell;
use std::mem;
use std::ops::Deref;
use std::rc::Rc;
use std::sync::{Arc, Mutex};
use std::thread;

fn main() {
    // ==================== Box<T>：堆分配 ====================
    // Box 允许将值存储在堆上而不是栈上
    
    let boxed = Box::new(5);
    println!("Box 值: {}", boxed);
    println!("Box 大小: {} 字节", mem::size_of::<Box<i32>>());
    
    // Box 用于递归类型
    enum List {
        Cons(i32, Box<List>),
        Nil,
    }
    
    let list = List::Cons(1, Box::new(List::Cons(2, Box::new(List::Nil))));
    
    // 遍历列表
    fn print_list(list: &List) {
        match list {
            List::Cons(value, next) => {
                print!("{} -> ", value);
                print_list(next);
            }
            List::Nil => println!("Nil"),
        }
    }
    
    print!("列表: ");
    print_list(&list);
    println!();
    
    // Box 与 trait 对象
    trait Animal {
        fn speak(&self) -> &str;
    }
    
    struct Dog;
    struct Cat;
    
    impl Animal for Dog {
        fn speak(&self) -> &str {
            "汪汪!"
        }
    }
    
    impl Animal for Cat {
        fn speak(&self) -> &str {
            "喵喵!"
        }
    }
    
    let animals: Vec<Box<dyn Animal>> = vec![Box::new(Dog), Box::new(Cat)];
    
    for animal in &animals {
        println!("动物说话: {}", animal.speak());
    }
    
    // ==================== Rc<T>：引用计数 ====================
    // Rc 允许多个所有者共享数据
    
    let shared_data = Rc::new(String::from("共享数据"));
    println!("引用计数: {}", Rc::strong_count(&shared_data));
    
    let clone1 = Rc::clone(&shared_data);
    println!("克隆后引用计数: {}", Rc::strong_count(&shared_data));
    
    let clone2 = Rc::clone(&shared_data);
    println!("再次克隆后引用计数: {}", Rc::strong_count(&shared_data));
    
    println!("数据: {}", shared_data);
    println!("克隆1: {}", clone1);
    println!("克隆2: {}", clone2);
    
    drop(clone2);
    println!("drop clone2 后引用计数: {}", Rc::strong_count(&shared_data));
    
    drop(clone1);
    println!("drop clone1 后引用计数: {}", Rc::strong_count(&shared_data));
    
    // Rc 与共享所有权
    enum SharedList {
        Cons(Rc<String>, Rc<SharedList>),
        Nil,
    }
    
    let shared_value = Rc::new(String::from("共享值"));
    
    let list_a = SharedList::Cons(
        Rc::clone(&shared_value),
        Rc::new(SharedList::Nil),
    );
    
    let list_b = SharedList::Cons(
        Rc::clone(&shared_value),
        Rc::new(SharedList::Nil),
    );
    
    println!("list_a 和 list_b 共享相同的值: {}", shared_value);
    
    // ==================== RefCell<T>：内部可变性 ====================
    // RefCell 允许在运行时进行借用检查
    
    let data = RefCell::new(vec![1, 2, 3]);
    
    // 不可变借用
    {
        let borrowed = data.borrow();
        println!("数据: {:?}", borrowed);
    }
    
    // 可变借用
    {
        let mut borrowed_mut = data.borrow_mut();
        borrowed_mut.push(4);
        println!("修改后: {:?}", borrowed_mut);
    }
    
    println!("最终数据: {:?}", data.borrow());
    
    // Rc 与 RefCell 结合使用
    let shared_vec = Rc::new(RefCell::new(vec![1, 2, 3]));
    
    let clone1 = Rc::clone(&shared_vec);
    let clone2 = Rc::clone(&shared_vec);
    
    // 通过 clone1 修改
    clone1.borrow_mut().push(4);
    
    // 通过 clone2 读取
    println!("通过 clone2 读取: {:?}", clone2.borrow());
    
    // ==================== 循环引用 ====================
    // Rc 与 RefCell 结合使用时可能出现循环引用
    
    #[derive(Debug)]
    enum RefList {
        Cons(Rc<RefCell<i32>>, Rc<RefList>),
        Nil,
    }
    
    use RefList::{Cons, Nil};
    
    let shared = Rc::new(RefCell::new(1));
    let list = Rc::new(Cons(Rc::clone(&shared), Rc::new(Nil)));
    
    println!("列表值: {:?}", list);
    
    // ==================== Weak<T>：弱引用 ====================
    // Weak 是 Rc 的弱引用版本，不增加引用计数
    
    use std::cell::RefCell;
    use std::rc::Weak;
    
    #[derive(Debug)]
    struct Node {
        value: i32,
        children: RefCell<Vec<Rc<Node>>>,
        parent: RefCell<Weak<Node>>,
    }
    
    let leaf = Rc::new(Node {
        value: 3,
        children: RefCell::new(vec![]),
        parent: RefCell::new(Weak::new()),
    });
    
    let branch = Rc::new(Node {
        value: 5,
        children: RefCell::new(vec![Rc::clone(&leaf)]),
        parent: RefCell::new(Weak::new()),
    });
    
    // 设置 leaf 的 parent 为 branch 的弱引用
    *leaf.parent.borrow_mut() = Rc::downgrade(&branch);
    
    println!("branch: {:?}", branch);
    println!("leaf: {:?}", leaf);
    
    // 通过弱引用访问 parent
    if let Some(parent) = leaf.parent.borrow().upgrade() {
        println!("leaf 的 parent 值: {}", parent.value);
    }
    
    // ==================== Cell<T>：Copy 类型的内部可变性 ====================
    let cell = Cell::new(42);
    println!("Cell 值: {}", cell.get());
    
    cell.set(100);
    println!("修改后: {}", cell.get());
    
    // ==================== Arc<T>：原子引用计数 ====================
    // Arc 是线程安全的 Rc
    
    let arc_data = Arc::new(vec![1, 2, 3, 4, 5]);
    let mut handles = vec![];
    
    for i in 0..3 {
        let data = Arc::clone(&arc_data);
        let handle = thread::spawn(move || {
            println!("线程 {} 看到数据: {:?}", i, data);
        });
        handles.push(handle);
    }
    
    for handle in handles {
        handle.join().unwrap();
    }
    
    // ==================== Arc + Mutex ====================
    // 在多线程环境中共享可变数据
    
    let counter = Arc::new(Mutex::new(0));
    let mut handles = vec![];
    
    for _ in 0..10 {
        let counter = Arc::clone(&counter);
        let handle = thread::spawn(move || {
            let mut num = counter.lock().unwrap();
            *num += 1;
        });
        handles.push(handle);
    }
    
    for handle in handles {
        handle.join().unwrap();
    }
    
    println!("计数器: {}", *counter.lock().unwrap());
    
    // ==================== Arc + RwLock ====================
    // 读写锁允许多个读取者或一个写入者
    
    use std::sync::RwLock;
    
    let data = Arc::new(RwLock::new(vec![1, 2, 3]));
    let mut handles = vec![];
    
    // 读取者
    for i in 0..3 {
        let data = Arc::clone(&data);
        let handle = thread::spawn(move || {
            let read_data = data.read().unwrap();
            println!("读取者 {} 看到: {:?}", i, *read_data);
        });
        handles.push(handle);
    }
    
    // 写入者
    {
        let data = Arc::clone(&data);
        let handle = thread::spawn(move || {
            let mut write_data = data.write().unwrap();
            write_data.push(4);
            println!("写入者修改后: {:?}", *write_data);
        });
        handles.push(handle);
    }
    
    for handle in handles {
        handle.join().unwrap();
    }
    
    println!("最终数据: {:?}", *data.read().unwrap());
    
    // ==================== Deref trait ====================
    // 自定义智能指针
    
    struct MyBox<T>(T);
    
    impl<T> MyBox<T> {
        fn new(x: T) -> MyBox<T> {
            MyBox(x)
        }
    }
    
    impl<T> Deref for MyBox<T> {
        type Target = T;
        
        fn deref(&self) -> &T {
            &self.0
        }
    }
    
    let x = MyBox::new(5);
    println!("MyBox 值: {}", *x);  // 解引用
    
    // Deref 强制转换
    fn greet(name: &str) {
        println!("Hello, {}!", name);
    }
    
    let name = MyBox::new(String::from("Rust"));
    greet(&name);  // 自动解引用
    
    // ==================== Drop trait ====================
    // 自定义清理逻辑
    
    struct DatabaseConnection {
        name: String,
    }
    
    impl Drop for DatabaseConnection {
        fn drop(&mut self) {
            println!("关闭数据库连接: {}", self.name);
        }
    }
    
    {
        let _conn1 = DatabaseConnection {
            name: String::from("主数据库"),
        };
        let _conn2 = DatabaseConnection {
            name: String::from("备份数据库"),
        };
        println!("连接已创建");
    }
    // 在这里，_conn1 和 _conn2 被 drop
    
    println!("智能指针演示完成!");
}

// ============================================
// 编译和运行方法：
// 
// Windows:
//   rustc 01_smart_pointers.rs -o 01_smart_pointers.exe
//   01_smart_pointers.exe
//
// Linux/macOS:
//   rustc 01_smart_pointers.rs -o 01_smart_pointers
//   ./01_smart_pointers
// ============================================
