import os
from flask import Flask, render_template, flash, redirect, url_for, Markup

app = Flask(__name__)
app.secret_key = os.getenv('SECRET_KEY', 'secret string')

user = {
    'grey': {
        'username': 'Grey Li',
        'bio': 'A boy who loves movies and music.',
    },

    'anonymous': {
        'username': 'anonymous',
        'bio': 'anonymous person.',
    }
}

user_info = {
    'username': 'Grey Li',
    'bio': 'A boy who loves movies and music.',
}

movies = [
    {'name': 'My Neighbor Totoro', 'year': '1988'},
    {'name': 'Three Colours trilogy', 'year': '1993'},
    {'name': 'Forrest Gump', 'year': '1994'},
    {'name': 'Perfect Blue', 'year': '1997'},
    {'name': 'The Matrix', 'year': '1999'},
    {'name': 'Memento', 'year': '2000'},
    {'name': 'The Bucket list', 'year': '2007'},
    {'name': 'Black Swan', 'year': '2010'},
    {'name': 'Gone Girl', 'year': '2014'},
    {'name': 'CoCo', 'year': '2017'},
]


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


@app.route('/user/<name>')
def watchlist(name='anonymous'):
    print('username: {}, user: {}, user_info: {}'.format(name, user.get(name), user_info))
    # return render_template('watchlist.html', user=user_info, movies=movies)
    return render_template('watchlist.html', user=user.get(name), movies=movies)


# register template context handler
@app.context_processor
def inject_info():
    foo = 'I am foo.'
    return dict(foo=foo)  # equal to: return {'foo': foo}


# register template global function
@app.template_global()
def bar():
    return 'I am bar.'


# register template filter
@app.template_filter()
def musical(s):
    return s + Markup(' &#9835;')


# register template test
@app.template_test()
def baz(n):
    if n == 'baz':
        return True
    return False


@app.route('/watchlist2')
def watchlist_with_static():
    return render_template('watchlist_with_static.html', user=user, movies=movies)


# message flashing
@app.route('/flash')
def just_flash():
    flash('I am flash, who is looking for me?')
    return redirect(url_for('index'))


# 404 error handler
@app.errorhandler(404)
def page_not_found(e):
    return render_template('errors/404.html'), 404


# 500 error handler
@app.errorhandler(500)
def internal_server_error(e):
    return render_template('errors/500.html'), 500


# @app.route('/')
# def hello_world():
#     return '<p>Hello World!</p>'

@app.route('/')
def index():
    return render_template('index.html')


if __name__ == '__main__':
    app.run(debug=True)
