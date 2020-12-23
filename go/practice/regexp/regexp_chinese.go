/*
@Author:        hogan.chen@ymail.com
@Create Date:   2020-11-11
*/

package main

import (
	"fmt"
	"time"
	"regexp"
	"strconv"
)

func main() {
	start := time.Now()
	fmt.Printf("Program start execution at %s\n\n", start.Format("2006-01-02 15:04:05"))

	content := `<div>
    <div class="tag_area2" >
        <a id="tag_inha" class="label" href="/free/inha/">国内高匿代理</a>
        <a id="tag_intr" class="label" href="/free/intr/">国内普通代理</a>

        <span class="buy"><a href="/pricing/">购买更多代理>></a></span>
    </div>

    <div id="list" style="margin-top:15px;">
        <p>免费代理由第三方服务器提供，IP不确定性较大，总体质量不高。如需购买基于自营服务器的高质量IP产品，请联系客服开通测试订单。
            <span class="mod-wrap mod-wrap-forfree2"><a href="javascript:void(0);" class="online-chat free-btn">打开在线客服</a></span>
        </p>
        <table class="table table-bordered table-striped">
          <thead>
              <tr>
                <th>IP</th>
                <th>PORT</th>
                <th>匿名度</th>
                <th>类型</th>
                <th>位置</th>
                <th>响应速度</th>
                <th>最后验证时间</th>
              </tr>
            </thead>
            <tbody>

                <tr>
                    <td data-title="IP">117.141.155.241</td>
                    <td data-title="PORT">53281</td>
                    <td data-title="匿名度">透明</td>
                    <td data-title="类型">HTTP</td>
                    <td data-title="位置">中国 广西壮族自治区 南宁市 移动</td>
                    <td data-title="响应速度">4秒</td>
                    <td data-title="最后验证时间">2020-12-23 13:31:01</td>
                </tr>

                <tr>
                    <td data-title="IP">113.161.58.255</td>
                    <td data-title="PORT">8080</td>
                    <td data-title="匿名度">透明</td>
                    <td data-title="类型">HTTP</td>
                    <td data-title="位置">越南 胡志明市</td>
                    <td data-title="响应速度">2秒</td>
                    <td data-title="最后验证时间">2020-12-23 12:31:01</td>
                </tr>

                <tr>
                    <td data-title="IP">43.243.166.222</td>
                    <td data-title="PORT">8080</td>
                    <td data-title="匿名度">透明</td>
                    <td data-title="类型">HTTP</td>
                    <td data-title="位置">中国 香港  </td>
                    <td data-title="响应速度">7秒</td>
                    <td data-title="最后验证时间">2020-12-23 11:31:01</td>
                </tr>

                <tr>
                    <td data-title="IP">218.66.253.146</td>
                    <td data-title="PORT">8800</td>
                    <td data-title="匿名度">透明</td>
                    <td data-title="类型">HTTP</td>
                    <td data-title="位置">中国 福建省 莆田市 电信</td>
                    <td data-title="响应速度">1秒</td>
                    <td data-title="最后验证时间">2020-12-23 10:31:01</td>
                </tr>

                <tr>
                    <td data-title="IP">112.95.20.217</td>
                    <td data-title="PORT">8888</td>
                    <td data-title="匿名度">透明</td>
                    <td data-title="类型">HTTP</td>
                    <td data-title="位置">中国 广东省 深圳市 联通</td>
                    <td data-title="响应速度">1秒</td>
                    <td data-title="最后验证时间">2020-12-23 09:31:01</td>
                </tr>

                <tr>
                    <td data-title="IP">113.161.58.255</td>
                    <td data-title="PORT">8080</td>
                    <td data-title="匿名度">透明</td>
                    <td data-title="类型">HTTP</td>
                    <td data-title="位置">越南 胡志明市</td>
                    <td data-title="响应速度">4秒</td>
                    <td data-title="最后验证时间">2020-12-23 08:31:01</td>
                </tr>

                <tr>
                    <td data-title="IP">112.95.20.217</td>
                    <td data-title="PORT">8888</td>
                    <td data-title="匿名度">透明</td>
                    <td data-title="类型">HTTP</td>
                    <td data-title="位置">中国 广东省 深圳市 联通</td>
                    <td data-title="响应速度">2秒</td>
                    <td data-title="最后验证时间">2020-12-23 07:31:01</td>
                </tr>

                <tr>
                    <td data-title="IP">103.249.100.152</td>
                    <td data-title="PORT">80</td>
                    <td data-title="匿名度">透明</td>
                    <td data-title="类型">HTTP</td>
                    <td data-title="位置">越南 胡志明市</td>
                    <td data-title="响应速度">5秒</td>
                    <td data-title="最后验证时间">2020-12-23 06:31:01</td>
                </tr>

                <tr>
                    <td data-title="IP">114.231.42.136</td>
                    <td data-title="PORT">8888</td>
                    <td data-title="匿名度">透明</td>
                    <td data-title="类型">HTTP</td>
                    <td data-title="位置">江苏省南通市  电信</td>
                    <td data-title="响应速度">0.4秒</td>
                    <td data-title="最后验证时间">2020-12-23 05:31:01</td>
                </tr>

                <tr>
                    <td data-title="IP">222.249.238.138</td>
                    <td data-title="PORT">8080</td>
                    <td data-title="匿名度">透明</td>
                    <td data-title="类型">HTTP</td>
                    <td data-title="位置">北京市海淀区 BJENET宽带网络 BGP多线</td>
                    <td data-title="响应速度">3秒</td>
                    <td data-title="最后验证时间">2020-12-23 04:31:01</td>
                </tr>

                <tr>
                    <td data-title="IP">122.136.212.132</td>
                    <td data-title="PORT">53281</td>
                    <td data-title="匿名度">透明</td>
                    <td data-title="类型">HTTP</td>
                    <td data-title="位置">中国 吉林 延边 联通</td>
                    <td data-title="响应速度">0.9秒</td>
                    <td data-title="最后验证时间">2020-12-23 03:31:01</td>
                </tr>

                <tr>
                    <td data-title="IP">124.205.155.150</td>
                    <td data-title="PORT">9090</td>
                    <td data-title="匿名度">透明</td>
                    <td data-title="类型">HTTP</td>
                    <td data-title="位置">中国 北京市 北京市 鹏博士</td>
                    <td data-title="响应速度">4秒</td>
                    <td data-title="最后验证时间">2020-12-23 02:31:01</td>
                </tr>

                <tr>
                    <td data-title="IP">47.91.234.3</td>
                    <td data-title="PORT">3128</td>
                    <td data-title="匿名度">透明</td>
                    <td data-title="类型">HTTP</td>
                    <td data-title="位置">中国 香港 阿里云 </td>
                    <td data-title="响应速度">1秒</td>
                    <td data-title="最后验证时间">2020-12-23 01:31:02</td>
                </tr>

                <tr>
                    <td data-title="IP">106.104.170.66</td>
                    <td data-title="PORT">8080</td>
                    <td data-title="匿名度">透明</td>
                    <td data-title="类型">HTTP</td>
                    <td data-title="位置">中国 台湾 fetnet.net </td>
                    <td data-title="响应速度">1秒</td>
                    <td data-title="最后验证时间">2020-12-23 00:31:01</td>
                </tr>

                <tr>
                    <td data-title="IP">117.141.155.241</td>
                    <td data-title="PORT">53281</td>
                    <td data-title="匿名度">透明</td>
                    <td data-title="类型">HTTP</td>
                    <td data-title="位置">中国 广西壮族自治区 南宁市 移动</td>
                    <td data-title="响应速度">3秒</td>
                    <td data-title="最后验证时间">2020-12-22 23:31:02</td>
                </tr>

            </tbody>
        </table>
        <p>注：表中响应速度是中国测速服务器的测试数据，仅供参考。响应速度根据你机器所在的地理位置不同而有差异。</p>
        <p>声明：<br/>
        免费代理是第三方代理服务器，收集自互联网，并非快代理所有，快代理不对免费代理的有效性负责。<br/>
        请合法使用免费代理，由用户使用免费代理带来的法律责任与快代理无关。<br/>
        若免费代理侵犯了您的权益，请通过客服及时告知，快代理将在第一时间删除。
        </p>

        <div id="listnav">
        <ul><li>第</li><li><a href="/free/intr/1/" class="active">1</a></li><li><a href="/free/intr/2/">2</a></li><li><a href="/free/intr/3/">3</a></li><li><a href="/free/intr/4/">4</a></li><li><a href="/free/intr/5/">5</a></li><li>...</li><li><a href="/free/intr/3791/">3791</a></li><li><a href="/free/intr/3792/">3792</a></li><li>页</li></ul>
        </div>

        <div class="btn center be-f"><a id="tobuy" href="/pricing/" target="_blank">购买更多代理</a></div>
    </div>
</div>`

	fmt.Printf("类型: %v\n", strconv.QuoteToASCII("类型"))

	// re, _ := regexp.Compile(`<tr>\s+<td\s+data-title="IP">(\d+\.\d+\.\d+\.\d+)</td>\s+<td\s+data-title="PORT">(\d+)</td>\s+<td\s+data-title=.*?</td>\s+<td\s+data-title="\\u7c7b\\u578b">(\w+)</td>`)
	re, _ := regexp.Compile(`<tr>\s+<td\s+data-title="IP">(\d+\.\d+\.\d+\.\d+)</td>\s+<td\s+data-title="PORT">(\d+)</td>\s+.*?</td>\s+<td\s+data-title="(\p{Han}+)">(\w+)</td>`)
	// re, _ := regexp.Compile(`<tr>\s+<td\s+data-title="IP">(\d+\.\d+\.\d+\.\d+)</td>\s+<td\s+data-title="PORT">(\d+)</td>\s+<td\s+data-title=.*?</td>\s+<td\s+data-title="(\p{Han}+)">(\w+)</td>`)
	// re, _ := regexp.Compile(`<tr>\s+<td\s+data-title="IP">(\d+\.\d+\.\d+\.\d+)</td>\s+<td\s+data-title="PORT">(\d+)</td>\s+<td\s+data-title=.*?</td>\s+<td\s+data-title=".*?">(\w+)</td>`)
	match := re.FindAllStringSubmatch(string(content), -1)
	// match := re.FindAllString(string(content), -1)
	fmt.Printf("match:\n%v\n", match)

	elapsed := time.Since(start)
	fmt.Printf("\nTotal elapsed time: %s\n", elapsed)
}
