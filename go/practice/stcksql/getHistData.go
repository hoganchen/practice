/*
@Author:        hogan.chen@ymail.com
@Create Date:   2020-11-11
*/

package main

import (
	"database/sql"
	"flag"
	"fmt"
	"io/ioutil"
	"math/rand"
	"net/http"
	"os"
	"path"
	"runtime"
	"strconv"
	"strings"
	"sync"
	"time"
	"unicode/utf8"

	_ "github.com/go-sql-driver/mysql"
	"github.com/sirupsen/logrus"
	"github.com/tidwall/gjson"
	"github.com/valyala/fastjson"
)

const (
	mysqlUser = "gostck"
	mysqlPwd  = "stck&sql"
	mysqlDb   = "gostock"
)

const (
	codeDataTable      = "code_data"
	emCodeDataTable    = "em_code_data"
	etfCodeDataTable   = "etf_data"

	basicAllDataTable      = "basics_all_data"
	basicIndustryDataTable = "basics_industry_data"
	basicStockDataTable    = "basics_stock_data"

	etfQfqDayDataTable   = "etf_qfq_day_data"
	etfQfqWeekDataTable  = "etf_qfq_week_data"
	etfQfqMonthDataTable = "etf_qfq_month_data"

	kQfqDayDataTable   = "k_qfq_day_data"
	kQfqWeekDataTable  = "k_qfq_week_data"
	kQfqMonthDataTable = "k_qfq_month_data"

	updateStatusTable  = "update_status_data"

	//sina服务器接受的参数值为20, 40, 80, 100，参数值超过100，也最多返回100条数据
	sinaStockNumPerPage = 80
	emStockNumPerPage   = 1000
	emItemNumPerPage    = 1000

	maxGoroutinePoolNum = 50
)

var (
	//"D"表示日线，"W"表示周线，"M"表示月线，"Q"表示季度线，"H"表示半年线，"Y"表示年线
	//"1"表示1分钟线，"5"表示5分钟线，"15"表示15分钟线，"30"表示30分钟线，"60"表示60分钟线
	kTypeMap = map[string]int{"D": 101, "W": 102, "M": 103, "Q": 104, "H": 105, "Y": 106,
		"1": 1, "5": 5, "15": 15, "30": 30, "60": 60}
	//bfq表示不复权，qfq表示前复权，hfq表示后复权
	fqTypeMap = map[string]int{"bfq": 0, "qfq": 1, "hfq": 2}

	//stock && etf k type map
	typeTableMap = map[string]map[string]map[string]string{
		"etf": {"qfq": {"D": etfQfqDayDataTable, "W": etfQfqWeekDataTable, "M": etfQfqMonthDataTable}},
		"stock": {"qfq": {"D": kQfqDayDataTable, "W": kQfqWeekDataTable, "M": kQfqMonthDataTable}}}
)

type UpdateTableTag struct {
	Name string `json:"name"`
	Date string `json:"date"`
}

type CodeTableTag struct {
	Code string `json:"code"`
	Name string `json:"name"`
}

type CodeDateTag struct {
	Code string `json:"code"`
	Date string `json:"date"`
}

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

func httpFetch(url string) string {
	logrus.Debugf("Fetch Url: %v", url)

	resp, err := http.Get(url)
	if err != nil {
		logrus.Warningf("Http get err: %v", err)
		return ""
	}
	if resp.StatusCode != 200 {
		logrus.Warningf("Http status code: %v", resp.StatusCode)
		return ""
	}

	logrus.Debugf("Http status code: %v", resp.StatusCode)
	defer resp.Body.Close()

	body, err := ioutil.ReadAll(resp.Body)
	if err != nil {
		logrus.Warningf("Read error: %v", err)
		return ""
	}

	return string(body)
}

func openDB() *sql.DB {
	//设置sql的连接参数maxAllowedPacket为128M，同时也需要修改/etc/my.cnf，修改max_allowed_packet=128M
	dataSource := fmt.Sprintf("%s:%s@tcp(127.0.0.1:3306)/%s?maxAllowedPacket=%d",
		mysqlUser, mysqlPwd, mysqlDb, 1 << 27)
	db, err := sql.Open("mysql", dataSource)

	//if there is an error opening the connection, handle it
	if err != nil {
		panic(err.Error())
	}

	//panic: Error 1227: Access denied; you need (at least one of) the SUPER privilege(s) for this operation
	//_, err = db.Exec("set global max_allowed_packet=134217728")
	//if err != nil {
	//	panic(err.Error()) //proper error handling instead of panic in your app
	//}

	return db
}

func closeDB(db *sql.DB) {
	db.Close()
}

func getUpdateDate(tableName string, db *sql.DB) string {
	dateStr := ""
	selectStr := fmt.Sprintf("select name, date from %v where name = \"%v\"", updateStatusTable, tableName)

	results, err := db.Query(selectStr)
	if err != nil {
		panic(err.Error()) //proper error handling instead of panic in your app
	}

	var tag UpdateTableTag
	for results.Next() {
		//for each row, scan the result into our tag composite object
		err = results.Scan(&tag.Name, &tag.Date)
		if err != nil {
			panic(err.Error()) //proper error handling instead of panic in your app
		}

		//and then print out the tag's Name attribute
		logrus.Debugf("Name: %v, Date: %v", tag.Name, tag.Date)
		dateStr = tag.Date
		break
	}

	return dateStr
}

