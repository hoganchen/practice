x = list(range(0, 10))
index = 0

# while len(x) > 1:
#     list_len = len(x)

#     while index <= list_len:
#         # while index not in x:
#         #     index += 1
#         x.pop(index)

#         print('index = {}'.format(index))
#         print('x = {}'.format(x))

#         index += 2

#     if index > list_len:
#         index -= list_len

while len(x) > 1:
    if index >= len(x):
        index -= len(x)

    try:
        x.pop(index)
    except Exception as err:
        print('Error...')
        print('index = {}'.format(index))
        print('x = {}'.format(x))
        break

    print('index = {}'.format(index))
    print('x = {}'.format(x))
    index += 2

print(x)

# count_num = 10
# count = 0
# index = 1

# while count <= count_num:
#     count += 1
#     index += 3

#     if index > count_num:
#         index -= count_num

# print(index)