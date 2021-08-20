from flask import Flask, request, redirect, url_for, make_response, render_template, json, jsonify, flash
from jinja2.utils import generate_lorem_ipsum

app = Flask(__name__)
app.secret_key = 'secret string'


@app.route('/greet')
@app.route('/greet/')
@app.route('/greet/<name>')
def greet(name='anonymous'):
    """
    我们不仅可以为视图函数绑定多个URL,还可以在URL规则中添加变量部分,使用“<变量名>”的形式表示。
    Flask处理请求时会把变量传入视图函数,所以我们可以添加参数获取这个变量值。视图函数greet(),它的URL规则包含一个name变量。
    :param name:
    :return:
    """
    # 调用url_for()函数时,第一个参数为端点(endpoint)值。在Flask中,端点用来标记一个视图函数以及对应的URL规则。
    # 端点的默认值为视图函数的名称。如果URL含有动态部分,那么我们需要在url_for()函数里传入相应的参数
    return '<h1>Hello, {}!</h1>\n<h2>url path: {}</h2>'.format(name, url_for('greet', name=name, _external=True))


@app.route('/relocate')
def url_relocate():
    """
    有时你会想附加或修改某个首部字段。比如,要生成状态码为3XX的重定向响应,需要将首部中的Location字段设置为重定向的目标URL
    :return:
    """
    return '', 302, {'Location': 'https://cn.bing.com'}


@app.route('/redirect')
def url_redirect():
    """
    对于重定向这一类特殊响应,Flask提供了一些辅助函数。除了像前面那样手动生成302响应,
    我们可以使用Flask提供的redirect()函数来生成重定向响应,重定向的目标URL作为第一个参数。
    :return:
    """
    return redirect('https://www.baidu.com')


@app.route('/colors/<any(blue, white, red):color>')
def three_colors(color):
    """
    在用法上唯一特别的是any转换器,你需要在转换器后添加括号来给出可选值,即“<any(value1,value2,...):变量名>”
    当你在浏览器中访问http://localhost:5000/colors/时,如果将<color>部分替换为any转换器中设置的可选值以外的任意字符,均会获得404错误响应。
    :param color:
    :return:
    """
    return '<p>Love is patient and kind. Color is {}, Love is not jealous or boastful or proud or rude</p>'.\
        format(color)


@app.route('/goback')
@app.route('/goback/<int:year>')
def go_back(year=None):
    """
    http://127.0.0.1:5000/goback/25
    http://127.0.0.1:5000/goback?year=10

    <int:year>表示为year变量添加了一个int转换器,Flask在解析这个URL变量时会将其转换为整型。
    URL中的变量部分默认类型为字符串,但Flask提供了一些转换器可以在URL规则里使用

    转换器通过特定的规则指定,即“<转换器:变量名>”。<int:year>把year的值转换为整数,因此我们可以在视图函数中直接对year变量进行数学计算

    默认的行为不仅仅是转换变量类型,还包括URL匹配。在这个例子中,如果不使用转换器,默认year变量会被转换成字符串,
    为了能够在Python中计算天数,我们需要使用int()函数将year变量转换成整型。
    但是如果用户输入的是英文字母,就会出现转换错误,抛出ValueError异常,我们还需要手动验证;
    使用了转换器后,如果URL中传入的变量不是数字,那么会直接返回404错误响应。比如,你可以尝试访问http://localhost:5000/goback/tang
    :param year:
    :return:
    """
    if year is None:
        year = int(request.args.get('year'))
    return '<p>Welcome to %d!</p>' % (2021 - year)


@app.route('/hi')
def hi():
    """
    如果要在程序内重定向到其他视图,那么只需在redirect()函数中使用url_for()函数生成目标URL即可
    :return:
    """
    return redirect(url_for('hello'))  # 重定向到/hello


@app.route('/hello', methods=['GET', 'POST'])
def hello():
    """
    我们可以在app.route()装饰器中使用methods参数传入一个包含监听的HTTP方法的可迭代对象。
    比如,下面的视图函数同时监听GET请求和POST请求
    http://127.0.0.1:5000/hello
    http://127.0.0.1:5000/hello?name=hogan
    :return:
    """
    name = request.args.get('name', 'Flask')
    return '<h1>Hello, {}!</h1>'.format(name)


@app.route('/foo/<any(text, json):re_type>')
def foo(re_type):
    if 'text' == re_type:
        response = make_response('Hello, World!')
        response.mimetype = 'text/plain'
    elif 'json' == re_type:
        data = {'name': 'hogan', 'gender': 'male', 'age': 35, 'city': 'chengdu'}
        response = make_response(json.dumps(data))
        response.mimetype = 'application/json'
    else:
        response = None
    return response