/*
condapython -c "print(','.join([f'f{i}' for i in range(1, 100)]))"
python -c "print(','.join(['f{}'.format(i) for i in range(1, 100)]))"

http://quote.eastmoney.com/center/gridlist.html#hs_a_board
获取所有沪深A股的股票列表，pn为page number，pz为page size，po为1表示降序，为0表示升序，fid为f3表示以涨幅排序，为f12表示以股票代码排序
http://29.push2.eastmoney.com/api/qt/clist/get?pn=1&pz=20&po=0&np=1&fltt=2&invt=2&fid=f12&fs=m:0+t:6,m:0+t:80,m:1+t:2,m:1+t:23&fields=f1,f2,f3,f4,f5,f6,f7,f8,f9,f10,f12,f13,f14,f15,f16,f17,f18,f20,f21,f23,f24,f25,f22,f11,f62,f128,f136,f115,f152
*/
func updateEmTodayData(db *sql.DB) {
	dateStr := getUpdateDate(emCodeDataTable, db)
	updateDateStr := fmt.Sprintf("%v-%02d-%02d", time.Now().Year(), time.Now().Month(), time.Now().Day())
	logrus.Debugf("dateStr: %v, updateDateStr: %v", dateStr, updateDateStr)

	if updateDateStr == dateStr {
		logrus.Infof("The %s table is updated to latest date...", emCodeDataTable)
		return
	} else {
		logrus.Infof("start to update %v table...", emCodeDataTable)
	}

	numUrl := fmt.Sprintf("http://%d.push2.eastmoney.com/api/qt/clist/get?pn=1&pz=20&po=0&np=1&fltt=2" +
		"&invt=2&fid=f12&fs=m:0+t:6,m:0+t:80,m:1+t:2,m:1+t:23&fields=f1,f2,f3,f4,f5,f6,f7,f8,f9,f10,f12,f13," +
		"f14,f15,f16,f17,f18,f20,f21,f23,f24,f25,f22,f11,f62,f128,f136,f115,f152", rand.Intn(99) + 1)

	numUrlContent := httpFetch(numUrl)
	logrus.Tracef("url: %v, content: %v", numUrl, numUrlContent)

	stockNum := int(gjson.Get(numUrlContent, "data.total").Int())
	pageNum := (stockNum - 1) / emStockNumPerPage + 1
	logrus.Debugf("stockNum: %v, pageNum: %v", stockNum, pageNum)

	//truncate table
	_, err := db.Exec(fmt.Sprintf("truncate table %s", emCodeDataTable))
	if err != nil {
		panic(err.Error()) //proper error handling instead of panic in your app
	}

	var wg sync.WaitGroup
	for i := 1; i <= pageNum; i++ {
		wg.Add(1)
		go func(num int) {
			defer wg.Done()

			//rand.Intn(n) -> [0, n)
			rand.Seed(time.Now().UnixNano())
			serverID := rand.Intn(99) + 1

			dataUrl := fmt.Sprintf("http://%d.push2.eastmoney.com/api/qt/clist/get?pn=%d&pz=%d&po=0&np=1" +
				"&fltt=2&invt=2&fid=f12&fs=m:0+t:6,m:0+t:80,m:1+t:2,m:1+t:23&fields=f1,f2,f3,f4,f5,f6,f7,f8,f9," +
				"f10,f12,f13,f14,f15,f16,f17,f18,f20,f21,f23,f24,f25,f22,f11,f62,f128,f136,f115,f152",
				serverID, num, emStockNumPerPage)

			dataUrlContent := httpFetch(dataUrl)
			logrus.Tracef("pageIndex: %v, url: %v, content: %v", num, dataUrl, dataUrlContent)

			itemNum := int(gjson.Get(dataUrlContent, "data.diff.#").Int())
			logrus.Debugf("pageIndex: %v, itemNum: %v", num, itemNum)

			var builder strings.Builder
			//var dataPath string
			var codePath, namePath string
			var code, name string

			builder.WriteString(fmt.Sprintf("insert into %s (code, name) values ", emCodeDataTable))

			for j := 0; j < itemNum; j++ {
				//dataPath = fmt.Sprintf("data.diff.%d", j)
				//logrus.Tracef("pageIndex: %v, itemIndex: %v, diff: %v", num, j, gjson.Get(dataUrlContent, dataPath))

				codePath = fmt.Sprintf("data.diff.%d.f12", j)
				namePath = fmt.Sprintf("data.diff.%d.f14", j)
				code = gjson.Get(dataUrlContent, codePath).String()
				name = gjson.Get(dataUrlContent, namePath).String()

				//如果希望按习惯上的字符个数来计算，就需要使用 Go 语言中 UTF-8 包提供的 RuneCountInString() 函数，统计 Uncode 字符数量
				//import "unicode/utf8"
				logrus.Tracef("code: %v(%T), name: %v(%T), len(name): %v, RuneCountInString(name): %v",
					code, code, name, name, len(name), utf8.RuneCountInString(name))

				//最后一行数据后，不能有逗号
				if j < itemNum - 1 {
					builder.WriteString("(\"" + code + "\", \"" + name + "\"), ")
				} else {
					builder.WriteString("(\"" + code + "\", \"" + name + "\")")
				}
			}

			logrus.Debugf("pageIndex: %v, InsertStr: %v", num, builder.String())

			//Execute the query
			_, err := db.Exec(builder.String())
			if err != nil {
				logrus.Warningf("pageIndex: %v, InsertStr: %v", num, builder.String())
				panic(err.Error()) //proper error handling instead of panic in your app
			}
		}(i)
	}

	wg.Wait()

	updateStr := fmt.Sprintf("insert into %s (name, date) values (\"%s\", \"%s\") on duplicate key " +
		"update date = values(date)", updateStatusTable, emCodeDataTable, updateDateStr)

	_, err = db.Exec(updateStr)
	if err != nil {
		logrus.Warningf("updateStr: %v", updateStr)
		panic(err.Error()) //proper error handling instead of panic in your app
	}
}

/*
获取沪深A股股票数量
http://vip.stock.finance.sina.com.cn/quotes_service/api/json_v2.php/Market_Center.getHQNodeStockCount?node=hs_a
获取沪深A股股票列表，num为page size，sort=symbol表示按照代码排序，asc为1表示升序，为0表示降序
http://vip.stock.finance.sina.com.cn/quotes_service/api/json_v2.php/Market_Center.getHQNodeData?page=1&num=80&sort=symbol&asc=1&node=hs_a&symbol=&_s_r_a=sort

获取风险警示板股票数量
http://vip.stock.finance.sina.com.cn/quotes_service/api/json_v2.php/Market_Center.getHQNodeStockCount?node=shfxjs
获取风险警示板股票列表，num为page size，sort=symbol表示按照代码排序，asc为1表示升序，为0表示降序
http://vip.stock.finance.sina.com.cn/quotes_service/api/json_v2.php/Market_Center.getHQNodeData?page=1&num=80&sort=symbol&asc=1&node=shfxjs&symbol=&_s_r_a=sort
*/
func updateSinaTodayData(db *sql.DB) {
	dateStr := getUpdateDate(codeDataTable, db)
	updateDateStr := fmt.Sprintf("%v-%02d-%02d", time.Now().Year(), time.Now().Month(), time.Now().Day())
	logrus.Debugf("dateStr: %v, updateDateStr: %v", dateStr, updateDateStr)

	if updateDateStr == dateStr {
		logrus.Infof("The %s table is updated to latest date...", codeDataTable)
		return
	} else {
		logrus.Infof("start to update %v table...", codeDataTable)
	}

	//truncate table
	_, err := db.Exec(fmt.Sprintf("truncate table %s", codeDataTable))
	if err != nil {
		panic(err.Error()) //proper error handling instead of panic in your app
	}

	//hs_a(沪深A股股票)，shfxjs(风险警示板股票)，两者数据有重复，所以使用"insert ignore into"语句
	nodeSlice := []string{"hs_a", "shfxjs"}

	var builder strings.Builder
	//var dataPath string
	var codePath, namePath string
	var code, name string
	var pageUrl, pageUrlContent, dataUrl, dataUrlContent string
	var stockNum, pageNum, itemNum int

	for _, node := range nodeSlice {
		pageUrl = fmt.Sprintf("http://vip.stock.finance.sina.com.cn/quotes_service/api/json_v2.php/"+
			"Market_Center.getHQNodeStockCount?node=%s", node)

		pageUrlContent = httpFetch(pageUrl)
		logrus.Tracef("url: %v, content: %v", pageUrl, pageUrlContent)

		//去除"字符，然后再转为整数
		stockNum, _ = strconv.Atoi(strings.ReplaceAll(pageUrlContent, "\"", ""))
		pageNum = (stockNum - 1) / sinaStockNumPerPage + 1
		logrus.Tracef("stockNum: %v, pageNum: %v", stockNum, pageNum)

		for num := 1; num <= pageNum; num++ {
			dataUrl = fmt.Sprintf("http://vip.stock.finance.sina.com.cn/quotes_service/api/json_v2.php/" +
				"Market_Center.getHQNodeData?page=%d&num=%d&sort=symbol&asc=1&node=%s&symbol=&_s_r_a=sort",
				num, sinaStockNumPerPage, node)

			dataUrlContent = httpFetch(dataUrl)
			logrus.Tracef("pageIndex: %v, url: %v, content: %v", num, dataUrl, dataUrlContent)
			itemNum = int(gjson.Get(dataUrlContent, "#").Int())

			logrus.Debugf("pageIndex: %v, itemNum: %v", num, itemNum)

			builder.Reset()
			builder.WriteString(fmt.Sprintf("insert ignore into %s (code, name) values ", codeDataTable))

			for j := 0; j < itemNum; j++ {
				//dataPath = fmt.Sprintf("%d", j)
				//logrus.Tracef("pageIndex, itemIndex, diff: %v", num, j, gjson.Get(dataUrlContent, dataPath))

				codePath = fmt.Sprintf("%d.code", j)
				namePath = fmt.Sprintf("%d.name", j)
				code = gjson.Get(dataUrlContent, codePath).String()
				name = gjson.Get(dataUrlContent, namePath).String()

				//如果希望按习惯上的字符个数来计算，就需要使用 Go 语言中 UTF-8 包提供的 RuneCountInString() 函数，统计 Uncode 字符数量
				//import "unicode/utf8"
				logrus.Tracef("code: %v(%T), name: %v(%T), len(name): %v, RuneCountInString(name): %v",
					code, code, name, name, len(name), utf8.RuneCountInString(name))

				//最后一行数据后，不能有逗号
				if j < itemNum - 1 {
					builder.WriteString("(\"" + code + "\", \"" + name + "\"), ")
				} else {
					builder.WriteString("(\"" + code + "\", \"" + name + "\")")
				}
			}

			logrus.Debugf("pageIndex: %v, InsertStr: %v", num, builder.String())

			//Execute the query
			_, err := db.Exec(builder.String())
			if err != nil {
				logrus.Warningf("pageIndex: %v, InsertStr: %v", num, builder.String())
				panic(err.Error()) //proper error handling instead of panic in your app
			}
		}
	}

	updateStr := fmt.Sprintf("insert into %s (name, date) values (\"%s\", \"%s\") on duplicate key " +
		"update date = values(date)", updateStatusTable, codeDataTable, updateDateStr)

	_, err = db.Exec(updateStr)
	if err != nil {
		logrus.Warningf("updateStr: %v", updateStr)
		panic(err.Error()) //proper error handling instead of panic in your app
	}
}

