import pandas as pd
import numpy as np
import logging
import random

ROW_NUM = 10
COLUMNS_NUM = 6
START_DATE = '20200101'

# log level
LOGGING_LEVEL = logging.INFO


def logging_config(logging_level):
    # log_format = "%(asctime)s - %(levelname)s - %(message)s"
    log_format = "%(asctime)s [line: %(lineno)d] - %(levelname)s - %(message)s"
    # log_format = "[%(asctime)s - [File: %(filename)s line: %(lineno)d] - %(levelname)s]: %(message)s"
    logging.basicConfig(level=logging_level, format=log_format)


def db_print(*args):
    print('\n\n{}\n{}'.format('#' * 80, *args))
    # print('\n\n')
    # logging.info('\n{}\n{}'.format('#' * 80, *args))


# 创建对象
def basic_use_01():
    print('\n\n{0}\n{0}\n{1}{2}\n{0}\n{0}\n\n'.format('*' * 80, ' ' * 30, 'BASIC USE 01'))
    # lower_columns_list = [chr(i) for i in range(97, 123)]
    upper_columns_list = [chr(i) for i in range(65, 91)]

    # dates = pd.date_range(START_DATE, periods=6)
    dates = pd.date_range(START_DATE, periods=ROW_NUM)
    db_print(dates)

    # df = pd.DataFrame(np.random.randn(6, 4), index=pd.date_range(START_DATE, periods=6), columns=list('ABCD'))
    df = pd.DataFrame(np.random.randn(ROW_NUM, COLUMNS_NUM), index=pd.date_range(START_DATE, periods=ROW_NUM),
                      columns=upper_columns_list[:COLUMNS_NUM])

    db_print(df)

    # 打印每行的数据类型
    db_print(df.dtypes)

    # 每行的index名称
    db_print(df.index)

    # df的所有列名
    db_print(df.columns)

    # 打印df的value值，返回为2维列表
    db_print(df.values)


# 查看数据
def basic_use_02():
    print('\n\n{0}\n{0}\n{1}{2}\n{0}\n{0}\n\n'.format('*' * 80, ' ' * 30, 'BASIC USE 02'))
    # lower_columns_list = [chr(i) for i in range(97, 123)]
    upper_columns_list = [chr(i) for i in range(65, 91)]

    # dates = pd.date_range(START_DATE, periods=6)
    dates = pd.date_range(START_DATE, periods=ROW_NUM)
    db_print(dates)

    # df = pd.DataFrame(np.random.randn(6, 4), index=pd.date_range(START_DATE, periods=6), columns=list('ABCD'))
    df = pd.DataFrame(np.random.randn(ROW_NUM, COLUMNS_NUM), index=pd.date_range(START_DATE, periods=ROW_NUM),
                      columns=upper_columns_list[:COLUMNS_NUM])

    # 打印前几行，默认参数为5
    db_print(df.head())
    db_print(df.head(2))
    # 打印后几行，默认参数为5
    db_print(df.tail())
    db_print(df.tail(2))

    # 数据的快速统计汇总
    db_print(df.describe())

    # 按轴进行排序，axis默认值为1，ascending值默认为True，即默认为升序
    db_print(df.sort_index())                           # 按列名排序，升序
    db_print(df.sort_index(axis=1, ascending=False))    # 按列名排序，降序
    db_print(df.sort_index(axis=1, ascending=True))     # 按列名排序，升序
    db_print(df.sort_index(axis=0, ascending=False))    # 按索引index排序，降序
    db_print(df.sort_index(axis=0, ascending=True))     # 按索引index排序，升序

    # 按值排序，ascending值默认为True，即默认为升序
    db_print(df.sort_values(by='A'))  # 以A列的数据，升序排列
    db_print(df.sort_values(by='A', ascending=True))  # 以A列的数据，升序排列
    db_print(df.sort_values(by='A', ascending=False))  # 以A列的数据，降序排列


