// ============================================================
// Rust 知识点：Cell 和 RefCell —— 内部可变性
// 通过运行时借用检查实现不可变引用下的可变操作
// 编译：rustc 003_cell_refcell.rs && .\003_cell_refcell.exe
// ============================================================

use std::cell::{Cell, RefCell};

// ========== Cell<T>（适用于 Copy 类型） ==========
// 通过 set/get 方法操作值，零运行时开销
struct Counter {
    count: Cell<i32>, // Cell 允许在 &self 下修改
}

impl Counter {
    fn new(initial: i32) -> Self {
        Counter {
            count: Cell::new(initial),
        }
    }

    fn increment(&self) {
        self.count.set(self.count.get() + 1); // 通过 Cell 修改
    }

    fn get(&self) -> i32 {
        self.count.get()
    }
}

// ========== RefCell<T>（适用于非 Copy 类型） ==========
// 运行时借用检查（改为编译时借用检查）
// 违反规则会在运行时 panic

struct Messenger {
    messages: RefCell<Vec<String>>,
}

impl Messenger {
    fn new() -> Self {
        Messenger {
            messages: RefCell::new(vec![]),
        }
    }

    // 虽然 &self 不可变，但可以修改 RefCell 内部数据
    fn send(&self, msg: &str) {
        self.messages.borrow_mut().push(msg.to_string());
    }

    fn read_all(&self) {
        for msg in self.messages.borrow().iter() {
            println!("消息: {}", msg);
        }
    }
}

// ========== Rc<RefCell<T>>：共享可变数据 ==========
use std::rc::Rc;

#[derive(Debug)]
struct Node {
    value: i32,
    children: RefCell<Vec<Rc<Node>>>,
}

impl Node {
    fn new(value: i32) -> Rc<Node> {
        Rc::new(Node {
            value,
            children: RefCell::new(vec![]),
        })
    }

    fn add_child(parent: &Rc<Node>, child: Rc<Node>) {
        parent.children.borrow_mut().push(child);
    }
}

fn main() {
    // ---- Cell 示例 ----
    let counter = Counter::new(0);
    counter.increment();
    counter.increment();
    counter.increment();
    println!("Cell 计数器: {}", counter.get());

    // ---- RefCell 示例 ----
    let messenger = Messenger::new();
    messenger.send("你好");
    messenger.send("世界");
    messenger.send("Rust");
    messenger.read_all();

    // ---- 运行时借用检查 ----
    let ref_cell = RefCell::new(vec![1, 2, 3]);

    // 正确用法
    {
        let mut borrow = ref_cell.borrow_mut();
        borrow.push(4);
    } // 借用结束

    let borrow = ref_cell.borrow();
    println!("RefCell: {:?}", borrow);

    // 错误用法（运行时 panic）：
    // let mut b1 = ref_cell.borrow_mut();
    // let mut b2 = ref_cell.borrow_mut(); // 运行时 panic！

    // ---- Rc<RefCell<T>>：树形结构 ----
    let root = Node::new(1);
    let child1 = Node::new(2);
    let child2 = Node::new(3);

    Node::add_child(&root, child1);
    Node::add_child(&root, child2);

    println!("树形结构: {:?}", root);
}
