// ============================================================
// Rust 知识点：PhantomData —— 幻影类型参数
// 用于类型状态、所有权标记、生命周期约束
// 编译：rustc 003_phantomdata.rs && .\003_phantomdata.exe
// ============================================================

use std::marker::PhantomData;

// ========== 1. 使用 PhantomData 表示所有权关系 ==========
// 在原始指针包装器中标记所有权
struct MyBox<T> {
    ptr: *mut T,
    _marker: PhantomData<T>, // 告诉编译器我们拥有一个 T
}

impl<T> MyBox<T> {
    fn new(val: T) -> Self {
        MyBox {
            ptr: Box::into_raw(Box::new(val)),
            _marker: PhantomData,
        }
    }

    fn get(&self) -> &T {
        unsafe { &*self.ptr }
    }
}

impl<T> Drop for MyBox<T> {
    fn drop(&mut self) {
        unsafe {
            let _ = Box::from_raw(self.ptr);
        }
    }
}

// ========== 2. PhantomData 与协变/逆变/不变 ==========
// 更安全的迭代器包装器
struct SliceIter<'a, T> {
    data: *const T,
    len: usize,
    _marker: PhantomData<&'a T>, // 与生命周期 'a 协变
}

impl<'a, T> SliceIter<'a, T> {
    fn new(slice: &'a [T]) -> Self {
        SliceIter {
            data: slice.as_ptr(),
            len: slice.len(),
            _marker: PhantomData,
        }
    }

    fn next(&mut self) -> Option<&'a T> {
        if self.len == 0 {
            None
        } else {
            let val = unsafe { &*self.data };
            self.data = unsafe { self.data.add(1) };
            self.len -= 1;
            Some(val)
        }
    }
}

// ========== 3. 类型状态模式 ==========
// 编译时强制执行操作顺序
struct Door<State> {
    _state: PhantomData<State>,
}

struct Open;
struct Closed;
struct Locked;

impl Door<Closed> {
    fn new() -> Self {
        Door {
            _state: PhantomData,
        }
    }

    fn open(self) -> Door<Open> {
        println!("开门");
        Door {
            _state: PhantomData,
        }
    }

    fn lock(self) -> Door<Locked> {
        println!("锁门");
        Door {
            _state: PhantomData,
        }
    }
}

impl Door<Open> {
    fn close(self) -> Door<Closed> {
        println!("关门");
        Door {
            _state: PhantomData,
        }
    }
}

impl Door<Locked> {
    fn unlock(self) -> Door<Closed> {
        println!("解锁");
        Door {
            _state: PhantomData,
        }
    }
}

// ========== 4. PhantomData 一致性 ==========
struct ForeignWrapper<T> {
    // 持有外部资源的句柄，用于 Drop
    handle: i32,
    _marker: PhantomData<T>,
}

impl<T> ForeignWrapper<T> {
    fn new(handle: i32) -> Self {
        ForeignWrapper {
            handle,
            _marker: PhantomData,
        }
    }
}

fn main() {
    // ---- PhantomData 所有权标记 ----
    let my_box = MyBox::new(42);
    println!("PhantomData 所有权: {}", my_box.get());

    // ---- 迭代器生命周期 ----
    let arr = [10, 20, 30, 40, 50];
    let mut iter = SliceIter::new(&arr);
    while let Some(val) = iter.next() {
        print!("{} ", val);
    }
    println!("(迭代器安全)");

    // ---- 类型状态模式 ----
    let door = Door::<Closed>::new();
    // door.close(); // 编译错误！Closed 门不能 close
    let door = door.open();
    // door.open(); // 编译错误！Open 门不能 open
    let door = door.close();
    let door = door.lock();
    // door.lock(); // 编译错误！Locked 门不能 lock
    let _door = door.unlock();
    println!("门状态转换成功");

    // ---- PhantomData 大小 ----
    println!("\nPhantomData 的大小: {} 字节", std::mem::size_of::<PhantomData<i32>>()); // 0
    println!("MyBox 的大小: {} 字节", std::mem::size_of::<MyBox<i32>>());
}
