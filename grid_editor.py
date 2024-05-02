import tkinter as tk
import pyperclip


class PixelGrid:
    def __init__(self, master, rows=10, columns=22, cell_size=40, target=100):
        self.master = master
        self.rows = rows
        self.columns = columns
        self.cell_size = cell_size
        self.target = target
        self.pixels_on = 0
        self.pixel_grid = [[0] * columns for _ in range(rows)]

        self.canvas = tk.Canvas(master, width=columns * cell_size, height=rows * cell_size)
        self.canvas.pack()
        self.canvas.bind("<Button-1>", self.start_draw_on)
        self.canvas.bind("<Button-3>", self.start_draw_off)
        self.canvas.bind("<B1-Motion>", self.draw)
        self.canvas.bind("<B3-Motion>", self.draw)
        self.canvas.bind("<ButtonRelease-1>", self.stop_draw)
        self.canvas.bind("<ButtonRelease-3>", self.stop_draw)

        self.export_button = tk.Button(master, text="Export", command=self.export_pixel_grid)
        self.export_button.pack()

        self.draw_grid()
        self.drawing = -1

    def draw_grid(self):
        for i in range(self.rows):
            for j in range(self.columns):
                x0, y0 = j * self.cell_size, i * self.cell_size
                x1, y1 = x0 + self.cell_size, y0 + self.cell_size
                color = "black" if self.pixel_grid[i][j] else "white"
                self.canvas.create_rectangle(x0, y0, x1, y1, fill=color, outline="black")
                if self.pixel_grid[i][j]:
                    self.pixels_on += 1

    def start_draw_on(self, event):
        self.drawing = 1
        self.toggle_pixel(event)

    def start_draw_off(self, event):
        self.drawing = 0
        self.toggle_pixel(event)

    def draw(self, event):
        if self.drawing != -1:
            self.toggle_pixel(event)

    def stop_draw(self, event):
        self.drawing = -1

    def toggle_pixel(self, event):
        col = event.x // self.cell_size
        row = event.y // self.cell_size
        if 0 <= row < self.rows and 0 <= col < self.columns:
            self.pixel_grid[row][col] = self.drawing #1 - self.pixel_grid[row][col]  # Toggle pixel state
            if self.pixel_grid[row][col] == 1:
                self.pixels_on += 1
            else:
                self.pixels_on -= 1
            self.draw_pixel(row, col)

    def draw_pixel(self, row, col):
        x0, y0 = col * self.cell_size, row * self.cell_size
        x1, y1 = x0 + self.cell_size, y0 + self.cell_size
        color = "black" if self.pixel_grid[row][col] else "white"
        self.canvas.create_rectangle(x0, y0, x1, y1, fill=color, outline="black")

    def export_pixel_grid(self):
        if self.target != self.count_pixels():
            print(f"Error: You need to turn on {self.target - self.count_pixels()} more pixels.")
        else:
            grid_string = "[\n"
            for i, row in enumerate(self.pixel_grid):
                grid_string += "    " + str(row) + (",\n" if i < len(self.pixel_grid)-1 else "\n")
            grid_string += "]"
            pyperclip.copy(grid_string)
            print("Pixel grid copied to clipboard!")

    def count_pixels(self):
        i = 0
        for row in self.pixel_grid:
            for item in row:
                if item == 1:
                    i +=1
        return i

def main():
    root = tk.Tk()
    root.title("Pixel Grid")
    grid = PixelGrid(root, target=57)
    root.mainloop()


if __name__ == "__main__":
    main()
