"""
Titanium Geometry - Image Renamer Tool
Rename product photos to 1.jpg, 2.jpg, etc.

Usage: python image_renamer.py
"""

import tkinter as tk
from tkinter import ttk, filedialog, messagebox
from PIL import Image, ImageTk, ExifTags
import os
import shutil

class ImageRenamerApp:
    def __init__(self, root):
        self.root = root
        self.root.title("Image Renamer - Titanium Geometry")
        self.root.geometry("1000x750")
        
        self.folder_path = None
        self.image_files = []
        self.thumbnails = []  # Store PhotoImage references
        self.assignments = {}  # {filename: number} e.g., {"IMG_001.jpg": 1}
        self.assign_vars = {}  # {filename: StringVar} for updating display
        
        # Size options: (thumb_size, columns, label)
        self.size_options = [
            ((120, 120), 5, "Small"),
            ((180, 180), 4, "Medium"),
            ((280, 280), 3, "Large"),
            ((400, 400), 2, "X-Large"),
        ]
        self.current_size_idx = 1  # Default to Medium
        
        self.create_widgets()
    
    def create_widgets(self):
        # Top frame - folder selection
        top_frame = ttk.Frame(self.root, padding=10)
        top_frame.pack(fill='x')
        
        ttk.Button(top_frame, text="Select Folder", command=self.select_folder).pack(side='left')
        
        self.folder_label = ttk.Label(top_frame, text="No folder selected", foreground='gray')
        self.folder_label.pack(side='left', padx=20)
        
        ttk.Button(top_frame, text="Rename Files", command=self.rename_files).pack(side='right')
        ttk.Button(top_frame, text="Clear All", command=self.clear_assignments).pack(side='right', padx=10)
        
        # Size selector frame
        size_frame = ttk.Frame(self.root, padding=5)
        size_frame.pack(fill='x')
        
        ttk.Label(size_frame, text="Thumbnail Size:").pack(side='left', padx=(10, 5))
        
        self.size_var = tk.StringVar(value=self.size_options[self.current_size_idx][2])
        for idx, (size, cols, label) in enumerate(self.size_options):
            rb = ttk.Radiobutton(size_frame, text=label, value=label, 
                                variable=self.size_var, command=lambda i=idx: self.change_size(i))
            rb.pack(side='left', padx=5)
        
        # Backup option
        ttk.Separator(size_frame, orient='vertical').pack(side='left', padx=15, fill='y')
        self.backup_var = tk.BooleanVar(value=True)
        ttk.Checkbutton(size_frame, text="Save originals to backup folder", 
                       variable=self.backup_var).pack(side='left', padx=5)
        
        # Instructions
        instructions = ttk.Label(self.root, 
            text="Click a number button under each image to assign it (1.jpg, 2.jpg, etc). Click again to unassign.",
            foreground='gray')
        instructions.pack(pady=5)
        
        # Main scrollable frame for images
        self.canvas = tk.Canvas(self.root)
        scrollbar = ttk.Scrollbar(self.root, orient="vertical", command=self.canvas.yview)
        self.scrollable_frame = ttk.Frame(self.canvas)
        
        self.scrollable_frame.bind(
            "<Configure>",
            lambda e: self.canvas.configure(scrollregion=self.canvas.bbox("all"))
        )
        
        self.canvas.create_window((0, 0), window=self.scrollable_frame, anchor="nw")
        self.canvas.configure(yscrollcommand=scrollbar.set)
        
        # Mouse wheel scrolling
        self.canvas.bind_all("<MouseWheel>", lambda e: self.canvas.yview_scroll(int(-1*(e.delta/120)), "units"))
        
        self.canvas.pack(side="left", fill="both", expand=True, padx=10, pady=10)
        scrollbar.pack(side="right", fill="y")
        
        # Status bar
        self.status_var = tk.StringVar(value="Select a folder to begin")
        ttk.Label(self.root, textvariable=self.status_var, relief='sunken').pack(fill='x', side='bottom')
    
    def fix_orientation(self, img):
        """Fix image orientation based on EXIF data"""
        try:
            # Get EXIF data
            exif = img._getexif()
            if exif is None:
                return img
            
            # Find orientation tag
            orientation_key = None
            for key, val in ExifTags.TAGS.items():
                if val == 'Orientation':
                    orientation_key = key
                    break
            
            if orientation_key is None or orientation_key not in exif:
                return img
            
            orientation = exif[orientation_key]
            
            # Apply rotation/flip based on orientation
            if orientation == 2:
                img = img.transpose(Image.FLIP_LEFT_RIGHT)
            elif orientation == 3:
                img = img.rotate(180, expand=True)
            elif orientation == 4:
                img = img.transpose(Image.FLIP_TOP_BOTTOM)
            elif orientation == 5:
                img = img.rotate(-90, expand=True).transpose(Image.FLIP_LEFT_RIGHT)
            elif orientation == 6:
                img = img.rotate(-90, expand=True)
            elif orientation == 7:
                img = img.rotate(90, expand=True).transpose(Image.FLIP_LEFT_RIGHT)
            elif orientation == 8:
                img = img.rotate(90, expand=True)
            
            return img
        except Exception:
            # If anything fails, return original image
            return img
    
    def select_folder(self):
        folder = filedialog.askdirectory(title="Select folder with images")
        if not folder:
            return
        
        self.folder_path = folder
        self.folder_label.config(text=folder)
        self.load_images()
    
    def change_size(self, size_idx):
        self.current_size_idx = size_idx
        if self.folder_path and self.image_files:
            self.load_images(preserve_assignments=True)
    
    def load_images(self, preserve_assignments=False):
        # Clear existing widgets
        for widget in self.scrollable_frame.winfo_children():
            widget.destroy()
        self.thumbnails = []
        
        if not preserve_assignments:
            self.assignments = {}
        self.assign_vars = {}
        
        # Get current size settings
        thumb_size, cols, _ = self.size_options[self.current_size_idx]
        
        # Find image files if not already loaded
        if not preserve_assignments:
            self.image_files = []
            valid_extensions = {'.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp'}
            
            try:
                files = os.listdir(self.folder_path)
            except Exception as e:
                messagebox.showerror("Error", f"Could not read folder: {e}")
                return
            
            for f in sorted(files):
                ext = os.path.splitext(f)[1].lower()
                if ext in valid_extensions:
                    self.image_files.append(f)
        
        if not self.image_files:
            messagebox.showinfo("No Images", "No image files found in this folder")
            return
        
        # Create grid of images
        for idx, filename in enumerate(self.image_files):
            row = idx // cols
            col = idx % cols
            
            # Create frame for each image
            frame = ttk.Frame(self.scrollable_frame, padding=5)
            frame.grid(row=row, column=col, padx=5, pady=5, sticky='n')
            
            # Load and resize image
            img_path = os.path.join(self.folder_path, filename)
            try:
                img = Image.open(img_path)
                # Fix orientation based on EXIF
                img = self.fix_orientation(img)
                img.thumbnail(thumb_size, Image.Resampling.LANCZOS)
                photo = ImageTk.PhotoImage(img)
                self.thumbnails.append(photo)  # Keep reference
                
                # Image label
                img_label = ttk.Label(frame, image=photo)
                img_label.pack()
            except Exception as e:
                # Show placeholder for failed images
                ttk.Label(frame, text="[Error]", width=20).pack()
            
            # Filename (truncated based on size)
            max_chars = max(15, thumb_size[0] // 10)
            display_name = filename if len(filename) < max_chars else filename[:max_chars-3] + "..."
            ttk.Label(frame, text=display_name, font=('Helvetica', 8)).pack()
            
            # Assignment indicator
            assign_var = tk.StringVar(value="-")
            self.assign_vars[filename] = assign_var
            
            # Restore assignment if preserving
            if preserve_assignments and filename in self.assignments:
                assign_var.set(str(self.assignments[filename]))
            
            assign_label = ttk.Label(frame, textvariable=assign_var, font=('Helvetica', 14, 'bold'),
                                     foreground='green')
            assign_label.pack()
            
            # Number buttons - adjust layout based on size
            btn_frame = ttk.Frame(frame)
            btn_frame.pack()
            
            if thumb_size[0] >= 280:  # Large or X-Large - all 12 in one row
                for num in range(1, 13):
                    btn = ttk.Button(btn_frame, text=str(num), width=2,
                                    command=lambda f=filename, n=num: self.toggle_assignment(f, n))
                    btn.grid(row=0, column=num-1, padx=1, pady=1)
            else:  # Small or Medium - two rows
                for num in range(1, 7):
                    btn = ttk.Button(btn_frame, text=str(num), width=2,
                                    command=lambda f=filename, n=num: self.toggle_assignment(f, n))
                    btn.grid(row=0, column=num-1, padx=1, pady=1)
                
                for num in range(7, 13):
                    btn = ttk.Button(btn_frame, text=str(num), width=2,
                                    command=lambda f=filename, n=num: self.toggle_assignment(f, n))
                    btn.grid(row=1, column=num-7, padx=1, pady=1)
        
        self.update_status()
    
    def toggle_assignment(self, filename, number):
        # Check if this number is already assigned to another file
        current_holder = None
        for f, n in self.assignments.items():
            if n == number:
                current_holder = f
                break
        
        # If clicking same assignment, remove it
        if self.assignments.get(filename) == number:
            del self.assignments[filename]
            if filename in self.assign_vars:
                self.assign_vars[filename].set("-")
            self.update_status()
            return
        
        # If number is taken by another file, remove that assignment first
        if current_holder and current_holder != filename:
            del self.assignments[current_holder]
            if current_holder in self.assign_vars:
                self.assign_vars[current_holder].set("-")
        
        # Assign new number
        self.assignments[filename] = number
        if filename in self.assign_vars:
            self.assign_vars[filename].set(str(number))
        
        self.update_status()
    
    def update_status(self):
        assigned = len(self.assignments)
        total = len(self.image_files)
        
        # Check for gaps
        if self.assignments:
            nums = sorted(self.assignments.values())
            expected = list(range(1, len(nums) + 1))
            if nums != expected:
                self.status_var.set(f"Assigned: {assigned}/{total} - Warning: gaps in numbering!")
            else:
                backup_status = "with backup" if self.backup_var.get() else "NO backup"
                self.status_var.set(f"Assigned: {assigned}/{total} - Ready to rename ({backup_status})")
        else:
            self.status_var.set(f"Loaded {total} images - assign numbers to rename")
    
    def clear_assignments(self):
        self.assignments = {}
        self.load_images(preserve_assignments=False)
        self.status_var.set(f"Cleared all assignments")
    
    def rename_files(self):
        if not self.assignments:
            messagebox.showwarning("No Assignments", "Please assign numbers to images first")
            return
        
        # Check for gaps
        nums = sorted(self.assignments.values())
        expected = list(range(1, len(nums) + 1))
        if nums != expected:
            if not messagebox.askyesno("Warning", 
                "There are gaps in your numbering. Continue anyway?"):
                return
        
        # Confirm
        backup_msg = "Originals will be backed up." if self.backup_var.get() else "WARNING: Originals will NOT be backed up!"
        msg = f"Rename {len(self.assignments)} files?\n{backup_msg}\n\n"
        for filename, num in sorted(self.assignments.items(), key=lambda x: x[1]):
            msg += f"  {filename} → {num}.jpg\n"
        
        if not messagebox.askyesno("Confirm Rename", msg):
            return
        
        # Create backup folder if needed
        backup_folder = None
        if self.backup_var.get():
            backup_folder = os.path.join(self.folder_path, "_original_backup")
            os.makedirs(backup_folder, exist_ok=True)
            
            # Copy originals to backup
            for filename in self.assignments.keys():
                src = os.path.join(self.folder_path, filename)
                dst = os.path.join(backup_folder, filename)
                try:
                    shutil.copy2(src, dst)
                except Exception as e:
                    messagebox.showerror("Error", f"Failed to backup {filename}: {e}")
                    return
        
        # Now rename (using temp names first to avoid conflicts)
        temp_names = {}
        for filename, num in self.assignments.items():
            src = os.path.join(self.folder_path, filename)
            temp = os.path.join(self.folder_path, f"_temp_{num}_{filename}")
            try:
                os.rename(src, temp)
                temp_names[temp] = num
            except Exception as e:
                messagebox.showerror("Error", f"Failed to rename {filename}: {e}")
                return
        
        # Final rename to 1.jpg, 2.jpg, etc.
        for temp_path, num in temp_names.items():
            final = os.path.join(self.folder_path, f"{num}.jpg")
            try:
                # Open image, fix orientation, and save as jpg
                img = Image.open(temp_path)
                img = self.fix_orientation(img)
                img = img.convert('RGB')
                img.save(final, 'JPEG', quality=95)
                os.remove(temp_path)
            except Exception as e:
                messagebox.showerror("Error", f"Failed final rename to {num}.jpg: {e}")
                return
        
        if backup_folder:
            messagebox.showinfo("Success", 
                f"Renamed {len(self.assignments)} files!\n\n"
                f"Originals backed up to:\n{backup_folder}")
        else:
            messagebox.showinfo("Success", 
                f"Renamed {len(self.assignments)} files!")
        
        # Reload
        self.assignments = {}
        self.load_images()


def main():
    # Check for PIL
    try:
        from PIL import Image, ImageTk
    except ImportError:
        import tkinter.messagebox as mb
        root = tk.Tk()
        root.withdraw()
        mb.showerror("Missing Dependency", 
            "This tool requires Pillow (PIL).\n\n"
            "Install it by running:\n"
            "pip install Pillow")
        return
    
    root = tk.Tk()
    app = ImageRenamerApp(root)
    root.mainloop()


if __name__ == "__main__":
    main()
