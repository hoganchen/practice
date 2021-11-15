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

type holidayStruct struct {
	t time.Time
}

var holidaySlice = []string{
	"20170101", "20170102", "20170127", "20170128", "20170129", "20170130", "20170131", "20170201", "20170202",
	"20170403", "20170404", "20170501", "20170529", "20170530", "20171002", "20171003", "20171004", "20171005", "20171006",

	"20180101", "20180215", "20180216", "20180219", "20180220", "20180221", "20180405", "20180406", "20180430",
	"20180501", "20180618", "20180924", "20181001", "20181002", "20181003", "20181004", "20181005",

	"20190101", "20190204", "20190205", "20190206", "20190207", "20190208", "20190405", "20190501", "20190502",
	"20190503", "20190607", "20190913", "20191001", "20191002", "20191003", "20191004",

	"20200101", "20200124", "20200127", "20200128", "20200129", "20200130", "20200406", "20200501", "20200504",
	"20200505", "20200625", "20200626", "20201001", "20201002", "20201005", "20201006", "20201007", "20201008",

	"20210101", "20210211", "20210212", "20210215", "20210216", "20210217", "20210405", "20210503", "20210504",
	"20210505", "20210614", "20210920", "20210921", "20211001", "20211004", "20211005", "20211006", "20211007",
}

const (
	allTradeMinute  = 60 * 4     // The total trading minutes
	startMinute     = 9*60 + 30  // The start minutes of trading
	halfEndMinute   = 11*60 + 30 // The half end minutes of trading
	halfStartMinute = 13 * 60    // The half start minutes of trading
	endMinute       = 15 * 60    // The end minutes of trading
)

