// ============================================
// 知识点：PhantomData
// 难度：高级
// ============================================

// PhantomData 是一个零大小类型，用于标记类型系统中的关系
// 常用于泛型约束和生命周期标记

use std::marker::PhantomData;

fn main() {
    // ==================== 基础 PhantomData ====================
    println!("=== 基础 PhantomData ===");
    
    // PhantomData 用于标记泛型参数
    struct Marker<T> {
        _phantom: PhantomData<T>,
    }
    
    let _marker: Marker<i32> = Marker {
        _phantom: PhantomData,
    };
    
    println!("PhantomData 创建成功");
    
    // ==================== PhantomData 与所有权 ====================
    println!("\n=== PhantomData 与所有权 ===");
    
    struct Foo<'a> {
        _phantom: PhantomData<&'a ()>,
    }
    
    let foo: Foo<'_> = Foo {
        _phantom: PhantomData,
    };
    
    println!("带生命周期的 PhantomData 创建成功");
    
    // ==================== PhantomData 与类型状态 ====================
    println!("\n=== PhantomData 与类型状态 ===");
    
    // 类型状态模式：使用类型系统表示状态
    struct Locked;
    struct Unlocked;
    
    struct Door<State> {
        _state: PhantomData<State>,
    }
    
    impl Door<Locked> {
        fn new() -> Self {
            Door {
                _state: PhantomData,
            }
        }
        
        fn unlock(self) -> Door<Unlocked> {
            println!("门已解锁");
            Door {
                _state: PhantomData,
            }
        }
    }
    
    impl Door<Unlocked> {
        fn open(&self) {
            println!("门已打开");
        }
        
        fn lock(self) -> Door<Locked> {
            println!("门已上锁");
            Door {
                _state: PhantomData,
            }
        }
    }
    
    let door = Door::<Locked>::new();
    let door = door.unlock();
    door.open();
    let _door = door.lock();
    
    // ==================== PhantomData 与类型安全 ====================
    println!("\n=== PhantomData 与类型安全 ===");
    
    struct Meters;
    struct Kilometers;
    
    struct Distance<Unit> {
        value: f64,
        _unit: PhantomData<Unit>,
    }
    
    impl<Unit> Distance<Unit> {
        fn new(value: f64) -> Self {
            Distance {
                value,
                _unit: PhantomData,
            }
        }
    }
    
    impl Distance<Meters> {
        fn to_kilometers(&self) -> Distance<Kilometers> {
            Distance::new(self.value / 1000.0)
        }
    }
    
    impl Distance<Kilometers> {
        fn to_meters(&self) -> Distance<Meters> {
            Distance::new(self.value * 1000.0)
        }
    }
    
    let meters = Distance::<Meters>::new(5000.0);
    let kilometers = meters.to_kilometers();
    
    println!("5000 米 = {} 公里", kilometers.value);
    
    let meters = kilometers.to_meters();
    println!("5 公里 = {} 米", meters.value);
    
    // ==================== PhantomData 与泛型约束 ====================
    println!("\n=== PhantomData 与泛型约束 ===");
    
    struct Container<T> {
        data: Vec<T>,
        _marker: PhantomData<T>,
    }
    
    impl<T: Clone> Container<T> {
        fn new() -> Self {
            Container {
                data: Vec::new(),
                _marker: PhantomData,
            }
        }
        
        fn add(&mut self, item: T) {
            self.data.push(item);
        }
        
        fn get_all(&self) -> Vec<T> {
            self.data.clone()
        }
    }
    
    let mut container = Container::new();
    container.add(1);
    container.add(2);
    container.add(3);
    
    let items = container.get_all();
    println!("容器内容: {:?}", items);
    
    // ==================== PhantomData 与迭代器 ====================
    println!("\n=== PhantomData 与迭代器 ===");
    
    struct MyIterator<T> {
        data: Vec<T>,
        index: usize,
        _marker: PhantomData<T>,
    }
    
    impl<T: Clone> MyIterator<T> {
        fn new(data: Vec<T>) -> Self {
            MyIterator {
                data,
                index: 0,
                _marker: PhantomData,
            }
        }
    }
    
    impl<T: Clone> Iterator for MyIterator<T> {
        type Item = T;
        
        fn next(&mut self) -> Option<Self::Item> {
            if self.index < self.data.len() {
                let item = self.data[self.index].clone();
                self.index += 1;
                Some(item)
            } else {
                None
            }
        }
    }
    
    let data = vec![1, 2, 3, 4, 5];
    let iter = MyIterator::new(data);
    
    let result: Vec<i32> = iter.filter(|x| x % 2 == 0).collect();
    println!("偶数: {:?}", result);
    
    // ==================== PhantomData 与模式匹配 ====================
    println!("\n=== PhantomData 与模式匹配 ===");
    
    enum Shape {
        Circle(f64),
        Rectangle(f64, f64),
    }
    
    struct TypedShape<T> {
        shape: Shape,
        _marker: PhantomData<T>,
    }
    
    struct Area;
    struct Perimeter;
    
    impl TypedShape<Area> {
        fn calculate(&self) -> f64 {
            match &self.shape {
                Shape::Circle(r) => std::f64::consts::PI * r * r,
                Shape::Rectangle(w, h) => w * h,
            }
        }
    }
    
    impl TypedShape<Perimeter> {
        fn calculate(&self) -> f64 {
            match &self.shape {
                Shape::Circle(r) => 2.0 * std::f64::consts::PI * r,
                Shape::Rectangle(w, h) => 2.0 * (w + h),
            }
        }
    }
    
    let circle = TypedShape::<Area> {
        shape: Shape::Circle(5.0),
        _marker: PhantomData,
    };
    
    println!("圆面积: {:.2}", circle.calculate());
    
    let circle = TypedShape::<Perimeter> {
        shape: Shape::Circle(5.0),
        _marker: PhantomData,
    };
    
    println!("圆周长: {:.2}", circle.calculate());
    
    // ==================== PhantomData 与错误处理 ====================
    println!("\n=== PhantomData 与错误处理 ===");
    
    struct Success;
    struct Error;
    
    struct Result<T, E> {
        value: Option<T>,
        error: Option<E>,
        _marker: PhantomData<(T, E)>,
    }
    
    impl<T, E> Result<T, E> {
        fn ok(value: T) -> Self {
            Result {
                value: Some(value),
                error: None,
                _marker: PhantomData,
            }
        }
        
        fn err(error: E) -> Self {
            Result {
                value: None,
                error: Some(error),
                _marker: PhantomData,
            }
        }
    }
    
    let result: Result<i32, String> = Result::ok(42);
    println!("成功: {:?}", result.value);
    
    let result: Result<i32, String> = Result::err(String::from("错误"));
    println!("失败: {:?}", result.error);
    
    // ==================== 实际应用 ====================
    println!("\n=== 实际应用 ===");
    
    // 类型安全的 ID
    struct UserId;
    struct ProductId;
    
    struct Id<T> {
        value: u64,
        _marker: PhantomData<T>,
    }
    
    impl<T> Id<T> {
        fn new(value: u64) -> Self {
            Id {
                value,
                _marker: PhantomData,
            }
        }
    }
    
    fn get_user(id: Id<UserId>) -> String {
        format!("用户 {}", id.value)
    }
    
    fn get_product(id: Id<ProductId>) -> String {
        format!("产品 {}", id.value)
    }
    
    let user_id = Id::<UserId>::new(1);
    let product_id = Id::<ProductId>::new(100);
    
    println!("{}", get_user(user_id));
    println!("{}", get_product(product_id));
    // println!("{}", get_user(product_id));  // 编译错误：类型不匹配
    
    println!("\nPhantomData 演示完成!");
}

// ============================================
// 编译和运行方法：
// 
// Windows:
//   rustc 01_phantom_data.rs -o 01_phantom_data.exe
//   01_phantom_data.exe
//
// Linux/macOS:
//   rustc 01_phantom_data.rs -o 01_phantom_data
//   ./01_phantom_data
// ============================================
