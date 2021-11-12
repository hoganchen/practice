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
	"strconv"
	"strings"
	"unicode/utf8"

	//"os"
	"path"
	"runtime"
	"sync"
	"time"

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

	basicAllDataTable  = "basics_all_data"

	kQfqDayDataTable   = "k_qfq_day_data"
	kQfqWeekDataTable  = "k_qfq_day_data"
	kQfqMonthDataTable = "k_qfq_day_data"

	updateStatusTable  = "update_status_data"

	//sina服务器接受的参数值为20, 40, 80, 100，参数值超过100，也最多返回100条数据
	sinaStockNumPerPage = 80
	emStockNumPerPage   = 1000

	maxKLineNumPerPage  = 1000

	maxGoroutinePoolNum = 50
)

var (
	//"D"表示日线，"W"表示周线，"M"表示月线，"Q"表示季度线，"H"表示半年线，"Y"表示年线
	//"1"表示1分钟线，"5"表示5分钟线，"15"表示15分钟线，"30"表示30分钟线，"60"表示60分钟线
	kTypeMap = map[string]int{"D": 101, "W": 102, "M": 103, "Q": 104, "H": 105, "Y": 106,
		"1": 1, "5": 5, "15": 15, "30": 30, "60": 60}
	//bfq表示不复权，qfq表示前复权，hfq表示后复权
	fqTypeMap = map[string]int{"bfq": 0, "qfq": 1, "hfq": 2}
	kTypeTableMap = map[string]map[string]string{
		"qfq": {"D": kQfqDayDataTable, "W": kQfqWeekDataTable, "M": kQfqMonthDataTable}}
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

func httpFetchWithHeader(url string) string {
	fmt.Printf("Fetch Url: %v\n", url)
	client := &http.Client{}
	req, _ := http.NewRequest("GET", url, nil)
	req.Header.Set("User-Agent", "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)")
	resp, err := client.Do(req)
	if err != nil {
		fmt.Printf("Http get err: %v\n", err)
		return ""
	}
	if resp.StatusCode != 200 {
		fmt.Printf("Http status code: %v\n", resp.StatusCode)
		return ""
	}

	defer resp.Body.Close()

	body, err := ioutil.ReadAll(resp.Body)
	if err != nil {
		fmt.Printf("Read error: %v\n", err)
		return ""
	}

	return string(body)
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

	db.Exec("set global max_allowed_packet=134217728")

	return db
}

func closeDB(db *sql.DB) {
	db.Close()
}

func dbQueryExample() {
	//Open up our database connection.
	//I've set up a database on my local machine using phpmyadmin.
	//The database is called testDb
	//db, err := sql.Open("mysql", "stck:stck&sql@tcp(127.0.0.1:3306)/stock")
	dataSource := fmt.Sprintf("%s:%s@tcp(127.0.0.1:3306)/%s", mysqlUser, mysqlPwd, mysqlDb)
	db, err := sql.Open("mysql", dataSource)

	//if there is an error opening the connection, handle it
	if err != nil {
		panic(err.Error())
	}

	//defer the close till after the main function has finished
	//executing
	defer db.Close()

	//Execute the query
	results, err := db.Query(fmt.Sprintf("select name, date from %v", updateStatusTable))
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
	}
}