func init() {
	//你可以在Logger上设置日志记录级别,然后它只会记录具有该级别或以上级别任何内容的条目，
	//日志级别大小说明:Panic>Fatal>Error>Warn>Info>Debug>Trace
	logrus.SetLevel(logrus.InfoLevel)

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
https://strconv.com/posts/time-fmt/

这段代码分别把时间指向了2006-01-02 03:04:05和2006-01-02 15:04:05，然后格式化。看看输出:

❯ go run simple.go
2006-01-02 03:04:05 +0000 UTC
2006-01-02 03:04:05
2006-01-02 03:04:05
2006-01-02 15:04:05 +0000 UTC
2006-01-02 03:04:05
2006-01-02 15:04:05

看到第二个例子了吧？这个是一个下午时间，但使用2006-01-02 03:04:05和2006-01-02 15:04:05格式化获得的时间是不一样的。所以可以看出一定要使用24小时制的时间。

注意：使用"2006-01-02 03:04:05"解析出来的是12小时制时间，使用"2006-01-02 15:04:05"解析出来的是24小时制时间
*/
func timeParse() {
	t, _ := time.Parse("2006-01-02 15:04:05", "2006-01-02 03:04:05")

	fmt.Println(t)
	fmt.Println(t.Format("2006-01-02 03:04:05"))
	fmt.Println(t.Format("2006-01-02 15:04:05"))

	t, _ = time.Parse("2006-01-02 15:04:05", "2006-01-02 15:04:05")

	fmt.Println(t)
	fmt.Println(t.Format("2006-01-02 03:04:05"))
	fmt.Println(t.Format("2006-01-02 15:04:05"))

	t = time.Now().AddDate(0, 0, -1)
	fmt.Printf("t: %v, type(t): %T, int(t.Weekday): %v\n", t, t, int(t.Weekday()))
	t = t.AddDate(0, 0, -1)
	fmt.Printf("t: %v\n", t)

	year, month, day := time.Now().Date()
	fmt.Printf("year: %v, month: %v, day: %v\n", year, month, day)

	fmt.Printf("After 30 minutes from now on: %v\n", time.Now().Add(time.Minute*30))

	startDateStr := fmt.Sprintf("%d%02d%02d", time.Now().Year(), time.Now().Month(), 1)
	startDate, _ := time.Parse("20060102", startDateStr)
	fmt.Printf("startDateStr: %v, startDate: %v\n", startDateStr, startDate)
}

func isWeekendDay(t time.Time) bool {
	if 6 == int(t.Weekday()) || 0 == int(t.Weekday()) {
		return true
	}

	return false
}

func isValueInList(value string, list []string) bool {
	for _, v := range list {
		if v == value {
			return true
		}
	}
	return false
}

func isHoliday(t time.Time) bool {
	tStr := t.Format("20060102")

	return isValueInList(tStr, holidaySlice)
}

func isTradeDay(t time.Time) bool {
	if isWeekendDay(t) || isHoliday(t) {
		return false
	}

	return true
}

func isTradeTime(t time.Time) bool {
	if isTradeDay(t) {
		tradeMinute := t.Hour()*60 + t.Minute()

		if tradeMinute >= startMinute && tradeMinute <= endMinute {
			return true
		}
	}

	return false
}

func isSameDay(t1, t2 time.Time) bool {
	logrus.Debugf("t1: %v, t2: %v", t1, t2)

	//该方法存在时区差异，采用method 2
	/*
	t1Date, _ := time.Parse("20060102",
		fmt.Sprintf("%d%02d%02d", t1.Year(), t1.Month(), t1.Day()))
	t2Date, _ := time.Parse("20060102",
		fmt.Sprintf("%d%02d%02d", t2.Year(), t2.Month(), t2.Day()))

	logrus.Debugf("t1Date: %v, t2Date: %v", t1Date, t2Date)

	return t1Date == t2Date
	*/

	//https://blog.csdn.net/qq_33446100/article/details/120679611
	//method 2:

	y1, m1, d1 := t1.Date()
	y2, m2, d2 := t2.Date()

	return y1 == y2 && m1 == m2 && d1 == d2
}

func isSameWeek(t1, t2 time.Time) bool {
	logrus.Debugf("t1: %v, t2: %v", t1, t2)

	y1, w1 := t1.ISOWeek()
	y2, w2 := t2.ISOWeek()

	return y1 == y2 && w1 == w2
}

func isSameMonth(t1, t2 time.Time) bool {
	logrus.Debugf("t1: %v, t2: %v", t1, t2)

	y1, m1, _ := t1.Date()
	y2, m2, _ := t2.Date()

	return y1 == y2 && m1 == m2
}

func getLastTradeDay(t time.Time, kType string) time.Time {
	var lastDate time.Time

	if "D" == kType {
		lastDate = t
	} else if "W" == kType {
		if int(t.Weekday()) >= 1 && int(t.Weekday()) <= 5 {
			lastDate = t.AddDate(0, 0, -(int(t.Weekday())))
		} else {
			lastDate = t
		}
	} else if "M" == kType {
		//该方法略麻烦，而且存在时区差异
		//lastDate, _ = time.Parse("20060102", fmt.Sprintf("%d%02d%02d", t.Year(), t.Month(), 1))
		//lastDate = lastDate.AddDate(0, 0, -1)
		lastDate = t.AddDate(0, 0, -(t.Day() + 1))
	} else {
		panic("unsupported k type: " + kType)
	}

	logrus.Debugf("lastDate: %v", lastDate)

	for {
		if !isTradeDay(lastDate) {
			lastDate = lastDate.AddDate(0, 0, -1)
		} else {
			if isSameDay(time.Now(), lastDate) {
				if isTradeTime(lastDate) {
					lastDate = lastDate.AddDate(0, 0, -1)
				} else {
					break
				}
			} else {
				break
			}
		}

		logrus.Debugf("lastDate: %v", lastDate)
	}

	return lastDate
}

/*
func main() {
	start := time.Now()
	fmt.Printf("Program start execution at %s\n\n", start.Format("2006-01-02 15:04:05"))

	timeParse()
	fmt.Printf("isTradeTime: %v\n", isTradeTime(time.Now()))
	fmt.Printf("isSameDay: %v\n", isSameDay(time.Now(), time.Now().Add(time.Minute*30)))

	fmt.Printf("getLastTradeDay: %v\n", getLastTradeDay(time.Now(), "D"))
	fmt.Printf("getLastTradeDay: %v\n", getLastTradeDay(time.Now(), "W"))
	fmt.Printf("getLastTradeDay: %v\n", getLastTradeDay(time.Now(), "M"))

	elapsed := time.Since(start)
	fmt.Printf("\nProgram end execution at %s\n", time.Now().Format("2006-01-02 15:04:05"))
	fmt.Printf("Total elapsed time: %s\n", elapsed)
}
*/
