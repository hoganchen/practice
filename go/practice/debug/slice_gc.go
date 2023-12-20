/*
@Author:        hogan.chen@ymail.com
@Create Date:   2020-11-11
@Description:   golang程序模板
*/

/*
go mod管理包
mkdir trade
cd trade
go mod init trade

go mod下载缺失的库
go mod tidy
*/
package main

import (
	"flag"
	"fmt"
	"os"
	"path"
	"reflect"
	"runtime"
	"strconv"
	"strings"
	"time"
	"unsafe"

	"github.com/sirupsen/logrus"
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

// uint8是一个字节，uint32是4个字节, 在64位操作系统中，uint, int, uint64, int64都是8个字节
func memPrint(ptr *uint32, len uint) {
	newPtr := (*uint32)(unsafe.Pointer(ptr))
	fmt.Printf("%p ", newPtr)

	for i := uint(1); i <= len; i++ {
		// fmt.Printf("%p ", new_ptr)
		fmt.Printf("%08x ", *newPtr)
		newPtr = (*uint32)(unsafe.Pointer(uintptr(unsafe.Pointer(ptr)) + uintptr(4*i)))

		if 0 == i%4 {
			fmt.Printf("\n")
			fmt.Printf("%p ", newPtr)
		}
	}
	fmt.Printf("\n\n")
}

func reSlice(a []int) []int {
	/*
		在此函数中，切片b截取了切片a中的部分数据并返回。
		但这存在一个问题，假如切片a在之后不再使用，即使切片b只使用了切片a中的前三个数据而已，a的整个底层数组都不会被GC回收。
		因为切片b和a都指向同一个底层数组，因此，gc在进行检测时，不会将底层数组回收。除非发生扩容，导致切片a和b没有指向了同一个底层数组
		可以想象，如果切片a中含有大量的数据，那这会极大的浪费内存。
		解决方法为重新构造一个切片，然后把a中的数据复制到切片b中。
	*/
	//b := a[0:3]

	//由下打印可以看出，nil切片的底层数组的地址为0，即没有底层数组，所以需要初始化才能访问，而空切片存在底层数组，并且已经初始化了的
	//var b []int // b = nil，nil切片；slArrAddr = 0x0, slLen = 0, slCap = 0
	//b := []int{} // b != nil，空切片；slArrAddr = 0x3a1f20, slLen = 0, slCap = 0
	b := make([]int, 0) //b != nil，空切片；slArrAddr = 0x3a1f20, slLen = 0, slCap = 0

	fmt.Printf("b: %v, b is nil: %v\n", b, b == nil)
	slArrAddr := unsafe.Pointer(uintptr(*(*int)(unsafe.Pointer(&b))))           // 切片SliceHeader数据结构，data的地址
	slLen := *(*int)(unsafe.Pointer(uintptr(unsafe.Pointer(&b)) + uintptr(8)))  // 切片SliceHeader数据结构，切片的长度
	slCap := *(*int)(unsafe.Pointer(uintptr(unsafe.Pointer(&b)) + uintptr(16))) // 切片SliceHeader数据结构，切片的容量
	var i int
	var p uintptr
	fmt.Printf("unsafe.Sizeof(uintptr): %v, unsafe.Sizeof(int): %v\n", unsafe.Sizeof(p), unsafe.Sizeof(i))                 //64位系统，int和uintptr都是8个字节
	fmt.Printf("unsafe.Sizeof(uintptr): %v, unsafe.Sizeof(int): %v\n", unsafe.Sizeof(uintptr(0x0)), unsafe.Sizeof(int(0))) //64位系统，int和uintptr都是8个字节
	fmt.Printf("unsafe.Sizeof(strconv.IntSize): %v\n", unsafe.Sizeof(strconv.IntSize))                                     //64位系统，int和uintptr都是8个字节
	fmt.Printf("sliceHeader: %x\n", *(*reflect.SliceHeader)(unsafe.Pointer(&b)))
	fmt.Printf("slArrAddrAddr = %p, slLenAddr = %p, slCapAddr = %p\n", unsafe.Pointer(&b), unsafe.Pointer(uintptr(unsafe.Pointer(&b))+uintptr(8)), unsafe.Pointer(uintptr(unsafe.Pointer(&b))+uintptr(16)))
	fmt.Printf("slArrAddr = %p, slLen = %v, slCap = %v\n", slArrAddr, slLen, slCap)
	//切片b的数据结构
	memPrint((*uint32)(unsafe.Pointer(&b)), 8)
	//切片b的底层数组
	memPrint((*uint32)(slArrAddr), 32)

	var copyNum int
	b = append(b, a[0:3]...)
	//copyNum = copy(b, a[0:3]) //如果destination切片为空，拷贝会失败，即copy函数会根据destination切片的容量来拷贝，不会发生扩容
	fmt.Printf("copyNum: %v, sliceHeader: %x\n", copyNum, *(*reflect.SliceHeader)(unsafe.Pointer(&b)))
	fmt.Printf("slArrAddrAddr = %p, slLenAddr = %p, slCapAddr = %p\n", unsafe.Pointer(&b), unsafe.Pointer(uintptr(unsafe.Pointer(&b))+uintptr(8)), unsafe.Pointer(uintptr(unsafe.Pointer(&b))+uintptr(16)))
	//切片b的数据结构
	memPrint((*uint32)(unsafe.Pointer(&b)), 8)

	return b
}

// 打印占用的内存
func printMem() {
	var rtm runtime.MemStats
	runtime.ReadMemStats(&rtm)
	fmt.Printf("%f MB\n", float64(rtm.Alloc)/1024./1024.)
}

func debugFunc() {
}

func mainFunc() {
	//a := make([]int, 9999999)
	a := []int{0: 1, 2, 3, 9999999: 0} //初始化切片，设置前三个元素值为1, 2, 3, 并指定第10000000元素值为0，即指定该切片有10000000个元素，并初始化前3个元素
	a = reSlice(a)
	printMem() //76.516983 MB
	runtime.GC()
	fmt.Println(a) //在reSlice函数中，如果采用b := a[0:3]的方式获取切片b，由于没有发生扩容，则切片a和b指向同一个底层数组，因此手动GC不会将a回收
	printMem()     //76.516983 MB
}

// go run goTemplate.go --log="debug" --debug=true > debug.log 2>&1
func main() {
	start := time.Now()
	fmt.Printf("Program start execution at %s\n\n", start.Format("2006-01-02 15:04:05"))

	logFlag := flag.String("log", "info", "The log level flag")
	debugFlag := flag.Bool("debug", false, "The debug flag")

	flag.Parse()

	logrus.Debugf("logFlag: %v, debugFlag: %v", *logFlag, *debugFlag)

	if "trace" == strings.ToLower(*logFlag) {
		logrus.SetLevel(logrus.TraceLevel)
	} else if "debug" == strings.ToLower(*logFlag) {
		logrus.SetLevel(logrus.DebugLevel)
	} else if "info" == strings.ToLower(*logFlag) {
		logrus.SetLevel(logrus.InfoLevel)
	} else {
		logrus.SetLevel(logrus.DebugLevel)
	}

	if false == *debugFlag {
		mainFunc()
	} else {
		debugFunc()
	}

	elapsed := time.Since(start)
	fmt.Printf("\nProgram end execution at %s\n", time.Now().Format("2006-01-02 15:04:05"))
	fmt.Printf("Total elapsed time: %s\n", elapsed)
}