@app.route('/jsonfoo')
def json_foo():
    """
    不过我们一般并不直接使用json模块的dumps()、load()等方法,因为Flask通过包装这些方法提供了更方便的jsonify()函数。
    借助jsonify()函数,我们仅需要传入数据或参数,它会对我们传入的参数进行序列化,转换成JSON字符串作为响应的主体,
    然后生成一个响应对象,并且设置正确的MIME类型。使用jsonify函数可以将前面的例子简化为这种形式

    @app.route('/foo')
    def foo():
        return jsonify(name='Grey Li', gender='male')

    jsonify()函数接收多种形式的参数。你既可以传入普通参数,也可以传入关键字参数。
    如果你想要更直观一点,也可以像使用dumps()方法一样传入字典、列表或元组
    :param:
    :return:
    """
    return jsonify({'name': 'Grey Li', 'gender': 'male', 'age': 36, 'city': 'hangzhou'},
                   {'name': 'hogan', 'gender': 'male', 'age': 35, 'city': 'chengdu'})


@app.route('/back')
def redirect_back(default='hello', **kwargs):
    """
    获取上一个页面的URL

    HTTP referer(起源为referrer在HTTP规范中的错误拼写)是一个用来记录请求发源地址的HTTP首部字段(HTTP_REFERER),
    即访问来源。当用户在某个站点单击链接,浏览器向新链接所在的服务器发起请求,
    请求的数据中包含的HTTP_REFERER字段记录了用户所在的原站点URL。

    这个值通常会用来追踪用户,比如记录用户进入程序的外部站点,以此来更有针对性地进行营销。
    在Flask中,referer的值可以通过请求对象的referrer属性获取,即request.referrer(正确拼写形式)。
    但是在很多种情况下,referrer字段会是空值,比如用户在浏览器的地址栏输入URL,
    或是用户出于保护隐私的考虑使用了防火墙软件或使用浏览器设置自动清除或修改了referrer字段。

    除了自动从referrer获取,另一种更常见的方式是在URL中手动加入包含当前页面URL的查询参数,这个查询参数一般命名为next。
    比如,下面在foo和bar视图的返回值中的URL后添加next参数

    http://127.0.0.1:5000/back?next=cookie
    :param default:
    :param kwargs:
    :return:
    """
    for target in request.args.get('next'), request.referrer:
        if target:
            return redirect(target)
    return redirect(url_for(default, **kwargs))


@app.route('/flash')
def just_flash():
    flash('I am flash, who is looking for me?')
    return redirect(url_for('index'))


@app.route('/more')
def show_more():
    return generate_lorem_ipsum(2)


@app.route('/post')
def show_post():
    """
    章的随机正文通过Jinja2提供的generate_lorem_ipsum()函数生成,n参数用来指定段落的数量,默认为5,
    它会返回由随机字符组成的虚拟文章。文章下面添加了一个“加载更多”按钮。
    按钮下面是两个<script></script>代码块,第一个script从CDN加载jQuery资源。

    在$(function(){...})中,$('#load')被称为选择器,我们在括号中传入目标元素的id、class或是其他属性来定位到对应的元素,
    将其创建为jQuery对象。我们传入了“加载更多”按钮的id值以定位到加载按钮。
    在这个选择器上,我们附加了.click(function(){...}),这会为加载按钮注册一个单击事件处理函数,
    当加载按钮被单击时就会执行单击事件回调函数。在这个回调函数中,我们使用$.ajax()方法发送一个AJAX请求到服务器,
    通过url将目标URL设为“/more”,通过type参数将请求的类型设为GET。当请求成功处理并返回2XX响应时(另外还包括304响应),
    会触发success回调函数。success回调函数接收的第一个参数为服务器端返回的响应主体,在这个回调函数中,
    我们在文章正文(通过$('.body')选择)底部使用append()方法插入返回的data数据。
    :return:
    """
    post_body = generate_lorem_ipsum(n=2)  # 生成两段随机文本
    return '''
<h1>A very long post</h1>
<div class="body">%s</div>
<button id="load">Load More</button>
<script src="https://code.jquery.com/jquery-3.3.1.min.js"></script>
<script type="text/javascript">
$(function() {
    $('#load').click(function() {
        $.ajax({
            url: '/more',  // 目标URL
            type: 'get',  // 请求方法
            success: function(data){  // 返回2XX响应后触发的回调函数
                $('.body').append(data);  // 将返回的响应插入到页面中
            }
        })
    })
})
</script>''' % post_body


@app.route('/cookie')
def cookie():
    return '<p>cookie: {}</p>'.format(request.headers.get('cookie'))
    # return '<p>items: {}</p>'.format(request.headers.items())


@app.route('/index')
@app.route('/')
def index():  # put application's code here
    """
    在上面这些步骤中,大部分都由Flask完成,我们要做的只是建立处理请求的函数,并为其定义对应的URL规则。
    只需为函数附加app.route()装饰器,并传入URL规则作为参数,我们就可以让URL与函数建立关联。
    这个过程我们称为注册路由(route),路由负责管理URL和函数之间的映射,而这个函数则被称为视图函数(view function)。

    一个视图函数可以绑定多个URL,比如下面的代码把/和/index都绑定到index函数上,这就会为index视图注册两个路由,
    用户访问这两个URL均会触发index()函数,获得相同的响应
    :return:
    """
    return '<p>Hello World!</p>'


if __name__ == '__main__':
    app.run(debug=True)