func dbExec(sentence string) {
	dataSource := fmt.Sprintf("%s:%s@tcp(127.0.0.1:3306)/%s", mysqlUser, mysqlPwd, mysqlDb)
	db, err := sql.Open("mysql", dataSource)

	//if there is an error opening the connection, handle it
	if err != nil {
		panic(err.Error())
	}

	//defer the close till after the main function has finished
	//executing
	defer db.Close()

	//Execute the query
	_, err = db.Exec(sentence)
	if err != nil {
		panic(err.Error()) //proper error handling instead of panic in your app
	}
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
获取所有沪深A股的股票列表，沪深A股，pn为page number，pz为page size，po为1表示降序，为0表示升序，fid为f3表示以涨幅排序，为f12表示以股票代码排序
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
	pageNum := (stockNum - 1) /emStockNumPerPage + 1
	logrus.Debugf("stockNum: %v, pageNum: %v", stockNum, pageNum)

	//truncate table
	db.Exec(fmt.Sprintf("truncate table %s", emCodeDataTable))

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
			builder.WriteString(fmt.Sprintf("insert into %s (code, name) values ", emCodeDataTable))

			for j := 0; j < itemNum; j++ {
				dataPath := fmt.Sprintf("data.diff.%d", j)
				logrus.Tracef("pageIndex: %v, itemIndex: %v, diff: %v", num, j, gjson.Get(dataUrlContent, dataPath))

				codePath := fmt.Sprintf("data.diff.%d.f12", j)
				namePath := fmt.Sprintf("data.diff.%d.f14", j)
				code := gjson.Get(dataUrlContent, codePath).String()
				name := gjson.Get(dataUrlContent, namePath).String()

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
				panic(err.Error()) //proper error handling instead of panic in your app
			}
		}(i)
	}

	wg.Wait()

	updateStr := fmt.Sprintf("insert into %s (name, date) values (\"%s\", \"%s\") on duplicate key " +
		"update date = values(date)", updateStatusTable, emCodeDataTable, updateDateStr)

	_, err := db.Exec(updateStr)
	if err != nil {
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
	db.Exec(fmt.Sprintf("truncate table %s", codeDataTable))

	//hs_a(沪深A股股票)，shfxjs(风险警示板股票)，两者数据有重复，所以使用"insert ignore into"语句
	nodeSlice := []string{"hs_a", "shfxjs"}

	for _, node := range nodeSlice {
		pageUrl := fmt.Sprintf("http://vip.stock.finance.sina.com.cn/quotes_service/api/json_v2.php/"+
			"Market_Center.getHQNodeStockCount?node=%s", node)

		pageUrlContent := httpFetch(pageUrl)
		logrus.Tracef("url: %v, content: %v", pageUrl, pageUrlContent)

		//去除"字符，然后再转为整数
		stockNum, _ := strconv.Atoi(strings.ReplaceAll(pageUrlContent, "\"", ""))
		pageNum := (stockNum - 1) / sinaStockNumPerPage + 1
		logrus.Tracef("stockNum: %v, pageNum: %v", stockNum, pageNum)

		var builder strings.Builder

		for num := 1; num <= pageNum; num++ {
			dataUrl := fmt.Sprintf("http://vip.stock.finance.sina.com.cn/quotes_service/api/json_v2.php/" +
				"Market_Center.getHQNodeData?page=%d&num=%d&sort=symbol&asc=1&node=%s&symbol=&_s_r_a=sort",
				num, sinaStockNumPerPage, node)

			dataUrlContent := httpFetch(dataUrl)
			logrus.Tracef("pageIndex: %v, url: %v, content: %v", num, dataUrl, dataUrlContent)
			itemNum := int(gjson.Get(dataUrlContent, "#").Int())

			logrus.Debugf("pageIndex: %v, itemNum: %v", num, itemNum)

			builder.Reset()
			builder.WriteString(fmt.Sprintf("insert ignore into %s (code, name) values ", codeDataTable))

			for j := 0; j < itemNum; j++ {
				dataPath := fmt.Sprintf("%d", j)
				logrus.Tracef("pageIndex, itemIndex, diff: %v", num, j, gjson.Get(dataUrlContent, dataPath))

				codePath := fmt.Sprintf("%d.code", j)
				namePath := fmt.Sprintf("%d.name", j)
				code := gjson.Get(dataUrlContent, codePath).String()
				name := gjson.Get(dataUrlContent, namePath).String()

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

			logrus.Debugf("execString: %v", builder.String())

			//Execute the query
			_, err := db.Exec(builder.String())
			if err != nil {
				panic(err.Error()) //proper error handling instead of panic in your app
			}
		}
	}

	updateStr := fmt.Sprintf("insert into %s (name, date) values (\"%s\", \"%s\") on duplicate key " +
		"update date = values(date)", updateStatusTable, codeDataTable, updateDateStr)

	_, err := db.Exec(updateStr)
	if err != nil {
		panic(err.Error()) //proper error handling instead of panic in your app
	}
}

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
	db.Exec(fmt.Sprintf("truncate table %s", basicAllDataTable))

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

			var fieldKeySlice []string
			var fieldValueSlice []string

			for key, value := range fieldMap {
				fieldKeySlice = append(fieldKeySlice, key)
				fieldValueSlice = append(fieldValueSlice, value)
			}

			fieldKeySliceLen := len(fieldKeySlice)
			fieldKeyStr := strings.Join(fieldKeySlice, ",")
			fieldValueStr := strings.Join(fieldValueSlice, ",")

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
			builder.WriteString(fmt.Sprintf("insert into %s (date, %s) values ", basicAllDataTable, fieldValueStr))

			for j := 0; j < itemNum; j++ {
				//在复杂的json中，gjson的效率很低，推荐用fastjson
				//dataPath := fmt.Sprintf("data.diff.%d", j)
				//logrus.Tracef("diff: %v", gjson.Get(dataUrlContent, dataPath))

				builder.WriteString("(\"" + updateDateStr + "\", ")
				mapIndex := 0

				for _, key := range fieldKeySlice {
					fieldStr := string(v.GetStringBytes("data", "diff", fmt.Sprintf("%d", j), key))

					if "-" == fieldStr {
						fieldStr = "0"
					}

					if "" == fieldStr {
						fieldStr = strconv.FormatFloat(
							v.GetFloat64("data", "diff", fmt.Sprintf("%d", j), key), 'f', 2, 32)
					}

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
				panic(err.Error()) //proper error handling instead of panic in your app
			}
		}(i)
	}

	wg.Wait()

	updateStr := fmt.Sprintf("insert into %s (name, date) values (\"%s\", \"%s\") on duplicate key " +
		"update date = values(date)", updateStatusTable, basicAllDataTable, updateDateStr)

	_, err := db.Exec(updateStr)
	if err != nil {
		panic(err.Error()) //proper error handling instead of panic in your app
	}
}

