/*
@Author:        hogan.chen@ymail.com
@Create Date:   2020-11-11
*/

package main

/*
https://segmentfault.com/a/1190000021429226
https://gobea.cn/blog/detail/KodP0Kob.html
https://www.coder.work/article/194303

go build
    go build命令是在当前目录编译生成可执行文件，注意 go build 指令会调用所有引用包的源码进行重新编译而不是使用之前pkg里的文件

go install
    执行 go install 命令会完成类似 go build 的功能 ，但go install 命令执行生成的可执行文件是在【$GOPATH/bin】目录中

go get
    该命令可以理解为两个操作 git clone + go install , 执行会将远程代码clone 到【$GOPATH/src】 目录中
	git clone命令会将存储库克隆到新创建的目录中，而go get下载并安装由导入路径命名的软件包及其依赖项。

go get -v github.com/chromedp/chromedp

go help get

go get 的参数说明：

-d 只下载不安装
-f 只有在你包含了-u参数的时候才有效，
   不让-u去验证import中的每一个都已经获取了，
   这对于本地fork的包特别有用
-fix 在获取源码之后先运行fix，然后再去做其他的事情
-t 同时也下载需要为运行测试所需要的包
-u 强制使用网络去更新包和它的依赖包
-v 显示执行的命令

*/
import (
	"log"
	"fmt"
	"time"
	"regexp"
	"context"

	"github.com/chromedp/chromedp"
)

func get_my_ua() {
	var ua string
	var htmlContent string

	// create chrome instance
	ctx, cancel := chromedp.NewContext(
		context.Background(),
		chromedp.WithLogf(log.Printf),
	)
	defer cancel()

	// create a timeout
	ctx, cancel = context.WithTimeout(ctx, 30*time.Second)
	defer cancel()

	// err := chromedp.Run(ctx,
	// 	chromedp.Navigate(`https://www.whatsmyua.info/?a`),
	// 	// chromedp.WaitVisible(`custom-ua-string`),
	// 	chromedp.WaitVisible(`body > div > div.top.block > form > label`),
	// 	// chromedp.Text(`custom-ua-string`, &ua),
	// 	chromedp.Value(`#custom-ua-string`, &ua),
	// 	chromedp.OuterHTML(`body`, &htmlContent),
	// )

	err := chromedp.Run(ctx,
		chromedp.Navigate(`https://httpbin.org/get`),
		chromedp.WaitVisible(`body > pre`),
		chromedp.Text(`body`, &ua),
		// chromedp.OuterHTML(`body`, &htmlContent, chromedp.ByJSPath),
		chromedp.OuterHTML(`body`, &htmlContent),
		// chromedp.Value(`User-Agent`, &ua),
	)

	if err != nil {
		log.Fatal(err)
	}

	var re *regexp.Regexp
	re, _ = regexp.Compile(`"User-Agent":\s+"(.*?)"`)
	match := re.FindStringSubmatch(string(ua))
	if nil != match {
		fmt.Printf("re matched...\n")
		ua = match[1]
	}

	log.Printf("user agent: %s", ua)
	fmt.Printf("\n################################################################################\n\n")
	log.Printf("htmlContent: %s", htmlContent)
}

func main() {
	start := time.Now()
	fmt.Printf("Program start execution at %s\n\n", start.Format("2006-01-02 15:04:05"))

	get_my_ua()

	elapsed := time.Since(start)
	fmt.Printf("\nProgram end execution at %s\n", time.Now().Format("2006-01-02 15:04:05"))
	fmt.Printf("Total elapsed time: %s\n", elapsed)
}