# 选择
def basic_use_03():
    print('\n\n{0}\n{0}\n{1}{2}\n{0}\n{0}\n\n'.format('*' * 80, ' ' * 30, 'BASIC USE 03'))
    # lower_columns_list = [chr(i) for i in range(97, 123)]
    upper_columns_list = [chr(i) for i in range(65, 91)]

    # dates = pd.date_range(START_DATE, periods=6)
    dates = pd.date_range(START_DATE, periods=ROW_NUM)
    db_print(dates)

    # df = pd.DataFrame(np.random.randn(6, 4), index=pd.date_range(START_DATE, periods=6), columns=list('ABCD'))
    df = pd.DataFrame(np.random.randn(ROW_NUM, COLUMNS_NUM), index=pd.date_range(START_DATE, periods=ROW_NUM),
                      columns=upper_columns_list[:COLUMNS_NUM])

    # 获取某列，或者某几列
    db_print(df.A)
    db_print(df['A'])
    db_print(df[['A', 'B']])

    # 切片，可通过index的序号，或者index的值来切片
    db_print(df[:0])                            # 仅复制DataFrame结构
    db_print(df[:])                             # 全部数据
    db_print(df[:3])                            # 前3行
    db_print(df[::2])                           # 间隔1行获取数据
    db_print(df['2020-01-01':'2020-01-05'])     # 通过指定索引范围获取数据
    db_print(df['2020-01-01':'2020-01-05':2])   # 间隔1行获取指定索引范围内的数据

    # 通过标签获取数据
    db_print(df.loc['2020-01-01'])                              # 获取标签值为2020-01-01所在行的数据
    db_print(df.loc['2020-01-01', ['A', 'B']])                  # 获取标签值为2020-01-01所在行，A，B两列的数据(对于返回的对象进行维度缩减)
    db_print(df.loc['2020-01-01', 'A'])                         # 获取标签值为2020-01-01所在行，A列的数据(获取一个标量)
    db_print(df.loc[dates[0], 'A'])                             # 获取标签值为2020-01-01所在行，A列的数据(获取一个标量)
    db_print(df.loc['2020-01-01':'2020-01-03'])                 # 获取标签范围内的行数据
    db_print(df.loc['2020-01-01':'2020-01-03', ['A', 'C']])     # 获取标签范围内的行，A，C两列的数据(标签切片)
    db_print(df.loc[:, ['A', 'C']])                             # 获取所有A，C两列的数据(通过标签来在多个轴上进行选择)

    # 快速访问一个标量，因为at只用于访问一个标量，所以速度比使用loc更快
    db_print(dates[0])                      # 2020-01-01 00:00:00
    db_print(df.at[dates[0], 'A'])
    # db_print(df.at['2020-01-01', 'A'])    # 该语句出错，因为列索引的类型为2020-01-01 00:00:00

    # 通过位置获取数据，行和列的初始值为0
    db_print(df.iloc[1])                        # 获取第1行的数据
    db_print(df.iloc[1:3])                      # 获取第1,2行的数据
    db_print(df.iloc[1:3, 0:3])                 # 获取第1,2行，前3列的数据
    db_print(df.iloc[1:3, [0, 3, 5]])           # 获取第1,2行，第0,3,5列的数据
    db_print(df.iloc[[0, 2, 6], [0, 3, 5]])     # 获取第0,2,6行，第0,3,5列的数据
    db_print(df.iloc[1:5, :])                   # 获取第1～4行的数据(对行进行切片)
    db_print(df.iloc[:, 1:3])                   # 获取第1～2列的数据(对列进行切片)
    db_print(df.iloc[1, 1])                     # 获取特定的值

    # 快速访问一个标量，因为iat只用于访问一个标量，所以速度比使用iloc更快
    db_print(df.iat[1, 1])

    # 布尔索引
    db_print(df[df.A > 1])      # 过滤列A中所有大于0的值所在的行(使用一个单独列的值来选择数据)
    db_print(df[df > 0])        # 过滤df中所有大于0的值(使用where操作来选择数据)

    # 使用isin()方法来过滤
    df2 = df.copy()
    # https://www.pythonf.cn/read/88401
    # https://www.cnblogs.com/MLing/p/12851108.html
    # https://www.liaoxuefeng.com/wiki/1016959663602400/1017317609699776
    df2['Z'] = ['ZZ' if i % 2 == 0 else 'ZZZ' for i in range(ROW_NUM)]
    db_print(df2[df2['Z'].isin(['ZZ'])])
    df2['Y'] = [random.choice(['AA', 'BB', 'CC']) for _ in range(ROW_NUM)]
    # 调整列顺序
    xx = list(df2.columns)
    db_print(xx)
    xx.insert(len(xx) - 2, xx.pop())
    db_print(xx)
    df2 = df2[xx]
    db_print(df2[df2['Y'].isin(['AA', 'BB'])])

    # 设置一个新的列
    s1 = pd.Series(random.choices(range(100), k=ROW_NUM), index=pd.date_range(START_DATE, periods=ROW_NUM))
    db_print(s1)
    df['X'] = s1
    db_print(df)

    # 通过标签设置新的值
    df.at[dates[0], 'A'] = 999

    # 通过位置设置新的值
    df.iat[0, 1] = 888

    # 通过一个numpy数组设置一组新值
    df.loc[:, 'W'] = np.array([5] * len(df))
    df.loc[:, 'V'] = np.array(random.choices(range(100), k=len(df)))
    db_print(df)

    # 通过where操作来设置新的值
    df2 = df.copy()
    df2[df2 < 0] = -df2
    db_print(df2)