/*
获取所有沪深两市的ETF列表，沪深A股，pn为page number，pz为page size，po为1表示降序，为0表示升序，fid为f3表示以涨幅排序，为f12表示以股票代码排序
http://71.push2.eastmoney.com/api/qt/clist/get?pn=1&pz=20&po=0&np=1&fltt=2&invt=2&fid=f12&fs=b:MK0021,b:MK0022,b:MK0023,b:MK0024&fields=f1,f2,f3,f4,f5,f6,f7,f8,f9,f10,f12,f13,f14,f15,f16,f17,f18,f20,f21,f23,f24,f25,f22,f11,f62,f128,f136,f115,f152
*/
func updateETFTodayData(db *sql.DB) {
	dateStr := getUpdateDate(etfCodeDataTable, db)
	updateDateStr := fmt.Sprintf("%v-%02d-%02d", time.Now().Year(), time.Now().Month(), time.Now().Day())
	logrus.Debugf("dateStr: %v, updateDateStr: %v", dateStr, updateDateStr)

	if updateDateStr == dateStr {
		logrus.Infof("The %s table is updated to latest date...", etfCodeDataTable)
		return
	} else {
		logrus.Infof("start to update %v table...", etfCodeDataTable)
	}

	numUrl := fmt.Sprintf("http://%d.push2.eastmoney.com/api/qt/clist/get?pn=1&pz=20&po=0&np=1&fltt=2" +
		"&invt=2&fid=f12&fs=b:MK0021,b:MK0022,b:MK0023,b:MK0024&fields=f1,f2,f3,f4,f5,f6,f7,f8,f9,f10,f12,f13," +
		"f14,f15,f16,f17,f18,f20,f21,f23,f24,f25,f22,f11,f62,f128,f136,f115,f152", rand.Intn(99) + 1)

	numUrlContent := httpFetch(numUrl)
	logrus.Tracef("url: %v, content: %v", numUrl, numUrlContent)

	stockNum := int(gjson.Get(numUrlContent, "data.total").Int())
	pageNum := (stockNum - 1) / emItemNumPerPage + 1
	logrus.Debugf("stockNum: %v, pageNum: %v", stockNum, pageNum)

	//truncate table
	_, err := db.Exec(fmt.Sprintf("truncate table %s", etfCodeDataTable))
	if err != nil {
		panic(err.Error()) //proper error handling instead of panic in your app
	}

	var wg sync.WaitGroup
	for i := 1; i <= pageNum; i++ {
		wg.Add(1)
		go func(num int) {
			defer wg.Done()

			//rand.Intn(n) -> [0, n)
			rand.Seed(time.Now().UnixNano())
			serverID := rand.Intn(99) + 1

			dataUrl := fmt.Sprintf("http://%d.push2.eastmoney.com/api/qt/clist/get?pn=%d&pz=%d&po=0&np=1" +
				"&fltt=2&invt=2&fid=f12&fs=b:MK0021,b:MK0022,b:MK0023,b:MK0024&fields=f1,f2,f3,f4,f5,f6,f7,f8,f9," +
				"f10,f12,f13,f14,f15,f16,f17,f18,f20,f21,f23,f24,f25,f22,f11,f62,f128,f136,f115,f152",
				serverID, num, emItemNumPerPage)

			dataUrlContent := httpFetch(dataUrl)
			logrus.Tracef("pageIndex: %v, url: %v, content: %v", num, dataUrl, dataUrlContent)

			itemNum := int(gjson.Get(dataUrlContent, "data.diff.#").Int())
			logrus.Debugf("pageIndex: %v, itemNum: %v", num, itemNum)

			var builder strings.Builder
			//var dataPath string
			var codePath, namePath string
			var code, name string

			builder.WriteString(fmt.Sprintf("insert into %s (code, name) values ", etfCodeDataTable))

			for j := 0; j < itemNum; j++ {
				//dataPath = fmt.Sprintf("data.diff.%d", j)
				//logrus.Tracef("pageIndex: %v, itemIndex: %v, diff: %v", num, j, gjson.Get(dataUrlContent, dataPath))

				codePath = fmt.Sprintf("data.diff.%d.f12", j)
				namePath = fmt.Sprintf("data.diff.%d.f14", j)
				code = gjson.Get(dataUrlContent, codePath).String()
				name = gjson.Get(dataUrlContent, namePath).String()

				//如果希望按习惯上的字符个数来计算，就需要使用 Go 语言中 UTF-8 包提供的 RuneCountInString() 函数，统计 Uncode 字符数量
				//import "unicode/utf8"
				logrus.Tracef("code: %v(%T), name: %v(%T), len(name): %v, RuneCountInString(name): %v",
					code, code, name, name, len(name), utf8.RuneCountInString(name))

				//最后一行数据后，不能有逗号
				if j < itemNum - 1 {
					builder.WriteString("(\"" + code + "\", \"" + name + "\"), ")
				} else {
					builder.WriteString("(\"" + code + "\", \"" + name + "\")")
				}
			}

			logrus.Debugf("pageIndex: %v, InsertStr: %v", num, builder.String())

			//Execute the query
			_, err := db.Exec(builder.String())
			if err != nil {
				logrus.Warningf("pageIndex: %v, InsertStr: %v", num, builder.String())
				panic(err.Error()) //proper error handling instead of panic in your app
			}
		}(i)
	}

	wg.Wait()

	updateStr := fmt.Sprintf("insert into %s (name, date) values (\"%s\", \"%s\") on duplicate key " +
		"update date = values(date)", updateStatusTable, etfCodeDataTable, updateDateStr)

	_, err = db.Exec(updateStr)
	if err != nil {
		logrus.Debugf("updateStr: %v", updateStr)
		panic(err.Error()) //proper error handling instead of panic in your app
	}
}

