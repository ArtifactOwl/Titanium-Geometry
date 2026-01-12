"""
Titanium Geometry - Product Admin Tool
Run this to add and manage products in your shop.

Requirements: Python 3.x (no extra packages needed - uses built-in tkinter)
Usage: python product_admin.py
"""

import tkinter as tk
from tkinter import ttk, messagebox, scrolledtext, simpledialog
import json
import os
import re
import shutil
from datetime import datetime
from pathlib import Path

# Configuration
PROJECT_PATH = os.path.dirname(os.path.abspath(__file__))
DATA_FILE = os.path.join(PROJECT_PATH, "data", "products.json")
SETTINGS_FILE = os.path.join(PROJECT_PATH, "data", "admin_settings.json")
PENDANTS_FOLDER = os.path.join(PROJECT_PATH, "public", "pendants")
PREVIOUS_WORK_FOLDER = os.path.join(PROJECT_PATH, "public", "previous-work")

# Item ID prefixes by group
GROUP_PREFIXES = {
    "Geometric Pendants": "G",
    "Molecules": "M",
    "Organic and Other Pendants": "O",
    "Judaic": "J",
}
DEFAULT_PREFIX = "X"

DEFAULT_STANDARD_TEXT = """Includes:
• Titanium pendant with precision laser engraving
• 24" black cord necklace (or keychain attachment on request)
• Gift box

Shipping:
• US orders ship free via USPS First Class (3-5 business days)
• International shipping available

Care:
• Titanium is hypoallergenic and will not tarnish
• Clean with mild soap and water"""


