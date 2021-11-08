/*
@Author:        hogan.chen@ymail.com
@Create Date:   2020-11-11
*/

package main

import (
	"fmt"
	"os"
	"path"
	"runtime"
	"time"

	"github.com/sirupsen/logrus"
)

func init() {
	//你可以在Logger上设置日志记录级别,然后它只会记录具有该级别或以上级别任何内容的条目，日志级别大小说明:Panic>Fatal>Error>Warn>Info>Debug>Trace
	logrus.SetLevel(logrus.DebugLevel)

	//默认情况下，日志输出到io.Stderr
	//输出到标准输出，而不是默认的标准错误
	logrus.SetOutput(os.Stdout)

	/*
		logrus有两个片自的Formatter，分别是：TextFormatter和JSONFormatter。
		（如果不了解TextFormatter和JSONFormatter，可以点这里）要在这两个Formatter中输出文件名，行号和函数名，只需要设置
		logrus.SetReportCaller(true)
	*/
	logrus.SetReportCaller(true)
	logrus.SetFormatter(&logrus.TextFormatter{
		TimestampFormat: "2006-01-02 15:04:05",
		//默认是Colors模式，该模式下，必须设置FullTimestamp:true， 否则时间显示不生效。
		FullTimestamp: true,
		/*
			如果我们只要想文件名，不想输出路径，以便使得日志更简短，怎么做呢？可以设置Formatter中的CallerPrettyfier，它的函数原型是：
			func(*runtime.Frame) (function string, file string)
			返回值中的function是函数名， file是文件名。
		*/
		CallerPrettyfier: func(frame *runtime.Frame) (function string, file string) {
			//path.Base(frame.File)去掉了文件名中的路径部分
			fileName := path.Base(frame.File)
			return fmt.Sprintf("%v():", frame.Function), fmt.Sprintf(" %v:%v", fileName, frame.Line)
		},
	})
}

/*
logrus的使用非常简单，与标准库log类似。logrus支持更多的日志级别：

	Panic：记录日志，然后panic。
	Fatal：致命错误，出现错误时程序无法正常运转。输出日志后，程序退出；
	Error：错误日志，需要查看原因；
	Warn：警告信息，提醒程序员注意；
	Info：关键操作，核心流程的日志；
	Debug：一般程序中输出的调试信息；
	Trace：很细粒度的信息，一般用不到；

日志级别从上向下依次增加，Trace最大，Panic最小。logrus有一个日志级别，高于这个级别的日志不会输出。
默认的级别为InfoLevel。所以为了能看到Trace和Debug日志，我们在main函数第一行设置日志级别为TraceLevel。

输出文件名

调用logrus.SetReportCaller(true)设置在输出日志中添加文件名和方法信息
*/
func main() {
	start := time.Now()
	fmt.Printf("Program start execution at %s\n\n", start.Format("2006-01-02 15:04:05"))

	//logrus.SetLevel(logrus.DebugLevel)，所以Trace信息不会打印
	logrus.Trace("Trace信息")
	logrus.Debug("调试信息")
	logrus.Info("提示信息")
	logrus.Warn("警告信息")
	logrus.Error("错误信息")
	logrus.Fatal("致命错误信息")
	logrus.Panic("Panic错误信息")

	elapsed := time.Since(start)
	fmt.Printf("\nProgram end execution at %s\n", time.Now().Format("2006-01-02 15:04:05"))
	fmt.Printf("Total elapsed time: %s\n", elapsed)
}