/*
sortColumns=BOARD_CODE，sortTypes=1表示按照BOARD_CODE升序排列, pageSize=50，pageNumber=1
https://datacenter-web.eastmoney.com/api/data/v1/get?sortColumns=BOARD_CODE&sortTypes=1&pageSize=50&pageNumber=1&reportName=RPT_VALUEINDUSTRY_DET&columns=ALL&quoteColumns=&source=WEB&client=WEB&filter=(TRADE_DATE='2021-11-15')
*/
func updateBasicIndustryData(db *sql.DB) {
	dateStr := getUpdateDate(basicIndustryDataTable, db)
	updateDateStr := ""

	if time.Now().Day() >= 1 && time.Now().Day() < 15 {
		updateDateStr = fmt.Sprintf("%v-%02d-%02d", time.Now().Year(), time.Now().Month(), 1)
	} else {
		updateDateStr = fmt.Sprintf("%v-%02d-%02d", time.Now().Year(), time.Now().Month(), 15)
	}

	logrus.Debugf("dateStr: %v, updateDateStr: %v", dateStr, updateDateStr)

	if updateDateStr == dateStr {
		logrus.Infof("The %s table is updated to latest date...", basicIndustryDataTable)
		return
	} else {
		logrus.Infof("start to update %v table...", basicIndustryDataTable)
	}

	reportDate := getLastTradeDay(time.Now().AddDate(0, 0, -1), "D")
	reportDateStr := reportDate.Format("2006-01-02")
	numUrl := fmt.Sprintf("https://datacenter-web.eastmoney.com/api/data/v1/get?sortColumns=BOARD_CODE" +
		"&sortTypes=1&pageSize=50&pageNumber=1&reportName=RPT_VALUEINDUSTRY_DET&columns=ALL&quoteColumns=" +
		"&source=WEB&client=WEB&filter=(TRADE_DATE='%s')", reportDateStr)

	numUrlContent := httpFetch(numUrl)
	logrus.Tracef("url: %v, content: %v", numUrl, numUrlContent)

	stockNum := int(gjson.Get(numUrlContent, "result.count").Int())
	pageNum := (stockNum - 1) / emItemNumPerPage + 1
	logrus.Debugf("stockNum: %v, pageNum: %v", stockNum, pageNum)

	//truncate table
	_, err := db.Exec(fmt.Sprintf("truncate table %s", basicIndustryDataTable))
	if err != nil {
		panic(err.Error()) //proper error handling instead of panic in your app
	}

	var wg sync.WaitGroup
	for i := 1; i <= pageNum; i++ {
		wg.Add(1)
		go func(num int) {
			defer wg.Done()

			dataUrl := fmt.Sprintf("https://datacenter-web.eastmoney.com/api/data/v1/get?" +
				"sortColumns=BOARD_CODE&sortTypes=1&pageSize=%d&pageNumber=%d&reportName=RPT_VALUEINDUSTRY_DET" +
				"&columns=ALL&quoteColumns=&source=WEB&client=WEB&filter=(TRADE_DATE='%s')",
				emItemNumPerPage, num, reportDateStr)

			dataUrlContent := httpFetch(dataUrl)
			logrus.Tracef("pageIndex: %v, url: %v, content: %v", num, dataUrl, dataUrlContent)

			itemNum := int(gjson.Get(dataUrlContent, "result.data.#").Int())
			logrus.Debugf("pageIndex: %v, itemNum: %v", num, itemNum)

			var p fastjson.Parser
			v, _ := p.Parse(dataUrlContent)

			var builder strings.Builder
			//var dataPath string
			var fieldStr string
			var mapIndex int

			fieldTypeMap := map[string]string{
				"BOARD_CODE": "string", "BOARD_NAME": "string", "FREE_SHARES_VAG": "float", "LOSS_COUNT": "int",
				"MARKET_CAP_VAG": "float", "NOMARKETCAP_A_VAG": "float", "NOTLIMITED_MARKETCAP_A": "float",
				"NUM": "int", "ORIGINALCODE": "string", "PB_MRQ": "float", "PCF_OCF_TTM": "float",
				"PEG_CAR": "float", "PE_LAR": "float", "PE_TTM": "float", "PS_TTM": "float",
				"TOTAL_MARKET_CAP": "float", "TOTAL_SHARES": "int", "TOTAL_SHARES_VAG": "float",
			}
			fieldValueSlice := []string{"BOARD_CODE", "BOARD_NAME", "FREE_SHARES_VAG", "LOSS_COUNT", "MARKET_CAP_VAG",
				"NOMARKETCAP_A_VAG", "NOTLIMITED_MARKETCAP_A", "NUM", "ORIGINALCODE", "PB_MRQ", "PCF_OCF_TTM",
				"PEG_CAR", "PE_LAR", "PE_TTM", "PS_TTM", "TOTAL_MARKET_CAP", "TOTAL_SHARES", "TOTAL_SHARES_VAG"}
			fieldValueStr := strings.Join(fieldValueSlice, ", ")
			fieldValueSliceLen := len(fieldValueSlice)

			builder.WriteString(fmt.Sprintf("insert into %s (%s) values ",
				basicIndustryDataTable, fieldValueStr))

			for j := 0; j < itemNum; j++ {
				//dataPath = fmt.Sprintf("result.data.%d", j)
				//logrus.Tracef("pageIndex: %v, itemIndex: %v, data: %v", num, j, gjson.Get(dataUrlContent, dataPath))

				builder.WriteString("(")
				mapIndex = 0

				for _, key := range fieldValueSlice {
					if "string" == fieldTypeMap[key] {
						fieldStr = string(v.GetStringBytes("result", "data", fmt.Sprintf("%d", j), key))
					} else if "int" == fieldTypeMap[key] {
						/*
						func FormatInt(i int64, base int) string
						返回i的base进制的字符串表示。base 必须在2到36之间，结果中会使用小写字母'a'到'z'表示大于10的数字。

						func Itoa(i int) string
						Itoa是FormatInt(i, 10) 的简写。
						*/
						fieldStr = strconv.FormatInt(v.GetInt64("result", "data", fmt.Sprintf("%d", j), key), 10)
					} else {
						/*
						func FormatFloat(f float64, fmt byte, prec, bitSize int) string
						函数将浮点数表示为字符串并返回。

						bitSize表示f的来源类型（32：float32、64：float64），会据此进行舍入。

						fmt表示格式：'f'（-ddd.dddd）、'b'（-ddddp±ddd，指数为二进制）、'e'（-d.dddde±dd，十进制指数）、
						'E'（-d.ddddE±dd，十进制指数）、'g'（指数很大时用'e'格式，否则'f'格式）、'G'（指数很大时用'E'格式，否则'f'格式）。

						prec控制精度（排除指数部分）：对'f'、'e'、'E'，它表示小数点后的数字个数；对'g'、'G'，它控制总的数字个数。
						如果prec 为-1，则代表使用最少数量的、但又必需的数字来表示f。
						*/
						fieldStr = strconv.FormatFloat(
							v.GetFloat64("result", "data", fmt.Sprintf("%d", j), key), 'f', -1, 64)
					}

					logrus.Tracef("key: %v, value: %f, fieldStr: %v",
						key, v.GetFloat64("result", "data", fmt.Sprintf("%d", j), key), fieldStr)

					mapIndex += 1
					if mapIndex < fieldValueSliceLen {
						builder.WriteString("\"" + fieldStr + "\", ")
					} else {
						builder.WriteString("\"" + fieldStr + "\"")
					}
				}

				//最后一行数据后，不能有逗号
				if j < itemNum - 1 {
					builder.WriteString("), ")
				} else {
					builder.WriteString(")")
				}
			}

			logrus.Debugf("pageIndex: %v, InsertStr: %v", num, builder.String())

			//Execute the query
			_, err := db.Exec(builder.String())
			if err != nil {
				logrus.Warningf("pageIndex: %v, InsertStr: %v", num, builder.String())
				panic(err.Error()) //proper error handling instead of panic in your app
			}
		}(i)
	}

	wg.Wait()

	updateStr := fmt.Sprintf("insert into %s (name, date) values (\"%s\", \"%s\") on duplicate key " +
		"update date = values(date)", updateStatusTable, basicIndustryDataTable, updateDateStr)

	_, err = db.Exec(updateStr)
	if err != nil {
		logrus.Debugf("updateStr: %v", updateStr)
		panic(err.Error()) //proper error handling instead of panic in your app
	}
}

