go.mod vs go.work 对比


go.mod — 模块定义文件（每个模块一个）
go.mod 定义单个模块的元数据：模块路径、Go 版本、依赖及其版本。

// go.mod
module github.com/user/myproject  // 模块路径

go 1.25                            // 所需 Go 版本

require (                          // 第三方依赖
    github.com/gin-gonic/gin v1.9.1
    go.uber.org/zap v1.26.0
)

replace (                          // 本地替换（开发时）
    example.com/pkg => ./local/pkg
)

exclude (                          // 排除特定版本
    example.com/pkg v1.0.0
)
场景：每个 Go 项目（库或可执行程序）都有自己的 go.mod。


go.work — 工作区文件（整个工作区一个）
go.work 将多个模块组织在一起，让它们互相引用时无需 replace 指令。

// go.work
go 1.25                            // 工作区 Go 版本

use (                              // 成员模块
    ./myapp                         // 主应用
    ./shared/lib                    // 本地库
    ./tools                         // 工具
)
场景：同时开发多个相关联的模块。

核心区别
维度            go.mod	go.work
作用范围        单个模块	多个模块
主要功能        声明模块路径、管理依赖版本	本地多模块互相引用
是否必须        ✅ 是（所有 Go 项目都需要）	❌ 否（仅本地开发需要）
提交到 Git      ✅ 是	❌ 否（通常 .gitignore 忽略）
影响编译        决定最终二进制包含什么	仅影响本地开发时的模块解析
类比 Maven      每个子模块的 pom.xml	父 pom.xml 的 <modules>


没有 go.work 时的痛点
假设你同时开发两个模块：

my-project/
├── server/        # go.mod → module server
│   └── main.go    // import "lib"
└── lib/           # go.mod → module lib
    └── helper.go

server/main.go 引用了 lib，但 lib 还没有发布到 GitHub。没有 go.work 时只能：

// server/go.mod
require lib v0.0.0
replace lib => ../lib    // ← 每个模块都要加 replace，很麻烦

有 go.work 只需：
// go.work
use (
    ./server
    ./lib
)
server 中的 import "lib" 自动解析到本地的 ./lib 目录，无需任何 replace。

同时存在时的解析优先级

go.work  >  go.mod replace  >  模块缓存（GOPATH）
即 go.work use 中的本地模块优先级最高。

我们这个项目的例子

// go.work — 把两个有 go.mod 的模块纳入工作区
go 1.25.9
use (
    ./15_modules                     // 模块示例
    ./16_go125_new_features/synctest // synctest 测试
)

// 其他目录（01~14、17）没有 go.mod，不纳入工作区，
// 直接用 go run 单文件编译，不受 go.work 影响
一句话总结
            go.mod                              go.work
是什么      模块的身份证+地图                    工作区的花名册
干什么      告诉 Go 这个模块叫什么、依赖什么      告诉 Go 这些模块是同一个项目，互相引用时直接走本地代码
谁需要它    所有 Go 项目                         多模块开发时才需要