func getSecID(code string) string {
	secID := ""

	if "5" == code[:1] || "6" == code[:1] || "9" == code[:1]  || "11" == code[:1] || "13" == code[:1] {
		secID = "1." + code
	} else {
		secID = "0." + code
	}

	return secID
}

func getLatestItemDate(code string, kType string, fqType string, db *sql.DB) string {
	latestDateStr := ""

	dateResults, err := db.Query(fmt.Sprintf("select code, date from %s where code = \"%s\" order by date desc limit 1",
		kTypeTableMap[fqType][kType], code))
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

		latestDateStr = dateTag.Date
		break
	}

	return latestDateStr
}

//含有过多数据
//http://81.push2his.eastmoney.com/api/qt/stock/kline/get?secid=1.603160&fields1=f1,f2,f3,f4,f5,f6,f7,f8&fields2=f51,f52,f53,f54,f55,f56,f57,f58,f59,f60,f61&klt=101&fqt=1&beg=0&end=20500101
//数据与表的列一一对应
//http://81.push2his.eastmoney.com/api/qt/stock/kline/get?secid=1.603160&fields1=f1,f2,f3,f4,f5&fields2=f51,f52,f53,f54,f55,f56,f57&klt=101&fqt=1&beg=0&end=20500101
func updateOneKFqData(codeChan chan string, kType string, fqType string, wg *sync.WaitGroup, db *sql.DB) {
	defer wg.Done()

	for code := range codeChan {
		latestDateStr := getLatestItemDate(code, kType, fqType, db)
		latestDate, _ := time.Parse("2006-01-02", latestDateStr)
		startDate := latestDate.AddDate(0, 0, 1)
		startDateStr := startDate.Format("2006-01-02")
		endDateStr := time.Now().Format("2006-01-02")  //应该计算最近一个日期

		//rand.Intn(n) -> [0, n)
		rand.Seed(time.Now().UnixNano())
		serverID := rand.Intn(99) + 1
		secID := getSecID(code)

		url := fmt.Sprintf("http://%d.push2his.eastmoney.com/api/qt/stock/kline/get?secid=%s" +
			"&fields1=f1,f2,f3,f4,f5&fields2=f51,f52,f53,f54,f55,f56,f57&klt=%d&fqt=%d&beg=%s&end=%s",
			serverID, secID, kTypeMap[kType], fqTypeMap[fqType], startDateStr, endDateStr)
		logrus.Debugf("code: %v, secID: %v, url: %v", code, secID, url)

		urlContent := httpFetch(url)
		logrus.Tracef("code: %v, url: %v, urlContent:%v", code, url, urlContent)

		itemNum := int(gjson.Get(urlContent, "data.klines.#").Int())
		pageNum := (itemNum - 1) / maxKLineNumPerPage + 1
		logrus.Debugf("code: %v, itemNum: %v, pageNum: %v", code, itemNum, pageNum)

		var p fastjson.Parser
		v, _ := p.Parse(urlContent)

		var builder strings.Builder

		startIndex := 0
		endIndex := 0

		for i := 0; i < pageNum; i++ {
			startIndex = i * maxKLineNumPerPage
			if i < pageNum - 1 {
				endIndex = (i + 1) * maxKLineNumPerPage
			} else {
				endIndex = itemNum
			}

			builder.Reset()
			builder.WriteString(fmt.Sprintf("insert into %s (code, date, open, close, high, low, volume, amount) values ",
				kTypeTableMap[fqType][kType]))

			for j := startIndex; j < endIndex; j++ {
				builder.WriteString("(\"" + code + "\", ")

				fieldStr := string(v.GetStringBytes("data", "klines", fmt.Sprintf("%d", j)))
				fieldSlice := strings.Split(fieldStr, ",")

				builder.WriteString(strings.Join(fieldSlice, ", "))

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
				panic(err.Error()) //proper error handling instead of panic in your app
			}
		}
	}
}