/*
sortColumns=SECURITY_CODE，sortTypes=1表示按照SECURITY_CODE升序排列, pageSize=50，pageNumber=1
https://datacenter-web.eastmoney.com/api/data/v1/get?sortColumns=SECURITY_CODE&sortTypes=1&pageSize=50&pageNumber=1&reportName=RPT_VALUEANALYSIS_DET&columns=ALL&quoteColumns=&source=WEB&client=WEB&filter=(TRADE_DATE='2021-11-15')
*/
func updateBasicStockData(db *sql.DB) {
	dateStr := getUpdateDate(basicStockDataTable, db)
	updateDateStr := ""

	if time.Now().Day() >= 1 && time.Now().Day() < 15 {
		updateDateStr = fmt.Sprintf("%v-%02d-%02d", time.Now().Year(), time.Now().Month(), 1)
	} else {
		updateDateStr = fmt.Sprintf("%v-%02d-%02d", time.Now().Year(), time.Now().Month(), 15)
	}

	logrus.Debugf("dateStr: %v, updateDateStr: %v", dateStr, updateDateStr)

	if updateDateStr == dateStr {
		logrus.Infof("The %s table is updated to latest date...", basicStockDataTable)
		return
	} else {
		logrus.Infof("start to update %v table...", basicStockDataTable)
	}

	reportDate := getLastTradeDay(time.Now().AddDate(0, 0, -1), "D")
	reportDateStr := reportDate.Format("2006-01-02")
	numUrl := fmt.Sprintf("https://datacenter-web.eastmoney.com/api/data/v1/get?sortColumns=SECURITY_CODE" +
		"&sortTypes=1&pageSize=50&pageNumber=1&reportName=RPT_VALUEANALYSIS_DET&columns=ALL&quoteColumns=" +
		"&source=WEB&client=WEB&filter=(TRADE_DATE='%s')", reportDateStr)

	numUrlContent := httpFetch(numUrl)
	logrus.Tracef("url: %v, content: %v", numUrl, numUrlContent)

	stockNum := int(gjson.Get(numUrlContent, "result.count").Int())
	pageNum := (stockNum - 1) / emItemNumPerPage + 1
	logrus.Debugf("stockNum: %v, pageNum: %v", stockNum, pageNum)

	//truncate table
	_, err := db.Exec(fmt.Sprintf("truncate table %s", basicStockDataTable))
	if err != nil {
		panic(err.Error()) //proper error handling instead of panic in your app
	}

	var wg sync.WaitGroup
	for i := 1; i <= pageNum; i++ {
		wg.Add(1)
		go func(num int) {
			defer wg.Done()

			dataUrl := fmt.Sprintf("https://datacenter-web.eastmoney.com/api/data/v1/get?" +
				"sortColumns=SECURITY_CODE&sortTypes=1&pageSize=%d&pageNumber=%d&reportName=RPT_VALUEANALYSIS_DET" +
				"&columns=ALL&quoteColumns=&source=WEB&client=WEB&filter=(TRADE_DATE='%s')",
				emItemNumPerPage, num, reportDateStr)

			dataUrlContent := httpFetch(dataUrl)
			logrus.Tracef("pageIndex: %v, url: %v, content: %v", num, dataUrl, dataUrlContent)

			itemNum := int(gjson.Get(dataUrlContent, "result.data.#").Int())
			logrus.Debugf("pageIndex: %v, itemNum: %v", num, itemNum)

			var p fastjson.Parser
			v, _ := p.Parse(dataUrlContent)

			var builder strings.Builder
			//var dataPath string
			var fieldStr string
			var mapIndex int

			fieldTypeMap := map[string]string{
				"BOARD_CODE": "string", "BOARD_NAME": "string", "CHANGE_RATE": "float", "CLOSE_PRICE": "float",
				"FREE_SHARES_A": "int", "NOTLIMITED_MARKETCAP_A": "float", "ORG_CODE": "string",
				"ORIG_BOARD_CODE": "string", "PB_MRQ": "float", "PCF_OCF_LAR": "float", "PCF_OCF_TTM": "float",
				"PEG_CAR": "float", "PE_LAR": "float", "PE_TTM": "float", "PS_TTM": "float", "SECURITY_CODE": "string",
				"SECURITY_NAME_ABBR": "string", "TOTAL_MARKET_CAP": "float", "TOTAL_SHARES": "int",
			}
			fieldValueSlice := []string{
				"BOARD_CODE", "BOARD_NAME", "CHANGE_RATE", "CLOSE_PRICE", "FREE_SHARES_A", "NOTLIMITED_MARKETCAP_A",
				"ORG_CODE", "ORIG_BOARD_CODE", "PB_MRQ", "PCF_OCF_LAR", "PCF_OCF_TTM", "PEG_CAR", "PE_LAR", "PE_TTM",
				"PS_TTM", "SECURITY_CODE", "SECURITY_NAME_ABBR", "TOTAL_MARKET_CAP", "TOTAL_SHARES"}
			fieldValueStr := strings.Join(fieldValueSlice, ", ")
			fieldValueSliceLen := len(fieldValueSlice)

			builder.WriteString(fmt.Sprintf("insert into %s (%s) values ",
				basicStockDataTable, fieldValueStr))

			for j := 0; j < itemNum; j++ {
				//dataPath = fmt.Sprintf("result.data.%d", j)
				//logrus.Tracef("pageIndex: %v, itemIndex: %v, data: %v", num, j, gjson.Get(dataUrlContent, dataPath))

				builder.WriteString("(")
				mapIndex = 0

				for _, key := range fieldValueSlice {
					if "string" == fieldTypeMap[key] {
						fieldStr = string(v.GetStringBytes("result", "data", fmt.Sprintf("%d", j), key))
					} else if "int" == fieldTypeMap[key] {
						/*
							func FormatInt(i int64, base int) string
							返回i的base进制的字符串表示。base 必须在2到36之间，结果中会使用小写字母'a'到'z'表示大于10的数字。

							func Itoa(i int) string
							Itoa是FormatInt(i, 10) 的简写。
						*/
						fieldStr = strconv.FormatInt(v.GetInt64("result", "data", fmt.Sprintf("%d", j), key), 10)
					} else {
						/*
							func FormatFloat(f float64, fmt byte, prec, bitSize int) string
							函数将浮点数表示为字符串并返回。

							bitSize表示f的来源类型（32：float32、64：float64），会据此进行舍入。

							fmt表示格式：'f'（-ddd.dddd）、'b'（-ddddp±ddd，指数为二进制）、'e'（-d.dddde±dd，十进制指数）、
							'E'（-d.ddddE±dd，十进制指数）、'g'（指数很大时用'e'格式，否则'f'格式）、'G'（指数很大时用'E'格式，否则'f'格式）。

							prec控制精度（排除指数部分）：对'f'、'e'、'E'，它表示小数点后的数字个数；对'g'、'G'，它控制总的数字个数。
							如果prec 为-1，则代表使用最少数量的、但又必需的数字来表示f。
						*/
						fieldStr = strconv.FormatFloat(
							v.GetFloat64("result", "data", fmt.Sprintf("%d", j), key), 'f', -1, 64)
					}

					logrus.Tracef("key: %v, value: %f, fieldStr: %v",
						key, v.GetFloat64("result", "data", fmt.Sprintf("%d", j), key), fieldStr)

					mapIndex += 1
					if mapIndex < fieldValueSliceLen {
						builder.WriteString("\"" + fieldStr + "\", ")
					} else {
						builder.WriteString("\"" + fieldStr + "\"")
					}
				}

				//最后一行数据后，不能有逗号
				if j < itemNum - 1 {
					builder.WriteString("), ")
				} else {
					builder.WriteString(")")
				}
			}

			logrus.Debugf("pageIndex: %v, InsertStr: %v", num, builder.String())

			//Execute the query
			_, err := db.Exec(builder.String())
			if err != nil {
				logrus.Warningf("pageIndex: %v, InsertStr: %v", num, builder.String())
				panic(err.Error()) //proper error handling instead of panic in your app
			}
		}(i)
	}

	wg.Wait()

	updateStr := fmt.Sprintf("insert into %s (name, date) values (\"%s\", \"%s\") on duplicate key " +
		"update date = values(date)", updateStatusTable, basicStockDataTable, updateDateStr)

	_, err = db.Exec(updateStr)
	if err != nil {
		logrus.Debugf("updateStr: %v", updateStr)
		panic(err.Error()) //proper error handling instead of panic in your app
	}
}

