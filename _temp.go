package main

import (
	"fmt"
	"sort"
	"time"
)

var admins = []string{"a", "b", "c", "d", "e", "f", "g", "h"}
var probs = func() []string {
	problems := make([]string, 20)
	for i := range problems {
		problems[i] = fmt.Sprintf("u%d", i)
	}
	return problems
}()
var sectors = [][][]string{
	{
		{"u0", "u1"}, {"u2", "u3", "u4"}, {"u5"}, {"u6", "u7"},
		{"u8", "u9"}, {"u10", "u11", "u12"}, {"u13", "u14", "u15"}, {"u16", "u17", "u18", "u19"},
	},
}

func newSector() bool {
	ap := make([][]string, len(admins))
	for _, sector := range sectors {
		for i, admin := range sector {
			ap[i] = append(ap[i], admin...)
		}
	}

	sector := make([][]string, len(admins))
	for i := range sector {
		sector[i] = []string{}
	}

	counts := make([]int, len(admins))
	for i, p := range ap {
		counts[i] = len(p)
	}

	added := false
	for _, prob := range probs {
		queue := make([]int, len(counts))
		for i := range queue {
			queue[i] = i
		}

		sort.Slice(queue, func(i, j int) bool {
			return counts[queue[i]] < counts[queue[j]]
		})

		for _, i := range queue {
			// Check if the problem is already assigned to this admin
			found := false
			for _, p := range ap[i] {
				if p == prob {
					found = true
					break
				}
			}
			if found {
				continue
			}

			ap[i] = append(ap[i], prob)
			sector[i] = append(sector[i], prob)
			counts[i]++
			added = true
			break
		}
	}

	sectors = append(sectors, sector)
	return added
}

func compileSectors() [][]string {
	queues := make([][]string, len(probs))
	for i, prob := range probs {
		for _, sector := range sectors {
			for j, admin := range sector {
				for _, p := range admin {
					if p == prob {
						queues[i] = append(queues[i], admins[j])
						break
					}
				}
			}
		}
	}
	return queues
}

func main() {
	start := time.Now()

	for newSector() { }
	sectors = sectors[:len(sectors)-1]

	fmt.Printf("Took %v seconds\n", time.Since(start).Seconds())
	fmt.Println(compileSectors())
}