func updateAllKFqData(kType string, fqType string, db *sql.DB) {
	dateStr := getUpdateDate(codeDataTable, db)
	updateDateStr := fmt.Sprintf("%v-%02d-%02d", time.Now().Year(), time.Now().Month(), time.Now().Day())
	logrus.Debugf("dateStr: %v, updateDateStr: %v", dateStr, updateDateStr)

	if updateDateStr == dateStr {
		logrus.Infof("The %s table is updated to latest date...", codeDataTable)
		return
	} else {
		logrus.Infof("start to update %v table...", codeDataTable)
	}

	var wg sync.WaitGroup
	codeChan := make(chan string, maxGoroutinePoolNum * 2)

	for i := 0; i < maxGoroutinePoolNum; i++ {
		go updateOneKFqData(codeChan, kType, fqType, &wg, db)
	}

	//Execute the query
	codeResults, err := db.Query(fmt.Sprintf("select code, name from %s", codeDataTable))
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
		"update date = values(date)", updateStatusTable, kTypeTableMap[fqType][kType], updateDateStr)

	_, err = db.Exec(updateStr)
	if err != nil {
		panic(err.Error()) //proper error handling instead of panic in your app
	}
}

func debugFunc() {
	//fmt.Printf("HttpFetchWithHeader Content: \n%v\n", httpFetchWithHeader("http://www.baidu.com"))
	//fmt.Printf("httpFetch Content: \n%v\n", httpFetch("http://www.baidu.com"))
	//dbQueryExample()

	db := openDB()
	dateStr := getUpdateDate("code_data", db)
	logrus.Debugf("dateStr: %v", dateStr)
	dateStr = getUpdateDate("update_status_data", db)
	logrus.Debugf("dateStr: %v", dateStr)
	closeDB(db)
}

func mainFunc() {
	db := openDB()
	//updateEmTodayData(db)
	//updateSinaTodayData(db)
	updateBasicAllInfoData(db)
	closeDB(db)
}

//go run getHistData.go --debug="info"
//go run getHistData.go --debug "info"
func main() {
	start := time.Now()
	fmt.Printf("Program start execution at %s\n\n", start.Format("2006-01-02 15:04:05"))

	debugFlag := flag.String("debug", "Info", "The debug output flag")
	flag.Parse()
	//fmt.Printf("debugFlag: %v\n", *debugFlag)

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
