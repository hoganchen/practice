// ============================================================
// Rust 知识点：关联类型与泛型关联类型（GAT）
// 编译：rustc 002_associated_types_gats.rs && .\002_associated_types_gats.exe
// ============================================================

// ========== 关联类型基础 ==========
trait Iterator {
    type Item; // 关联类型

    fn next(&mut self) -> Option<Self::Item>;
}

struct Counter {
    count: u32,
    max: u32,
}

impl Iterator for Counter {
    type Item = u32;

    fn next(&mut self) -> Option<u32> {
        if self.count < self.max {
            self.count += 1;
            Some(self.count)
        } else {
            None
        }
    }
}

// ========== 泛型关联类型（GAT） ==========
// Rust 1.65+：关联类型也可以是泛型的

trait Container {
    // GAT：Item<'a> 是带生命周期参数的关联类型
    type Item<'a>
    where
        Self: 'a;

    fn get<'a>(&'a self, index: usize) -> Option<Self::Item<'a>>;
}

// 实现 GAT
struct MyVec<T>(Vec<T>);

impl<T: Clone> Container for MyVec<T> {
    type Item<'a> = T where Self: 'a;

    fn get<'a>(&'a self, index: usize) -> Option<T> {
        self.0.get(index).cloned()
    }
}

// ---- GAT 的另一个例子：借用迭代器 ----
trait LendingIterator {
    type Item<'a>
    where
        Self: 'a;

    fn next<'a>(&'a mut self) -> Option<Self::Item<'a>>;
}

struct Chunks<'a, T> {
    data: &'a [T],
    size: usize,
}

impl<'a, T> LendingIterator for Chunks<'a, T> {
    type Item<'b> = &'b [T] where Self: 'b;

    fn next<'b>(&'b mut self) -> Option<&'b [T]> {
        if self.data.is_empty() {
            return None;
        }
        let chunk = &self.data[..self.data.len().min(self.size)];
        self.data = &self.data[chunk.len()..];
        Some(chunk)
    }
}

fn main() {
    // ---- 关联类型使用 ----
    let mut counter = Counter { count: 0, max: 5 };
    while let Some(val) = counter.next() {
        print!("{} ", val);
    }
    println!();

    // ---- GAT 使用 ----
    let my_vec = MyVec(vec![1, 2, 3, 4, 5]);
    if let Some(val) = my_vec.get(2) {
        println!("GAT get: {}", val);
    }

    // ---- LendingIterator ----
    let data = vec![1, 2, 3, 4, 5, 6];
    let mut chunks = Chunks {
        data: &data,
        size: 2,
    };

    print!("Chunks: ");
    while let Some(chunk) = chunks.next() {
        print!("{:?} ", chunk);
    }
    println!();
}
