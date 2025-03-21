https://segmentfault.com/a/1190000021468353

前言

go 的 goroutine 提供了一种较线程而言更廉价的方式处理并发场景, go 使用二级线程的模式, 将 goroutine 以 M:N 的形式复用到系统线程上, 节省了 cpu 调度的开销, 也避免了用户级线程（协程）进行系统调用时阻塞整个系统线程的问题。【1】

但 goroutine 太多仍会导致调度性能下降、GC 频繁、内存暴涨, 引发一系列问题。在面临这样的场景时, 限制 goroutine 的数量、重用 goroutine 显然很有价值。

本文正是针对上述情况而提供一种简单的解决方案, 编写一个协程池（任务池）来实现对 goroutine 的管控。
思路

要解决这个问题, 要思考两个问题

    goroutine 的数量如何限制, goroutine 如何重用
    任务如何执行

goroutine 的数量如何限制, goroutine 如何重用

说到限制和重用, 那么最先想到的就是池化。比如 TCP 连接池, 线程池, 都是有效限制、重用资源的最好实践。所以, 我们可以创建一个 goroutine 池, 用来管理 goroutine。

任务如何执行
在使用原生 goroutine 的场景中, 运行一个任务直接启动一个 goroutine 来运行, 在池化的场景而言, 任务也是要在 goroutine 中执行, 但是任务需要任务池来放入 goroutine。

生产者消费者模型
在连接池中, 连接在使用时从池中取出, 用完后放入池中。对于 goroutine 而言, goroutine 通过语言关键字启动, 无法像连接一样操作。那么如何让 goroutine 可以执行任务, 且执行后可以重新用来执行其它任务呢？这里就需要使用生产者消费者模型了:

生产者 --(生产任务)--> 队列 --(消费任务)--> 消费者

用来执行任务的 goroutine 可以作为消费者, 操作任务池的 goroutine 作为生产者, 而队列则可以使用 go 的 buffer channel, 任务池的建模到此结束。


实现
Talk is cheap. Show me the code.

任务的定义
任务要包含需要执行的函数、以及函数要传的参数, 因为参数类型、个数不确定, 这里使用可变参数和空接口的形式

type Task struct {
    Handler func(v ...interface{})
    Params  []interface{}
}

任务池的定义
任务池的定义包括了池的容量 capacity、当前运行的 worker（goroutine）数量 runningWorkers、任务队列（channel）chTask 以及任务池的状态 status（运行中或已关闭, 用于安全关闭任务池）, 最后还有一把互斥锁 sync.Mutex

type Pool struct {
    capacity       uint64
    runningWorkers uint64
    status          int64
    chTask          chan *Task
    sync.Mutex
}

任务池的构造函数:


var ErrInvalidPoolCap = errors.New("invalid pool cap")

const (
    RUNNING = 1
    STOPED = 0
)

func NewPool(capacity uint64) (*Pool, error) {
    if capacity <= 0 {
        return nil, ErrInvalidPoolCap
    }
    return &Pool{
        capacity: capacity,
        status:    RUNNING,
        // 初始化任务队列, 队列长度为容量
        chTask:    make(chan *Task, capacity),
    }, nil
}

启动 worker

新建 run() 方法作为启动 worker 的方法:

func (p *Pool) run() {
    p.runningWorkers++ // 运行中的任务加一

    go func() {
        defer func() {
            p.runningWorkers-- // worker 结束, 运行中的任务减一
        }()

        for {
            select { // 阻塞等待任务、结束信号到来
            case task, ok := <-p.chTask: // 从 channel 中消费任务
                if !ok { // 如果 channel 被关闭, 结束 worker 运行
                    return
                }
                // 执行任务
                task.Handler(task.Params...)
            }
        }
    }()
}

上述代码中, runningWorkers 的加减直接使用了自增运算, 但是考虑到启动多个 worker 时, runningWorkers 就会有数据竞争, 所以我们使用 sync.atomic 包来保证 runningWorkers 的自增操作是原子的。

对 runningWorkers 的操作进行封装:

func (p *Pool) incRunning() { // runningWorkers + 1
    atomic.AddUint64(&p.runningWorkers, 1)
}

func (p *Pool) decRunning() { // runningWorkers - 1
    atomic.AddUint64(&p.runningWorkers, ^uint64(0))
}

func (p *Pool) GetRunningWorkers() uint64 {
    return atomic.LoadUint64(&p.runningWorkers)
}

对于 capacity 的操作无需考虑数据竞争, 因为 capacity 在初始化时已经固定。封装 GetCap() 方法:

func (p *Pool) GetCap() uint64 {
    return p.capacity
}

趁热打铁, status 的操作也加锁封装为安全操作:


func (p *Pool) setStatus(status int64) bool {
    p.Lock()
    defer p.Unlock()

    if p.status == status {
        return false
    }

    p.status = status

    return true
}

run() 方法改造:

func (p *Pool) run() {
    p.incRunning()

    go func() {
        defer func() {
            p.decRunning()
        }()

        for {
            select {
            case task, ok := <-p.chTask:
                if !ok {
                    return
                }
                task.Handler(task.Params...)
            }
        }
    }()
}

生产任务

新建 Put() 方法用来将任务放入池中:

func (p *Pool) Put(task *Task) {

    // 加锁防止启动多个 worker
    p.Lock()
    defer p.Unlock()

    if p.GetRunningWorkers() < p.GetCap() { // 如果任务池满, 则不再创建 worker
        // 创建启动一个 worker
        p.run()
    }

    // 将任务推入队列, 等待消费
    p.chTask <- task
}

任务池安全关闭

当有关闭任务池来节省 goroutine 资源的场景时, 我们需要有一个关闭任务池的方法。

