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
)

const (
	mysqlUser = "gostck"
	mysqlPwd  = "stck&sql"
	mysqlDb   = "gostock"

	codeTable = "code_data"
	emCodeTable = "em_code_data"
	basicAllTable = "basics_all_data"
	updateStatusTable = "update_status_data"

	maxStockNumPerPage = 1000
)

type Tag struct {
	Name string `json:"name"`
	Date string `json:"date"`
}

func init() {
	//你可以在Logger上设置日志记录级别,然后它只会记录具有该级别或以上级别任何内容的条目，日志级别大小说明:Panic>Fatal>Error>Warn>Info>Debug>Trace
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

func httpFetchWithHeader (url string) string {
	fmt.Println("Fetch Url", url)
	client := &http.Client{}
	req, _ := http.NewRequest("GET", url, nil)
	req.Header.Set("User-Agent", "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)")
	resp, err := client.Do(req)
	if err != nil {
		fmt.Println("Http get err:", err)
		return ""
	}
	if resp.StatusCode != 200 {
		fmt.Println("Http status code:", resp.StatusCode)
		return ""
	}

	defer resp.Body.Close()

	body, err := ioutil.ReadAll(resp.Body)
	if err != nil {
		fmt.Println("Read error:", err)
		return ""
	}

	return string(body)
}

func httpFetch(url string) string {
	logrus.Debugln("Fetch Url", url)

	resp, err := http.Get(url)
	if err != nil {
		logrus.Warningln("Http get err:", err)
		return ""
	}
	if resp.StatusCode != 200 {
		logrus.Warningln("Http status code:", resp.StatusCode)
		return ""
	}

	logrus.Debugln("Http status code:", resp.StatusCode)
	defer resp.Body.Close()

	body, err := ioutil.ReadAll(resp.Body)
	if err != nil {
		logrus.Warningln("Read error:", err)
		return ""
	}

	return string(body)
}

func openDB() *sql.DB {
	dataSource := fmt.Sprintf("%s:%s@tcp(127.0.0.1:3306)/%s", mysqlUser, mysqlPwd, mysqlDb)
	db, err := sql.Open("mysql", dataSource)

	//if there is an error opening the connection, handle it
	if err != nil {
		panic(err.Error())
	}

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
	results, err := db.Query("SELECT * FROM update_status_data")
	if err != nil {
		panic(err.Error()) //proper error handling instead of panic in your app
	}

	for results.Next() {
		var tag Tag
		//for each row, scan the result into our tag composite object
		err = results.Scan(&tag.Name, &tag.Date)
		if err != nil {
			panic(err.Error()) //proper error handling instead of panic in your app
		}
		//and then print out the tag's Name attribute
		logrus.Debugf("Name: %v, Date: %v\n", tag.Name, tag.Date)
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
	selectStr := fmt.Sprintf("SELECT * FROM %v where name = \"%v\"", updateStatusTable, tableName)
	results, err := db.Query(selectStr)
	if err != nil {
		panic(err.Error()) //proper error handling instead of panic in your app
	}
	for results.Next() {
		var tag Tag
		//for each row, scan the result into our tag composite object
		err = results.Scan(&tag.Name, &tag.Date)
		if err != nil {
			panic(err.Error()) //proper error handling instead of panic in your app
		}
		//and then print out the tag's Name attribute
		logrus.Debugf("Name: %v, Date: %v\n", tag.Name, tag.Date)
		dateStr = tag.Date
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
	dateStr := getUpdateDate(emCodeTable, db)
	updateDateStr := fmt.Sprintf("%v-%02d-%02d", time.Now().Year(), time.Now().Month(), time.Now().Day())

	logrus.Debugf("dateStr: %v, updateDateStr: %v", dateStr, updateDateStr)
	if updateDateStr == dateStr {
		logrus.Infof("The %s table is updated to latest date...", emCodeTable)
		return
	} else {
		logrus.Infof("start to update %v table...", emCodeTable)
	}

	firstUrl := "http://29.push2.eastmoney.com/api/qt/clist/get?pn=1&pz=20&po=0&np=1&fltt=2&invt=2&fid=f12" +
		"&fs=m:0+t:6,m:0+t:80,m:1+t:2,m:1+t:23" +
		"&fields=f1,f2,f3,f4,f5,f6,f7,f8,f9,f10,f12,f13,f14,f15,f16,f17,f18,f20,f21,f23,f24,f25,f22,f11,f62,f128,f136,f115,f152"

	firstUrlContent := httpFetch(firstUrl)
	logrus.Tracef("url: %v, content:\n%v\n", firstUrl, firstUrlContent)
	stockNum := int(gjson.Get(firstUrlContent, "data.total").Int())
	pageNum := (stockNum - 1) / maxStockNumPerPage + 1
	logrus.Tracef("stockNum: %v, pageNum: %v\n", stockNum, pageNum)

	//truncate table
	truncStr := fmt.Sprintf("truncate table %s", emCodeTable)
	db.Exec(truncStr)

	var wg sync.WaitGroup
	for i := 1; i <= pageNum; i++ {
		wg.Add(1)
		go func(num int) {
			defer wg.Done()

			//rand.Intn(n) -> [0, n)
			rand.Seed(time.Now().UnixNano())
			serverID := rand.Intn(99) + 1

			dataUrl := fmt.Sprintf("http://%d.push2.eastmoney.com/api/qt/clist/get?pn=%d&pz=%d&po=0&np=1&fltt=2&invt=2&fid=f12" +
				"&fs=m:0+t:6,m:0+t:80,m:1+t:2,m:1+t:23" +
				"&fields=f1,f2,f3,f4,f5,f6,f7,f8,f9,f10,f12,f13,f14,f15,f16,f17,f18,f20,f21,f23,f24,f25,f22,f11,f62,f128,f136,f115,f152", serverID, num, maxStockNumPerPage)
			dataUrlContent := httpFetch(dataUrl)

			itemNum := int(gjson.Get(dataUrlContent, "data.diff.#").Int())
			logrus.Debugf("pageNum: %v, itemNum: %v\n", num, itemNum)
			execStr := fmt.Sprintf("insert into %s (code, name) values", emCodeTable)
			data := " "

			for j := 0; j < itemNum; j++ {
				dataPath := fmt.Sprintf("data.diff.%d", j)
				logrus.Tracef("diff: %v\n", gjson.Get(dataUrlContent, dataPath))

				codePath := fmt.Sprintf("data.diff.%d.f12", j)
				namePath := fmt.Sprintf("data.diff.%d.f14", j)
				code := gjson.Get(dataUrlContent, codePath).String()
				name := gjson.Get(dataUrlContent, namePath).String()

				//如果希望按习惯上的字符个数来计算，就需要使用 Go 语言中 UTF-8 包提供的 RuneCountInString() 函数，统计 Uncode 字符数量。
				//import "unicode/utf8"
				logrus.Debugf("code: %v(%T), name: %v(%T), len(name): %v, RuneCountInString(name): %v\n", code, code, name, name, len(name), utf8.RuneCountInString(name))
				//最后一行数据后，不能有逗号
				if j < itemNum - 1 {
					data = data + "(\"" + code + "\", \"" + name + "\"), "
				} else {
					data = data + "(\"" + code + "\", \"" + name + "\")"
				}
			}

			logrus.Tracef("execStr: %v, data: %v\n", execStr, data)
			logrus.Debugf("execString: %v\n", execStr + data)

			//Execute the query
			_, err := db.Exec(execStr + data)
			if err != nil {
				panic(err.Error()) //proper error handling instead of panic in your app
			}
		}(i)
	}

	wg.Wait()

	updateStr := fmt.Sprintf("insert into %s (name, date) values (\"%s\", \"%s\") on duplicate key update date = values(date)", updateStatusTable, emCodeTable, updateDateStr)
	logrus.Debugf("dateStr: %v, updateStr: %v\n", dateStr, updateStr)
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
	dateStr := getUpdateDate(codeTable, db)
	updateDateStr := fmt.Sprintf("%v-%02d-%02d", time.Now().Year(), time.Now().Month(), time.Now().Day())

	logrus.Debugf("dateStr: %v, updateDateStr: %v", dateStr, updateDateStr)
	if updateDateStr == dateStr {
		logrus.Infof("The %s table is updated to latest date...", codeTable)
		return
	} else {
		logrus.Infof("start to update %v table...", codeTable)
	}

	//truncate table
	truncStr := fmt.Sprintf("truncate table %s", codeTable)
	db.Exec(truncStr)

	//服务器接受的参数值为20, 40, 80, 100，参数值超过100，也最多返回100条数据
	pageSize := 80
	nodeSlice := []string{"hs_a", "shfxjs"}

	for _, node := range nodeSlice {
		pageUrl := fmt.Sprintf("http://vip.stock.finance.sina.com.cn/quotes_service/api/json_v2.php/"+
			"Market_Center.getHQNodeStockCount?node=%s", node)

		pageUrlContent := httpFetch(pageUrl)
		logrus.Tracef("url: %v, content:\n%v\n", pageUrl, pageUrlContent)
		//去除"字符，然后再转为整数
		stockNum, _ := strconv.Atoi(strings.ReplaceAll(pageUrlContent, "\"", ""))
		pageNum := (stockNum - 1) / pageSize + 1
		logrus.Tracef("stockNum: %v, pageNum: %v\n", stockNum, pageNum)

		for num := 1; num <= pageNum; num++ {
			dataUrl := fmt.Sprintf("http://vip.stock.finance.sina.com.cn/quotes_service/api/json_v2.php/" +
				"Market_Center.getHQNodeData?page=%d&num=%d&sort=symbol&asc=1&node=%s&symbol=&_s_r_a=sort", num, pageSize, node)
			dataUrlContent := httpFetch(dataUrl)

			itemNum := int(gjson.Get(dataUrlContent, "#").Int())
			logrus.Debugf("pageNum: %v, itemNum: %v\n", num, itemNum)
			execStr := fmt.Sprintf("insert ignore into %s (code, name) values", codeTable)
			data := " "

			for j := 0; j < itemNum; j++ {
				dataPath := fmt.Sprintf("%d", j)
				logrus.Tracef("diff: %v\n", gjson.Get(dataUrlContent, dataPath))

				codePath := fmt.Sprintf("%d.code", j)
				namePath := fmt.Sprintf("%d.name", j)
				code := gjson.Get(dataUrlContent, codePath).String()
				name := gjson.Get(dataUrlContent, namePath).String()

				//如果希望按习惯上的字符个数来计算，就需要使用 Go 语言中 UTF-8 包提供的 RuneCountInString() 函数，统计 Uncode 字符数量。
				//import "unicode/utf8"
				logrus.Debugf("code: %v(%T), name: %v(%T), len(name): %v, RuneCountInString(name): %v\n", code, code, name, name, len(name), utf8.RuneCountInString(name))
				//最后一行数据后，不能有逗号
				if j < itemNum-1 {
					data = data + "(\"" + code + "\", \"" + name + "\"), "
				} else {
					data = data + "(\"" + code + "\", \"" + name + "\")"
				}
			}

			logrus.Tracef("execStr: %v, data: %v\n", execStr, data)
			logrus.Debugf("execString: %v\n", execStr + data)

			//Execute the query
			_, err := db.Exec(execStr + data)
			if err != nil {
				panic(err.Error()) //proper error handling instead of panic in your app
			}
		}
	}

	updateStr := fmt.Sprintf("insert into %s (name, date) values (\"%s\", \"%s\") on duplicate key update date = values(date)", updateStatusTable, codeTable, updateDateStr)
	logrus.Debugf("dateStr: %v, updateStr: %v\n", dateStr, updateStr)
	_, err := db.Exec(updateStr)
	if err != nil {
		panic(err.Error()) //proper error handling instead of panic in your app
	}
}

func updateBasicInfoData(db *sql.DB) {
	dateStr := getUpdateDate(basicAllTable, db)
	updateDateStr := ""
	if time.Now().Day() >= 1 && time.Now().Day() < 15 {
		updateDateStr = fmt.Sprintf("%v-%02d-%02d", time.Now().Year(), time.Now().Month(), 1)
	} else {
		updateDateStr = fmt.Sprintf("%v-%02d-%02d", time.Now().Year(), time.Now().Month(), 15)
	}

	logrus.Debugf("dateStr: %v, updateDateStr: %v", dateStr, updateDateStr)
	if updateDateStr == dateStr {
		logrus.Infof("The %s table is updated to latest date...", basicAllTable)
		return
	} else {
		logrus.Infof("start to update %v table...", basicAllTable)
	}

	firstUrl := "http://29.push2.eastmoney.com/api/qt/clist/get?pn=1&pz=20&po=0&np=1&fltt=2&invt=2&fid=f12" +
		"&fs=m:0+t:6,m:0+t:80,m:1+t:2,m:1+t:23" +
		"&fields=f1,f2,f3,f4,f5,f6,f7,f8,f9,f10,f12,f13,f14,f15,f16,f17,f18,f20,f21,f23,f24,f25,f22,f11,f62,f128,f136,f115,f152"

	firstUrlContent := httpFetch(firstUrl)
	logrus.Tracef("url: %v, content:\n%v\n", firstUrl, firstUrlContent)
	stockNum := int(gjson.Get(firstUrlContent, "data.total").Int())
	pageNum := (stockNum - 1) / maxStockNumPerPage + 1
	logrus.Tracef("stockNum: %v, pageNum: %v\n", stockNum, pageNum)

	//truncate table
	truncStr := fmt.Sprintf("truncate table %s", basicAllTable)
	db.Exec(truncStr)

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

			fieldStr := ""
			for key := range fieldMap {
				fieldStr = strings.Join([]string{fieldStr, key}, ",")
			}

			dataUrl := fmt.Sprintf("http://%d.push2.eastmoney.com/api/qt/clist/get?pn=%d&pz=%d&po=0&np=1&fltt=2&invt=2&fid=f12" +
				"&fs=m:0+t:6,m:0+t:80,m:1+t:2,m:1+t:23&fields=%s", serverID, num, maxStockNumPerPage, fieldStr)
			dataUrlContent := httpFetch(dataUrl)

			itemNum := int(gjson.Get(dataUrlContent, "data.diff.#").Int())
			logrus.Debugf("pageNum: %v, itemNum: %v\n", num, itemNum)
			execStr := fmt.Sprintf("insert into %s (date, code, name) values", basicAllTable)
			data := " "

			for j := 0; j < itemNum; j++ {
				dataPath := fmt.Sprintf("data.diff.%d", j)
				logrus.Tracef("diff: %v\n", gjson.Get(dataUrlContent, dataPath))

				codePath := fmt.Sprintf("data.diff.%d.f12", j)
				namePath := fmt.Sprintf("data.diff.%d.f14", j)
				code := gjson.Get(dataUrlContent, codePath).String()
				name := gjson.Get(dataUrlContent, namePath).String()

				//如果希望按习惯上的字符个数来计算，就需要使用 Go 语言中 UTF-8 包提供的 RuneCountInString() 函数，统计 Uncode 字符数量。
				//import "unicode/utf8"
				logrus.Debugf("code: %v(%T), name: %v(%T), len(name): %v, RuneCountInString(name): %v\n", code, code, name, name, len(name), utf8.RuneCountInString(name))
				//最后一行数据后，不能有逗号
				if j < itemNum - 1 {
					data = data + "(\"" + updateDateStr + "\", \"" + code + "\", \"" + name + "\"), "
				} else {
					data = data + "(\"" + updateDateStr + "\", \"" + code + "\", \"" + name + "\")"
				}
			}

			logrus.Tracef("execStr: %v, data: %v\n", execStr, data)
			logrus.Debugf("execString: %v\n", execStr + data)

			//Execute the query
			_, err := db.Exec(execStr + data)
			if err != nil {
				panic(err.Error()) //proper error handling instead of panic in your app
			}
		}(i)
	}

	wg.Wait()

	updateStr := fmt.Sprintf("insert into %s (name, date) values (\"%s\", \"%s\") on duplicate key update date = values(date)", updateStatusTable, basicAllTable, updateDateStr)
	logrus.Debugf("dateStr: %v, updateStr: %v\n", dateStr, updateStr)
	_, err := db.Exec(updateStr)
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
	updateEmTodayData(db)
	updateSinaTodayData(db)
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
