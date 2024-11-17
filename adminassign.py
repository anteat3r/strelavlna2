admins = ["a", "b", "c", "d"]
probs = ["u0", "u1", "u2", "u3", "u4", "u5", "u6", "u7"]

sectors = [
    [["u0", "u1"], ["u2", "u3", "u4"], ["u5"], ["u6", "u7"]]
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

while new_sector():
    pass
sectors.pop()




print(compile_sectors())