class ProductAdminApp:
    def __init__(self, root):
        self.root = root
        self.root.title("Titanium Geometry - Product Admin")
        self.root.geometry("950x850")
        self.root.resizable(True, True)
        
        self.data = self.load_data()
        self.settings = self.load_settings()
        
        self.notebook = ttk.Notebook(root)
        self.notebook.pack(fill=tk.BOTH, expand=True, padx=10, pady=10)
        
        self.add_tab = ttk.Frame(self.notebook)
        self.manage_tab = ttk.Frame(self.notebook)
        self.previous_work_tab = ttk.Frame(self.notebook)
        self.sales_tab = ttk.Frame(self.notebook)
        self.groups_tab = ttk.Frame(self.notebook)
        self.videos_tab = ttk.Frame(self.notebook)
        self.settings_tab = ttk.Frame(self.notebook)
        
        self.notebook.add(self.add_tab, text="  Add Product  ")
        self.notebook.add(self.manage_tab, text="  Manage Products  ")
        self.notebook.add(self.previous_work_tab, text="  Previous Work  ")
        self.notebook.add(self.sales_tab, text="  Sales/Pricing  ")
        self.notebook.add(self.groups_tab, text="  Groups  ")
        self.notebook.add(self.videos_tab, text="  Videos  ")
        self.notebook.add(self.settings_tab, text="  Settings  ")
        
        self.create_add_tab()
        self.create_manage_tab()
        self.create_previous_work_tab()
        self.create_sales_tab()
        self.create_groups_tab()
        self.create_videos_tab()
        self.create_settings_tab()
        
    def load_data(self):
        if os.path.exists(DATA_FILE):
            with open(DATA_FILE, 'r') as f:
                return json.load(f)
        else:
            return {
                "groups": ["Molecules", "Geometric Pendants", "Organic and Other Pendants", "Judaic"],
                "categoryImages": {},
                "products": [],
                "previousWork": [],
                "youtubeVideos": []
            }
    
    def save_data(self):
        os.makedirs(os.path.dirname(DATA_FILE), exist_ok=True)
        with open(DATA_FILE, 'w') as f:
            json.dump(self.data, f, indent=2)
    
    def load_settings(self):
        if os.path.exists(SETTINGS_FILE):
            with open(SETTINGS_FILE, 'r') as f:
                return json.load(f)
        else:
            return {
                "standardText": DEFAULT_STANDARD_TEXT,
                "includeStandardTextByDefault": True
            }
    
    def save_settings(self):
        os.makedirs(os.path.dirname(SETTINGS_FILE), exist_ok=True)
        with open(SETTINGS_FILE, 'w') as f:
            json.dump(self.settings, f, indent=2)
    
    def slugify(self, text):
        text = text.lower().strip()
        text = re.sub(r'[^\w\s-]', '', text)
        text = re.sub(r'[-\s]+', '-', text)
        return text
    
    def extract_youtube_id(self, url):
        url = url.strip()
        if len(url) == 11 and '/' not in url and '.' not in url:
            return url
        if 'youtube.com/watch' in url:
            match = re.search(r'v=([a-zA-Z0-9_-]{11})', url)
            if match: return match.group(1)
        if 'youtu.be/' in url:
            match = re.search(r'youtu\.be/([a-zA-Z0-9_-]{11})', url)
            if match: return match.group(1)
        if 'youtube.com/embed/' in url:
            match = re.search(r'embed/([a-zA-Z0-9_-]{11})', url)
            if match: return match.group(1)
        return None
    
    def get_group_prefix(self, group):
        return GROUP_PREFIXES.get(group, DEFAULT_PREFIX)
    
    def generate_item_id(self, group):
        """Generate next available item ID for a group"""
        prefix = self.get_group_prefix(group)
        
        # Find highest existing number for this prefix
        max_num = 0
        for p in self.data['products']:
            item_id = p.get('itemId', '')
            if item_id.startswith(prefix):
                try:
                    num = int(item_id[1:])
                    max_num = max(max_num, num)
                except ValueError:
                    pass
        
        # Return next number
        return f"{prefix}{max_num + 1:04d}"
    
    def assign_all_item_ids(self):
        """Assign item IDs to all products that don't have one"""
        count = 0
        for product in self.data['products']:
            if not product.get('itemId'):
                product['itemId'] = self.generate_item_id(product['group'])
                count += 1
        
        self.save_data()
        return count

    # ==================== ADD PRODUCT TAB ====================
    def create_add_tab(self):
        # Create canvas with scrollbar for this tab
        canvas = tk.Canvas(self.add_tab)
        scrollbar = ttk.Scrollbar(self.add_tab, orient="vertical", command=canvas.yview)
        scrollable_frame = ttk.Frame(canvas)
        
        scrollable_frame.bind(
            "<Configure>",
            lambda e: canvas.configure(scrollregion=canvas.bbox("all"))
        )
        
        canvas.create_window((0, 0), window=scrollable_frame, anchor="nw")
        canvas.configure(yscrollcommand=scrollbar.set)
        
        canvas.pack(side="left", fill="both", expand=True)
        scrollbar.pack(side="right", fill="y")
        
        # Bind mousewheel
        canvas.bind_all("<MouseWheel>", lambda e: canvas.yview_scroll(int(-1*(e.delta/120)), "units"))
        
        main_frame = ttk.Frame(scrollable_frame, padding="20")
        main_frame.pack(fill=tk.BOTH, expand=True)
        
        ttk.Label(main_frame, text="Add New Product", font=('Helvetica', 16, 'bold')).pack(pady=(0, 20))
        
        ttk.Label(main_frame, text="Product Name:").pack(anchor='w')
        self.name_entry = ttk.Entry(main_frame, width=50)
        self.name_entry.pack(fill='x', pady=(0, 10))
        
        ttk.Label(main_frame, text="Group:").pack(anchor='w')
        self.group_var = tk.StringVar()
        self.group_combo = ttk.Combobox(main_frame, textvariable=self.group_var, width=47)
        self.group_combo['values'] = self.data['groups']
        if self.data['groups']: self.group_combo.current(0)
        self.group_combo.pack(fill='x', pady=(0, 10))
        
        ttk.Label(main_frame, text="Price ($):").pack(anchor='w')
        self.price_entry = ttk.Entry(main_frame, width=20)
        self.price_entry.insert(0, "75")
        self.price_entry.pack(anchor='w', pady=(0, 10))
        
        ttk.Label(main_frame, text="Description:").pack(anchor='w')
        self.desc_text = scrolledtext.ScrolledText(main_frame, width=50, height=4)
        self.desc_text.pack(fill='x', pady=(0, 10))
        
        # Standard text section
        std_frame = ttk.LabelFrame(main_frame, text="Standard Text", padding=10)
        std_frame.pack(fill='x', pady=(0, 10))
        
        self.include_std_var = tk.BooleanVar(value=self.settings.get('includeStandardTextByDefault', True))
        ttk.Checkbutton(std_frame, text="Include standard text in description", 
                       variable=self.include_std_var).pack(anchor='w')
        
        ttk.Label(std_frame, text="(Edit standard text in Settings tab)", 
                  foreground='gray', font=('Helvetica', 8)).pack(anchor='w')
        
        # Preview of standard text
        self.std_preview = scrolledtext.ScrolledText(std_frame, width=50, height=4, state='disabled')
        self.std_preview.pack(fill='x', pady=(5, 0))
        self.update_std_preview()
        
        ttk.Label(main_frame, text="YouTube Video URL (optional):").pack(anchor='w')
        self.youtube_entry = ttk.Entry(main_frame, width=50)
        self.youtube_entry.pack(fill='x', pady=(0, 10))
        
        ttk.Label(main_frame, text="Image Folder (auto-generated):").pack(anchor='w')
        self.folder_var = tk.StringVar(value="(enter product name above)")
        ttk.Label(main_frame, textvariable=self.folder_var, font=('Courier', 9), foreground='blue').pack(anchor='w', pady=(0, 10))
        
        # Item ID preview
        ttk.Label(main_frame, text="Item ID (auto-generated):").pack(anchor='w')
        self.item_id_var = tk.StringVar(value="(select group above)")
        ttk.Label(main_frame, textvariable=self.item_id_var, font=('Courier', 9), foreground='green').pack(anchor='w', pady=(0, 10))
        
        self.name_entry.bind('<KeyRelease>', self.update_folder_preview)
        self.group_combo.bind('<<ComboboxSelected>>', self.update_item_id_preview)
        
        btn_frame = ttk.Frame(main_frame)
        btn_frame.pack(fill='x', pady=20)
        ttk.Button(btn_frame, text="Add Product", command=self.add_product).pack(side='left', padx=(0, 10))
        ttk.Button(btn_frame, text="Open Pendants Folder", command=self.open_pendants_folder).pack(side='left')
        
        self.add_status_var = tk.StringVar(value="Ready")
        ttk.Label(main_frame, textvariable=self.add_status_var, foreground='gray').pack(anchor='w')
    
    def update_std_preview(self):
        self.std_preview.config(state='normal')
        self.std_preview.delete("1.0", tk.END)
        self.std_preview.insert("1.0", self.settings.get('standardText', DEFAULT_STANDARD_TEXT))
        self.std_preview.config(state='disabled')
    
    def update_folder_preview(self, event=None):
        name = self.name_entry.get()
        if name.strip():
            self.folder_var.set(os.path.join(PENDANTS_FOLDER, self.slugify(name)))
        else:
            self.folder_var.set("(enter product name above)")
    
    def update_item_id_preview(self, event=None):
        group = self.group_var.get()
        if group:
            next_id = self.generate_item_id(group)
            self.item_id_var.set(next_id)
        else:
            self.item_id_var.set("(select group above)")
    
    def add_product(self):
        name = self.name_entry.get().strip()
        group = self.group_var.get().strip()
        price_str = self.price_entry.get().strip()
        description = self.desc_text.get("1.0", tk.END).strip()
        youtube_url = self.youtube_entry.get().strip()
        
        if not name: return messagebox.showerror("Error", "Please enter a product name")
        if not group: return messagebox.showerror("Error", "Please select a group")
        if not price_str: return messagebox.showerror("Error", "Please enter a price")
        
        try: price = float(price_str)
        except ValueError: return messagebox.showerror("Error", "Price must be a number")
        
        slug = self.slugify(name)
        if any(p['id'] == slug for p in self.data['products']):
            return messagebox.showerror("Error", f"A product with ID '{slug}' already exists")
        
        youtube_id = None
        if youtube_url:
            youtube_id = self.extract_youtube_id(youtube_url)
            if not youtube_id: return messagebox.showerror("Error", "Invalid YouTube URL format")
        
        # Add standard text if checked
        if self.include_std_var.get():
            std_text = self.settings.get('standardText', DEFAULT_STANDARD_TEXT)
            if description:
                description = description + "\n\n" + std_text
            else:
                description = std_text
        
        folder_path = os.path.join(PENDANTS_FOLDER, slug)
        os.makedirs(folder_path, exist_ok=True)
        
        # Generate item ID
        item_id = self.generate_item_id(group)
        
        product = {"id": slug, "name": name, "description": description, "price": price, 
                   "group": group, "folder": slug, "status": "available", 
                   "itemId": item_id,
                   "created": datetime.now().strftime("%Y-%m-%d")}
        if youtube_id: product["youtubeId"] = youtube_id
        
        self.data['products'].append(product)
        self.save_data()
        
        messagebox.showinfo("Success", f"Product '{name}' added!\nItem ID: {item_id}\n\nAdd images to:\n{folder_path}")
        
        self.name_entry.delete(0, tk.END)
        self.desc_text.delete("1.0", tk.END)
        self.price_entry.delete(0, tk.END)
        self.price_entry.insert(0, "75")
        self.youtube_entry.delete(0, tk.END)
        self.folder_var.set("(enter product name above)")
        self.add_status_var.set(f"Added: {name} ({item_id})")
        self.refresh_product_list()
        self.update_item_id_preview()
        
        if messagebox.askyesno("Open Folder?", "Open the product folder to add images?"):
            os.startfile(folder_path)
    
    def open_pendants_folder(self):
        os.makedirs(PENDANTS_FOLDER, exist_ok=True)
        os.startfile(PENDANTS_FOLDER)

    # ==================== MANAGE PRODUCTS TAB ====================
    def create_manage_tab(self):
        main_frame = ttk.Frame(self.manage_tab, padding="20")
        main_frame.pack(fill=tk.BOTH, expand=True)
        
        ttk.Label(main_frame, text="Manage Products", font=('Helvetica', 16, 'bold')).pack(pady=(0, 10))
        
        filter_frame = ttk.Frame(main_frame)
        filter_frame.pack(fill='x', pady=(0, 10))
        ttk.Label(filter_frame, text="Filter:").pack(side='left')
        self.filter_var = tk.StringVar(value="All")
        filter_combo = ttk.Combobox(filter_frame, textvariable=self.filter_var, width=20, values=["All", "Available", "Sold", "Pending"])
        filter_combo.pack(side='left', padx=10)
        filter_combo.bind('<<ComboboxSelected>>', lambda e: self.refresh_product_list())
        ttk.Button(filter_frame, text="Refresh", command=self.refresh_product_list).pack(side='left')
        ttk.Button(filter_frame, text="Update All Item IDs", command=self.update_all_item_ids).pack(side='right')
        
        list_frame = ttk.Frame(main_frame)
        list_frame.pack(fill=tk.BOTH, expand=True, pady=10)
        
        columns = ('itemId', 'name', 'group', 'price', 'status', 'video')
        self.product_tree = ttk.Treeview(list_frame, columns=columns, show='headings', height=10)
        for col, w in [('itemId', 70), ('name', 180), ('group', 110), ('price', 90), ('status', 70), ('video', 50)]:
            self.product_tree.heading(col, text=col.replace('itemId', 'Item #').title())
            self.product_tree.column(col, width=w)
        
        scrollbar = ttk.Scrollbar(list_frame, orient=tk.VERTICAL, command=self.product_tree.yview)
        self.product_tree.configure(yscrollcommand=scrollbar.set)
        self.product_tree.pack(side='left', fill=tk.BOTH, expand=True)
        scrollbar.pack(side='right', fill='y')
        
        for row, btns in enumerate([
            [("Mark Sold", self.mark_sold), ("Mark Pending", self.mark_pending), ("Mark Available", self.mark_available), ("Delete", self.delete_product)],
            [("Edit Price", self.edit_price), ("Edit Description", self.edit_description), ("Change Group", self.change_group), ("Open Images Folder", self.open_product_folder)],
            [("Add/Edit YouTube Video", self.edit_product_video), ("Remove Video", self.remove_product_video), ("Move to Previous Work", self.move_to_previous)]
        ]):
            btn_frame = ttk.Frame(main_frame)
            btn_frame.pack(fill='x', pady=3)
            for text, cmd in btns:
                ttk.Button(btn_frame, text=text, command=cmd).pack(side='left', padx=3)
        
        self.refresh_product_list()
    
    def update_all_item_ids(self):
        count = self.assign_all_item_ids()
        self.refresh_product_list()
        if count > 0:
            messagebox.showinfo("Done", f"Assigned item IDs to {count} products")
        else:
            messagebox.showinfo("Done", "All products already have item IDs")
    
    def refresh_product_list(self):
        for item in self.product_tree.get_children():
            self.product_tree.delete(item)
        self.data = self.load_data()
        
        filter_val = self.filter_var.get()
        products = self.data['products']
        if filter_val == "Available": products = [p for p in products if p.get('status', 'available') == 'available']
        elif filter_val == "Sold": products = [p for p in products if p.get('status') == 'sold']
        elif filter_val == "Pending": products = [p for p in products if p.get('status') == 'pending']
        
        for product in products:
            status = product.get('status', 'available').upper()
            has_video = "✓" if product.get('youtubeId') else ""
            item_id = product.get('itemId', '-')
            if product.get('salePrice'):
                price_display = f"${product['salePrice']} (was ${product.get('originalPrice', product['price'])})"
            else:
                price_display = f"${product['price']}"
            self.product_tree.insert('', tk.END, iid=product['id'], values=(item_id, product['name'], product['group'], price_display, status, has_video))
        
        self.group_combo['values'] = self.data['groups']
    
    def get_selected_product(self):
        selection = self.product_tree.selection()
        if not selection:
            messagebox.showwarning("No Selection", "Please select a product first")
            return None
        return selection[0]
    
    def mark_sold(self):
        pid = self.get_selected_product()
        if not pid: return
        for p in self.data['products']:
            if p['id'] == pid: p['status'] = 'sold'; break
        self.save_data(); self.refresh_product_list()
        messagebox.showinfo("Done", "Product marked as SOLD")
    
    def mark_pending(self):
        pid = self.get_selected_product()
        if not pid: return
        for p in self.data['products']:
            if p['id'] == pid: p['status'] = 'pending'; break
        self.save_data(); self.refresh_product_list()
        messagebox.showinfo("Done", "Product marked as PENDING")
    
    def mark_available(self):
        pid = self.get_selected_product()
        if not pid: return
        for p in self.data['products']:
            if p['id'] == pid: p['status'] = 'available'; break
        self.save_data(); self.refresh_product_list()
        messagebox.showinfo("Done", "Product marked as AVAILABLE")
    
    def delete_product(self):
        pid = self.get_selected_product()
        if not pid: return
        pname = next((p['name'] for p in self.data['products'] if p['id'] == pid), "")
        if not messagebox.askyesno("Confirm", f"Delete '{pname}'?"): return
        self.data['products'] = [p for p in self.data['products'] if p['id'] != pid]
        self.save_data(); self.refresh_product_list()
        messagebox.showinfo("Done", "Product deleted")
    
    def edit_price(self):
        pid = self.get_selected_product()
        if not pid: return
        product = next((p for p in self.data['products'] if p['id'] == pid), None)
        if not product: return
        new_price = simpledialog.askfloat("Edit Price", f"Current: ${product['price']}\n\nNew price:", initialvalue=product['price'], minvalue=0)
        if new_price is not None:
            product['price'] = new_price
            product.pop('salePrice', None)
            product.pop('originalPrice', None)
            self.save_data(); self.refresh_product_list()
            messagebox.showinfo("Done", f"Price updated to ${new_price}")
    
    def edit_description(self):
        pid = self.get_selected_product()
        if not pid: return
        product = next((p for p in self.data['products'] if p['id'] == pid), None)
        if not product: return
        
        dialog = tk.Toplevel(self.root)
        dialog.title(f"Edit Description - {product['name']}")
        dialog.geometry("500x350")
        dialog.transient(self.root); dialog.grab_set()
        
        frame = ttk.Frame(dialog, padding=20)
        frame.pack(fill=tk.BOTH, expand=True)
        ttk.Label(frame, text="Description:").pack(anchor='w')
        desc_text = scrolledtext.ScrolledText(frame, width=50, height=12)
        desc_text.pack(fill=tk.BOTH, expand=True, pady=10)
        desc_text.insert("1.0", product.get('description', ''))
        
        btn_frame = ttk.Frame(frame)
        btn_frame.pack(fill='x')
        
        def append_std():
            std_text = self.settings.get('standardText', DEFAULT_STANDARD_TEXT)
            current = desc_text.get("1.0", tk.END).strip()
            if current:
                desc_text.insert(tk.END, "\n\n" + std_text)
            else:
                desc_text.insert("1.0", std_text)
        
        def save():
            product['description'] = desc_text.get("1.0", tk.END).strip()
            self.save_data(); dialog.destroy()
            messagebox.showinfo("Done", "Description updated")
        
        ttk.Button(btn_frame, text="Append Standard Text", command=append_std).pack(side='left')
        ttk.Button(btn_frame, text="Save", command=save).pack(side='right')
    
    def change_group(self):
        pid = self.get_selected_product()
        if not pid: return
        product = next((p for p in self.data['products'] if p['id'] == pid), None)
        if not product: return
        
        dialog = tk.Toplevel(self.root)
        dialog.title(f"Change Group - {product['name']}")
        dialog.geometry("350x180")
        dialog.transient(self.root); dialog.grab_set()
        
        frame = ttk.Frame(dialog, padding=20)
        frame.pack(fill=tk.BOTH, expand=True)
        ttk.Label(frame, text=f"Current: {product['group']}").pack(pady=5)
        group_var = tk.StringVar(value=product['group'])
        ttk.Combobox(frame, textvariable=group_var, values=self.data['groups'], width=30).pack(fill='x', pady=10)
        
        regen_var = tk.BooleanVar(value=True)
        ttk.Checkbutton(frame, text="Regenerate Item ID for new group", variable=regen_var).pack(anchor='w')
        
        def save():
            new_group = group_var.get()
            product['group'] = new_group
            if regen_var.get():
                product['itemId'] = self.generate_item_id(new_group)
            self.save_data(); self.refresh_product_list(); dialog.destroy()
        ttk.Button(frame, text="Save", command=save).pack(pady=10)
    
    def open_product_folder(self):
        pid = self.get_selected_product()
        if not pid: return
        product = next((p for p in self.data['products'] if p['id'] == pid), None)
        if product:
            folder = os.path.join(PENDANTS_FOLDER, product['folder'])
            if os.path.exists(folder): os.startfile(folder)
            else: messagebox.showwarning("Not Found", f"Folder not found: {folder}")
    
    def edit_product_video(self):
        pid = self.get_selected_product()
        if not pid: return
        product = next((p for p in self.data['products'] if p['id'] == pid), None)
        if not product: return
        
        dialog = tk.Toplevel(self.root)
        dialog.title(f"Edit Video - {product['name']}")
        dialog.geometry("500x180")
        dialog.transient(self.root); dialog.grab_set()
        
        frame = ttk.Frame(dialog, padding=20)
        frame.pack(fill=tk.BOTH, expand=True)
        current_id = product.get('youtubeId', '')
        if current_id: ttk.Label(frame, text=f"Current: {current_id}", foreground='gray').pack()
        ttk.Label(frame, text="YouTube URL:").pack(anchor='w', pady=(10, 0))
        url_entry = ttk.Entry(frame, width=60)
        url_entry.pack(fill='x', pady=5)
        if current_id: url_entry.insert(0, f"https://youtube.com/watch?v={current_id}")
        
        def save():
            url = url_entry.get().strip()
            if url:
                vid = self.extract_youtube_id(url)
                if not vid: return messagebox.showerror("Error", "Invalid YouTube URL", parent=dialog)
                product['youtubeId'] = vid
            else:
                product.pop('youtubeId', None)
            self.save_data(); self.refresh_product_list(); dialog.destroy()
            messagebox.showinfo("Done", "Video updated!")
        ttk.Button(frame, text="Save", command=save).pack(pady=15)
    
    def remove_product_video(self):
        pid = self.get_selected_product()
        if not pid: return
        for p in self.data['products']:
            if p['id'] == pid:
                if 'youtubeId' not in p: return messagebox.showinfo("Info", "No video to remove")
                if messagebox.askyesno("Confirm", f"Remove video from '{p['name']}'?"):
                    del p['youtubeId']
                    self.save_data(); self.refresh_product_list()
                return
    
    def move_to_previous(self):
        pid = self.get_selected_product()
        if not pid: return
        if not messagebox.askyesno("Confirm", "Move to Previous Work?\n\nThis removes from shop and adds to gallery."): return
        
        product = None
        for i, p in enumerate(self.data['products']):
            if p['id'] == pid: product = self.data['products'].pop(i); break
        if not product: return
        
        prev_item = {"id": product['id'], "name": product['name'], "folder": product['folder'], "description": product.get('description', '')}
        if product.get('youtubeId'): prev_item['youtubeId'] = product['youtubeId']
        if product.get('itemId'): prev_item['itemId'] = product['itemId']
        
        if 'previousWork' not in self.data: self.data['previousWork'] = []
        self.data['previousWork'].append(prev_item)
        
        old_folder = os.path.join(PENDANTS_FOLDER, product['folder'])
        new_folder = os.path.join(PREVIOUS_WORK_FOLDER, product['folder'])
        if os.path.exists(old_folder):
            os.makedirs(PREVIOUS_WORK_FOLDER, exist_ok=True)
            try: shutil.move(old_folder, new_folder)
            except Exception as e: messagebox.showwarning("Note", f"Could not move folder: {e}")
        
        self.save_data(); self.refresh_product_list(); self.refresh_previous_work_list()
        messagebox.showinfo("Done", f"'{product['name']}' moved to Previous Work")

    # ==================== PREVIOUS WORK TAB ====================
    def create_previous_work_tab(self):
        main_frame = ttk.Frame(self.previous_work_tab, padding="20")
        main_frame.pack(fill=tk.BOTH, expand=True)
        
        ttk.Label(main_frame, text="Previous Work Gallery", font=('Helvetica', 16, 'bold')).pack(pady=(0, 10))
        
        list_frame = ttk.Frame(main_frame)
        list_frame.pack(fill=tk.BOTH, expand=True, pady=10)
        
        columns = ('itemId', 'name', 'description', 'video')
        self.prev_tree = ttk.Treeview(list_frame, columns=columns, show='headings', height=10)
        for col, w in [('itemId', 70), ('name', 180), ('description', 250), ('video', 50)]:
            self.prev_tree.heading(col, text=col.replace('itemId', 'Item #').title())
            self.prev_tree.column(col, width=w)
        
        scrollbar = ttk.Scrollbar(list_frame, orient=tk.VERTICAL, command=self.prev_tree.yview)
        self.prev_tree.configure(yscrollcommand=scrollbar.set)
        self.prev_tree.pack(side='left', fill=tk.BOTH, expand=True)
        scrollbar.pack(side='right', fill='y')
        
        btn_frame = ttk.Frame(main_frame)
        btn_frame.pack(fill='x', pady=10)
        for text, cmd in [("Add New", self.add_previous_work), ("Edit", self.edit_previous_work), 
                          ("Add/Edit Video", self.edit_prev_video), ("Delete", self.delete_previous_work), ("Open Folder", self.open_prev_folder)]:
            ttk.Button(btn_frame, text=text, command=cmd).pack(side='left', padx=3)
        
        self.refresh_previous_work_list()
    
    def refresh_previous_work_list(self):
        for item in self.prev_tree.get_children(): self.prev_tree.delete(item)
        self.data = self.load_data()
        for item in self.data.get('previousWork', []):
            has_video = "✓" if item.get('youtubeId') else ""
            item_id = item.get('itemId', '-')
            desc = (item.get('description', '')[:40] + '...') if len(item.get('description', '')) > 40 else item.get('description', '')
            self.prev_tree.insert('', tk.END, iid=item['id'], values=(item_id, item['name'], desc, has_video))
    
    def add_previous_work(self):
        dialog = tk.Toplevel(self.root)
        dialog.title("Add Previous Work")
        dialog.geometry("500x350")
        dialog.transient(self.root); dialog.grab_set()
        
        frame = ttk.Frame(dialog, padding=20)
        frame.pack(fill=tk.BOTH, expand=True)
        
        ttk.Label(frame, text="Name:").pack(anchor='w')
        name_entry = ttk.Entry(frame, width=50)
        name_entry.pack(fill='x', pady=(0, 10))
        
        ttk.Label(frame, text="Description:").pack(anchor='w')
        desc_text = scrolledtext.ScrolledText(frame, width=50, height=5)
        desc_text.pack(fill='x', pady=(0, 10))
        
        ttk.Label(frame, text="YouTube URL (optional):").pack(anchor='w')
        yt_entry = ttk.Entry(frame, width=50)
        yt_entry.pack(fill='x', pady=(0, 10))
        
        def save():
            name = name_entry.get().strip()
            if not name: return messagebox.showerror("Error", "Please enter a name", parent=dialog)
            slug = self.slugify(name)
            item = {"id": slug, "name": name, "folder": slug, "description": desc_text.get("1.0", tk.END).strip()}
            yt_url = yt_entry.get().strip()
            if yt_url:
                yt_id = self.extract_youtube_id(yt_url)
                if yt_id: item['youtubeId'] = yt_id
            if 'previousWork' not in self.data: self.data['previousWork'] = []
            self.data['previousWork'].append(item)
            folder_path = os.path.join(PREVIOUS_WORK_FOLDER, slug)
            os.makedirs(folder_path, exist_ok=True)
            self.save_data(); self.refresh_previous_work_list(); dialog.destroy()
            messagebox.showinfo("Success", f"Added '{name}'\n\nAdd images to:\n{folder_path}")
            if messagebox.askyesno("Open Folder?", "Open folder to add images?"): os.startfile(folder_path)
        
        ttk.Button(frame, text="Add", command=save).pack(pady=10)
    
    def edit_previous_work(self):
        selection = self.prev_tree.selection()
        if not selection: return messagebox.showwarning("No Selection", "Please select an item")
        item = next((p for p in self.data.get('previousWork', []) if p['id'] == selection[0]), None)
        if not item: return
        
        dialog = tk.Toplevel(self.root)
        dialog.title(f"Edit - {item['name']}")
        dialog.geometry("500x300")
        dialog.transient(self.root); dialog.grab_set()
        
        frame = ttk.Frame(dialog, padding=20)
        frame.pack(fill=tk.BOTH, expand=True)
        
        ttk.Label(frame, text="Name:").pack(anchor='w')
        name_entry = ttk.Entry(frame, width=50)
        name_entry.insert(0, item['name'])
        name_entry.pack(fill='x', pady=(0, 10))
        
        ttk.Label(frame, text="Description:").pack(anchor='w')
        desc_text = scrolledtext.ScrolledText(frame, width=50, height=6)
        desc_text.insert("1.0", item.get('description', ''))
        desc_text.pack(fill='x', pady=(0, 10))
        
        def save():
            item['name'] = name_entry.get().strip()
            item['description'] = desc_text.get("1.0", tk.END).strip()
            self.save_data(); self.refresh_previous_work_list(); dialog.destroy()
        ttk.Button(frame, text="Save", command=save).pack(pady=10)
    
    def edit_prev_video(self):
        selection = self.prev_tree.selection()
        if not selection: return messagebox.showwarning("No Selection", "Please select an item")
        item = next((p for p in self.data.get('previousWork', []) if p['id'] == selection[0]), None)
        if not item: return
        
        dialog = tk.Toplevel(self.root)
        dialog.title(f"Edit Video - {item['name']}")
        dialog.geometry("500x180")
        dialog.transient(self.root); dialog.grab_set()
        
        frame = ttk.Frame(dialog, padding=20)
        frame.pack(fill=tk.BOTH, expand=True)
        current_id = item.get('youtubeId', '')
        if current_id: ttk.Label(frame, text=f"Current: {current_id}", foreground='gray').pack()
        ttk.Label(frame, text="YouTube URL:").pack(anchor='w', pady=(10, 0))
        url_entry = ttk.Entry(frame, width=60)
        url_entry.pack(fill='x', pady=5)
        if current_id: url_entry.insert(0, f"https://youtube.com/watch?v={current_id}")
        
        def save():
            url = url_entry.get().strip()
            if url:
                vid = self.extract_youtube_id(url)
                if not vid: return messagebox.showerror("Error", "Invalid YouTube URL", parent=dialog)
                item['youtubeId'] = vid
            else:
                item.pop('youtubeId', None)
            self.save_data(); self.refresh_previous_work_list(); dialog.destroy()
        ttk.Button(frame, text="Save", command=save).pack(pady=15)
    
    def delete_previous_work(self):
        selection = self.prev_tree.selection()
        if not selection: return messagebox.showwarning("No Selection", "Please select an item")
        if messagebox.askyesno("Confirm", "Delete this item?"):
            self.data['previousWork'] = [p for p in self.data.get('previousWork', []) if p['id'] != selection[0]]
            self.save_data(); self.refresh_previous_work_list()
    
    def open_prev_folder(self):
        selection = self.prev_tree.selection()
        if not selection: return messagebox.showwarning("No Selection", "Please select an item")
        item = next((p for p in self.data.get('previousWork', []) if p['id'] == selection[0]), None)
        if item:
            folder = os.path.join(PREVIOUS_WORK_FOLDER, item['folder'])
            os.makedirs(folder, exist_ok=True)
            os.startfile(folder)

    # ==================== SALES TAB ====================
    def create_sales_tab(self):
        main_frame = ttk.Frame(self.sales_tab, padding="20")
        main_frame.pack(fill=tk.BOTH, expand=True)
        
        ttk.Label(main_frame, text="Sales & Bulk Pricing", font=('Helvetica', 16, 'bold')).pack(pady=(0, 10))
        
        cat_frame = ttk.LabelFrame(main_frame, text="Category Sale", padding=15)
        cat_frame.pack(fill='x', pady=10)
        
        row1 = ttk.Frame(cat_frame)
        row1.pack(fill='x', pady=5)
        ttk.Label(row1, text="Category:").pack(side='left')
        self.sale_cat_var = tk.StringVar()
        self.sale_cat_combo = ttk.Combobox(row1, textvariable=self.sale_cat_var, width=25)
        self.sale_cat_combo['values'] = ["All Products"] + self.data['groups']
        self.sale_cat_combo.current(0)
        self.sale_cat_combo.pack(side='left', padx=10)
        
        row2 = ttk.Frame(cat_frame)
        row2.pack(fill='x', pady=5)
        ttk.Label(row2, text="Discount:").pack(side='left')
        self.discount_entry = ttk.Entry(row2, width=10)
        self.discount_entry.pack(side='left', padx=5)
        self.discount_type = tk.StringVar(value="percent")
        ttk.Radiobutton(row2, text="% off", variable=self.discount_type, value="percent").pack(side='left', padx=5)
        ttk.Radiobutton(row2, text="$ off", variable=self.discount_type, value="dollars").pack(side='left', padx=5)
        
        row3 = ttk.Frame(cat_frame)
        row3.pack(fill='x', pady=10)
        ttk.Button(row3, text="Apply Sale", command=self.apply_sale).pack(side='left', padx=5)
        ttk.Button(row3, text="Remove All Sales", command=self.remove_all_sales).pack(side='left', padx=5)
        
        ttk.Label(cat_frame, text="Sale prices show with strikethrough original price", foreground='gray').pack(anchor='w')
        
        sales_frame = ttk.LabelFrame(main_frame, text="Current Sale Items", padding=15)
        sales_frame.pack(fill=tk.BOTH, expand=True, pady=10)
        
        columns = ('itemId', 'name', 'original', 'sale', 'discount')
        self.sales_tree = ttk.Treeview(sales_frame, columns=columns, show='headings', height=8)
        for col, w in [('itemId', 70), ('name', 180), ('original', 70), ('sale', 70), ('discount', 70)]:
            self.sales_tree.heading(col, text=col.replace('itemId', 'Item #').title())
            self.sales_tree.column(col, width=w)
        self.sales_tree.pack(fill=tk.BOTH, expand=True)
        
        btn_frame = ttk.Frame(sales_frame)
        btn_frame.pack(fill='x', pady=5)
        ttk.Button(btn_frame, text="Remove Selected Sale", command=self.remove_selected_sale).pack(side='left')
        ttk.Button(btn_frame, text="Refresh", command=self.refresh_sales_list).pack(side='left', padx=10)
        
        self.refresh_sales_list()
    
    def apply_sale(self):
        try: discount = float(self.discount_entry.get())
        except ValueError: return messagebox.showerror("Error", "Enter a valid discount number")
        if discount <= 0: return messagebox.showerror("Error", "Discount must be > 0")
        
        category = self.sale_cat_var.get()
        dtype = self.discount_type.get()
        count = 0
        
        for product in self.data['products']:
            if product.get('status') == 'sold': continue
            if category != "All Products" and product['group'] != category: continue
            
            orig = product.get('originalPrice', product['price'])
            if dtype == "percent": new = round(orig * (1 - discount/100), 2)
            else: new = round(orig - discount, 2)
            if new < 0: new = 0
            
            product['originalPrice'] = orig
            product['salePrice'] = new
            product['price'] = new
            count += 1
        
        self.save_data(); self.refresh_sales_list(); self.refresh_product_list()
        messagebox.showinfo("Done", f"Applied {discount}{'%' if dtype == 'percent' else '$'} discount to {count} products")
    
    def remove_all_sales(self):
        if not messagebox.askyesno("Confirm", "Remove all sales?"): return
        count = 0
        for p in self.data['products']:
            if 'originalPrice' in p:
                p['price'] = p['originalPrice']
                del p['originalPrice']
                count += 1
            p.pop('salePrice', None)
        self.save_data(); self.refresh_sales_list(); self.refresh_product_list()
        messagebox.showinfo("Done", f"Restored {count} products to original price")
    
    def remove_selected_sale(self):
        selection = self.sales_tree.selection()
        if not selection: return messagebox.showwarning("No Selection", "Select a product first")
        for p in self.data['products']:
            if p['id'] == selection[0]:
                if 'originalPrice' in p: p['price'] = p['originalPrice']; del p['originalPrice']
                p.pop('salePrice', None)
                break
        self.save_data(); self.refresh_sales_list(); self.refresh_product_list()
    
    def refresh_sales_list(self):
        for item in self.sales_tree.get_children(): self.sales_tree.delete(item)
        self.data = self.load_data()
        for p in self.data['products']:
            if p.get('salePrice') is not None and p.get('originalPrice') is not None:
                orig, sale = p['originalPrice'], p['salePrice']
                disc = round((1 - sale/orig) * 100, 1) if orig > 0 else 0
                item_id = p.get('itemId', '-')
                self.sales_tree.insert('', tk.END, iid=p['id'], values=(item_id, p['name'], f"${orig}", f"${sale}", f"{disc}% off"))
        self.sale_cat_combo['values'] = ["All Products"] + self.data['groups']

    # ==================== GROUPS TAB ====================
    def create_groups_tab(self):
        main_frame = ttk.Frame(self.groups_tab, padding="20")
        main_frame.pack(fill=tk.BOTH, expand=True)
        
        ttk.Label(main_frame, text="Manage Groups", font=('Helvetica', 16, 'bold')).pack(pady=(0, 20))
        
        ttk.Label(main_frame, text="Current Groups:").pack(anchor='w')
        self.groups_listbox = tk.Listbox(main_frame, height=8, width=40)
        self.groups_listbox.pack(fill='x', pady=(0, 10))
        self.refresh_groups_list()
        
        add_frame = ttk.Frame(main_frame)
        add_frame.pack(fill='x', pady=10)
        ttk.Label(add_frame, text="New group:").pack(side='left')
        self.new_group_entry = ttk.Entry(add_frame, width=30)
        self.new_group_entry.pack(side='left', padx=10)
        ttk.Button(add_frame, text="Add Group", command=self.add_group).pack(side='left')
        
        ttk.Button(main_frame, text="Delete Selected Group", command=self.delete_group).pack(anchor='w', pady=10)
        
        # Group prefixes
        prefix_frame = ttk.LabelFrame(main_frame, text="Item ID Prefixes", padding=10)
        prefix_frame.pack(fill='x', pady=10)
        
        prefix_text = "Current prefixes:\n"
        for group, prefix in GROUP_PREFIXES.items():
            prefix_text += f"  {prefix} = {group}\n"
        prefix_text += f"  {DEFAULT_PREFIX} = Other groups"
        ttk.Label(prefix_frame, text=prefix_text, font=('Courier', 9)).pack(anchor='w')
        ttk.Label(prefix_frame, text="(Edit GROUP_PREFIXES in script to change)", foreground='gray', font=('Helvetica', 8)).pack(anchor='w')
        
        ttk.Separator(main_frame, orient='horizontal').pack(fill='x', pady=20)
        self.stats_var = tk.StringVar()
        self.update_stats()
        ttk.Label(main_frame, textvariable=self.stats_var, foreground='gray').pack(anchor='w')
    
    def refresh_groups_list(self):
        self.groups_listbox.delete(0, tk.END)
        for g in self.data['groups']:
            count = len([p for p in self.data['products'] if p['group'] == g])
            prefix = GROUP_PREFIXES.get(g, DEFAULT_PREFIX)
            self.groups_listbox.insert(tk.END, f"[{prefix}] {g} ({count} products)")
    
    def add_group(self):
        new = self.new_group_entry.get().strip()
        if not new: return messagebox.showerror("Error", "Enter a group name")
        if new in self.data['groups']: return messagebox.showerror("Error", "Group exists")
        self.data['groups'].append(new)
        self.save_data()
        self.group_combo['values'] = self.data['groups']
        self.refresh_groups_list()
        self.new_group_entry.delete(0, tk.END)
        self.update_stats()
    
    def delete_group(self):
        sel = self.groups_listbox.curselection()
        if not sel: return messagebox.showwarning("No Selection", "Select a group")
        gtext = self.groups_listbox.get(sel[0])
        # Extract group name (format: "[X] Group Name (N products)")
        gname = gtext.split('] ', 1)[1].rsplit(' (', 1)[0]
        count = len([p for p in self.data['products'] if p['group'] == gname])
        if count > 0: return messagebox.showerror("Error", f"Cannot delete - has {count} products")
        if messagebox.askyesno("Confirm", f"Delete '{gname}'?"):
            self.data['groups'].remove(gname)
            self.save_data()
            self.group_combo['values'] = self.data['groups']
            self.refresh_groups_list()
            self.update_stats()
    
    def update_stats(self):
        total = len(self.data['products'])
        avail = len([p for p in self.data['products'] if p.get('status', 'available') == 'available'])
        sold = len([p for p in self.data['products'] if p.get('status') == 'sold'])
        pend = len([p for p in self.data['products'] if p.get('status') == 'pending'])
        prev = len(self.data.get('previousWork', []))
        sale = len([p for p in self.data['products'] if p.get('salePrice')])
        with_id = len([p for p in self.data['products'] if p.get('itemId')])
        self.stats_var.set(f"Products: {total} | With Item ID: {with_id} | Available: {avail} | Sold: {sold} | Pending: {pend} | On Sale: {sale} | Previous Work: {prev}")

    # ==================== VIDEOS TAB ====================
    def create_videos_tab(self):
        main_frame = ttk.Frame(self.videos_tab, padding="20")
        main_frame.pack(fill=tk.BOTH, expand=True)
        
        ttk.Label(main_frame, text="YouTube Videos", font=('Helvetica', 16, 'bold')).pack(pady=(0, 10))
        
        wt_frame = ttk.LabelFrame(main_frame, text="'Why Titanium?' Page Videos", padding=10)
        wt_frame.pack(fill='x', pady=10)
        
        self.wt_videos_listbox = tk.Listbox(wt_frame, height=4, width=60)
        self.wt_videos_listbox.pack(fill='x', pady=5)
        
        wt_btn = ttk.Frame(wt_frame)
        wt_btn.pack(fill='x')
        ttk.Button(wt_btn, text="Add Video", command=self.add_wt_video).pack(side='left', padx=3)
        ttk.Button(wt_btn, text="Remove Selected", command=self.delete_wt_video).pack(side='left', padx=3)
        
        pv_frame = ttk.LabelFrame(main_frame, text="Product Videos", padding=10)
        pv_frame.pack(fill=tk.BOTH, expand=True, pady=10)
        
        columns = ('product', 'video_id')
        self.pv_tree = ttk.Treeview(pv_frame, columns=columns, show='headings', height=6)
        self.pv_tree.heading('product', text='Product')
        self.pv_tree.heading('video_id', text='YouTube ID')
        self.pv_tree.column('product', width=250)
        self.pv_tree.column('video_id', width=150)
        self.pv_tree.pack(fill=tk.BOTH, expand=True, pady=5)
        
        pv_btn = ttk.Frame(pv_frame)
        pv_btn.pack(fill='x')
        ttk.Button(pv_btn, text="Quick Add Video to Product", command=self.quick_add_product_video).pack(side='left', padx=3)
        ttk.Button(pv_btn, text="Remove Selected", command=self.remove_pv_video).pack(side='left', padx=3)
        
        self.refresh_videos_lists()
    
    def refresh_videos_lists(self):
        self.wt_videos_listbox.delete(0, tk.END)
        for v in self.data.get('youtubeVideos', []):
            self.wt_videos_listbox.insert(tk.END, f"{v.get('title', 'Untitled')} - {v.get('id', '')}")
        
        for item in self.pv_tree.get_children(): self.pv_tree.delete(item)
        for p in self.data['products']:
            if p.get('youtubeId'): self.pv_tree.insert('', tk.END, iid=p['id'], values=(p['name'], p['youtubeId']))
        for item in self.data.get('previousWork', []):
            if item.get('youtubeId'): self.pv_tree.insert('', tk.END, iid=f"prev_{item['id']}", values=(f"[Previous] {item['name']}", item['youtubeId']))
    
    def add_wt_video(self):
        dialog = tk.Toplevel(self.root)
        dialog.title("Add Video to Why Titanium")
        dialog.geometry("450x180")
        dialog.transient(self.root); dialog.grab_set()
        
        frame = ttk.Frame(dialog, padding=20)
        frame.pack(fill=tk.BOTH, expand=True)
        
        ttk.Label(frame, text="YouTube URL:").pack(anchor='w')
        url_entry = ttk.Entry(frame, width=50)
        url_entry.pack(fill='x', pady=5)
        
        ttk.Label(frame, text="Title:").pack(anchor='w')
        title_entry = ttk.Entry(frame, width=50)
        title_entry.pack(fill='x', pady=5)
        
        def save():
            vid = self.extract_youtube_id(url_entry.get().strip())
            if not vid: return messagebox.showerror("Error", "Invalid YouTube URL", parent=dialog)
            if 'youtubeVideos' not in self.data: self.data['youtubeVideos'] = []
            self.data['youtubeVideos'].append({'id': vid, 'title': title_entry.get().strip() or "Untitled"})
            self.save_data(); self.refresh_videos_lists(); dialog.destroy()
        ttk.Button(frame, text="Add", command=save).pack(pady=10)
    
    def delete_wt_video(self):
        sel = self.wt_videos_listbox.curselection()
        if not sel: return messagebox.showwarning("No Selection", "Select a video")
        if messagebox.askyesno("Confirm", "Remove this video?"):
            videos = self.data.get('youtubeVideos', [])
            if sel[0] < len(videos): del videos[sel[0]]
            self.save_data(); self.refresh_videos_lists()
    
    def quick_add_product_video(self):
        dialog = tk.Toplevel(self.root)
        dialog.title("Add Video to Product")
        dialog.geometry("450x220")
        dialog.transient(self.root); dialog.grab_set()
        
        frame = ttk.Frame(dialog, padding=20)
        frame.pack(fill=tk.BOTH, expand=True)
        
        ttk.Label(frame, text="Select Product:").pack(anchor='w')
        pvar = tk.StringVar()
        products = [p for p in self.data['products'] if not p.get('youtubeId')]
        ttk.Combobox(frame, textvariable=pvar, values=[p['name'] for p in products], width=40).pack(fill='x', pady=5)
        
        ttk.Label(frame, text="YouTube URL:").pack(anchor='w', pady=(10, 0))
        url_entry = ttk.Entry(frame, width=50)
        url_entry.pack(fill='x', pady=5)
        
        def save():
            pname = pvar.get()
            if not pname: return messagebox.showerror("Error", "Select a product", parent=dialog)
            vid = self.extract_youtube_id(url_entry.get().strip())
            if not vid: return messagebox.showerror("Error", "Invalid YouTube URL", parent=dialog)
            for p in self.data['products']:
                if p['name'] == pname: p['youtubeId'] = vid; break
            self.save_data(); self.refresh_videos_lists(); self.refresh_product_list(); dialog.destroy()
        ttk.Button(frame, text="Add", command=save).pack(pady=15)
    
    def remove_pv_video(self):
        sel = self.pv_tree.selection()
        if not sel: return messagebox.showwarning("No Selection", "Select a video")
        if messagebox.askyesno("Confirm", "Remove video from product?"):
            iid = sel[0]
            if iid.startswith("prev_"):
                for item in self.data.get('previousWork', []):
                    if item['id'] == iid[5:]: item.pop('youtubeId', None); break
            else:
                for p in self.data['products']:
                    if p['id'] == iid: p.pop('youtubeId', None); break
            self.save_data(); self.refresh_videos_lists(); self.refresh_product_list()

    # ==================== SETTINGS TAB ====================
    def create_settings_tab(self):
        main_frame = ttk.Frame(self.settings_tab, padding="20")
        main_frame.pack(fill=tk.BOTH, expand=True)
        
        ttk.Label(main_frame, text="Settings", font=('Helvetica', 16, 'bold')).pack(pady=(0, 20))
        
        # Standard text section
        std_frame = ttk.LabelFrame(main_frame, text="Standard Product Description Text", padding=15)
        std_frame.pack(fill=tk.BOTH, expand=True, pady=10)
        
        ttk.Label(std_frame, text="This text can be automatically appended to product descriptions:").pack(anchor='w')
        
        self.settings_std_text = scrolledtext.ScrolledText(std_frame, width=60, height=12)
        self.settings_std_text.pack(fill=tk.BOTH, expand=True, pady=10)
        self.settings_std_text.insert("1.0", self.settings.get('standardText', DEFAULT_STANDARD_TEXT))
        
        self.default_include_var = tk.BooleanVar(value=self.settings.get('includeStandardTextByDefault', True))
        ttk.Checkbutton(std_frame, text="Include standard text by default when adding products", 
                       variable=self.default_include_var).pack(anchor='w')
        
        btn_frame = ttk.Frame(std_frame)
        btn_frame.pack(fill='x', pady=10)
        
        ttk.Button(btn_frame, text="Save Settings", command=self.save_settings_tab).pack(side='left', padx=5)
        ttk.Button(btn_frame, text="Reset to Default", command=self.reset_std_text).pack(side='left', padx=5)
        
        # Info
        info_frame = ttk.LabelFrame(main_frame, text="Info", padding=10)
        info_frame.pack(fill='x', pady=10)
        
        ttk.Label(info_frame, text=f"Data file: {DATA_FILE}", font=('Courier', 8), foreground='gray').pack(anchor='w')
        ttk.Label(info_frame, text=f"Settings file: {SETTINGS_FILE}", font=('Courier', 8), foreground='gray').pack(anchor='w')
    
    def save_settings_tab(self):
        self.settings['standardText'] = self.settings_std_text.get("1.0", tk.END).strip()
        self.settings['includeStandardTextByDefault'] = self.default_include_var.get()
        self.save_settings()
        self.include_std_var.set(self.default_include_var.get())
        self.update_std_preview()
        messagebox.showinfo("Done", "Settings saved!")
    
    def reset_std_text(self):
        if messagebox.askyesno("Confirm", "Reset standard text to default?"):
            self.settings_std_text.delete("1.0", tk.END)
            self.settings_std_text.insert("1.0", DEFAULT_STANDARD_TEXT)


def main():
    root = tk.Tk()
    app = ProductAdminApp(root)
    root.mainloop()

if __name__ == "__main__":
    main()