# 缺失值处理
def basic_use_04():
    print('\n\n{0}\n{0}\n{1}{2}\n{0}\n{0}\n\n'.format('*' * 80, ' ' * 30, 'BASIC USE 04'))
    # lower_columns_list = [chr(i) for i in range(97, 123)]
    upper_columns_list = [chr(i) for i in range(65, 91)]

    # dates = pd.date_range(START_DATE, periods=6)
    dates = pd.date_range(START_DATE, periods=ROW_NUM)
    db_print(dates)

    # df = pd.DataFrame(np.random.randn(6, 4), index=pd.date_range(START_DATE, periods=6), columns=list('ABCD'))
    df = pd.DataFrame(np.random.randn(ROW_NUM, COLUMNS_NUM), index=pd.date_range(START_DATE, periods=ROW_NUM),
                      columns=upper_columns_list[:COLUMNS_NUM])
    db_print(df)

    # reindex()方法可以对指定轴上的索引进行改变/增加/删除操作, 这将返回原始数据的一个拷贝
    df1 = df.reindex(index=dates[0:5], columns=list(df.columns) + ['G'])
    df1.loc[dates[0]:dates[1], 'G'] = 1
    df1.loc[dates[4], 'G'] = 99
    df1.loc[dates[1]:dates[2], 'F'] = np.nan
    db_print(df1)

    # 去掉包含缺失值的行
    df2 = df1.dropna(how='any')
    db_print(df2)

    # 对缺失值进行填充
    df2 = df1.fillna(value=99)
    db_print(df2)
    df2 = df1.fillna(method='backfill')
    db_print(df2)
    df2 = df1.fillna(method='bfill')
    db_print(df2)
    df2 = df1.fillna(method='pad')
    db_print(df2)
    df2 = df1.fillna(method='ffill')
    db_print(df2)
    df2 = df1.fillna(88)
    db_print(df2)

    # 对数据进行布尔填充
    df2 = pd.isnull(df1)
    db_print(df2)


# 相关操作
def basic_use_05():
    print('\n\n{0}\n{0}\n{1}{2}\n{0}\n{0}\n\n'.format('*' * 80, ' ' * 30, 'BASIC USE 05'))
    # lower_columns_list = [chr(i) for i in range(97, 123)]
    upper_columns_list = [chr(i) for i in range(65, 91)]

    # dates = pd.date_range(START_DATE, periods=6)
    dates = pd.date_range(START_DATE, periods=ROW_NUM)
    db_print(dates)

    # df = pd.DataFrame(np.random.randn(6, 4), index=pd.date_range(START_DATE, periods=6), columns=list('ABCD'))
    df = pd.DataFrame(np.random.randn(ROW_NUM, COLUMNS_NUM), index=pd.date_range(START_DATE, periods=ROW_NUM),
                      columns=upper_columns_list[:COLUMNS_NUM])
    db_print(df)

    # 执行描述性统计，获取列上平均数
    db_print(df.mean())

    # 在其他轴上进行相同的操作，获取行上平均数
    db_print(df.mean(1))

    # 对于拥有不同维度,需要对齐的对象进行操作。Pandas会自动的沿着指定的维度进行广播
    s = pd.Series([1, 3, 5, np.nan, 6, 8, 10, 12, 14, 16], index=dates)
    db_print(s)
    # series下移2行，补NaN
    s1 = s.shift(2)
    db_print(s1)
    # df上的每列都减去s1，而得到一个新的df
    df1 = df.sub(s1, axis='index')
    db_print(df1)

    # 对数据应用函数
    # 对每一列上的每一行执行累加，即n = 1时，new[n] = old[n], n > 1时，new[n] = new[n - 1] + old[n]
    df1 = df.apply(np.cumsum)
    db_print(df)
    db_print(df1)

    # 每列上的最大值减去最小值，生成了一个新的列(Series)
    df1 = df.apply(lambda x: x.max() - x.min())
    db_print(df)
    db_print(df1)

    s = pd.Series(np.random.randint(0, 7, size=10))
    # 统计Series中，各个数值及其对应的个数
    s1 = s.value_counts()
    db_print(s)
    db_print(s1)

    # 字符串方法
    s = pd.Series(['A', 'B',    'C',    'Aaba', 'Baca', np.nan, 'CABA',  'dog',  'cat'])
    s1 = s.str.lower()
    db_print(s1)


# 相关操作
def basic_use_06():
    print('\n\n{0}\n{0}\n{1}{2}\n{0}\n{0}\n\n'.format('*' * 80, ' ' * 30, 'BASIC USE 06'))
    # lower_columns_list = [chr(i) for i in range(97, 123)]
    upper_columns_list = [chr(i) for i in range(65, 91)]

    # dates = pd.date_range(START_DATE, periods=6)
    dates = pd.date_range(START_DATE, periods=ROW_NUM)
    db_print(dates)

    # df = pd.DataFrame(np.random.randn(6, 4), index=pd.date_range(START_DATE, periods=6), columns=list('ABCD'))
    df = pd.DataFrame(np.random.randn(ROW_NUM, COLUMNS_NUM), index=pd.date_range(START_DATE, periods=ROW_NUM),
                      columns=upper_columns_list[:COLUMNS_NUM])
    db_print(df)

    pieces = [df[:3], df[3:7], df[7:]]
    df1 = pd.concat(pieces)
    db_print(pieces[0])
    db_print(pieces[1])
    db_print(pieces[2])
    db_print(df1)


def main():
    basic_use_01()
    basic_use_02()
    basic_use_03()
    basic_use_04()
    basic_use_05()
    basic_use_06()


if __name__ == "__main__":
    logging_config(LOGGING_LEVEL)
    main()
