import sys, time, select

count = 0
print("You have ten seconds to answer!")

while True:
    i, o, e = select.select( [sys.stdin], [], [], 0.0001 )

    if (i):
        input_char = sys.stdin.readline().strip()
        print("You said", input_char)
        if 'b' == input_char:
            break
    else:
        print("You said nothing!")

    print('{} times print...'.format(count))
    count += 1
    # time.sleep(0.1)

