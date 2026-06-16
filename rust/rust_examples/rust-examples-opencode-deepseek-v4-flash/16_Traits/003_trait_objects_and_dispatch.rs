// ============================================================
// Rust 知识点：Trait 对象（动态分发）与静态分发
// 编译：rustc 003_trait_objects_and_dispatch.rs && .\003_trait_objects_and_dispatch.exe
// ============================================================

// ---- 定义 trait ----
trait Animal {
    fn make_sound(&self) -> String;
    fn name(&self) -> String;
}

// ---- 实现者 ----
struct Dog {
    name: String,
}

impl Animal for Dog {
    fn make_sound(&self) -> String {
        "汪汪！".to_string()
    }
    fn name(&self) -> String {
        self.name.clone()
    }
}

struct Cat {
    name: String,
}

impl Animal for Cat {
    fn make_sound(&self) -> String {
        "喵喵！".to_string()
    }
    fn name(&self) -> String {
        self.name.clone()
    }
}

// ========== 静态分发（Static Dispatch） ==========
// 编译时确定具体类型，零开销抽象
fn animal_sound_static<T: Animal>(animal: &T) {
    println!("{} 发出: {}", animal.name(), animal.make_sound());
}

// ========== 动态分发（Dynamic Dispatch） ==========
// 运行时确定具体类型，通过虚函数表（vtable）
fn animal_sound_dynamic(animal: &dyn Animal) {
    println!("{} 发出: {}", animal.name(), animal.make_sound());
}

// ========== Box<dyn Trait> ==========
// 在堆上分配 trait 对象，允许不同类型混合
fn get_animal(kind: &str) -> Box<dyn Animal> {
    match kind {
        "dog" => Box::new(Dog {
            name: String::from("旺财"),
        }),
        "cat" => Box::new(Cat {
            name: String::from("咪咪"),
        }),
        _ => Box::new(Dog {
            name: String::from("默认狗狗"),
        }),
    }
}

// ========== 对象安全（Object Safety） ==========
// 只有对象安全的 trait 才能用于 &dyn Trait 或 Box<dyn Trait>
// 规则：
//   1. 返回值不能是 Self
//   2. 方法不能有泛型参数
//   3. 不能是 Sized 的 supertrait

// 对象安全的 trait
trait ObjectSafe {
    fn method(&self) -> String; // 没有问题
}

// 非对象安全的 trait
// trait NotObjectSafe {
//     fn returns_self() -> Self;          // 不允许
//     fn generic<T>(&self, val: T);       // 不允许
// }

fn main() {
    let dog = Dog {
        name: String::from("旺财"),
    };
    let cat = Cat {
        name: String::from("咪咪"),
    };

    // 静态分发
    println!("=== 静态分发 ===");
    animal_sound_static(&dog);
    animal_sound_static(&cat);

    // 动态分发
    println!("\n=== 动态分发 ===");
    animal_sound_dynamic(&dog);
    animal_sound_dynamic(&cat);

    // 混合类型集合
    println!("\n=== 混合类型集合 ===");
    let animals: Vec<Box<dyn Animal>> = vec![
        Box::new(Dog {
            name: String::from("大黄"),
        }),
        Box::new(Cat {
            name: String::from("小花"),
        }),
    ];

    for animal in animals {
        println!("{} 发出: {}", animal.name(), animal.make_sound());
    }

    // 工厂函数
    println!("\n=== 工厂函数 ===");
    let pet = get_animal("cat");
    println!("{}", pet.make_sound());
}
