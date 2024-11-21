import time
admins = ["a", "b", "c", "d", "e", "f", "g", "h"]
probs = ["u{}".format(i) for i in range(20)]

sectors = [
    [["u0", "u1", "u2", "u3", "u4", "u5", "u6", "u7", "u8", "u9"], ["u10", "u11", "u12", "u13", "u14", "u15", "u16", "u17", "u18"], ["u19"], [], [], [], [], [], [], []],
]

def new_sector():
    global sectors
    ap = [] #admin probs
    for i in range(len(admins)):
        ap.append([])


    
    for sector in sectors:
        for i, admin in enumerate(sector):
            for prob in admin:
                ap[i].append(prob)
    #create new sector
    sector = []
    for i in range(len(admins)):
        sector.append([])
    
    counts = []
    for i in range(len(ap)):
        counts.append(len(ap[i]))
    
    added = False
    for prob in probs:
        queue = sorted(range(len(counts)), key=lambda i: counts[i])
        for i in queue:
            if prob in ap[i]:
                continue
            ap[i].append(prob)
            sector[i].append(prob)
            counts[i] += 1
            added = True
            break
    
    sectors.append(sector)
    return added

def compile_sectors():
    queues = []
    for i, prob in enumerate(probs):
        queues.append([])
        for sector in sectors:
            for j, admin in enumerate(sector):
                if prob in admin:
                    queues[i].append(admins[j])
                    break
    
    return queues


start = time.time()
while new_sector():
    pass
sectors.pop()
print("Took {} seconds".format(time.time() - start))


cs = compile_sectors()

for iteom in cs:
    print(iteom)
# print(compile_sectors())