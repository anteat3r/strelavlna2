import random

def rint(low, high):
    return random.randint(int(low), int(high))

def rfloat(low, high):
    return random.uniform(low, high)

def rfract(Nlow, Nhigh, Dlow, Dhigh):
    N = rint(Nlow, Nhigh)
    D = rint(Dlow, Dhigh)
    return N/D



t = r"<a> je v Moničině vrtačce, jestliže vrtá s <b> <x> a <c> <y>?"
s = r"""
type = rint(0, 2)
napeti = rint(100, 3000)
proud = rint(10, 80)
odpor = rint(10, 60)
if type == 0:
    a = "Jaké napětí"
    b = "odporem"
    c = "proudem"
    x = odpor
    y = proud
    result = x*y
    x = str(x) + ' Ohm'
    y = str(y) + ' A'
if type == 1:
    a = "Jaký proud"
    b = "napětím"
    c = "odporem"
    x = napeti
    y = odpor
    result = x/y
    x = str(x) + ' V'
    y = str(y) + ' Ohm'
if type == 2:
    a = "Jaký odpor"
    b = "napětím"
    c = "proudem"
    x = napeti
    y = proud
    result = x/y
    x = str(x) + ' V'
    y = str(y) + ' A'
"""






def generate(template, script):
    outputs = {}
    exec(script, globals(), outputs)

    result = ""
    output = template
    for key, value in outputs.items():
        if key == "result":
            result = value
        else:
            output = output.replace("<%s>" % key, str(value))

    return output, result

for i in range(10):
    print(generate(t, s))