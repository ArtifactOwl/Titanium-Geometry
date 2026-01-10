"""
Titanium Geometry - Product Admin Tool
Run this to add and manage products in your shop.

Requirements: Python 3.x (no extra packages needed - uses built-in tkinter)
Usage: python product_admin.py
"""

import tkinter as tk
from tkinter import ttk, messagebox, scrolledtext
import json
import os
import re
import shutil
from datetime import datetime
from pathlib import Path

# Configuration - update this path to match your project location
PROJECT_PATH = os.path.dirname(os.path.abspath(__file__))
DATA_FILE = os.path.join(PROJECT_PATH, "data", "products.json")
PENDANTS_FOLDER = os.path.join(PROJECT_PATH, "public", "pendants")
PREVIOUS_WORK_FOLDER = os.path.join(PROJECT_PATH, "public", "previous-work")


class ProductAdminApp:
    def __init__(self, root):
        self.root = root
        self.root.title("Titanium Geometry - Product Admin")
        self.root.geometry("900x750")
        self.root.resizable(True, True)
        
        # Load existing data
        self.data = self.load_data()
        
        # Create notebook (tabs)
        self.notebook = ttk.Notebook(root)
        self.notebook.pack(fill=tk.BOTH, expand=True, padx=10, pady=10)
        
        # Create tabs
        self.add_tab = ttk.Frame(self.notebook)
        self.manage_tab = ttk.Frame(self.notebook)
        self.groups_tab = ttk.Frame(self.notebook)
        self.videos_tab = ttk.Frame(self.notebook)
        
        self.notebook.add(self.add_tab, text="  Add Product  ")
        self.notebook.add(self.manage_tab, text="  Manage Products  ")
        self.notebook.add(self.groups_tab, text="  Groups  ")
        self.notebook.add(self.videos_tab, text="  Videos  ")
        
        # Build each tab
        self.create_add_tab()
        self.create_manage_tab()
        self.create_groups_tab()
        self.create_videos_tab()
        
    def load_data(self):
        """Load products.json or create default structure"""
        if os.path.exists(DATA_FILE):
            with open(DATA_FILE, 'r') as f:
                return json.load(f)
        else:
            return {
                "groups": [
                    "Molecules",
                    "Geometric Pendants", 
                    "Organic and Other Pendants",
                    "Judaic"
                ],
                "categoryImages": {},
                "products": [],
                "previousWork": []
            }
    
    def save_data(self):
        """Save products.json"""
        os.makedirs(os.path.dirname(DATA_FILE), exist_ok=True)
        with open(DATA_FILE, 'w') as f:
            json.dump(self.data, f, indent=2)
    
    def slugify(self, text):
        """Convert text to URL-friendly slug"""
        text = text.lower().strip()
        text = re.sub(r'[^\w\s-]', '', text)
        text = re.sub(r'[-\s]+', '-', text)
        return text
    
    # ==================== ADD PRODUCT TAB ====================
    def create_add_tab(self):
        main_frame = ttk.Frame(self.add_tab, padding="20")
        main_frame.pack(fill=tk.BOTH, expand=True)
        
        # Title
        title_label = ttk.Label(main_frame, text="Add New Product", font=('Helvetica', 16, 'bold'))
        title_label.pack(pady=(0, 20))
        
        # Product Name
        ttk.Label(main_frame, text="Product Name:").pack(anchor='w')
        self.name_entry = ttk.Entry(main_frame, width=50)
        self.name_entry.pack(fill='x', pady=(0, 10))
        
        # Group dropdown
        ttk.Label(main_frame, text="Group:").pack(anchor='w')
        self.group_var = tk.StringVar()
        self.group_combo = ttk.Combobox(main_frame, textvariable=self.group_var, width=47)
        self.group_combo['values'] = self.data['groups']
        if self.data['groups']:
            self.group_combo.current(0)
        self.group_combo.pack(fill='x', pady=(0, 10))
        
        # Price
        ttk.Label(main_frame, text="Price ($):").pack(anchor='w')
        self.price_entry = ttk.Entry(main_frame, width=20)
        self.price_entry.insert(0, "75")
        self.price_entry.pack(anchor='w', pady=(0, 10))
        
        # Description
        ttk.Label(main_frame, text="Description:").pack(anchor='w')
        self.desc_text = scrolledtext.ScrolledText(main_frame, width=50, height=6)
        self.desc_text.pack(fill='x', pady=(0, 10))
        
        # Folder info
        ttk.Label(main_frame, text="Image Folder (auto-generated):").pack(anchor='w')
        self.folder_var = tk.StringVar(value="(enter product name above)")
        self.folder_label = ttk.Label(main_frame, textvariable=self.folder_var, 
                                       font=('Courier', 9), foreground='blue')
        self.folder_label.pack(anchor='w', pady=(0, 10))
        
        # Update folder path as user types name
        self.name_entry.bind('<KeyRelease>', self.update_folder_preview)
        
        # Buttons frame
        btn_frame = ttk.Frame(main_frame)
        btn_frame.pack(fill='x', pady=20)
        
        self.add_btn = ttk.Button(btn_frame, text="Add Product", command=self.add_product)
        self.add_btn.pack(side='left', padx=(0, 10))
        
        self.open_folder_btn = ttk.Button(btn_frame, text="Open Pendants Folder", 
                                          command=self.open_pendants_folder)
        self.open_folder_btn.pack(side='left')
        
        # Status
        self.add_status_var = tk.StringVar(value="Ready")
        ttk.Label(main_frame, textvariable=self.add_status_var, foreground='gray').pack(anchor='w')
    
    def update_folder_preview(self, event=None):
        name = self.name_entry.get()
        if name.strip():
            slug = self.slugify(name)
            folder_path = os.path.join(PENDANTS_FOLDER, slug)
            self.folder_var.set(folder_path)
        else:
            self.folder_var.set("(enter product name above)")
    
    def add_product(self):
        name = self.name_entry.get().strip()
        group = self.group_var.get().strip()
        price_str = self.price_entry.get().strip()
        description = self.desc_text.get("1.0", tk.END).strip()
        
        if not name:
            messagebox.showerror("Error", "Please enter a product name")
            return
        if not group:
            messagebox.showerror("Error", "Please select a group")
            return
        if not price_str:
            messagebox.showerror("Error", "Please enter a price")
            return
        
        try:
            price = float(price_str)
        except ValueError:
            messagebox.showerror("Error", "Price must be a number")
            return
        
        slug = self.slugify(name)
        
        if any(p['id'] == slug for p in self.data['products']):
            messagebox.showerror("Error", f"A product with ID '{slug}' already exists")
            return
        
        # Create product folder
        folder_path = os.path.join(PENDANTS_FOLDER, slug)
        os.makedirs(folder_path, exist_ok=True)
        
        # Create product entry
        product = {
            "id": slug,
            "name": name,
            "description": description,
            "price": price,
            "group": group,
            "folder": slug,
            "status": "available",
            "created": datetime.now().strftime("%Y-%m-%d")
        }
        
        self.data['products'].append(product)
        self.save_data()
        
        messagebox.showinfo("Success", 
            f"Product '{name}' added!\n\n"
            f"Now add your images/videos to:\n{folder_path}\n\n"
            f"Then push to GitHub to update the site.")
        
        # Clear form
        self.name_entry.delete(0, tk.END)
        self.desc_text.delete("1.0", tk.END)
        self.price_entry.delete(0, tk.END)
        self.price_entry.insert(0, "75")
        self.folder_var.set("(enter product name above)")
        
        self.add_status_var.set(f"Added: {name}")
        self.refresh_product_list()
        
        if messagebox.askyesno("Open Folder?", "Open the product folder to add images?"):
            os.startfile(folder_path)
    
    def open_pendants_folder(self):
        os.makedirs(PENDANTS_FOLDER, exist_ok=True)
        os.startfile(PENDANTS_FOLDER)
    
    # ==================== MANAGE PRODUCTS TAB ====================
    def create_manage_tab(self):
        main_frame = ttk.Frame(self.manage_tab, padding="20")
        main_frame.pack(fill=tk.BOTH, expand=True)
        
        # Title
        ttk.Label(main_frame, text="Manage Products", font=('Helvetica', 16, 'bold')).pack(pady=(0, 10))
        
        # Filter frame
        filter_frame = ttk.Frame(main_frame)
        filter_frame.pack(fill='x', pady=(0, 10))
        
        ttk.Label(filter_frame, text="Filter:").pack(side='left')
        self.filter_var = tk.StringVar(value="All")
        filter_combo = ttk.Combobox(filter_frame, textvariable=self.filter_var, width=20,
                                     values=["All", "Available", "Sold", "Pending"])
        filter_combo.pack(side='left', padx=10)
        filter_combo.bind('<<ComboboxSelected>>', lambda e: self.refresh_product_list())
        
        ttk.Button(filter_frame, text="Refresh", command=self.refresh_product_list).pack(side='left')
        
        # Products list
        list_frame = ttk.Frame(main_frame)
        list_frame.pack(fill=tk.BOTH, expand=True, pady=10)
        
        # Treeview
        columns = ('name', 'group', 'price', 'status')
        self.product_tree = ttk.Treeview(list_frame, columns=columns, show='headings', height=12)
        
        self.product_tree.heading('name', text='Name')
        self.product_tree.heading('group', text='Group')
        self.product_tree.heading('price', text='Price')
        self.product_tree.heading('status', text='Status')
        
        self.product_tree.column('name', width=250)
        self.product_tree.column('group', width=150)
        self.product_tree.column('price', width=80)
        self.product_tree.column('status', width=100)
        
        scrollbar = ttk.Scrollbar(list_frame, orient=tk.VERTICAL, command=self.product_tree.yview)
        self.product_tree.configure(yscrollcommand=scrollbar.set)
        
        self.product_tree.pack(side='left', fill=tk.BOTH, expand=True)
        scrollbar.pack(side='right', fill='y')
        
        # Action buttons
        btn_frame = ttk.Frame(main_frame)
        btn_frame.pack(fill='x', pady=10)
        
        ttk.Button(btn_frame, text="Mark as Sold", command=self.mark_sold).pack(side='left', padx=5)
        ttk.Button(btn_frame, text="Mark as Pending", command=self.mark_pending).pack(side='left', padx=5)
        ttk.Button(btn_frame, text="Mark as Available", command=self.mark_available).pack(side='left', padx=5)
        ttk.Button(btn_frame, text="Move to Previous Work", command=self.move_to_previous).pack(side='left', padx=5)
        ttk.Button(btn_frame, text="Delete", command=self.delete_product).pack(side='left', padx=5)
        
        # Status descriptions
        status_frame = ttk.LabelFrame(main_frame, text="Status Descriptions", padding=10)
        status_frame.pack(fill='x', pady=10)
        
        ttk.Label(status_frame, text="• Available: Listed for sale with Buy button", foreground='green').pack(anchor='w')
        ttk.Label(status_frame, text="• Sold: Shows SOLD badge, no Buy button", foreground='red').pack(anchor='w')
        ttk.Label(status_frame, text="• Pending: No Buy button, shows 'Contact for similar piece' form", foreground='orange').pack(anchor='w')
        ttk.Label(status_frame, text="• Previous Work: Moved to gallery, available for commission requests", foreground='blue').pack(anchor='w')
        
        # Populate list
        self.refresh_product_list()
    
    def refresh_product_list(self):
        # Clear existing items
        for item in self.product_tree.get_children():
            self.product_tree.delete(item)
        
        # Reload data from file
        self.data = self.load_data()
        
        # Filter
        filter_val = self.filter_var.get()
        products = self.data['products']
        
        if filter_val == "Available":
            products = [p for p in products if p.get('status', 'available') == 'available']
        elif filter_val == "Sold":
            products = [p for p in products if p.get('status') == 'sold']
        elif filter_val == "Pending":
            products = [p for p in products if p.get('status') == 'pending']
        
        # Add to tree
        for product in products:
            status = product.get('status', 'available').upper()
            self.product_tree.insert('', tk.END, iid=product['id'], values=(
                product['name'],
                product['group'],
                f"${product['price']}",
                status
            ))
        
        # Update group combo in add tab
        self.group_combo['values'] = self.data['groups']
    
    def get_selected_product(self):
        selection = self.product_tree.selection()
        if not selection:
            messagebox.showwarning("No Selection", "Please select a product first")
            return None
        return selection[0]
    
    def mark_sold(self):
        product_id = self.get_selected_product()
        if not product_id:
            return
        
        for p in self.data['products']:
            if p['id'] == product_id:
                p['status'] = 'sold'
                break
        
        self.save_data()
        self.refresh_product_list()
        messagebox.showinfo("Done", "Product marked as SOLD")
    
    def mark_pending(self):
        product_id = self.get_selected_product()
        if not product_id:
            return
        
        for p in self.data['products']:
            if p['id'] == product_id:
                p['status'] = 'pending'
                break
        
        self.save_data()
        self.refresh_product_list()
        messagebox.showinfo("Done", "Product marked as PENDING\nBuy button replaced with commission form.")
    
    def mark_available(self):
        product_id = self.get_selected_product()
        if not product_id:
            return
        
        for p in self.data['products']:
            if p['id'] == product_id:
                p['status'] = 'available'
                break
        
        self.save_data()
        self.refresh_product_list()
        messagebox.showinfo("Done", "Product marked as AVAILABLE")
    
    def move_to_previous(self):
        product_id = self.get_selected_product()
        if not product_id:
            return
        
        if not messagebox.askyesno("Confirm", 
            "Move this product to Previous Work?\n\n"
            "This will:\n"
            "• Remove it from the shop\n"
            "• Add it to the Previous Work gallery\n"
            "• Move images to /public/previous-work/"):
            return
        
        # Find and remove from products
        product = None
        for i, p in enumerate(self.data['products']):
            if p['id'] == product_id:
                product = self.data['products'].pop(i)
                break
        
        if not product:
            return
        
        # Add to previousWork
        prev_item = {
            "id": product['id'],
            "name": product['name'],
            "folder": product['folder'],
            "description": product.get('description', '')
        }
        
        if 'previousWork' not in self.data:
            self.data['previousWork'] = []
        self.data['previousWork'].append(prev_item)
        
        # Move images folder
        old_folder = os.path.join(PENDANTS_FOLDER, product['folder'])
        new_folder = os.path.join(PREVIOUS_WORK_FOLDER, product['folder'])
        
        if os.path.exists(old_folder):
            os.makedirs(PREVIOUS_WORK_FOLDER, exist_ok=True)
            try:
                shutil.move(old_folder, new_folder)
            except Exception as e:
                messagebox.showwarning("Note", f"Could not move images folder: {e}\nPlease move manually.")
        
        self.save_data()
        self.refresh_product_list()
        messagebox.showinfo("Done", f"'{product['name']}' moved to Previous Work")
    
    def delete_product(self):
        product_id = self.get_selected_product()
        if not product_id:
            return
        
        product_name = ""
        for p in self.data['products']:
            if p['id'] == product_id:
                product_name = p['name']
                break
        
        if not messagebox.askyesno("Confirm Delete", 
            f"Delete '{product_name}'?\n\nThis cannot be undone.\n"
            f"(Images in /public/pendants/{product_id}/ will NOT be deleted)"):
            return
        
        self.data['products'] = [p for p in self.data['products'] if p['id'] != product_id]
        self.save_data()
        self.refresh_product_list()
        messagebox.showinfo("Done", "Product deleted")
    
    # ==================== GROUPS TAB ====================
    def create_groups_tab(self):
        main_frame = ttk.Frame(self.groups_tab, padding="20")
        main_frame.pack(fill=tk.BOTH, expand=True)
        
        ttk.Label(main_frame, text="Manage Groups", font=('Helvetica', 16, 'bold')).pack(pady=(0, 20))
        
        # Current groups
        ttk.Label(main_frame, text="Current Groups:").pack(anchor='w')
        self.groups_listbox = tk.Listbox(main_frame, height=8, width=40)
        self.groups_listbox.pack(fill='x', pady=(0, 10))
        self.refresh_groups_list()
        
        # Add group
        add_frame = ttk.Frame(main_frame)
        add_frame.pack(fill='x', pady=10)
        
        ttk.Label(add_frame, text="New group:").pack(side='left')
        self.new_group_entry = ttk.Entry(add_frame, width=30)
        self.new_group_entry.pack(side='left', padx=10)
        ttk.Button(add_frame, text="Add Group", command=self.add_group).pack(side='left')
        
        # Delete group button
        ttk.Button(main_frame, text="Delete Selected Group", command=self.delete_group).pack(anchor='w', pady=10)
        
        # Stats
        ttk.Separator(main_frame, orient='horizontal').pack(fill='x', pady=20)
        self.stats_var = tk.StringVar()
        self.update_stats()
        ttk.Label(main_frame, textvariable=self.stats_var, foreground='gray').pack(anchor='w')
    
    def refresh_groups_list(self):
        self.groups_listbox.delete(0, tk.END)
        for group in self.data['groups']:
            count = len([p for p in self.data['products'] if p['group'] == group])
            self.groups_listbox.insert(tk.END, f"{group} ({count} products)")
    
    def add_group(self):
        new_group = self.new_group_entry.get().strip()
        if not new_group:
            messagebox.showerror("Error", "Please enter a group name")
            return
        
        if new_group in self.data['groups']:
            messagebox.showerror("Error", "This group already exists")
            return
        
        self.data['groups'].append(new_group)
        self.save_data()
        
        self.group_combo['values'] = self.data['groups']
        self.refresh_groups_list()
        self.new_group_entry.delete(0, tk.END)
        self.update_stats()
    
    def delete_group(self):
        selection = self.groups_listbox.curselection()
        if not selection:
            messagebox.showwarning("No Selection", "Please select a group first")
            return
        
        group_text = self.groups_listbox.get(selection[0])
        group_name = group_text.rsplit(' (', 1)[0]
        
        # Check if group has products
        count = len([p for p in self.data['products'] if p['group'] == group_name])
        if count > 0:
            messagebox.showerror("Error", f"Cannot delete '{group_name}' - it has {count} products.\n"
                                          "Move or delete the products first.")
            return
        
        if messagebox.askyesno("Confirm", f"Delete group '{group_name}'?"):
            self.data['groups'].remove(group_name)
            self.save_data()
            self.group_combo['values'] = self.data['groups']
            self.refresh_groups_list()
            self.update_stats()
    
    def update_stats(self):
        total = len(self.data['products'])
        available = len([p for p in self.data['products'] if p.get('status', 'available') == 'available'])
        sold = len([p for p in self.data['products'] if p.get('status') == 'sold'])
        pending = len([p for p in self.data['products'] if p.get('status') == 'pending'])
        prev_work = len(self.data.get('previousWork', []))
        
        self.stats_var.set(f"Total: {total} | Available: {available} | Sold: {sold} | Pending: {pending} | Previous Work: {prev_work}")
    
    # ==================== VIDEOS TAB ====================
    def create_videos_tab(self):
        main_frame = ttk.Frame(self.videos_tab, padding="20")
        main_frame.pack(fill=tk.BOTH, expand=True)
        
        ttk.Label(main_frame, text="YouTube Videos", font=('Helvetica', 16, 'bold')).pack(pady=(0, 10))
        ttk.Label(main_frame, text="Add YouTube video URLs to display on the 'Why Titanium?' page.\nPaste the full YouTube URL or just the video ID.", 
                  foreground='gray').pack(pady=(0, 20))
        
        # Current videos list
        ttk.Label(main_frame, text="Current Videos:").pack(anchor='w')
        
        self.videos_listbox = tk.Listbox(main_frame, height=6, width=70)
        self.videos_listbox.pack(fill='x', pady=(0, 10))
        self.refresh_videos_list()
        
        # Delete video button
        ttk.Button(main_frame, text="Remove Selected Video", command=self.delete_video).pack(anchor='w', pady=(0, 20))
        
        # Add video section
        ttk.Separator(main_frame, orient='horizontal').pack(fill='x', pady=10)
        ttk.Label(main_frame, text="Add New Video", font=('Helvetica', 12, 'bold')).pack(anchor='w', pady=(10, 10))
        
        # Video URL
        url_frame = ttk.Frame(main_frame)
        url_frame.pack(fill='x', pady=5)
        ttk.Label(url_frame, text="YouTube URL:").pack(side='left')
        self.video_url_entry = ttk.Entry(url_frame, width=50)
        self.video_url_entry.pack(side='left', padx=10)
        
        # Video title
        title_frame = ttk.Frame(main_frame)
        title_frame.pack(fill='x', pady=5)
        ttk.Label(title_frame, text="Title/Caption:").pack(side='left')
        self.video_title_entry = ttk.Entry(title_frame, width=50)
        self.video_title_entry.pack(side='left', padx=10)
        
        # Add button
        ttk.Button(main_frame, text="Add Video", command=self.add_video).pack(anchor='w', pady=20)
        
        # Help text
        help_frame = ttk.LabelFrame(main_frame, text="Help", padding=10)
        help_frame.pack(fill='x', pady=10)
        
        help_text = """Supported URL formats:
• https://www.youtube.com/watch?v=VIDEO_ID
• https://youtu.be/VIDEO_ID
• Just the VIDEO_ID (e.g., dQw4w9WgXcQ)

Note: YouTube may show ads on embedded videos depending on the video's monetization settings.
For your own videos, you can disable monetization in YouTube Studio to prevent ads."""
        
        ttk.Label(help_frame, text=help_text, foreground='gray').pack(anchor='w')
    
    def extract_youtube_id(self, url):
        """Extract YouTube video ID from various URL formats"""
        url = url.strip()
        
        # Already just an ID?
        if len(url) == 11 and '/' not in url and '.' not in url:
            return url
        
        # youtube.com/watch?v=ID
        if 'youtube.com/watch' in url:
            match = re.search(r'v=([a-zA-Z0-9_-]{11})', url)
            if match:
                return match.group(1)
        
        # youtu.be/ID
        if 'youtu.be/' in url:
            match = re.search(r'youtu\.be/([a-zA-Z0-9_-]{11})', url)
            if match:
                return match.group(1)
        
        # youtube.com/embed/ID
        if 'youtube.com/embed/' in url:
            match = re.search(r'embed/([a-zA-Z0-9_-]{11})', url)
            if match:
                return match.group(1)
        
        return None
    
    def refresh_videos_list(self):
        self.videos_listbox.delete(0, tk.END)
        videos = self.data.get('youtubeVideos', [])
        for video in videos:
            self.videos_listbox.insert(tk.END, f"{video.get('title', 'Untitled')} - {video.get('id', '')}")
    
    def add_video(self):
        url = self.video_url_entry.get().strip()
        title = self.video_title_entry.get().strip() or "Untitled Video"
        
        if not url:
            messagebox.showerror("Error", "Please enter a YouTube URL")
            return
        
        video_id = self.extract_youtube_id(url)
        if not video_id:
            messagebox.showerror("Error", "Could not extract YouTube video ID from URL.\n\nPlease use a format like:\n• https://youtube.com/watch?v=VIDEO_ID\n• https://youtu.be/VIDEO_ID")
            return
        
        # Check for duplicate
        if 'youtubeVideos' not in self.data:
            self.data['youtubeVideos'] = []
        
        if any(v.get('id') == video_id for v in self.data['youtubeVideos']):
            messagebox.showerror("Error", "This video has already been added")
            return
        
        # Add video
        self.data['youtubeVideos'].append({
            'id': video_id,
            'title': title
        })
        
        self.save_data()
        self.refresh_videos_list()
        
        # Clear entries
        self.video_url_entry.delete(0, tk.END)
        self.video_title_entry.delete(0, tk.END)
        
        messagebox.showinfo("Success", f"Video '{title}' added!\n\nPush to GitHub to update the site.")
    
    def delete_video(self):
        selection = self.videos_listbox.curselection()
        if not selection:
            messagebox.showwarning("No Selection", "Please select a video first")
            return
        
        if messagebox.askyesno("Confirm", "Remove this video?"):
            videos = self.data.get('youtubeVideos', [])
            if selection[0] < len(videos):
                del videos[selection[0]]
                self.save_data()
                self.refresh_videos_list()


def main():
    root = tk.Tk()
    app = ProductAdminApp(root)
    root.mainloop()


if __name__ == "__main__":
    main()