/*
pn为page number，pz为page size，po为1表示降序，为0表示升序，fid为f3表示以涨幅排序，为f12表示以股票代码排序
http://44.push2.eastmoney.com/api/qt/clist/get?pn=5&pz=1000&po=0&np=1&fltt=2&invt=2&fid=f12&fs=m:0+t:6,m:0+t:80,m:1+t:2,m:1+t:23&fields=f36,f38,f41,f48,f49,f52,f9,f23,f115,f40,f57,f61,f112,f6,f25,f14,f45,f55,f59,f102,f2,f3,f113,f378,f54,f109,f53,f377,f47,f50,f56,f58,f12,f24,f21,f26,f37,f46,f60,f110,f5,f20,f129,f100,f114,f160,f39,f51
*/
func updateBasicAllInfoData(db *sql.DB) {
	dateStr := getUpdateDate(basicAllDataTable, db)
	updateDateStr := ""

	if time.Now().Day() >= 1 && time.Now().Day() < 15 {
		updateDateStr = fmt.Sprintf("%v-%02d-%02d", time.Now().Year(), time.Now().Month(), 1)
	} else {
		updateDateStr = fmt.Sprintf("%v-%02d-%02d", time.Now().Year(), time.Now().Month(), 15)
	}

	logrus.Debugf("dateStr: %v, updateDateStr: %v", dateStr, updateDateStr)

	if updateDateStr == dateStr {
		logrus.Infof("The %s table is updated to latest date...", basicAllDataTable)
		return
	} else {
		logrus.Infof("start to update %v table...", basicAllDataTable)
	}

	numUrl := fmt.Sprintf("http://%d.push2.eastmoney.com/api/qt/clist/get?pn=1&pz=20&po=0&np=1&fltt=2" +
		"&invt=2&fid=f12&fs=m:0+t:6,m:0+t:80,m:1+t:2,m:1+t:23&fields=f1,f2,f3,f4,f5,f6,f7,f8,f9,f10,f12,f13," +
		"f14,f15,f16,f17,f18,f20,f21,f23,f24,f25,f22,f11,f62,f128,f136,f115,f152", rand.Intn(99) + 1)

	numUrlContent := httpFetch(numUrl)
	logrus.Tracef("url: %v, content: %v", numUrl, numUrlContent)

	stockNum := int(gjson.Get(numUrlContent, "data.total").Int())
	pageNum := (stockNum - 1) / emStockNumPerPage + 1
	logrus.Debugf("stockNum: %v, pageNum: %v", stockNum, pageNum)

	//truncate table
	_, err := db.Exec(fmt.Sprintf("truncate table %s", basicAllDataTable))
	if err != nil {
		panic(err.Error()) //proper error handling instead of panic in your app
	}

	var wg sync.WaitGroup
	for i := 1; i <= pageNum; i++ {
		wg.Add(1)
		go func(num int) {
			defer wg.Done()

			//rand.Intn(n) -> [0, n)
			rand.Seed(time.Now().UnixNano())
			serverID := rand.Intn(99) + 1

			fieldMap := map[string]string{
				"f2": "price", "f3": "p_change", "f5": "volume", "f6": "amount", "f9": "dynamic_pe",
				"f12": "code", "f14": "name", "f20": "totalMarketCap", "f21": "marketCap", "f23": "pb",
				"f24": "60days_p_change", "f25": "year_p_change", "f26": "timeToMarket", "f36": "per_holdings",
				"f37": "roe", "f38": "totals", "f39": "outstanding", "f40": "revenue", "f41": "revenueRatio",
				"f45": "profit", "f46": "profitRatio", "f47": "undp", "f48": "perundp", "f49": "gpr",
				"f50": "totalAssets", "f51": "liquidAssets", "f52": "fixedAssets", "f53": "intangibleAssets",
				"f54": "totalLiability", "f55": "currentLiability", "f56": "noncurrentLiability",
				"f57": "debtAssetRatio", "f58": "shareholdersEquity", "f59": "equityRatio", "f60": "reserved",
				"f61": "reservedPerShare", "f100": "industry", "f102": "area", "f109": "5days_p_change",
				"f110": "20days_p_change", "f112": "esp", "f113": "bvps", "f114": "static_pe",
				"f115": "rolling_pe", "f129": "npr", "f160": "10days_p_change",
				"f377": "52weeks_low", "f378": "52weeks_high"}
			fieldTypeMap := map[string]string{
				"f2": "float", "f3": "float", "f5": "int", "f6": "float", "f9": "float",
				"f12": "string", "f14": "string", "f20": "int", "f21": "int", "f23": "float",
				"f24": "float", "f25": "float", "f26": "int", "f36": "float",
				"f37": "float", "f38": "float", "f39": "float", "f40": "float", "f41": "float",
				"f45": "float", "f46": "float", "f47": "float", "f48": "float", "f49": "float",
				"f50": "float", "f51": "float", "f52": "float", "f53": "float",
				"f54": "float", "f55": "float", "f56": "float",
				"f57": "float", "f58": "float", "f59": "float", "f60": "float",
				"f61": "float", "f100": "string", "f102": "string", "f109": "float",
				"f110": "float", "f112": "float", "f113": "float", "f114": "float",
				"f115": "float", "f129": "float", "f160": "float",
				"f377": "float", "f378": "float"}

			var fieldKeySlice []string
			var fieldValueSlice []string

			for key, value := range fieldMap {
				fieldKeySlice = append(fieldKeySlice, key)
				fieldValueSlice = append(fieldValueSlice, value)
			}

			fieldKeySliceLen := len(fieldKeySlice)
			fieldKeyStr := strings.Join(fieldKeySlice, ",")
			fieldValueStr := strings.Join(fieldValueSlice, ", ")

			dataUrl := fmt.Sprintf("http://%d.push2.eastmoney.com/api/qt/clist/get?pn=%d&pz=%d&po=0&np=1" +
				"&fltt=2&invt=2&fid=f12&fs=m:0+t:6,m:0+t:80,m:1+t:2,m:1+t:23&fields=%s",
				serverID, num, emStockNumPerPage, fieldKeyStr)

			dataUrlContent := httpFetch(dataUrl)
			logrus.Tracef("pageIndex: %v, url: %v, content: %v", num, dataUrl, dataUrlContent)

			itemNum := int(gjson.Get(dataUrlContent, "data.diff.#").Int())
			logrus.Debugf("pageIndex: %v, itemNum: %v", num, itemNum)

			var p fastjson.Parser
			v, _ := p.Parse(dataUrlContent)

			/*
				https://geektutu.com/post/hpg-string-concat.html
				https://www.flysnow.org/2018/11/05/golang-concat-strings-performance-analysis.html

				整体和100个字符串的时候差不多，表现好的还是Join和Builder。这两个方法的使用侧重点有些不一样，
				如果有现成的数组、切片那么可以直接使用Join,但是如果没有，并且追求灵活性拼接，还是选择Builder。
				Join还是定位于有现成切片、数组的（毕竟拼接成数组也要时间），并且使用固定方式进行分解的，比如逗号、空格等，局限比较大。

				从最近的这两篇文章的分析来看，我们大概可以总结出。

				+ 连接适用于短小的、常量字符串（明确的，非变量），因为编译器会给我们优化。
				Join是比较统一的拼接，不太灵活
				fmt和buffer基本上不推荐
				builder从性能和灵活性上，都是上佳的选择。
			*/
			var builder strings.Builder
			//var dataPath string
			var fieldStr string
			var mapIndex int

			builder.WriteString(fmt.Sprintf("insert into %s (%s) values ", basicAllDataTable, fieldValueStr))

			for j := 0; j < itemNum; j++ {
				//在复杂的json中，gjson的效率很低，推荐用fastjson
				//dataPath = fmt.Sprintf("data.diff.%d", j)
				//logrus.Tracef("diff: %v\n", gjson.Get(dataUrlContent, dataPath))

				builder.WriteString("(")
				mapIndex = 0

				for _, key := range fieldKeySlice {
					if "string" == fieldTypeMap[key] {
						fieldStr = string(v.GetStringBytes("data", "diff", fmt.Sprintf("%d", j), key))
					} else if "int" == fieldTypeMap[key] {
						/*
							func FormatInt(i int64, base int) string
							返回i的base进制的字符串表示。base 必须在2到36之间，结果中会使用小写字母'a'到'z'表示大于10的数字。

							func Itoa(i int) string
							Itoa是FormatInt(i, 10) 的简写。
						*/
						fieldStr = strconv.FormatInt(v.GetInt64("data", "diff", fmt.Sprintf("%d", j), key), 10)
					} else {
						/*
							func FormatFloat(f float64, fmt byte, prec, bitSize int) string
							函数将浮点数表示为字符串并返回。

							bitSize表示f的来源类型（32：float32、64：float64），会据此进行舍入。

							fmt表示格式：'f'（-ddd.dddd）、'b'（-ddddp±ddd，指数为二进制）、'e'（-d.dddde±dd，十进制指数）、
							'E'（-d.ddddE±dd，十进制指数）、'g'（指数很大时用'e'格式，否则'f'格式）、'G'（指数很大时用'E'格式，否则'f'格式）。

							prec控制精度（排除指数部分）：对'f'、'e'、'E'，它表示小数点后的数字个数；对'g'、'G'，它控制总的数字个数。
							如果prec 为-1，则代表使用最少数量的、但又必需的数字来表示f。
						*/
						fieldStr = strconv.FormatFloat(
							v.GetFloat64("data", "diff", fmt.Sprintf("%d", j), key), 'f', -1, 64)
					}

					logrus.Tracef("key: %v, value: %f, fieldStr: %v\n",
						key, v.GetFloat64("data", "diff", fmt.Sprintf("%d", j), key), fieldStr)

					mapIndex += 1
					if mapIndex < fieldKeySliceLen {
						builder.WriteString("\"" + fieldStr + "\", ")
					} else {
						builder.WriteString("\"" + fieldStr + "\"")
					}
				}

				if j < itemNum - 1 {
					builder.WriteString("), ")
				} else {
					builder.WriteString(")")
				}
			}

			logrus.Debugf("pageIndex: %v, InsertStr: %v", num, builder.String())

			//Execute the query
			_, err := db.Exec(builder.String())
			if err != nil {
				logrus.Warningf("pageIndex: %v, InsertStr: %v", num, builder.String())
				panic(err.Error()) //proper error handling instead of panic in your app
			}
		}(i)
	}

	wg.Wait()

	updateStr := fmt.Sprintf("insert into %s (name, date) values (\"%s\", \"%s\") on duplicate key " +
		"update date = values(date)", updateStatusTable, basicAllDataTable, updateDateStr)

	_, err = db.Exec(updateStr)
	if err != nil {
		logrus.Debugf("updateStr: %v", updateStr)
		panic(err.Error()) //proper error handling instead of panic in your app
	}
}

