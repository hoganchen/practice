// ============================================
// 知识点：设计模式
// 难度：高级
// ============================================

// Rust 中的设计模式
// 包括创建型、结构型和行为型模式

use std::cell::RefCell;
use std::rc::Rc;

fn main() {
    println!("=== Rust 设计模式 ===");
    
    // ==================== 构建者模式 ====================
    println!("\n=== 构建者模式 ===");
    
    #[derive(Debug)]
    struct Server {
        host: String,
        port: u16,
        max_connections: u32,
        timeout: u64,
    }
    
    struct ServerBuilder {
        host: String,
        port: u16,
        max_connections: u32,
        timeout: u64,
    }
    
    impl ServerBuilder {
        fn new(host: &str, port: u16) -> Self {
            ServerBuilder {
                host: host.to_string(),
                port,
                max_connections: 100,
                timeout: 30,
            }
        }
        
        fn max_connections(mut self, max: u32) -> Self {
            self.max_connections = max;
            self
        }
        
        fn timeout(mut self, timeout: u64) -> Self {
            self.timeout = timeout;
            self
        }
        
        fn build(self) -> Server {
            Server {
                host: self.host,
                port: self.port,
                max_connections: self.max_connections,
                timeout: self.timeout,
            }
        }
    }
    
    let server = ServerBuilder::new("localhost", 8080)
        .max_connections(200)
        .timeout(60)
        .build();
    
    println!("服务器: {:?}", server);
    
    // ==================== 工厂模式 ====================
    println!("\n=== 工厂模式 ===");
    
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
    
    enum AnimalType {
        Dog,
        Cat,
    }
    
    fn create_animal(animal_type: AnimalType) -> Box<dyn Animal> {
        match animal_type {
            AnimalType::Dog => Box::new(Dog),
            AnimalType::Cat => Box::new(Cat),
        }
    }
    
    let animals = vec![
        create_animal(AnimalType::Dog),
        create_animal(AnimalType::Cat),
        create_animal(AnimalType::Dog),
    ];
    
    for animal in &animals {
        println!("动物说话: {}", animal.speak());
    }
    
    // ==================== 单例模式 ====================
    println!("\n=== 单例模式 ===");
    
    use std::sync::Mutex;
    
    struct Config {
        database_url: String,
        server_port: u16,
    }
    
    static CONFIG: Mutex<Option<Config>> = Mutex::new(None);
    
    fn init_config(database_url: &str, server_port: u16) {
        let mut config = CONFIG.lock().unwrap();
        *config = Some(Config {
            database_url: database_url.to_string(),
            server_port,
        });
    }
    
    fn get_config() -> Option<(String, u16)> {
        let config = CONFIG.lock().unwrap();
        config.as_ref().map(|c| (c.database_url.clone(), c.server_port))
    }
    
    init_config("localhost:5432", 8080);
    
    if let Some((url, port)) = get_config() {
        println!("配置: {}:{} ", url, port);
    }
    
    // ==================== 观察者模式 ====================
    println!("\n=== 观察者模式 ===");
    
    trait Observer {
        fn update(&self, event: &str);
    }
    
    struct EventEmitter {
        observers: Vec<Box<dyn Observer>>,
    }
    
    impl EventEmitter {
        fn new() -> Self {
            EventEmitter {
                observers: Vec::new(),
            }
        }
        
        fn subscribe(&mut self, observer: Box<dyn Observer>) {
            self.observers.push(observer);
        }
        
        fn emit(&self, event: &str) {
            for observer in &self.observers {
                observer.update(event);
            }
        }
    }
    
    struct Logger;
    
    impl Observer for Logger {
        fn update(&self, event: &str) {
            println!("[LOG] 事件: {}", event);
        }
    }
    
    struct Notifier;
    
    impl Observer for Notifier {
        fn update(&self, event: &str) {
            println!("[NOTIFY] 事件: {}", event);
        }
    }
    
    let mut emitter = EventEmitter::new();
    emitter.subscribe(Box::new(Logger));
    emitter.subscribe(Box::new(Notifier));
    
    emitter.emit("用户登录");
    emitter.emit("数据更新");
    
    // ==================== 策略模式 ====================
    println!("\n=== 策略模式 ===");
    
    trait SortStrategy {
        fn sort(&self, data: &mut Vec<i32>);
    }
    
    struct BubbleSort;
    
    impl SortStrategy for BubbleSort {
        fn sort(&self, data: &mut Vec<i32>) {
            let len = data.len();
            for i in 0..len {
                for j in 0..len - 1 - i {
                    if data[j] > data[j + 1] {
                        data.swap(j, j + 1);
                    }
                }
            }
            println!("冒泡排序完成");
        }
    }
    
    struct QuickSort;
    
    impl SortStrategy for QuickSort {
        fn sort(&self, data: &mut Vec<i32>) {
            data.sort();
            println!("快速排序完成");
        }
    }
    
    struct Sorter {
        strategy: Box<dyn SortStrategy>,
    }
    
    impl Sorter {
        fn new(strategy: Box<dyn SortStrategy>) -> Self {
            Sorter { strategy }
        }
        
        fn set_strategy(&mut self, strategy: Box<dyn SortStrategy>) {
            self.strategy = strategy;
        }
        
        fn sort(&self, data: &mut Vec<i32>) {
            self.strategy.sort(data);
        }
    }
    
    let mut data = vec![5, 2, 8, 1, 9, 3];
    println!("排序前: {:?}", data);
    
    let mut sorter = Sorter::new(Box::new(BubbleSort));
    sorter.sort(&mut data);
    println!("排序后: {:?}", data);
    
    let mut data = vec![5, 2, 8, 1, 9, 3];
    sorter.set_strategy(Box::new(QuickSort));
    sorter.sort(&mut data);
    println!("快速排序后: {:?}", data);
    
    // ==================== 装饰器模式 ====================
    println!("\n=== 装饰器模式 ===");
    
    trait Logger {
        fn log(&self, message: &str);
    }
    
    struct ConsoleLogger;
    
    impl Logger for ConsoleLogger {
        fn log(&self, message: &str) {
            println!("[CONSOLE] {}", message);
        }
    }
    
    struct FileLogger {
        logger: Box<dyn Logger>,
        prefix: String,
    }
    
    impl FileLogger {
        fn new(logger: Box<dyn Logger>, prefix: &str) -> Self {
            FileLogger {
                logger,
                prefix: prefix.to_string(),
            }
        }
    }
    
    impl Logger for FileLogger {
        fn log(&self, message: &str) {
            self.logger.log(&format!("{}: {}", self.prefix, message));
        }
    }
    
    let logger = FileLogger::new(Box::new(ConsoleLogger), "APP");
    logger.log("用户登录");
    
    // ==================== 迭代器模式 ====================
    println!("\n=== 迭代器模式 ===");
    
    struct Fibonacci {
        a: u64,
        b: u64,
    }
    
    impl Fibonacci {
        fn new() -> Self {
            Fibonacci { a: 0, b: 1 }
        }
    }
    
    impl Iterator for Fibonacci {
        type Item = u64;
        
        fn next(&mut self) -> Option<Self::Item> {
            let result = self.a;
            self.a = self.b;
            self.b = result + self.b;
            Some(result)
        }
    }
    
    let fibs: Vec<u64> = Fibonacci::new().take(10).collect();
    println!("斐波那契数列: {:?}", fibs);
    
    // ==================== 代理模式 ====================
    println!("\n=== 代理模式 ===");
    
    trait Database {
        fn query(&self, sql: &str) -> Vec<String>;
    }
    
    struct RealDatabase;
    
    impl Database for RealDatabase {
        fn query(&self, sql: &str) -> Vec<String> {
            println!("执行查询: {}", sql);
            vec!["结果1".to_string(), "结果2".to_string()]
        }
    }
    
    struct CacheProxy {
        real_db: RealDatabase,
        cache: std::collections::HashMap<String, Vec<String>>,
    }
    
    impl CacheProxy {
        fn new() -> Self {
            CacheProxy {
                real_db: RealDatabase,
                cache: std::collections::HashMap::new(),
            }
        }
    }
    
    impl Database for CacheProxy {
        fn query(&self, sql: &str) -> Vec<String> {
            if let Some(cached) = self.cache.get(sql) {
                println!("从缓存获取: {}", sql);
                cached.clone()
            } else {
                println!("从数据库获取: {}", sql);
                self.real_db.query(sql)
            }
        }
    }
    
    // ==================== 状态模式 ====================
    println!("\n=== 状态模式 ===");
    
    struct TrafficLight {
        state: Box<dyn State>,
    }
    
    impl TrafficLight {
        fn new() -> Self {
            TrafficLight {
                state: Box::new(RedState),
            }
        }
        
        fn change(&mut self) {
            self.state.change(self);
        }
        
        fn state_name(&self) -> &str {
            self.state.name()
        }
    }
    
    trait State {
        fn change(&self, light: &mut TrafficLight);
        fn name(&self) -> &str;
    }
    
    struct RedState;
    
    impl State for RedState {
        fn change(&self, light: &mut TrafficLight) {
            light.state = Box::new(GreenState);
        }
        
        fn name(&self) -> &str {
            "红灯"
        }
    }
    
    struct GreenState;
    
    impl State for GreenState {
        fn change(&self, light: &mut TrafficLight) {
            light.state = Box::new(YellowState);
        }
        
        fn name(&self) -> &str {
            "绿灯"
        }
    }
    
    struct YellowState;
    
    impl State for YellowState {
        fn change(&self, light: &mut TrafficLight) {
            light.state = Box::new(RedState);
        }
        
        fn name(&self) -> &str {
            "黄灯"
        }
    }
    
    let mut light = TrafficLight::new();
    
    for _ in 0..6 {
        println!("当前: {}", light.state_name());
        light.change();
    }
    
    // ==================== 命令模式 ====================
    println!("\n=== 命令模式 ===");
    
    trait Command {
        fn execute(&self);
        fn undo(&self);
    }
    
    struct Light {
        is_on: bool,
    }
    
    impl Light {
        fn new() -> Self {
            Light { is_on: false }
        }
        
        fn turn_on(&mut self) {
            self.is_on = true;
        }
        
        fn turn_off(&mut self) {
            self.is_on = false;
        }
    }
    
    struct LightOnCommand {
        light: Rc<RefCell<Light>>,
    }
    
    impl Command for LightOnCommand {
        fn execute(&self) {
            self.light.borrow_mut().turn_on();
            println!("灯打开");
        }
        
        fn undo(&self) {
            self.light.borrow_mut().turn_off();
            println!("灯关闭");
        }
    }
    
    let light = Rc::new(RefCell::new(Light::new()));
    let command = LightOnCommand { light: light.clone() };
    
    command.execute();
    println!("灯状态: {}", light.borrow().is_on);
    
    command.undo();
    println!("灯状态: {}", light.borrow().is_on);
    
    println!("\n设计模式演示完成!");
}

// ============================================
// 编译和运行方法：
// 
// Windows:
//   rustc 01_design_patterns.rs -o 01_design_patterns.exe
//   01_design_patterns.exe
//
// Linux/macOS:
//   rustc 01_design_patterns.rs -o 01_design_patterns
//   ./01_design_patterns
// ============================================
