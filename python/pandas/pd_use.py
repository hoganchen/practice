import pandas as pd
import numpy as np
import logging

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

def main():
    row_num = 10
    columns_num = 6
    lower_columns_list = [chr(i) for i in range(97,123)]
    upper_columns_list = [chr(i) for i in range(65,91)]

    # dates = pd.date_range('20200101', periods=6)
    dates = pd.date_range('20200101', periods=row_num)
    db_print(dates)

    # df = pd.DataFrame(np.random.randn(6, 4), index=pd.date_range('20200101', periods=6), columns=list('ABCD'))
    df = pd.DataFrame(np.random.randn(row_num, columns_num), index=pd.date_range('20200101', periods=row_num), columns=upper_columns_list[:columns_num])

    db_print(df)

    # 打印每行的数据类型
    db_print(df.dtypes)

    # 每行的index名称
    db_print(df.index)

    # df的所有列名
    db_print(df.columns)

    # 打印df的value值，返回为2维列表
    db_print(df.values)

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
    db_print(df.iloc[1])                    # 获取第1行的数据
    db_print(df.iloc[1:3])                  # 获取第1,2行的数据
    db_print(df.iloc[1:3, 0:3])             # 获取第1,2行，前3列的数据
    db_print(df.iloc[1:3, [0,3,5]])         # 获取第1,2行，第0,3,5列的数据
    db_print(df.iloc[[0,2,6], [0,3,5]])     # 获取第0,2,6行，第0,3,5列的数据
    db_print(df.iloc[1:5, :])               # 获取第1～4行的数据(对行进行切片)
    db_print(df.iloc[:, 1:3])               # 获取第1～2列的数据(对列进行切片)
    db_print(df.iloc[1, 1])                 # 获取特定的值

    # 快速访问一个标量，因为iat只用于访问一个标量，所以速度比使用iloc更快
    db_print(df.iat[1, 1])

    # 布尔索引
    db_print(df[df.A > 1])      # 过滤列A中所有大于0的值所在的行(使用一个单独列的值来选择数据)
    db_print(df[df > 0])        # 过滤df中所有大于0的值(使用where操作来选择数据)


if __name__ == "__main__":
    logging_config(LOGGING_LEVEL)
    main()