/*
北交所
http://stock.jrj.com.cn/2021/11/12181333841925.shtml
根据指引，证券代码采用六位数的数字型编制方法。上市公司及挂牌公司普通股票证券代码首两位代码为83、87、88；
公开发行股票的发行代码从88号段选取，首三位代码为889。

沪深股票编码
https://news.cnstock.com/news,bwkx-202012-4637800.htm
https://finance.eastmoney.com/a/201912071316201096.html
12月6日，上海证券交易所发布《上海证券交易所证券代码分配指南》，自即日起施行。
　　其中，六位代码的第一位为6对应的是A股和存托凭证，第二、三位为00、01、03都对应沪市A股股票，第二、第三位为88对应科创板股票，第二、第三位为89对应科创板存托凭证。
　　也就是说，未来如果科创板发行存托凭证，证券代码会是“689”打头。

https://wiki.mbalib.com/wiki/%E8%AF%81%E5%88%B8%E4%BB%A3%E7%A0%81
https://baike.baidu.com/item/%E8%82%A1%E7%A5%A8%E4%BB%A3%E7%A0%81/4474479
https://baike.baidu.com/item/%E8%AF%81%E5%88%B8%E4%BB%A3%E7%A0%81/2480277
https://baike.baidu.com/item/%E8%82%A1%E7%A5%A8%E7%BC%96%E7%A0%81%E8%A7%84%E5%88%99/6519583
上海证券代码
　　在上海证券交易所上市的证券，根据上交所"证券编码实施方案"，采用6位数编制方法，前3位数为区别证券品种，具体见下表所列：
　　001×××国债现货； 201×××国债回购；110×××120×××企业债券；129×××100×××可转换债券；310×××国债期货；500×××550×××基金；600　×××A股；700×××配股；710×××转配股；701×××转配股再配股；711×××转配股再转配股；720×××红利；730×××新股申购；735×××新基金申购；900×××B股；737×××新股配售。
深圳证券代码
　　在深圳证券交易所上市面上证券，根据深交所证券编码实施采取4位编制方法，首位证券品种区别代码，具体见下表所示：
　　0×××A股；1×××企业债券、国债回购、国债现货；2×××B股及B股权证；3×××转配股权证； 4×××基金；5×××可转换债券；6×××国债期货；7×××期权；8×××配股权证；9×××新股配售

基金
http://www.csisc.cn/zbscbzw/cpbmjj/201212/f3263ab61f7c4dba8461ebbd9d0c6755.shtml
证券投资基金编码，该编码采用6位无意义数字编码，具体分配原则如下：
    a) 主编码的分配以基金合同为单位，每个基金产品只有一个主编码，是其唯一标识。
    b) 对于因不同份额净值、收益不同的分级基金、部分货币市场基金和债券基金等，除分配主编码外，还应根据份额类别分配不同的基金编码。
    c) 在上海证券交易所挂牌的证券投资基金使用50～59开头6位数字编码，在深圳证券交易所挂牌的证券投资基金使用15～19开头6位数字编码。
 */
func getSecID(code string) string {
	secID := ""

	//沪市的secID为1，深市为0；5表示基金，6表示A股，9表示B股，11表示可转换公司债券，13表示可交换公司债券
	if "5" == code[:1] || "6" == code[:1] || "9" == code[:1]  || "11" == code[:2] || "13" == code[:2] {
		secID = "1." + code
	} else {
		secID = "0." + code
	}

	return secID
}

func getFqTableItemLastDate(code string, kind string, fqType string, kType string, db *sql.DB) string {
	lastDateStr := ""

	dateResults, err := db.Query(fmt.Sprintf("select code, date from %s where code = \"%s\" order by date desc limit 1",
		typeTableMap[kind][fqType][kType], code))
	if err != nil {
		panic(err.Error()) //proper error handling instead of panic in your app
	}

	for dateResults.Next() {
		var dateTag CodeDateTag
		//for each row, scan the result into our dateTag composite object
		err = dateResults.Scan(&dateTag.Code, &dateTag.Date)
		if err != nil {
			panic(err.Error()) //proper error handling instead of panic in your app
		}

		//and then print out the dateTag's Name attribute
		logrus.Debugf("Name: %v, Date: %v", dateTag.Code, dateTag.Date)

		lastDateStr = dateTag.Date
		break
	}

	return lastDateStr
}