直接销毁 worker 关闭 channel 并不合适, 因为此时可能还有任务在队列中没有被消费掉。要确保所有任务被安全消费后再销毁掉 worker。

首先, 在关闭任务池时, 需要先关闭掉生产任务的入口。同时, 也要考虑到任务推送到 chTask 时 status 改变的问题。改造 Put() 方法:


var ErrPoolAlreadyClosed = errors.New("pool already closed")

func (p *Pool) Put(task *Task) error {
    p.Lock()
    defer p.Unlock()

    if p.status == STOPED { // 如果任务池处于关闭状态, 再 put 任务会返回 ErrPoolAlreadyClosed 错误
        return ErrPoolAlreadyClosed
    }

    // run worker
    if p.GetRunningWorkers() < p.GetCap() {
        p.run()
    }

    // send task
    if p.status == RUNNING {
        p.chTask <- task
    }

    return nil
}

在 run() 方法中已经对 chTask 的关闭进行了监听, 销毁 worker 只需等待任务被消费完后关闭 chTask。Close() 方法如下:

func (p *Pool) Close() {
    p.setStatus(STOPED) // 设置 status 为已停止

    for len(p.chTask) > 0 { // 阻塞等待所有任务被 worker 消费
        time.Sleep(1e6) // 防止等待任务清空 cpu 负载突然变大, 这里小睡一下
    }

    close(p.chTask) // 关闭任务队列
}

panic handler

每个 worker 都是一个 goroutine, 如果 goroutine 中产生了 panic, 会导致整个程序崩溃。为了保证程序的安全进行, 任务池需要对每个 worker 中的 panic 进行 recover 操作, 并提供可订制的 panic handler。

更新任务池定义:

type Pool struct {
    capacity       uint64
    runningWorkers uint64
    status          int64
    chTask          chan *Task
    sync.Mutex
    PanicHandler   func(interface{})
}

更新 run() 方法:

func (p *Pool) run() {
    p.incRunning()

    go func() {
        defer func() {
            p.decRunning()
            if r := recover(); r != nil { // 恢复 panic
                if p.PanicHandler != nil { // 如果设置了 PanicHandler, 调用
                    p.PanicHandler(r)
                } else { // 默认处理
                    log.Printf("Worker panic: %s\n", r)
                }
            }
        }()

        for {
            select {
            case task, ok := <-p.chTask:
                if !ok {
                    return
                }
                task.Handler(task.Params...)
            }
        }
    }()
}

可用 worker 检查

recover 后，gorotine 退出，当池的容量为 1 时，此时会有一个问题，观察 Put() 方法：


if p.GetRunningWorkers() < p.GetCap() {
    p.run() // 此时有一个 task (上一次 Put) panic，worker 退出了
}


if p.status == RUNNING {
    p.chTask <- task // 当前的 task 推送到 chTask，但是没有一个 worker 可以消费到，deadlock!
}

    感谢提出这个场景的朋友，详细参考 issue 极端情况 #4，此问题已经在 release v1.5 中修复

为了解决这个 bug，我们需要在 worker 退出时检查当前是否还有运行着的 worker，如果没有，则创建一个，保证 task 可以被正常消费，checkWorker() 方法如下：

func (p *Pool) checkWorker() {
    p.Lock()
    defer p.Unlock()

    // 当前没有 worker 且有任务存在，运行一个 worker 消费任务
    // 没有任务无需考虑 (当前 Put 不会阻塞，下次 Put 会启动 worker)
    if p.runningWorkers == 0 && len(p.chTask) > 0 {
        p.run()
    }
}

改造 run() 方法：
func (p *Pool) run() {
    p.incRunning()

    go func() {
        defer func() {
            p.decRunning()
            if r := recover(); r != nil {
                if p.PanicHandler != nil {
                    p.PanicHandler(r)
                } else {
                    log.Printf("Worker panic: %s\n", r)
                }
            }
            p.checkWorker() // worker 退出时检测是否有可运行的 worker
        }()

        for {
            select {
            case task, ok := <-p.chTask:
                if !ok {
                    return
                }
                task.Handler(task.Params...)
            }
        }
    }()
}

使用
OK, 我们的任务池就这么简单的写好了, 试试:

func main() {
    // 创建任务池
    pool, err := NewPool(10)
    if err != nil {
        panic(err)
    }

    for i := 0; i < 20; i++ {
        // 任务放入池中
        pool.Put(&Task{
            Handler: func(v ...interface{}) {
                fmt.Println(v)
            },
            Params: []interface{}{i},
        })
    }

    time.Sleep(1e9) // 等待执行
}

详细例子见 mortar/examples
benchmark

作为协程池, 性能和内存占用的指标测试肯定是少不了的, 测试数据才是最有说服力的
测试流程

100w 次执行，原子增量操作

测试任务:

var wg = sync.WaitGroup{}

var sum int64

func demoTask(v ...interface{}) {
    defer wg.Done()
    for i := 0; i < 100; i++ {
        atomic.AddInt64(&sum, 1)
    }
}

测试方法:

var runTimes = 1000000
// 原生 goroutine
func BenchmarkGoroutineTimeLifeSetTimes(b *testing.B) {

    for i := 0; i < runTimes; i++ {
        wg.Add(1)
        go demoTask2()
    }
    wg.Wait() // 等待执行完毕
}

// 使用协程池
func BenchmarkPoolTimeLifeSetTimes(b *testing.B) {
    pool, err := NewPool(20)
    if err != nil {
        b.Error(err)
    }

    task := &Task{
        Handler: demoTask2,
    }

    for i := 0; i < runTimes; i++ {
        wg.Add(1)
        pool.Put(task)
    }

    wg.Wait() // 等待执行完毕
}
