zero = 0
one = 1
none = None
empty_list = []
empty_tuple = ()
empty_set = set([])
empty_dict = {}

x_list = [x * 2 + 1 for x in range(100, 120)]
x_tuple = tuple(x_list)
x_set = set(x_list)
x_dict = dict(zip(range(20), x_list))

print('x_list: {}'.format(x_list))
print('x_tuple: {}'.format(x_tuple))
print('x_set: {}'.format(x_set))
print('x_dict: {}'.format(x_dict))

if zero:
    print('zero is {}'.format(zero))

if one:
    print('one is {}'.format(one))

if none:
    print('none is {}'.format(none))

if none is None:
    print('none is {}'.format(none))

if empty_list:
    print('empty_list is {}'.format(empty_list))

if empty_tuple:
    print('empty_tuple is {}'.format(empty_tuple))

if empty_set:
    print('empty_set is {}'.format(empty_set))

if empty_dict:
    print('empty_dict is {}'.format(empty_dict))

if x_list:
    print('x_list is {}'.format(x_list))

if x_tuple:
    print('x_tuple is {}'.format(x_tuple))

if x_set:
    print('x_set is {}'.format(x_set))

if x_dict:
    print('x_dict is {}'.format(x_dict))

'''
>>> not 0
True
>>> not 1
False
>>> not True
False
>>> not False
True
>>> not 10
False
>>> not 0
True
>>> not None
True
>>> None is None
True
>>> None is True
False
>>> None is not None
False
>>> not None is True
True
>>> not 0 is True
True
>>> not 1 is False
True
>>> 0 is True
False
>>> 1 is True
False
>>> not []
True
>>> not ()
True
>>> x = 1
>>> y = 1
>>> id(x)
94472208046624
>>> id(y)
94472208046624
>>> x is y
True
>>>
'''