/*
etf
数据与数据库表的列一一对应
http://13.push2his.eastmoney.com/api/qt/stock/kline/get?secid=0.159736&fields1=f1,f2,f3,f4,f5&fields2=f51,f52,f53,f54,f55,f56,f57&klt=101&fqt=1&beg=0&end=20500101

stock
含有多于数据库表的数据
http://81.push2his.eastmoney.com/api/qt/stock/kline/get?secid=1.603160&fields1=f1,f2,f3,f4,f5,f6,f7,f8&fields2=f51,f52,f53,f54,f55,f56,f57,f58,f59,f60,f61&klt=101&fqt=1&beg=0&end=20500101
数据与数据库表的列一一对应
http://81.push2his.eastmoney.com/api/qt/stock/kline/get?secid=1.603160&fields1=f1,f2,f3,f4,f5&fields2=f51,f52,f53,f54,f55,f56,f57&klt=101&fqt=1&beg=0&end=20500101
*/
func updateOneFqData(codeChan chan string, kind string, fqType string, kType string, wg *sync.WaitGroup, db *sql.DB) {
	defer wg.Done()

	var latestDate, startDate, endDate time.Time
	var lastDateStr, startDateStr, endDateStr string
	var secID, url, urlContent, fieldStr string
	var serverID, itemNum, pageNum int
	var startIndex, endIndex int

	var builder strings.Builder
	var p fastjson.Parser
	var v *fastjson.Value
	var fieldSlice []string

	//rand.Intn(n) -> [0, n)
	rand.Seed(time.Now().UnixNano())

	for code := range codeChan {
		lastDateStr = getFqTableItemLastDate(code, kind, fqType, kType, db)
		if "" == lastDateStr {
			startDateStr = "0"
		} else {
			latestDate, _ = time.Parse("2006-01-02", lastDateStr)

			startDate = latestDate.AddDate(0, 0, 1)
			startDateStr = startDate.Format("20060102")
		}

		endDate = getLastTradeDay(time.Now(), kType)
		endDateStr = endDate.Format("20060102")

		serverID = rand.Intn(99) + 1
		secID = getSecID(code)

		url = fmt.Sprintf("http://%d.push2his.eastmoney.com/api/qt/stock/kline/get?secid=%s" +
			"&fields1=f1,f2,f3,f4,f5&fields2=f51,f52,f53,f54,f55,f56,f57&klt=%d&fqt=%d&beg=%s&end=%s",
			serverID, secID, kTypeMap[kType], fqTypeMap[fqType], startDateStr, endDateStr)
		logrus.Debugf("code: %v, secID: %v, startDateStr: %v, endDateStr: %v url: %v",
			code, secID, startDateStr, endDateStr, url)

		urlContent = httpFetch(url)
		logrus.Tracef("code: %v, url: %v, urlContent:%v", code, url, urlContent)

		//可以获取klines的长度，也可以直接从dktotal字段中获取item的个数，从dktotal字段字段获取的数据有时候有误差(如：secid=0.159729)
		itemNum = int(gjson.Get(urlContent, "data.klines.#").Int())
		//itemNum = int(gjson.Get(urlContent, "data.dktotal").Int())
		pageNum = (itemNum - 1) / emItemNumPerPage + 1
		logrus.Debugf("code: %v, itemNum: %v, pageNum: %v", code, itemNum, pageNum)

		if 0 == itemNum {
			logrus.Infof("code: %v, kind: %v, fqType: %v, kType: %v, itemNum: %v",
				code, kind, fqType, kType, itemNum)
			continue
		}

		v, _ = p.Parse(urlContent)

		startIndex = 0
		endIndex = 0

		for i := 0; i < pageNum; i++ {
			startIndex = i * emItemNumPerPage
			if i < pageNum - 1 {
				endIndex = (i + 1) * emItemNumPerPage
			} else {
				endIndex = itemNum
			}

			builder.Reset()
			builder.WriteString(fmt.Sprintf("insert into %s (code, date, open, close, high, low, volume, amount) values ",
				typeTableMap[kind][fqType][kType]))

			for j := startIndex; j < endIndex; j++ {
				builder.WriteString("(\"" + code + "\", ")

				fieldStr = string(v.GetStringBytes("data", "klines", fmt.Sprintf("%d", j)))
				fieldSlice = strings.Split(fieldStr, ",")

				//为每个字段都添加""，避免MySQL insert错误
				//builder.WriteString(strings.Join(fieldSlice, ", "))
				builder.WriteString("\"" + strings.Join(fieldSlice, "\", \"") + "\"")

				if j < endIndex - 1 {
					builder.WriteString("), ")
				} else {
					builder.WriteString(")")
				}
			}

			logrus.Debugf("pageNum: %v, insertStr: %v", i, builder.String())

			//Execute the query
			_, err := db.Exec(builder.String())
			if err != nil {
				logrus.Warningf("pageNum: %v, insertStr: %v", i, builder.String())
				panic(err.Error()) //proper error handling instead of panic in your app
			}
		}
	}
}

func updateAllFqData(kind string, fqType string, kType string, db *sql.DB) {
	dateStr := getUpdateDate(typeTableMap[kind][fqType][kType], db)
	updateDateStr := fmt.Sprintf("%v-%02d-%02d", time.Now().Year(), time.Now().Month(), time.Now().Day())
	logrus.Debugf("dateStr: %v, updateDateStr: %v", dateStr, updateDateStr)

	if updateDateStr == dateStr {
		logrus.Infof("The %s table is updated to latest date...", typeTableMap[kind][fqType][kType])
		return
	} else {
		logrus.Infof("start to update %v table...", typeTableMap[kind][fqType][kType])
	}

	var wg sync.WaitGroup
	codeChan := make(chan string, maxGoroutinePoolNum * 2)

	for i := 0; i < maxGoroutinePoolNum; i++ {
		wg.Add(1)
		go updateOneFqData(codeChan, kind, fqType, kType, &wg, db)
	}

	//Execute the query
	codeResults, err := db.Query(fmt.Sprintf("select code, name from %s", etfCodeDataTable))
	if err != nil {
		panic(err.Error()) //proper error handling instead of panic in your app
	}

	for codeResults.Next() {
		var codeTag CodeTableTag
		//for each row, scan the result into our codeTag composite object
		err = codeResults.Scan(&codeTag.Code, &codeTag.Name)
		if err != nil {
			panic(err.Error()) //proper error handling instead of panic in your app
		}

		//and then print out the codeTag's Name attribute
		logrus.Debugf("Name: %v, Date: %v", codeTag.Code, codeTag.Name)

		codeChan <- codeTag.Code
	}

	close(codeChan)
	wg.Wait()

	updateStr := fmt.Sprintf("insert into %s (name, date) values (\"%s\", \"%s\") on duplicate key " +
		"update date = values(date)", updateStatusTable, typeTableMap[kind][fqType][kType], updateDateStr)

	_, err = db.Exec(updateStr)
	if err != nil {
		logrus.Warningf("updateStr: %v", updateStr)
		panic(err.Error()) //proper error handling instead of panic in your app
	}
}

func debugFunc() {
	db := openDB()

	dateStr := getUpdateDate("code_data", db)
	logrus.Debugf("dateStr: %v", dateStr)
	dateStr = getUpdateDate("update_status_data", db)
	logrus.Debugf("dateStr: %v", dateStr)

	closeDB(db)
}

func mainFunc() {
	db := openDB()

	updateEmTodayData(db)
	updateSinaTodayData(db)
	updateETFTodayData(db)

	updateBasicAllInfoData(db)
	updateBasicIndustryData(db)
	updateBasicStockData(db)

	//update etf tables
	//updateAllFqData("etf", "qfq", "D", db)
	//for循环range map的key和value时，当只需要key时，value可以忽略，不需要用_代替(仅遍历键时，可以直接省略掉无用值的赋值)
	for fqType := range typeTableMap["etf"] {
		for kType := range typeTableMap["etf"][fqType] {
			updateAllFqData("etf", fqType, kType, db)
		}
	}

	//update k tables
	//updateAllFqData("stock", "qfq", "D", db)
	//for fqType := range typeTableMap["stock"] {
	//	for kType := range typeTableMap["stock"][fqType] {
	//		updateAllFqData("stock", fqType, kType, db)
	//	}
	//}

	closeDB(db)
}

//go run getHistData.go tradeTime.go --debug="debug"
//go run getHistData.go tradeTime.go --debug "info"
//go run getHistData.go tradeTime.go --debug="debug" > debug.log 2>&1
func main() {
	start := time.Now()
	fmt.Printf("Program start execution at %s\n\n", start.Format("2006-01-02 15:04:05"))

	debugFlag := flag.String("debug", "Info", "The debug output flag")
	flag.Parse()
	logrus.Debugf("debugFlag: %v", *debugFlag)

	if "trace" == *debugFlag {
		logrus.SetLevel(logrus.TraceLevel)
	} else if "debug" == *debugFlag {
		logrus.SetLevel(logrus.DebugLevel)
	} else if "info" == *debugFlag {
		logrus.SetLevel(logrus.InfoLevel)
	} else {
		logrus.SetLevel(logrus.DebugLevel)
	}

	mainFunc()
	//debugFunc()

	elapsed := time.Since(start)
	fmt.Printf("\nProgram end execution at %s\n", time.Now().Format("2006-01-02 15:04:05"))
	fmt.Printf("Total elapsed time: %s\n", elapsed)
}
