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
import queue
import subprocess
import threading
from datetime import datetime
from pathlib import Path

# Configuration
PROJECT_PATH = os.path.dirname(os.path.abspath(__file__))
DATA_FILE = os.path.join(PROJECT_PATH, "data", "products.json")
SETTINGS_FILE = os.path.join(PROJECT_PATH, "data", "admin_settings.json")
PENDANTS_FOLDER = os.path.join(PROJECT_PATH, "public", "pendants")
PREVIOUS_WORK_FOLDER = os.path.join(PROJECT_PATH, "public", "previous-work")
COUPONS_FILE = os.path.join(PROJECT_PATH, "data", "coupons.json")
FLAG_SALES_FILE = os.path.join(PROJECT_PATH, "data", "flag-sales.json")

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

# Sale flags: internal keys never change (they're what's stored in products.json);
# the display names are editable in the Settings tab. Flags are admin-only —
# nothing on the website renders them.
FLAG_KEYS = ["sale1", "sale2", "sale3"]
DEFAULT_FLAG_NAMES = {"sale1": "Sale 1", "sale2": "Sale 2", "sale3": "Sale 3"}
FLAG_TARGET_PREFIX = "Flag: "
# Size is a short free-text note ("1.2 inch / 3cm"), shown as the first
# bullet under Details on the product page. Kept short so it stays a size.
SIZE_MAX_LENGTH = 64

# Ad creative sizes Meta accepts. 4:5 fills the most screen in a phone feed,
# 1:1 is the safe all-rounder, 9:16 is for Stories/Reels.
AD_RATIOS = [
    # label, width, height, filename suffix
    ("4:5  feed (best)", 1080, 1350, "45"),
    ("1:1  square",      1080, 1080, "11"),
    ("9:16 stories",     1080, 1920, "916"),
]
AD_OUTPUT_DIR = os.path.join(PROJECT_PATH, "ad-images")

# Only these paths get published — everything the admin tool actually edits.
# Deliberately narrow so a stray file in the project can never be swept into a
# commit by accident.
PUBLISH_PATHS = [
    "data/products.json",
    "data/coupons.json",
    "data/auto-promos.json",
    "data/testimonials.json",
    "data/flag-sales.json",
    "data/admin_settings.json",
    "public/pendants",
    # The small copies the site actually loads. Rebuild with make_images.py
    # after adding photos, or the new ones fall back to the full-size original.
    "public/img",
    "public/thumb",
    "public/previous-work",
    "public/categories",
    "public/testimonials",
]
CHECK_ON = "☑"
CHECK_OFF = "☐"
PREVIEW_MAX = 240          # widest the Manage tab's preview image is drawn


class ProductAdminApp:
    def __init__(self, root):
        self.root = root
        self.root.title("Titanium Geometry - Product Admin")
        self.root.geometry("950x850")
        self.root.resizable(True, True)
        
        self.data = self.load_data()
        self.settings = self.load_settings()
        self.coupons = self.load_coupons()
        self.flag_sales = self.load_flag_sales()
        
        self.notebook = ttk.Notebook(root)
        self.notebook.pack(fill=tk.BOTH, expand=True, padx=10, pady=10)
        
        self.add_tab = ttk.Frame(self.notebook)
        self.batch_tab = ttk.Frame(self.notebook)
        self.manage_tab = ttk.Frame(self.notebook)
        self.previous_work_tab = ttk.Frame(self.notebook)
        self.sales_tab = ttk.Frame(self.notebook)
        self.coupons_tab = ttk.Frame(self.notebook)
        self.groups_tab = ttk.Frame(self.notebook)
        self.videos_tab = ttk.Frame(self.notebook)
        self.ads_tab = ttk.Frame(self.notebook)
        self.publish_tab = ttk.Frame(self.notebook)
        self.settings_tab = ttk.Frame(self.notebook)
        
        self.notebook.add(self.add_tab, text="  Add Product  ")
        self.notebook.add(self.batch_tab, text="  Batch Create  ")
        self.notebook.add(self.manage_tab, text="  Manage Products  ")
        self.notebook.add(self.previous_work_tab, text="  Previous Work  ")
        self.notebook.add(self.sales_tab, text="  Sales/Pricing  ")
        self.notebook.add(self.coupons_tab, text="  Coupons  ")
        self.notebook.add(self.groups_tab, text="  Groups  ")
        self.notebook.add(self.videos_tab, text="  Videos  ")
        self.notebook.add(self.ads_tab, text="  Ad Images  ")
        self.notebook.add(self.publish_tab, text="  Publish  ")
        self.notebook.add(self.settings_tab, text="  Settings  ")
        
        self.create_add_tab()
        self.create_batch_tab()
        self.create_manage_tab()
        self.create_previous_work_tab()
        self.create_sales_tab()
        self.create_coupons_tab()
        self.create_groups_tab()
        self.create_videos_tab()
        self.create_ads_tab()
        self.create_publish_tab()
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
                "includeStandardTextByDefault": True,
                "flagNames": dict(DEFAULT_FLAG_NAMES)
            }
    
    def save_settings(self):
        os.makedirs(os.path.dirname(SETTINGS_FILE), exist_ok=True)
        with open(SETTINGS_FILE, 'w') as f:
            json.dump(self.settings, f, indent=2)
    
    def filename_safe(self, text, limit=40):
        """Product names contain slashes, commas and ampersands, none of which
        belong in a filename — turn one into a tidy hyphenated fragment."""
        cleaned = re.sub(r'[\/:*?"<>|]', ' ', str(text or ""))
        cleaned = re.sub(r"[^\w\s-]", " ", cleaned)
        cleaned = re.sub(r"[\s_]+", "-", cleaned.strip())
        cleaned = re.sub(r"-{2,}", "-", cleaned).strip("-")
        return cleaned[:limit].strip("-") or "item"

    def clean_size(self, text):
        """Trim a size note and cap its length. Returns '' when there's nothing
        worth storing, so callers can leave the field out entirely."""
        size = " ".join(str(text or "").split())
        return size[:SIZE_MAX_LENGTH]

    def slugify(self, text):
        text = text.lower().strip()
        text = re.sub(r'[^\w\s-]', '', text)
        text = re.sub(r'[-\s]+', '-', text)
        return text

    # ---------- Sale flags ----------
    def flag_names(self):
        """Display names for each flag key, falling back to the defaults."""
        saved = self.settings.get('flagNames', {}) or {}
        return {k: (saved.get(k) or DEFAULT_FLAG_NAMES[k]).strip() or DEFAULT_FLAG_NAMES[k]
                for k in FLAG_KEYS}

    def flag_label(self, key):
        return self.flag_names().get(key, key)

    def product_flags(self, product):
        """The flag keys set on a product (tolerates missing/malformed data)."""
        flags = product.get('flags') or []
        if not isinstance(flags, list):
            return []
        return [f for f in FLAG_KEYS if f in flags]

    def set_product_flags(self, product, keys):
        """Store flags on a product, keeping products.json clean when empty."""
        keys = [k for k in FLAG_KEYS if k in keys]
        if keys:
            product['flags'] = keys
        else:
            product.pop('flags', None)

    def name_from_filename(self, filename):
        """Turn an image filename into a display name: drop the extension,
        treat _ and - as word separators, and capitalize the first letter of
        each word (leaving the rest of each word as-is, e.g. 'DMT' stays 'DMT')."""
        name = os.path.splitext(filename)[0]
        name = name.replace('_', ' ')
        name = re.sub(r'\s+', ' ', name).strip()
        return re.sub(r'(^|[\s-])(\w)', lambda m: m.group(1) + m.group(2).upper(), name)

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
        
        ttk.Label(main_frame, text=f"Size (optional, max {SIZE_MAX_LENGTH} chars — e.g. 1.2 inch / 3cm):").pack(anchor='w')
        self.size_entry = ttk.Entry(main_frame, width=40)
        self.size_entry.pack(anchor='w', pady=(0, 10))

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
        
        # Sale flags (admin-only grouping, not shown on the website)
        self.add_flag_vars = {}
        flag_frame = ttk.LabelFrame(main_frame, text="Sale Flags (not shown on the website)", padding=8)
        flag_frame.pack(fill='x', pady=(0, 10))
        self.add_flag_checks = {}
        for key in FLAG_KEYS:
            var = tk.BooleanVar(value=False)
            cb = ttk.Checkbutton(flag_frame, text=self.flag_label(key), variable=var)
            cb.pack(side='left', padx=8)
            self.add_flag_vars[key] = var
            self.add_flag_checks[key] = cb

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
        size = self.clean_size(self.size_entry.get())
        if size: product["size"] = size
        self.set_product_flags(product, [k for k, v in self.add_flag_vars.items() if v.get()])

        self.data['products'].append(product)
        self.save_data()
        
        messagebox.showinfo("Success", f"Product '{name}' added!\nItem ID: {item_id}\n\nAdd images to:\n{folder_path}")
        
        self.name_entry.delete(0, tk.END)
        self.desc_text.delete("1.0", tk.END)
        self.price_entry.delete(0, tk.END)
        self.price_entry.insert(0, "75")
        self.size_entry.delete(0, tk.END)
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

    # ==================== BATCH CREATE TAB ====================
    def create_batch_tab(self):
        main_frame = ttk.Frame(self.batch_tab, padding="20")
        main_frame.pack(fill=tk.BOTH, expand=True)
        
        ttk.Label(main_frame, text="Batch Create Products", font=('Helvetica', 16, 'bold')).pack(pady=(0, 5))
        ttk.Label(main_frame, text="Create one product per image in a folder. Each gets a new item number.",
                  foreground='gray').pack(pady=(0, 15))
        
        # Folder selection
        folder_frame = ttk.Frame(main_frame)
        folder_frame.pack(fill='x', pady=5)
        ttk.Button(folder_frame, text="Select Image Folder", command=self.batch_select_folder).pack(side='left')
        self.batch_folder_var = tk.StringVar(value="No folder selected")
        ttk.Label(folder_frame, textvariable=self.batch_folder_var, foreground='blue', 
                  font=('Courier', 8)).pack(side='left', padx=10)
        
        # Settings for all products
        settings_frame = ttk.LabelFrame(main_frame, text="Settings for All Products", padding=15)
        settings_frame.pack(fill='x', pady=10)
        
        # Group
        grp_row = ttk.Frame(settings_frame)
        grp_row.pack(fill='x', pady=5)
        ttk.Label(grp_row, text="Group:", width=12).pack(side='left')
        self.batch_group_var = tk.StringVar()
        self.batch_group_combo = ttk.Combobox(grp_row, textvariable=self.batch_group_var, width=35)
        self.batch_group_combo['values'] = self.data['groups']
        if self.data['groups']: self.batch_group_combo.current(0)
        self.batch_group_combo.pack(side='left', padx=5)
        self.batch_group_combo.bind('<<ComboboxSelected>>', lambda e: self.batch_refresh_preview())
        
        # Price
        price_row = ttk.Frame(settings_frame)
        price_row.pack(fill='x', pady=5)
        ttk.Label(price_row, text="Price ($):", width=12).pack(side='left')
        self.batch_price_entry = ttk.Entry(price_row, width=15)
        self.batch_price_entry.insert(0, "75")
        self.batch_price_entry.pack(side='left', padx=5)
        
        # Naming option
        name_row = ttk.Frame(settings_frame)
        name_row.pack(fill='x', pady=5)
        ttk.Label(name_row, text="Name by:", width=12).pack(side='left')
        self.batch_name_mode = tk.StringVar(value="filename")
        ttk.Radiobutton(name_row, text="Image filename", variable=self.batch_name_mode, 
                       value="filename", command=self.batch_refresh_preview).pack(side='left', padx=5)
        ttk.Radiobutton(name_row, text="Item number", variable=self.batch_name_mode, 
                       value="itemnumber", command=self.batch_refresh_preview).pack(side='left', padx=5)
        
        # Size (applied to every product in the batch)
        size_row = ttk.Frame(settings_frame)
        size_row.pack(fill='x', pady=5)
        ttk.Label(size_row, text="Size:", width=12).pack(side='left')
        self.batch_size_entry = ttk.Entry(size_row, width=28)
        self.batch_size_entry.pack(side='left', padx=5)
        ttk.Label(size_row, text="optional — e.g. 1.2 inch / 3cm", foreground='gray').pack(side='left', padx=5)

        # Description
        desc_row = ttk.Frame(settings_frame)
        desc_row.pack(fill='x', pady=5)
        ttk.Label(desc_row, text="Description:", width=12).pack(side='left', anchor='n')
        self.batch_desc_text = scrolledtext.ScrolledText(desc_row, width=40, height=3)
        self.batch_desc_text.pack(side='left', padx=5)
        
        # Standard text checkbox
        self.batch_include_std_var = tk.BooleanVar(value=self.settings.get('includeStandardTextByDefault', True))
        ttk.Checkbutton(settings_frame, text="Include standard text in description",
                       variable=self.batch_include_std_var).pack(anchor='w', pady=5)

        # Sale flags applied to every product in the batch
        flag_row = ttk.Frame(settings_frame)
        flag_row.pack(fill='x', pady=5)
        ttk.Label(flag_row, text="Sale flags:", width=12).pack(side='left')
        self.batch_flag_vars = {}
        self.batch_flag_checks = {}
        for key in FLAG_KEYS:
            var = tk.BooleanVar(value=False)
            cb = ttk.Checkbutton(flag_row, text=self.flag_label(key), variable=var)
            cb.pack(side='left', padx=8)
            self.batch_flag_vars[key] = var
            self.batch_flag_checks[key] = cb
        
        # Preview
        preview_frame = ttk.LabelFrame(main_frame, text="Preview", padding=10)
        preview_frame.pack(fill=tk.BOTH, expand=True, pady=10)
        
        columns = ('image', 'name', 'itemId')
        self.batch_tree = ttk.Treeview(preview_frame, columns=columns, show='headings', height=8)
        self.batch_tree.heading('image', text='Image File')
        self.batch_tree.heading('name', text='Product Name')
        self.batch_tree.heading('itemId', text='Item # (preview)')
        self.batch_tree.column('image', width=200)
        self.batch_tree.column('name', width=250)
        self.batch_tree.column('itemId', width=100)
        
        batch_scroll = ttk.Scrollbar(preview_frame, orient=tk.VERTICAL, command=self.batch_tree.yview)
        self.batch_tree.configure(yscrollcommand=batch_scroll.set)
        self.batch_tree.pack(side='left', fill=tk.BOTH, expand=True)
        batch_scroll.pack(side='right', fill='y')
        
        # Create button
        btn_frame = ttk.Frame(main_frame)
        btn_frame.pack(fill='x', pady=10)
        self.batch_create_btn = ttk.Button(btn_frame, text="Create All Products", 
                                            command=self.batch_create_all, state='disabled')
        self.batch_create_btn.pack(side='left')
        self.batch_status_var = tk.StringVar(value="Select a folder to begin")
        ttk.Label(btn_frame, textvariable=self.batch_status_var, foreground='gray').pack(side='left', padx=15)
        
        self.batch_image_files = []
        self.batch_folder = None
    
    def batch_select_folder(self):
        from tkinter import filedialog
        folder = filedialog.askdirectory(title="Select folder with product images")
        if not folder:
            return
        
        self.batch_folder = folder
        self.batch_folder_var.set(folder)
        
        # Find images
        valid_ext = {'.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp'}
        self.batch_image_files = []
        try:
            for f in sorted(os.listdir(folder)):
                if os.path.splitext(f)[1].lower() in valid_ext:
                    self.batch_image_files.append(f)
        except Exception as e:
            return messagebox.showerror("Error", f"Could not read folder: {e}")
        
        if not self.batch_image_files:
            self.batch_status_var.set("No images found in folder")
            self.batch_create_btn.config(state='disabled')
            return
        
        self.batch_refresh_preview()
        self.batch_create_btn.config(state='normal')
    
    def batch_refresh_preview(self):
        for item in self.batch_tree.get_children():
            self.batch_tree.delete(item)
        
        if not self.batch_image_files:
            return
        
        group = self.batch_group_var.get()
        prefix = self.get_group_prefix(group)
        
        # Simulate sequential item IDs for preview
        max_num = 0
        for p in self.data['products']:
            iid = p.get('itemId', '')
            if iid.startswith(prefix):
                try: max_num = max(max_num, int(iid[1:]))
                except ValueError: pass
        
        name_mode = self.batch_name_mode.get()
        
        for idx, filename in enumerate(self.batch_image_files):
            next_id = f"{prefix}{max_num + 1 + idx:04d}"
            if name_mode == "filename":
                name = self.name_from_filename(filename)
            else:
                name = next_id
            self.batch_tree.insert('', tk.END, values=(filename, name, next_id))
        
        self.batch_status_var.set(f"{len(self.batch_image_files)} products ready to create")
    
    def batch_fix_orientation(self, img):
        """Fix orientation from EXIF; no-op if unavailable"""
        try:
            from PIL import ExifTags
            exif = img._getexif()
            if exif is None:
                return img
            orientation_key = next((k for k, v in ExifTags.TAGS.items() if v == 'Orientation'), None)
            if orientation_key is None or orientation_key not in exif:
                return img
            o = exif[orientation_key]
            if o == 3: img = img.rotate(180, expand=True)
            elif o == 6: img = img.rotate(-90, expand=True)
            elif o == 8: img = img.rotate(90, expand=True)
            return img
        except Exception:
            return img
    
    def batch_create_all(self):
        if not self.batch_image_files:
            return messagebox.showwarning("No Images", "Select a folder first")
        
        group = self.batch_group_var.get().strip()
        if not group:
            return messagebox.showerror("Error", "Please select a group")
        
        try:
            price = float(self.batch_price_entry.get().strip())
        except ValueError:
            return messagebox.showerror("Error", "Price must be a number")
        
        name_mode = self.batch_name_mode.get()
        base_desc = self.batch_desc_text.get("1.0", tk.END).strip()
        
        if self.batch_include_std_var.get():
            std_text = self.settings.get('standardText', DEFAULT_STANDARD_TEXT)
            description = (base_desc + "\n\n" + std_text) if base_desc else std_text
        else:
            description = base_desc
        
        batch_flags = [k for k, v in self.batch_flag_vars.items() if v.get()]
        batch_size = self.clean_size(self.batch_size_entry.get())
        flags_note = ", ".join(self.flag_label(k) for k in batch_flags) or "none"

        # Confirm
        if not messagebox.askyesno("Confirm",
            f"Create {len(self.batch_image_files)} products?\n\nGroup: {group}\nPrice: ${price}\n"
            f"Name by: {name_mode}\nSale flags: {flags_note}"):
            return
        
        # Try to import PIL for image processing
        try:
            from PIL import Image as PILImage
            have_pil = True
        except ImportError:
            have_pil = False
        
        created = 0
        skipped = []
        
        for filename in self.batch_image_files:
            item_id = self.generate_item_id(group)
            
            if name_mode == "filename":
                name = self.name_from_filename(filename)
            else:
                name = item_id
            
            slug = self.slugify(name)
            
            # Skip if slug already exists
            if any(p['id'] == slug for p in self.data['products']):
                skipped.append(name)
                continue
            
            # Create folder
            folder_path = os.path.join(PENDANTS_FOLDER, slug)
            os.makedirs(folder_path, exist_ok=True)
            
            # Copy image as 1.jpg
            src = os.path.join(self.batch_folder, filename)
            dst = os.path.join(folder_path, "1.jpg")
            try:
                if have_pil:
                    img = PILImage.open(src)
                    img = self.batch_fix_orientation(img)
                    img = img.convert('RGB')
                    img.save(dst, 'JPEG', quality=95)
                else:
                    shutil.copy2(src, dst)
            except Exception as e:
                skipped.append(f"{name} (image error)")
                continue
            
            # Create product entry
            product = {"id": slug, "name": name, "description": description, "price": price,
                       "group": group, "folder": slug, "status": "available",
                       "itemId": item_id,
                       "created": datetime.now().strftime("%Y-%m-%d")}
            if batch_size: product["size"] = batch_size
            self.set_product_flags(product, batch_flags)
            self.data['products'].append(product)
            created += 1
        
        self.save_data()
        self.refresh_product_list()
        
        msg = f"Created {created} products!"
        if skipped:
            msg += f"\n\nSkipped {len(skipped)} (name already exists):\n" + "\n".join(skipped[:10])
            if len(skipped) > 10:
                msg += f"\n...and {len(skipped) - 10} more"
        messagebox.showinfo("Done", msg)
        
        # Reset
        self.batch_image_files = []
        self.batch_folder = None
        self.batch_folder_var.set("No folder selected")
        self.batch_create_btn.config(state='disabled')
        for item in self.batch_tree.get_children():
            self.batch_tree.delete(item)
        self.batch_status_var.set(f"Created {created} products")

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

        ttk.Label(filter_frame, text="Search:").pack(side='left', padx=(12, 0))
        self.search_var = tk.StringVar()
        ttk.Entry(filter_frame, textvariable=self.search_var, width=26).pack(side='left', padx=5)
        # Filter as you type. No reload — re-reading the file on every keystroke
        # would be wasteful, and nothing on disk has changed.
        self.search_var.trace_add('write', lambda *_: self.refresh_product_list(reload=False))
        ttk.Button(filter_frame, text="Clear", width=6,
                   command=lambda: self.search_var.set("")).pack(side='left')

        ttk.Button(filter_frame, text="Refresh", command=self.refresh_product_list).pack(side='left', padx=(8, 0))
        ttk.Button(filter_frame, text="Update All Item IDs", command=self.update_all_item_ids).pack(side='right')
        ttk.Button(filter_frame, text="Export Images for AI", command=self.export_images_for_ai).pack(side='right', padx=(0, 10))
        ttk.Button(filter_frame, text="Fix Image Names", command=self.fix_image_names).pack(side='right', padx=(0, 10))
        
        list_frame = ttk.Frame(main_frame)
        list_frame.pack(fill=tk.BOTH, expand=True, pady=10)
        
        columns = ('itemId', 'name', 'group', 'price', 'status', 'video') + tuple(FLAG_KEYS) + ('featured', 'fbFeatured')
        self.product_tree = ttk.Treeview(list_frame, columns=columns, show='headings',
                                         height=10, selectmode='extended')
        for col, w in [('itemId', 70), ('name', 170), ('group', 105), ('price', 85), ('status', 65), ('video', 45)]:
            self.product_tree.heading(col, text=col.replace('itemId', 'Item #').title())
            self.product_tree.column(col, width=w)
        # One clickable checkbox column per sale flag
        for key in FLAG_KEYS:
            self.product_tree.heading(key, text=self.flag_label(key))
            self.product_tree.column(key, width=80, anchor='center', stretch=False)
        self.product_tree.heading('featured', text='Featured')
        self.product_tree.column('featured', width=70, anchor='center', stretch=False)
        self.product_tree.heading('fbFeatured', text='FB Ad')
        self.product_tree.column('fbFeatured', width=60, anchor='center', stretch=False)
        self.product_tree.bind('<Button-1>', self.on_product_tree_click)
        self.product_tree.bind('<<TreeviewSelect>>', self.on_product_selected)

        # Photo of whatever is selected, so it's obvious which piece a row is
        # before marking it sold or changing its price.
        preview_frame = ttk.LabelFrame(list_frame, text="Preview", padding=8)
        preview_frame.pack(side='right', fill='y', padx=(10, 0))
        self.preview_photo = None          # keep a reference or tkinter drops it
        self.preview_label = ttk.Label(preview_frame, anchor='center',
                                       text="Select a product", width=34)
        self.preview_label.pack(expand=True)
        self.preview_caption = tk.StringVar(value="")
        ttk.Label(preview_frame, textvariable=self.preview_caption, wraplength=PREVIEW_MAX,
                  justify='center', foreground='gray').pack(pady=(8, 0))

        scrollbar = ttk.Scrollbar(list_frame, orient=tk.VERTICAL, command=self.product_tree.yview)
        self.product_tree.configure(yscrollcommand=scrollbar.set)
        scrollbar.pack(side='right', fill='y')
        self.product_tree.pack(side='left', fill=tk.BOTH, expand=True)

        hint_frame = ttk.Frame(main_frame)
        hint_frame.pack(fill='x')
        ttk.Label(hint_frame,
                  text="Flags: click a checkbox to toggle it. Select several rows "
                       "(Ctrl or Shift click), then click a checkbox to set them all.",
                  foreground='gray').pack(side='left')
        self.manage_status_var = tk.StringVar(value="")
        ttk.Label(hint_frame, textvariable=self.manage_status_var, foreground='#0a7').pack(side='right')

        for row, btns in enumerate([
            [("Mark Sold", self.mark_sold), ("Mark Pending", self.mark_pending), ("Mark Available", self.mark_available), ("Delete", self.delete_product)],
            [("Edit Price", self.edit_price), ("Edit Description", self.edit_description), ("Change Group", self.change_group), ("Open Images Folder", self.open_product_folder)],
            [("Add/Edit YouTube Video", self.edit_product_video), ("Remove Video", self.remove_product_video), ("Move to Previous Work", self.move_to_previous), ("Edit Flags", self.edit_flags), ("Edit Keywords", self.edit_keywords), ("Edit Size", self.edit_size)]
        ]):
            btn_frame = ttk.Frame(main_frame)
            btn_frame.pack(fill='x', pady=3)
            for text, cmd in btns:
                ttk.Button(btn_frame, text=text, command=cmd).pack(side='left', padx=3)
        
        self.refresh_product_list()

    def on_product_tree_click(self, event):
        """Toggle a sale flag when its checkbox cell is clicked. If the clicked row
        is part of a multi-row selection, every selected row is set to match."""
        if self.product_tree.identify_region(event.x, event.y) != 'cell':
            return
        col_id = self.product_tree.identify_column(event.x)  # e.g. '#7'
        try:
            col_index = int(col_id.lstrip('#')) - 1
        except ValueError:
            return
        # Tk can hand back Tcl objects here, so compare as plain strings.
        columns = [str(c) for c in self.product_tree['columns']]
        if not (0 <= col_index < len(columns)):
            return
        flag_key = columns[col_index]
        if flag_key not in FLAG_KEYS and flag_key not in ('featured', 'fbFeatured'):
            return  # not a checkbox column — let the normal click through

        row = self.product_tree.identify_row(event.y)
        if not row:
            return

        selection = self.product_tree.selection()
        targets = selection if (row in selection and len(selection) > 1) else (row,)
        if flag_key in ('featured', 'fbFeatured'):
            self.toggle_featured_for(targets, row, key=flag_key)
        else:
            self.toggle_flag_for(targets, flag_key, row)
        return 'break'  # keep the current selection instead of resetting it

    def toggle_featured_for(self, product_ids, anchor_id, key='featured'):
        """`featured` pins a piece to the top of the shop and the homepage rail.
        `fbFeatured` is the separate, usually smaller set that the Facebook ad
        landing page leads with."""
        by_id = {p['id']: p for p in self.data['products']}
        anchor = by_id.get(anchor_id)
        if not anchor:
            return
        turn_on = not anchor.get(key)

        changed = 0
        for pid in product_ids:
            product = by_id.get(pid)
            if not product:
                continue
            if bool(product.get(key)) == turn_on:
                continue
            if turn_on:
                product[key] = True
            else:
                product.pop(key, None)   # keep products.json tidy
            changed += 1

        if not changed:
            return
        keep = list(product_ids)
        self.save_data()
        self.refresh_product_list()
        still_there = [pid for pid in keep if self.product_tree.exists(pid)]
        if still_there:
            self.product_tree.selection_set(still_there)
        total = sum(1 for p in self.data['products'] if p.get(key))
        what = 'FB ad' if key == 'fbFeatured' else 'Featured'
        self.manage_status_var.set(
            f"{'Added to' if turn_on else 'Removed from'} {what}: {changed} product"
            f"{'s' if changed != 1 else ''} ({total} in total)")

    def toggle_flag_for(self, product_ids, flag_key, anchor_id):
        """Flip the flag on the clicked row, then apply that same state to every
        target row (so a mixed selection ends up consistent)."""
        by_id = {p['id']: p for p in self.data['products']}
        anchor = by_id.get(anchor_id)
        if not anchor:
            return
        turn_on = flag_key not in self.product_flags(anchor)

        changed = 0
        for pid in product_ids:
            product = by_id.get(pid)
            if not product:
                continue
            flags = self.product_flags(product)
            if turn_on and flag_key not in flags:
                flags.append(flag_key)
            elif not turn_on and flag_key in flags:
                flags.remove(flag_key)
            else:
                continue  # already in the desired state
            self.set_product_flags(product, flags)
            changed += 1

        if not changed:
            return
        keep = list(product_ids)
        self.save_data()
        self.refresh_product_list()
        still_there = [pid for pid in keep if self.product_tree.exists(pid)]
        if still_there:
            self.product_tree.selection_set(still_there)
        label = self.flag_label(flag_key)
        self.manage_status_var.set(
            f"{'Set' if turn_on else 'Cleared'} {label} on {changed} product{'s' if changed != 1 else ''}")

    def fix_image_names(self):
        """The website only shows images named 1.jpg, 2.jpg, ... — anything else
        (camera names like 20260129_105720.jpg) is invisible. This renames those
        into the lowest free numbers so they show up on the product page."""
        img_exts = ('.jpg', '.jpeg', '.png', '.webp', '.bmp', '.gif')
        numbered = re.compile(r'^(\d+)\.jpg$', re.IGNORECASE)

        try:
            from PIL import Image as PILImage
            have_pil = True
        except ImportError:
            have_pil = False

        plan = []          # (folder, old_name, new_name, needs_convert)
        needs_convert = 0
        for product in self.data['products']:
            folder = os.path.join(PENDANTS_FOLDER, product['folder'])
            if not os.path.isdir(folder):
                continue
            files = [f for f in os.listdir(folder)
                     if os.path.splitext(f)[1].lower() in img_exts]
            used = set()
            odd = []
            for f in files:
                m = numbered.match(f)
                if m:
                    used.add(int(m.group(1)))
                else:
                    odd.append(f)
            if not odd:
                continue
            next_num = 1
            for old in sorted(odd):
                while next_num in used:
                    next_num += 1
                used.add(next_num)
                convert = os.path.splitext(old)[1].lower() != '.jpg'
                if convert:
                    needs_convert += 1
                plan.append((product, old, f"{next_num}.jpg", convert))

        if not plan:
            return messagebox.showinfo(
                "Nothing to fix",
                "Every image is already named 1.jpg, 2.jpg, ... so they all show on the site.")

        if needs_convert and not have_pil:
            return messagebox.showerror(
                "Pillow required",
                f"{needs_convert} image(s) aren't JPGs and need converting so the site can\n"
                "show them. Install Pillow first:\n\n    pip install Pillow")

        preview = "\n".join(
            f"  {p['itemId']}  {old}  ->  {new}" for p, old, new, _ in plan[:15])
        if len(plan) > 15:
            preview += f"\n  ...and {len(plan) - 15} more"
        if not messagebox.askyesno(
                "Rename these images?",
                f"{len(plan)} image(s) in {len({p['id'] for p, _, _, _ in plan})} product(s) "
                f"will be renamed so the website shows them:\n\n{preview}\n\nGo ahead?"):
            return

        renamed, failed = 0, []
        for product, old, new, convert in plan:
            folder = os.path.join(PENDANTS_FOLDER, product['folder'])
            src = os.path.join(folder, old)
            dst = os.path.join(folder, new)
            try:
                if os.path.exists(dst):        # shouldn't happen, but never overwrite
                    failed.append(f"{product['itemId']} {old} (target {new} exists)")
                    continue
                if convert:
                    img = PILImage.open(src)
                    img = self.batch_fix_orientation(img)
                    img.convert('RGB').save(dst, 'JPEG', quality=95)
                    os.remove(src)
                else:
                    os.rename(src, dst)
                renamed += 1
            except Exception as e:
                failed.append(f"{product['itemId']} {old} ({e})")

        msg = f"Renamed {renamed} image(s).\n\nThey'll appear on the product pages after you push."
        if failed:
            msg += "\n\nCouldn't rename:\n" + "\n".join(failed[:10])
        messagebox.showinfo("Done", msg)

    def export_images_for_ai(self):
        """Copy the primary photo of every product that still needs a description
        into ai-descriptions-images/, renamed by folder, for uploading to ChatGPT.
        See docs/ai-descriptions.md for the prompt and the apply step."""
        img_exts = ('.jpg', '.jpeg', '.png', '.webp')

        def needs_description(desc):
            d = (desc or '').strip()
            return d == '' or d.startswith('Includes:')

        def primary_image(folder):
            d = os.path.join(PENDANTS_FOLDER, folder)
            if not os.path.isdir(d):
                return None
            preferred = os.path.join(d, '1.jpg')
            if os.path.exists(preferred):
                return preferred
            for f in sorted(os.listdir(d)):
                if f.lower().endswith(img_exts):
                    return os.path.join(d, f)
            return None

        selected = [p for p in self.data['products'] if needs_description(p.get('description'))]
        if not selected:
            return messagebox.showinfo(
                "Nothing to export",
                "Every product already has a description (nothing is using the default text).")

        out_dir = os.path.join(PROJECT_PATH, "ai-descriptions-images")
        os.makedirs(out_dir, exist_ok=True)

        copied, missing = [], []
        for p in selected:
            src = primary_image(p['folder'])
            if not src:
                missing.append(p['folder'])
                continue
            ext = os.path.splitext(src)[1].lower()
            shutil.copy2(src, os.path.join(out_dir, p['folder'] + ext))
            copied.append(p['folder'])

        msg = f"Exported {len(copied)} image(s) to:\n{out_dir}\n\n"
        msg += "Next: upload these to ChatGPT with the prompt in docs/ai-descriptions.md,\n"
        msg += "then run:  python apply_descriptions.py descriptions.json"
        if missing:
            msg += f"\n\nNo image found for {len(missing)}: " + ", ".join(missing[:10])
        messagebox.showinfo("Export Complete", msg)

        if copied:
            try:
                os.startfile(out_dir)
            except Exception:
                pass

    def update_all_item_ids(self):
        count = self.assign_all_item_ids()
        self.refresh_product_list()
        if count > 0:
            messagebox.showinfo("Done", f"Assigned item IDs to {count} products")
        else:
            messagebox.showinfo("Done", "All products already have item IDs")
    
    def product_matches_search(self, product, terms):
        """Every word typed has to appear somewhere in the product. Searching
        covers the item number, name, group, keywords and description, so
        'M0001', 'molecule' and 'purple' all find the same piece."""
        if not terms:
            return True
        haystack = " ".join([
            str(product.get('itemId', '')),
            product.get('name', ''),
            product.get('id', ''),
            product.get('group', ''),
            product.get('description', ''),
            product.get('size', '') or '',
            " ".join(product.get('keywords') or []),
        ]).lower()
        return all(term in haystack for term in terms)

    def refresh_product_list(self, reload=True):
        # Rebuilding the tree drops the selection, which is jarring right after
        # editing a product — remember it and put it back.
        previous = self.product_tree.selection()
        for item in self.product_tree.get_children():
            self.product_tree.delete(item)
        if reload:
            self.data = self.load_data()

        filter_val = self.filter_var.get()
        products = self.data['products']
        if filter_val == "Available": products = [p for p in products if p.get('status', 'available') == 'available']
        elif filter_val == "Sold": products = [p for p in products if p.get('status') == 'sold']
        elif filter_val == "Pending": products = [p for p in products if p.get('status') == 'pending']

        terms = self.search_var.get().lower().split()
        if terms:
            products = [p for p in products if self.product_matches_search(p, terms)]

        for product in products:
            status = product.get('status', 'available').upper()
            has_video = "✓" if product.get('youtubeId') else ""
            item_id = product.get('itemId', '-')
            if product.get('salePrice'):
                price_display = f"${product['salePrice']} (was ${product.get('originalPrice', product['price'])})"
            else:
                price_display = f"${product['price']}"
            flags = self.product_flags(product)
            flag_cells = tuple(CHECK_ON if k in flags else CHECK_OFF for k in FLAG_KEYS)
            flag_cells += (CHECK_ON if product.get('featured') else CHECK_OFF,)
            flag_cells += (CHECK_ON if product.get('fbFeatured') else CHECK_OFF,)
            self.product_tree.insert('', tk.END, iid=product['id'],
                                     values=(item_id, product['name'], product['group'],
                                             price_display, status, has_video) + flag_cells)
        
        self.group_combo['values'] = self.data['groups']

        still_there = [pid for pid in previous if self.product_tree.exists(pid)]
        if still_there:
            self.product_tree.selection_set(still_there)
        else:
            self.show_preview(None)

        shown, total = len(products), len(self.data['products'])
        self.manage_status_var.set(
            f"Showing {shown} of {total}" if shown != total else ""
        )

    # ---------- Preview ----------
    def on_product_selected(self, event=None):
        selection = self.product_tree.selection()
        self.show_preview(selection[0] if selection else None, extra=len(selection) - 1)

    def product_images(self, product):
        """Image files in a product's folder, in the order the site numbers them."""
        folder = os.path.join(PROJECT_PATH, 'public', 'pendants', product.get('folder', ''))
        if not os.path.isdir(folder):
            return folder, []
        names = [f for f in os.listdir(folder) if f.lower().endswith(('.jpg', '.jpeg', '.png'))]
        # '2.jpg' must sort before '10.jpg', which plain text sorting gets wrong.
        def order(name):
            stem = os.path.splitext(name)[0]
            return (0, int(stem), '') if stem.isdigit() else (1, 0, stem.lower())
        return folder, sorted(names, key=order)

    def show_preview(self, product_id, extra=0):
        self.preview_photo = None
        if not product_id:
            self.preview_label.config(image='', text="Select a product")
            self.preview_caption.set("")
            return

        product = next((p for p in self.data['products'] if p['id'] == product_id), None)
        if not product:
            self.preview_label.config(image='', text="Select a product")
            self.preview_caption.set("")
            return

        folder, images = self.product_images(product)
        caption = f"{product.get('itemId', '-')} · {product['name']}"
        if extra > 0:
            caption += f"\n(+{extra} more selected)"
        caption += f"\n{len(images)} image(s)" if images else "\nNo images in folder"
        self.preview_caption.set(caption)

        if not images:
            self.preview_label.config(image='', text="(no image)")
            return

        try:
            from PIL import Image as PILImage, ImageOps, ImageTk
        except ImportError:
            self.preview_label.config(
                image='', text="Install Pillow to see\nphotos here:\npip install Pillow")
            return

        try:
            img = ImageOps.exif_transpose(PILImage.open(os.path.join(folder, images[0])))
            img.thumbnail((PREVIEW_MAX, PREVIEW_MAX), PILImage.LANCZOS)
            self.preview_photo = ImageTk.PhotoImage(img)
            self.preview_label.config(image=self.preview_photo, text='')
        except Exception as exc:
            self.preview_label.config(image='', text=f"Couldn't open image\n{exc}")

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
    
    def edit_size(self):
        """Size shows as the first bullet under Details on the product page.
        Clearing it removes the field, so the bullet disappears."""
        pid = self.get_selected_product()
        if not pid: return
        product = next((p for p in self.data['products'] if p['id'] == pid), None)
        if not product: return

        answer = simpledialog.askstring(
            "Edit Size",
            f"{product['name']}\n\n"
            f"Size (max {SIZE_MAX_LENGTH} characters, e.g. \"1.2 inch / 3cm\").\n"
            "Leave blank to remove it from the product page:",
            initialvalue=product.get('size', ''))
        if answer is None:
            return

        size = self.clean_size(answer)
        if size:
            product['size'] = size
        else:
            product.pop('size', None)   # keep products.json tidy
        self.save_data()
        self.refresh_product_list()
        self.manage_status_var.set(
            f"Size for {product.get('itemId') or product['name']}: {size or '(removed)'}")

    def edit_keywords(self):
        """Search keywords for the shop's search box (e.g. animals, mandala,
        geometry). Not shown to customers — they only make the piece findable."""
        pid = self.get_selected_product()
        if not pid: return
        product = next((p for p in self.data['products'] if p['id'] == pid), None)
        if not product: return

        current = product.get('keywords') or []
        if isinstance(current, str):
            current = [k.strip() for k in current.split(',') if k.strip()]

        # Offer what's already in use elsewhere, so wording stays consistent.
        in_use = {}
        for p in self.data['products']:
            for k in (p.get('keywords') or []):
                if isinstance(k, str) and k.strip():
                    key = k.strip().lower()
                    in_use[key] = in_use.get(key, 0) + 1
        suggestions = ", ".join(k for k, _ in sorted(in_use.items(), key=lambda x: -x[1])[:20])

        answer = simpledialog.askstring(
            "Edit Keywords",
            f"{product['name']}\n\n"
            "Comma-separated words customers might search for\n"
            "(e.g. animals, mandala, geometry, blue):\n\n"
            + (f"Already used: {suggestions}\n" if suggestions else ""),
            initialvalue=", ".join(current))
        if answer is None:
            return

        keywords = []
        for raw in answer.split(','):
            word = raw.strip().lower()
            if word and word not in keywords:
                keywords.append(word)
        if keywords:
            product['keywords'] = keywords
        else:
            product.pop('keywords', None)
        self.save_data()
        self.refresh_product_list()
        messagebox.showinfo("Done", f"Keywords for {product['name']}:\n\n"
                                    + (", ".join(keywords) if keywords else "(none)"))

    def edit_flags(self):
        pid = self.get_selected_product()
        if not pid: return
        product = next((p for p in self.data['products'] if p['id'] == pid), None)
        if not product: return

        win = tk.Toplevel(self.root)
        win.title(f"Sale Flags - {product['name']}")
        win.geometry("340x220")
        frame = ttk.Frame(win, padding=15)
        frame.pack(fill=tk.BOTH, expand=True)

        ttk.Label(frame, text=product['name'], font=('Helvetica', 11, 'bold')).pack(anchor='w')
        ttk.Label(frame, text="Flags group items for sales. They are never shown on the website.",
                  foreground='gray', wraplength=300).pack(anchor='w', pady=(0, 10))

        current = self.product_flags(product)
        vars_ = {}
        for key in FLAG_KEYS:
            var = tk.BooleanVar(value=key in current)
            ttk.Checkbutton(frame, text=self.flag_label(key), variable=var).pack(anchor='w', pady=2)
            vars_[key] = var

        def save():
            self.set_product_flags(product, [k for k, v in vars_.items() if v.get()])
            self.save_data()
            self.refresh_product_list()
            win.destroy()

        btns = ttk.Frame(frame)
        btns.pack(fill='x', pady=(12, 0))
        ttk.Button(btns, text="Save", command=save).pack(side='right')
        ttk.Button(btns, text="Cancel", command=win.destroy).pack(side='right', padx=5)

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
    # ---------- Flag sales (automatic discount on flagged products) ----------
    def load_flag_sales(self):
        default = {k: {"type": "fixed", "value": 0, "active": False} for k in FLAG_KEYS}
        if os.path.exists(FLAG_SALES_FILE):
            try:
                with open(FLAG_SALES_FILE, 'r', encoding='utf-8') as f:
                    saved = json.load(f).get('flagSales', {})
                for k in FLAG_KEYS:
                    if isinstance(saved.get(k), dict):
                        default[k].update(saved[k])
            except Exception:
                pass
        return default

    def save_flag_sales(self):
        os.makedirs(os.path.dirname(FLAG_SALES_FILE), exist_ok=True)
        with open(FLAG_SALES_FILE, 'w', encoding='utf-8') as f:
            json.dump({"flagSales": self.flag_sales}, f, indent=2)

    def build_flag_sale_section(self, parent):
        frame = ttk.LabelFrame(parent, text="Flag Sales (automatic, applied to every flagged product)", padding=15)
        frame.pack(fill='x', pady=10)
        ttk.Label(frame,
                  text="Anything carrying the flag is discounted automatically — the product page shows\n"
                       "the old price struck through with a SALE badge. Set the amount to 0 or untick\n"
                       "Active to switch a sale off. Tag products in Manage Products.",
                  foreground='gray', justify='left').pack(anchor='w', pady=(0, 8))

        self.flag_sale_vars = {}
        for key in FLAG_KEYS:
            rule = self.flag_sales.get(key, {})
            row = ttk.Frame(frame)
            row.pack(fill='x', pady=3)
            label = ttk.Label(row, text=self.flag_label(key), width=16)
            label.pack(side='left')
            amount = ttk.Entry(row, width=8)
            amount.insert(0, str(rule.get('value', 0)))
            amount.pack(side='left', padx=5)
            type_var = tk.StringVar(value=rule.get('type', 'fixed'))
            ttk.Radiobutton(row, text="$ off", variable=type_var, value="fixed").pack(side='left', padx=3)
            ttk.Radiobutton(row, text="% off", variable=type_var, value="percent").pack(side='left', padx=3)
            active_var = tk.BooleanVar(value=bool(rule.get('active', False)))
            ttk.Checkbutton(row, text="Active", variable=active_var).pack(side='left', padx=8)
            count = sum(1 for p in self.data['products'] if key in self.product_flags(p))
            count_lbl = ttk.Label(row, text=f"{count} product(s)", foreground='gray')
            count_lbl.pack(side='left', padx=5)
            self.flag_sale_vars[key] = (amount, type_var, active_var, label, count_lbl)

        ttk.Button(frame, text="Save Flag Sales", command=self.save_flag_sale_section).pack(anchor='w', pady=(10, 0))

    def save_flag_sale_section(self):
        updated = {}
        for key, (amount, type_var, active_var, _, _) in self.flag_sale_vars.items():
            try:
                value = float(amount.get().strip() or 0)
            except ValueError:
                return messagebox.showerror("Error", f"{self.flag_label(key)}: amount must be a number")
            if value < 0:
                return messagebox.showerror("Error", f"{self.flag_label(key)}: amount can't be negative")
            updated[key] = {"type": type_var.get(), "value": value, "active": active_var.get()}
        self.flag_sales = updated
        self.save_flag_sales()
        self.refresh_flag_sale_counts()
        live = [self.flag_label(k) for k, r in updated.items() if r['active'] and r['value'] > 0]
        messagebox.showinfo(
            "Done",
            "Flag sales saved.\n\nLive: " + (", ".join(live) if live else "none") +
            "\n\nPush to make the change appear on the site.")

    def refresh_flag_sale_counts(self):
        if not hasattr(self, 'flag_sale_vars'):
            return
        for key, (_, _, _, label, count_lbl) in self.flag_sale_vars.items():
            label.config(text=self.flag_label(key))
            count = sum(1 for p in self.data['products'] if key in self.product_flags(p))
            count_lbl.config(text=f"{count} product(s)")

    def create_sales_tab(self):
        main_frame = ttk.Frame(self.sales_tab, padding="20")
        main_frame.pack(fill=tk.BOTH, expand=True)
        
        ttk.Label(main_frame, text="Sales & Bulk Pricing", font=('Helvetica', 16, 'bold')).pack(pady=(0, 10))
        
        cat_frame = ttk.LabelFrame(main_frame, text="Category Sale", padding=15)
        cat_frame.pack(fill='x', pady=10)
        
        row1 = ttk.Frame(cat_frame)
        row1.pack(fill='x', pady=5)
        ttk.Label(row1, text="Apply to:").pack(side='left')
        self.sale_cat_var = tk.StringVar()
        self.sale_cat_combo = ttk.Combobox(row1, textvariable=self.sale_cat_var, width=30, state='readonly')
        self.sale_cat_combo['values'] = self.sale_target_values()
        self.sale_cat_combo.current(0)
        self.sale_cat_combo.pack(side='left', padx=10)
        ttk.Label(row1, text="(flags span categories)", foreground='gray').pack(side='left')
        
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
        
        self.build_flag_sale_section(main_frame)

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
    
    def sale_target_values(self):
        """Dropdown options: all products, each category, then each sale flag."""
        return (["All Products"] + list(self.data['groups'])
                + [FLAG_TARGET_PREFIX + self.flag_label(k) for k in FLAG_KEYS])

    def resolve_flag_target(self, target):
        """If the selection is a flag option, return its flag key, else None."""
        if not target.startswith(FLAG_TARGET_PREFIX):
            return None
        label = target[len(FLAG_TARGET_PREFIX):]
        for key in FLAG_KEYS:
            if self.flag_label(key) == label:
                return key
        return None

    def apply_sale(self):
        try: discount = float(self.discount_entry.get())
        except ValueError: return messagebox.showerror("Error", "Enter a valid discount number")
        if discount <= 0: return messagebox.showerror("Error", "Discount must be > 0")

        category = self.sale_cat_var.get()
        flag_key = self.resolve_flag_target(category)
        dtype = self.discount_type.get()
        count = 0

        for product in self.data['products']:
            if product.get('status') == 'sold': continue
            if flag_key:
                if flag_key not in self.product_flags(product): continue
            elif category != "All Products" and product['group'] != category: continue

            orig = product.get('originalPrice', product['price'])
            if dtype == "percent": new = round(orig * (1 - discount/100), 2)
            else: new = round(orig - discount, 2)
            if new < 0: new = 0
            
            product['originalPrice'] = orig
            product['salePrice'] = new
            product['price'] = new
            count += 1
        
        if count == 0:
            return messagebox.showwarning(
                "Nothing matched",
                f"No unsold products matched '{category}'.\n\n"
                "If you targeted a flag, set that flag on the products first "
                "(Manage Products > Edit Flags).")

        self.save_data(); self.refresh_sales_list(); self.refresh_product_list()
        messagebox.showinfo("Done", f"Applied {discount}{'%' if dtype == 'percent' else '$'} discount to {count} products ({category})")
    
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
        current = self.sale_cat_var.get()
        self.sale_cat_combo['values'] = self.sale_target_values()
        if current not in self.sale_cat_combo['values']:
            self.sale_cat_combo.current(0)

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
        self.batch_group_combo['values'] = self.data['groups']
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
            self.batch_group_combo['values'] = self.data['groups']
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
    # ==================== COUPONS TAB ====================
    def load_coupons(self):
        if os.path.exists(COUPONS_FILE):
            try:
                with open(COUPONS_FILE, 'r', encoding='utf-8') as f:
                    return json.load(f).get('coupons', [])
            except Exception:
                return []
        return []

    def save_coupons(self):
        os.makedirs(os.path.dirname(COUPONS_FILE), exist_ok=True)
        with open(COUPONS_FILE, 'w', encoding='utf-8') as f:
            json.dump({"coupons": self.coupons}, f, indent=2)

    def create_coupons_tab(self):
        main_frame = ttk.Frame(self.coupons_tab, padding="20")
        main_frame.pack(fill=tk.BOTH, expand=True)

        ttk.Label(main_frame, text="Coupon Codes", font=('Helvetica', 16, 'bold')).pack(pady=(0, 5))
        ttk.Label(main_frame, text="Customers enter these at checkout. Only ACTIVE codes work on the site.",
                  foreground='gray').pack(pady=(0, 10))

        columns = ('code', 'discount', 'applies', 'min', 'active', 'expires')
        self.coupon_tree = ttk.Treeview(main_frame, columns=columns, show='headings', height=10)
        for col, label, w in [('code', 'Code', 110), ('discount', 'Discount', 90),
                              ('applies', 'Applies To', 170), ('min', 'Min Order', 80),
                              ('active', 'Active', 60), ('expires', 'Expires', 90)]:
            self.coupon_tree.heading(col, text=label)
            self.coupon_tree.column(col, width=w)
        self.coupon_tree.pack(fill=tk.BOTH, expand=True, pady=10)

        btns = ttk.Frame(main_frame)
        btns.pack(fill='x', pady=5)
        for text, cmd in [("Add Coupon", self.add_coupon), ("Edit", self.edit_coupon),
                          ("Toggle Active", self.toggle_coupon), ("Delete", self.delete_coupon)]:
            ttk.Button(btns, text=text, command=cmd).pack(side='left', padx=3)

        ttk.Label(main_frame,
                  text="Tip: for a one-off deal, make a code just for that customer and send them\n"
                       "a link like  /cart?add=G0001,G0002&code=THEIRCODE  (see docs/cart-and-coupons.md).",
                  foreground='gray', justify='left').pack(anchor='w', pady=(10, 0))

        self.refresh_coupon_list()

    def refresh_coupon_list(self):
        for item in self.coupon_tree.get_children():
            self.coupon_tree.delete(item)
        for c in self.coupons:
            disc = f"{c.get('value', 0)}%" if c.get('type') == 'percent' else f"${c.get('value', 0)}"
            applies = c.get('group') or "Everything"
            minimum = f"${c.get('minSubtotal', 0)}" if c.get('minSubtotal') else "-"
            self.coupon_tree.insert('', tk.END, iid=c.get('code'),
                                    values=(c.get('code'), disc, applies, minimum,
                                            "YES" if c.get('active') else "no",
                                            c.get('expires') or "-"))

    def selected_coupon(self):
        sel = self.coupon_tree.selection()
        if not sel:
            messagebox.showwarning("No Selection", "Select a coupon first")
            return None
        return next((c for c in self.coupons if c.get('code') == sel[0]), None)

    def coupon_dialog(self, existing=None):
        win = tk.Toplevel(self.root)
        win.title("Edit Coupon" if existing else "Add Coupon")
        win.geometry("420x430")
        frame = ttk.Frame(win, padding=15)
        frame.pack(fill=tk.BOTH, expand=True)

        def row(label):
            ttk.Label(frame, text=label).pack(anchor='w')

        row("Code (what the customer types):")
        code_e = ttk.Entry(frame, width=30)
        code_e.insert(0, (existing or {}).get('code', ''))
        code_e.pack(anchor='w', pady=(0, 8))

        row("Description (shown when applied):")
        desc_e = ttk.Entry(frame, width=45)
        desc_e.insert(0, (existing or {}).get('description', ''))
        desc_e.pack(anchor='w', pady=(0, 8))

        row("Discount:")
        drow = ttk.Frame(frame); drow.pack(anchor='w', pady=(0, 8))
        val_e = ttk.Entry(drow, width=10)
        val_e.insert(0, str((existing or {}).get('value', '')))
        val_e.pack(side='left')
        type_var = tk.StringVar(value=(existing or {}).get('type', 'fixed'))
        ttk.Radiobutton(drow, text="$ off", variable=type_var, value="fixed").pack(side='left', padx=5)
        ttk.Radiobutton(drow, text="% off", variable=type_var, value="percent").pack(side='left', padx=5)

        row("Minimum order to qualify ($, 0 = none):")
        min_e = ttk.Entry(frame, width=15)
        min_e.insert(0, str((existing or {}).get('minSubtotal', 0)))
        min_e.pack(anchor='w', pady=(0, 8))

        row("Limit to one category (optional):")
        group_var = tk.StringVar(value=(existing or {}).get('group') or "Everything")
        group_combo = ttk.Combobox(frame, textvariable=group_var, width=32,
                                   values=["Everything"] + list(self.data['groups']), state='readonly')
        group_combo.pack(anchor='w', pady=(0, 8))

        row("Expires (YYYY-MM-DD, blank = never):")
        exp_e = ttk.Entry(frame, width=20)
        exp_e.insert(0, (existing or {}).get('expires') or "")
        exp_e.pack(anchor='w', pady=(0, 8))

        active_var = tk.BooleanVar(value=(existing or {}).get('active', False))
        ttk.Checkbutton(frame, text="Active (customers can use it now)", variable=active_var).pack(anchor='w', pady=5)

        def save():
            code = code_e.get().strip().upper()
            if not code:
                return messagebox.showerror("Error", "Enter a code", parent=win)
            if not existing and any(c.get('code') == code for c in self.coupons):
                return messagebox.showerror("Error", f"'{code}' already exists", parent=win)
            try:
                value = float(val_e.get().strip())
            except ValueError:
                return messagebox.showerror("Error", "Discount must be a number", parent=win)
            if value <= 0:
                return messagebox.showerror("Error", "Discount must be greater than 0", parent=win)
            try:
                minimum = float(min_e.get().strip() or 0)
            except ValueError:
                return messagebox.showerror("Error", "Minimum must be a number", parent=win)
            expires = exp_e.get().strip() or None
            if expires and not re.fullmatch(r'\d{4}-\d{2}-\d{2}', expires):
                return messagebox.showerror("Error", "Expiry must look like 2026-12-31", parent=win)

            entry = {
                "code": code,
                "description": desc_e.get().strip(),
                "type": type_var.get(),
                "value": value,
                "minSubtotal": minimum,
                "group": None if group_var.get() == "Everything" else group_var.get(),
                "active": active_var.get(),
                "expires": expires,
            }
            if existing:
                self.coupons[self.coupons.index(existing)] = entry
            else:
                self.coupons.append(entry)
            self.save_coupons()
            self.refresh_coupon_list()
            win.destroy()

        brow = ttk.Frame(frame); brow.pack(fill='x', pady=(10, 0))
        ttk.Button(brow, text="Save", command=save).pack(side='right')
        ttk.Button(brow, text="Cancel", command=win.destroy).pack(side='right', padx=5)

    def add_coupon(self):
        self.coupon_dialog()

    def edit_coupon(self):
        c = self.selected_coupon()
        if c:
            self.coupon_dialog(c)

    def toggle_coupon(self):
        c = self.selected_coupon()
        if not c:
            return
        c['active'] = not c.get('active')
        self.save_coupons()
        self.refresh_coupon_list()

    def delete_coupon(self):
        c = self.selected_coupon()
        if not c:
            return
        if not messagebox.askyesno("Confirm", f"Delete coupon '{c.get('code')}'?"):
            return
        self.coupons.remove(c)
        self.save_coupons()
        self.refresh_coupon_list()

    # ==================== AD IMAGES TAB ====================
    def create_ads_tab(self):
        main_frame = ttk.Frame(self.ads_tab, padding="14")
        main_frame.pack(fill=tk.BOTH, expand=True)

        ttk.Label(main_frame, text="Crop Photos for Facebook Ads",
                  font=('Helvetica', 15, 'bold')).pack()
        ttk.Label(main_frame,
                  text="Drag the box to choose what's in frame; the scroll wheel or the "
                       "buttons zoom it. Saved images are the exact size Meta wants.",
                  foreground='gray').pack(pady=(0, 8))

        picker = ttk.Frame(main_frame)
        picker.pack(fill='x', pady=4)
        ttk.Label(picker, text="Product:").pack(side='left')
        self.ad_product_var = tk.StringVar()
        self.ad_product_combo = ttk.Combobox(picker, textvariable=self.ad_product_var,
                                             width=44, state='readonly')
        self.ad_product_combo.pack(side='left', padx=6)
        self.ad_product_combo.bind('<<ComboboxSelected>>', lambda e: self.ad_load_photo_list())

        ttk.Label(picker, text="Photo:").pack(side='left', padx=(10, 0))
        self.ad_photo_var = tk.StringVar()
        self.ad_photo_combo = ttk.Combobox(picker, textvariable=self.ad_photo_var,
                                           width=10, state='readonly')
        self.ad_photo_combo.pack(side='left', padx=6)
        self.ad_photo_combo.bind('<<ComboboxSelected>>', lambda e: self.ad_load_image())
        ttk.Button(picker, text="Refresh List", command=self.ad_refresh_products).pack(side='left', padx=6)

        shape = ttk.Frame(main_frame)
        shape.pack(fill='x', pady=6)
        ttk.Label(shape, text="Shape:").pack(side='left')
        self.ad_ratio_var = tk.IntVar(value=0)
        for i, (label, _, _, _) in enumerate(AD_RATIOS):
            ttk.Radiobutton(shape, text=label, variable=self.ad_ratio_var, value=i,
                            command=self.ad_reset_crop).pack(side='left', padx=6)
        ttk.Button(shape, text="Zoom In", command=lambda: self.ad_zoom(0.9)).pack(side='right', padx=3)
        ttk.Button(shape, text="Zoom Out", command=lambda: self.ad_zoom(1.1)).pack(side='right', padx=3)
        ttk.Button(shape, text="Re-centre", command=self.ad_reset_crop).pack(side='right', padx=3)

        pad = ttk.Frame(main_frame)
        pad.pack(fill='x', pady=(0, 4))
        ttk.Label(pad, text="Fill around the photo:").pack(side='left')
        for name, value in [("Black", "#000000"), ("White", "#ffffff"),
                            ("Charcoal", "#1f2937"), ("Cream", "#f5f1e8")]:
            ttk.Button(pad, text=name, width=9,
                       command=lambda v=value: self.ad_set_pad(v)).pack(side='left', padx=2)
        ttk.Button(pad, text="Pick…", width=7, command=self.ad_pick_pad).pack(side='left', padx=2)
        self.ad_pad_swatch = tk.Canvas(pad, width=26, height=18, highlightthickness=1,
                                       highlightbackground='#888')
        self.ad_pad_swatch.pack(side='left', padx=6)
        ttk.Label(pad, text="(used when you zoom out past the photo)",
                  foreground='gray').pack(side='left')

        self.ad_canvas = tk.Canvas(main_frame, width=620, height=430, bg='#2b2b2b',
                                   highlightthickness=1, highlightbackground='#999')
        self.ad_canvas.pack(pady=6)
        self.ad_canvas.bind('<Button-1>', self.ad_drag_start)
        self.ad_canvas.bind('<B1-Motion>', self.ad_drag_move)
        self.ad_canvas.bind('<MouseWheel>', lambda e: self.ad_zoom(0.9 if e.delta > 0 else 1.1))

        actions = ttk.Frame(main_frame)
        actions.pack(fill='x', pady=4)
        ttk.Button(actions, text="Save This Shape", command=self.ad_save_current).pack(side='left')
        ttk.Button(actions, text="Save All Three Shapes",
                   command=self.ad_save_all).pack(side='left', padx=6)
        ttk.Button(actions, text="Open Folder", command=self.ad_open_folder).pack(side='left')
        self.ad_status_var = tk.StringVar(value="")
        ttk.Label(actions, textvariable=self.ad_status_var, foreground='#0a7').pack(side='left', padx=12)

        # state
        self.ad_source = None       # full-resolution PIL image
        self.ad_preview = None      # scaled copy shown on the canvas
        self.ad_tk = None           # keeps the PhotoImage alive
        self.ad_view_scale = 1.0    # preview px per source px
        self.ad_box = None          # [x, y, w, h] in preview coords
        self.ad_drag = None
        self.ad_pad_color = "#000000"
        self.ad_set_pad(self.ad_pad_color)
        self.ad_refresh_products()

    def ad_set_pad(self, colour):
        self.ad_pad_color = colour
        if hasattr(self, 'ad_pad_swatch'):
            self.ad_pad_swatch.configure(bg=colour)
        self.ad_redraw()

    def ad_pick_pad(self):
        from tkinter import colorchooser
        chosen = colorchooser.askcolor(color=self.ad_pad_color, title="Fill colour")
        if chosen and chosen[1]:
            self.ad_set_pad(chosen[1])

    def ad_refresh_products(self):
        items = []
        self._ad_lookup = {}
        for p in self.data['products']:
            star = "* " if p.get('featured') else "  "
            label = f"{star}{p.get('itemId', '?')}  {p['name']}"
            items.append(label)
            self._ad_lookup[label] = p
        self.ad_product_combo['values'] = items
        if items and not self.ad_product_var.get():
            self.ad_product_combo.current(0)
            self.ad_load_photo_list()

    def ad_current_product(self):
        return self._ad_lookup.get(self.ad_product_var.get())

    def ad_load_photo_list(self):
        product = self.ad_current_product()
        if not product:
            return
        folder = os.path.join(PENDANTS_FOLDER, product['folder'])
        photos = []
        if os.path.isdir(folder):
            photos = sorted(
                (f for f in os.listdir(folder)
                 if f.lower().endswith(('.jpg', '.jpeg', '.png', '.webp'))),
                key=lambda f: (int(re.match(r'(\d+)', f).group(1))
                               if re.match(r'(\d+)', f) else 9999, f))
        self.ad_photo_combo['values'] = photos
        if photos:
            self.ad_photo_combo.current(0)
            self.ad_load_image()
        else:
            self.ad_canvas.delete('all')
            self.ad_status_var.set("That product has no photos")

    def ad_load_image(self):
        product = self.ad_current_product()
        name = self.ad_photo_var.get()
        if not product or not name:
            return
        path = os.path.join(PENDANTS_FOLDER, product['folder'], name)
        try:
            from PIL import Image as PILImage, ImageOps, ImageTk
        except ImportError:
            return messagebox.showerror(
                "Pillow required",
                "This needs Pillow to read images:\n\n    pip install Pillow")
        try:
            img = PILImage.open(path)
            # honour the camera's rotation tag, or the crop won't match what you see
            img = ImageOps.exif_transpose(img).convert('RGB')
        except Exception as e:
            return messagebox.showerror("Error", f"Couldn't open {name}:\n{e}")

        self.ad_source = img
        cw, ch = int(self.ad_canvas['width']), int(self.ad_canvas['height'])
        self.ad_view_scale = min(cw / img.width, ch / img.height)
        self.ad_preview = img.resize(
            (max(1, int(img.width * self.ad_view_scale)),
             max(1, int(img.height * self.ad_view_scale))), PILImage.LANCZOS)
        self.ad_tk = ImageTk.PhotoImage(self.ad_preview)
        self.ad_reset_crop()

    def ad_reset_crop(self):
        if not self.ad_preview:
            return
        pw, ph = self.ad_preview.size
        _, tw, th, _ = AD_RATIOS[self.ad_ratio_var.get()]
        ratio = tw / th
        # biggest box of this shape that fits, centred
        w = min(pw, ph * ratio)
        h = w / ratio
        self.ad_box = [(pw - w) / 2, (ph - h) / 2, w, h]
        self.ad_redraw()

    def ad_zoom(self, factor):
        if not self.ad_box or not self.ad_preview:
            return
        pw, ph = self.ad_preview.size
        _, tw, th, _ = AD_RATIOS[self.ad_ratio_var.get()]
        ratio = tw / th
        x, y, w, h = self.ad_box
        cx, cy = x + w / 2, y + h / 2
        w = max(40.0, min(w * factor, pw * 4, ph * ratio * 4))
        h = w / ratio
        self.ad_box = [cx - w / 2, cy - h / 2, w, h]
        self.ad_clamp()
        self.ad_redraw()

    def ad_clamp(self):
        """The box may be larger than the photo (that's how padding happens),
        so just make sure the two always overlap instead of forcing it inside."""
        pw, ph = self.ad_preview.size
        x, y, w, h = self.ad_box
        margin = 20
        x = max(margin - w, min(x, pw - margin))
        y = max(margin - h, min(y, ph - margin))
        self.ad_box = [x, y, w, h]

    def ad_drag_start(self, event):
        if not self.ad_box:
            return
        self.ad_drag = (event.x, event.y, self.ad_box[0], self.ad_box[1])

    def ad_drag_move(self, event):
        if not self.ad_drag or not self.ad_box:
            return
        sx, sy, bx, by = self.ad_drag
        self.ad_box[0] = bx + (event.x - sx)
        self.ad_box[1] = by + (event.y - sy)
        self.ad_clamp()
        self.ad_redraw()

    def _ad_offset(self):
        """Where the preview sits on the canvas (it's centred)."""
        cw, ch = int(self.ad_canvas['width']), int(self.ad_canvas['height'])
        pw, ph = self.ad_preview.size
        return ((cw - pw) // 2, (ch - ph) // 2)

    def ad_redraw(self):
        self.ad_canvas.delete('all')
        if not self.ad_tk:
            return
        ox, oy = self._ad_offset()
        self.ad_canvas.create_image(ox, oy, anchor='nw', image=self.ad_tk)
        x, y, w, h = self.ad_box
        pw, ph = self.ad_preview.size
        # show the fill colour wherever the crop reaches past the photo,
        # so the preview matches the file that gets saved
        for px0, py0, px1, py1 in [
                (x, y, x + w, min(y + h, 0)),                    # above
                (x, max(y, ph), x + w, y + h),                   # below
                (x, max(y, 0), min(x + w, 0), min(y + h, ph)),   # left
                (max(x, pw), max(y, 0), x + w, min(y + h, ph))]: # right
            if px1 > px0 and py1 > py0:
                self.ad_canvas.create_rectangle(ox + px0, oy + py0, ox + px1, oy + py1,
                                                fill=self.ad_pad_color, outline='')
        # dim everything outside the crop so the framing is obvious
        for rect in [(ox, oy, ox + pw, oy + y),
                     (ox, oy + y + h, ox + pw, oy + ph),
                     (ox, oy + y, ox + x, oy + y + h),
                     (ox + x + w, oy + y, ox + pw, oy + y + h)]:
            self.ad_canvas.create_rectangle(*rect, fill='#000000', stipple='gray50', outline='')
        self.ad_canvas.create_rectangle(ox + x, oy + y, ox + x + w, oy + y + h,
                                        outline='#ffcc00', width=2)
        # rule-of-thirds guides
        for i in (1, 2):
            self.ad_canvas.create_line(ox + x + w * i / 3, oy + y,
                                       ox + x + w * i / 3, oy + y + h,
                                       fill='#ffcc00', dash=(2, 4))
            self.ad_canvas.create_line(ox + x, oy + y + h * i / 3,
                                       ox + x + w, oy + y + h * i / 3,
                                       fill='#ffcc00', dash=(2, 4))
        label, tw, th, _ = AD_RATIOS[self.ad_ratio_var.get()]
        src_w = int(w / self.ad_view_scale)
        note = f"{label}  →  {tw}x{th}"
        if src_w < tw:
            note += f"   (only {src_w}px of photo — zoom out for full sharpness)"
        self.ad_canvas.create_text(8, 8, anchor='nw', fill='#ffcc00', text=note,
                                   font=('Segoe UI', 9, 'bold'))

    def ad_crop_and_save(self, ratio_index):
        from PIL import Image as PILImage
        product = self.ad_current_product()
        label, tw, th, suffix = AD_RATIOS[ratio_index]
        x, y, w, h = self.ad_box
        s = self.ad_view_scale
        box = (int(x / s), int(y / s), int((x + w) / s), int((y + h) / s))
        # The box can extend past the photo; fill whatever it doesn't cover.
        bw, bh = max(1, box[2] - box[0]), max(1, box[3] - box[1])
        canvas = PILImage.new('RGB', (bw, bh), self.ad_pad_color)
        sx0, sy0 = max(0, box[0]), max(0, box[1])
        sx1, sy1 = min(self.ad_source.width, box[2]), min(self.ad_source.height, box[3])
        if sx1 > sx0 and sy1 > sy0:
            canvas.paste(self.ad_source.crop((sx0, sy0, sx1, sy1)), (sx0 - box[0], sy0 - box[1]))
        crop = canvas.resize((tw, th), PILImage.LANCZOS)
        os.makedirs(AD_OUTPUT_DIR, exist_ok=True)
        base = f"{product.get('itemId', product['id'])}-{self.filename_safe(product['name'])}-{suffix}.jpg"
        out = os.path.join(AD_OUTPUT_DIR, base)
        crop.save(out, 'JPEG', quality=90, optimize=True)
        return base, box

    def ad_save_current(self):
        if not self.ad_box:
            return messagebox.showwarning("Nothing loaded", "Pick a product and photo first")
        name, _ = self.ad_crop_and_save(self.ad_ratio_var.get())
        self.ad_status_var.set(f"Saved {name}")

    def ad_save_all(self):
        if not self.ad_box:
            return messagebox.showwarning("Nothing loaded", "Pick a product and photo first")
        keep = list(self.ad_box)
        chosen = self.ad_ratio_var.get()
        saved = []
        for i in range(len(AD_RATIOS)):
            # keep the same centre for each shape
            cx = keep[0] + keep[2] / 2
            cy = keep[1] + keep[3] / 2
            self.ad_ratio_var.set(i)
            self.ad_reset_crop()
            w, h = self.ad_box[2], self.ad_box[3]
            self.ad_box = [cx - w / 2, cy - h / 2, w, h]
            self.ad_clamp()
            saved.append(self.ad_crop_and_save(i)[0])
        self.ad_ratio_var.set(chosen)
        self.ad_box = keep
        self.ad_redraw()
        self.ad_status_var.set(f"Saved {len(saved)} images")
        messagebox.showinfo("Saved", "Created:\n\n" + "\n".join(saved) +
                            f"\n\nin {AD_OUTPUT_DIR}")

    def ad_open_folder(self):
        os.makedirs(AD_OUTPUT_DIR, exist_ok=True)
        try:
            os.startfile(AD_OUTPUT_DIR)
        except Exception:
            messagebox.showinfo("Folder", AD_OUTPUT_DIR)

    # ==================== PUBLISH TAB ====================
    def run_git(self, args, timeout=120):
        """Run a git command in the project folder. Returns (ok, output)."""
        kwargs = {}
        if os.name == "nt":
            # Stops a console window flashing up on Windows.
            kwargs["creationflags"] = getattr(subprocess, "CREATE_NO_WINDOW", 0)
        try:
            result = subprocess.run(
                ["git"] + args,
                cwd=PROJECT_PATH,
                capture_output=True,
                text=True,
                timeout=timeout,
                **kwargs,
            )
        except FileNotFoundError:
            return False, ("Git isn't installed, or isn't on your PATH.\n"
                           "Install Git for Windows, then reopen this tool.")
        except subprocess.TimeoutExpired:
            return False, f"git {' '.join(args)} took too long and was stopped."
        output = (result.stdout or "") + (result.stderr or "")
        # rstrip only: `git status --porcelain` encodes the state in the first two
        # columns, so an unstaged change begins with a space that must survive.
        return result.returncode == 0, output.rstrip()

    def create_publish_tab(self):
        main_frame = ttk.Frame(self.publish_tab, padding="20")
        main_frame.pack(fill=tk.BOTH, expand=True)

        ttk.Label(main_frame, text="Publish to the Website",
                  font=('Helvetica', 16, 'bold')).pack(pady=(0, 5))
        ttk.Label(main_frame,
                  text="Sends your changes to GitHub, which makes Vercel rebuild the live site.\n"
                       "Only the files this tool edits are published — products, images and settings.",
                  foreground='gray', justify='center').pack(pady=(0, 10))

        top = ttk.Frame(main_frame)
        top.pack(fill='x')
        ttk.Button(top, text="Check for Changes", command=self.refresh_publish_status).pack(side='left')
        self.publish_summary_var = tk.StringVar(value="")
        ttk.Label(top, textvariable=self.publish_summary_var, foreground='#0a7').pack(side='left', padx=12)

        changes_frame = ttk.LabelFrame(main_frame, text="Waiting to be published", padding=10)
        changes_frame.pack(fill=tk.BOTH, expand=True, pady=10)
        self.publish_changes = scrolledtext.ScrolledText(changes_frame, height=8, state='disabled',
                                                         font=('Courier', 9))
        self.publish_changes.pack(fill=tk.BOTH, expand=True)

        msg_frame = ttk.Frame(main_frame)
        msg_frame.pack(fill='x', pady=(0, 8))
        ttk.Label(msg_frame, text="Note (optional):").pack(side='left')
        self.publish_message = ttk.Entry(msg_frame, width=52)
        self.publish_message.pack(side='left', padx=8)

        btn_row = ttk.Frame(main_frame)
        btn_row.pack(fill='x')
        self.publish_button = ttk.Button(btn_row, text="Publish Now", command=self.publish_changes_clicked)
        self.publish_button.pack(side='left')
        self.pull_button = ttk.Button(btn_row, text="Get Latest First", command=self.pull_latest_clicked)
        self.pull_button.pack(side='left', padx=8)
        self.publish_status_var = tk.StringVar(value="")
        ttk.Label(btn_row, textvariable=self.publish_status_var, foreground='gray').pack(side='left', padx=10)

        log_frame = ttk.LabelFrame(main_frame, text="Result", padding=10)
        log_frame.pack(fill=tk.BOTH, expand=True, pady=(10, 0))
        self.publish_log = scrolledtext.ScrolledText(log_frame, height=7, state='disabled',
                                                     font=('Courier', 9))
        self.publish_log.pack(fill=tk.BOTH, expand=True)

        self.refresh_publish_status()

    def _set_text(self, widget, content):
        widget.config(state='normal')
        widget.delete("1.0", tk.END)
        widget.insert("1.0", content)
        widget.config(state='disabled')

    def _log(self, content):
        self._set_text(self.publish_log, content)

    def pending_publish_changes(self):
        """Changed files under PUBLISH_PATHS, as (status, path) pairs."""
        ok, out = self.run_git(["status", "--porcelain", "--untracked-files=all", "--"] + PUBLISH_PATHS)
        if not ok:
            return None, out
        changes = []
        for line in out.splitlines():
            if len(line) < 4:
                continue
            code, path = line[:2].strip(), line[3:].strip().strip('"')
            changes.append((code or "?", path))
        return changes, ""

    def unpushed_commits(self):
        """Commits saved on this computer but not yet sent to GitHub. A push that
        failed (say the site had newer changes) leaves work stranded here, so the
        Publish tab has to count it as still-to-publish."""
        ok, out = self.run_git(["rev-list", "--count", "@{u}..HEAD"])
        if not ok:
            return 0
        try:
            return int(out.strip().splitlines()[-1])
        except (ValueError, IndexError):
            return 0

    def refresh_publish_status(self):
        changes, error = self.pending_publish_changes()
        if changes is None:
            self.publish_summary_var.set("")
            self._set_text(self.publish_changes, "")
            self._log("Couldn't read the project's status:\n\n" + error)
            return

        pending_commits = self.unpushed_commits()
        if not changes:
            if pending_commits:
                self.publish_summary_var.set(
                    f"{pending_commits} saved change(s) still to send")
                self._set_text(
                    self.publish_changes,
                    f"{pending_commits} change(s) are saved on this computer but "
                    "haven't reached the website yet — click Publish Now to send them.")
            else:
                self.publish_summary_var.set("Everything is already published")
                self._set_text(self.publish_changes, "No changes waiting.")
                self.publish_message.delete(0, tk.END)
            return

        products = sum(1 for _, p in changes if p.endswith("products.json"))
        images = sum(1 for _, p in changes if p.lower().endswith((".jpg", ".jpeg", ".png", ".webp")))
        settings = sum(1 for _, p in changes
                       if p.endswith(("coupons.json", "auto-promos.json", "flag-sales.json",
                                      "admin_settings.json")))
        bits = []
        if products: bits.append("product changes")
        if images: bits.append(f"{images} image{'s' if images != 1 else ''}")
        if settings: bits.append("settings")
        self.publish_summary_var.set(f"{len(changes)} file(s) to publish — " + ", ".join(bits))

        label = {"M": "changed", "A": "added", "??": "new", "D": "removed", "R": "renamed"}
        listing = "\n".join(f"  {label.get(code, code):9} {path}" for code, path in changes)
        self._set_text(self.publish_changes, listing)

        if not self.publish_message.get().strip():
            self.publish_message.insert(0, "Update products from admin tool")

    def _set_publish_busy(self, busy, status=""):
        state = 'disabled' if busy else 'normal'
        self.publish_button.config(state=state)
        self.pull_button.config(state=state)
        self.publish_status_var.set(status)

    def publish_changes_clicked(self):
        changes, error = self.pending_publish_changes()
        if changes is None:
            return messagebox.showerror("Error", error)
        if not changes:
            pending_commits = self.unpushed_commits()
            if not pending_commits:
                return messagebox.showinfo("Nothing to publish",
                                           "There are no changes waiting to go to the website.")
            if not messagebox.askyesno(
                    "Send saved changes?",
                    f"{pending_commits} change(s) are saved here but haven't reached the "
                    "website yet.\n\nSend them now?"):
                return
            self._set_publish_busy(True, "Publishing…")
            self._log("Sending saved changes…\n")
            self._git_queue = queue.Queue()
            threading.Thread(target=self._publish_worker, args=(None, []), daemon=True).start()
            self.root.after(150, lambda: self._poll_git(self._publish_finished))
            return

        preview = "\n".join(f"  {path}" for _, path in changes[:12])
        if len(changes) > 12:
            preview += f"\n  ...and {len(changes) - 12} more"
        if not messagebox.askyesno(
                "Publish to the website?",
                f"{len(changes)} file(s) will be sent to GitHub and the live site "
                f"will rebuild:\n\n{preview}\n\nThis updates the public website. Continue?"):
            return

        note = self.publish_message.get().strip() or "Update products from admin tool"
        self._set_publish_busy(True, "Publishing…")
        self._log("Publishing…\n")
        # The git work runs off the UI thread and posts its result to a queue that
        # the main thread polls — tkinter must only ever be touched from here.
        self._git_queue = queue.Queue()
        paths = [path for _, path in changes]
        threading.Thread(target=self._publish_worker, args=(note, paths), daemon=True).start()
        self.root.after(150, lambda: self._poll_git(self._publish_finished))

    def _poll_git(self, on_done):
        """Check whether the background git command has finished yet."""
        try:
            result = self._git_queue.get_nowait()
        except queue.Empty:
            self.root.after(150, lambda: self._poll_git(on_done))
            return
        on_done(result)

    def _publish_worker(self, note, paths):
        """Runs off the UI thread; the result is posted to self._git_queue.

        Stages exactly the files listed in the preview. Naming them individually
        (rather than the whole PUBLISH_PATHS list) means what gets committed is
        exactly what was shown, and a folder that doesn't exist yet can't make
        `git add` fail on an unmatched pathspec."""
        steps = []
        ok = True
        if paths:
            ok, out = self.run_git(["add", "--"] + paths)
            steps.append(("Staging files", ok, out))
        if ok and paths:
            ok, out = self.run_git(["commit", "-m", note])
            # "nothing to commit" isn't a real failure worth alarming about
            if not ok and "nothing to commit" in out.lower():
                ok, out = True, "Nothing new to commit."
            steps.append(("Saving a version", ok, out))
        if ok:
            ok, out = self.run_git(["push"], timeout=180)
            steps.append(("Sending to GitHub", ok, out))

        self._git_queue.put(steps)

    def _publish_finished(self, steps):
        lines = []
        failed = None
        for name, ok, out in steps:
            lines.append(f"{'OK  ' if ok else 'FAIL'}  {name}")
            if out:
                lines += ["      " + l for l in out.splitlines()]
            if not ok and failed is None:
                failed = (name, out)

        if failed is None:
            lines.append("")
            lines.append("Done. Vercel is rebuilding — the site usually updates within a minute or two.")
        self._log("\n".join(lines))
        self._set_publish_busy(False, "")
        self.refresh_publish_status()

        if failed is None:
            self.publish_message.delete(0, tk.END)
            messagebox.showinfo("Published",
                                "Your changes are on their way.\n\n"
                                "Vercel rebuilds the site automatically — usually a minute or two.")
        else:
            name, out = failed
            hint = ""
            low = (out or "").lower()
            if "rejected" in low or "non-fast-forward" in low or "behind" in low:
                hint = ("\n\nThe website has newer changes than this computer. "
                        "Click \"Get Latest First\", then publish again.")
            elif "could not read username" in low or "authentication" in low or "permission" in low:
                hint = ("\n\nGitHub wouldn't accept the login. Signing in once from a terminal "
                        "with 'git push' usually fixes it for good.")
            elif "not a git repository" in low:
                hint = "\n\nThis folder isn't connected to GitHub."
            messagebox.showerror("Couldn't publish", f"{name} failed.\n\n{out}{hint}")

    def pull_latest_clicked(self):
        if not messagebox.askyesno(
                "Get the latest first?",
                "This pulls any newer changes from GitHub into this computer before you publish.\n\n"
                "Continue?"):
            return
        self._set_publish_busy(True, "Fetching…")
        self._log("Getting the latest from GitHub…\n")

        self._git_queue = queue.Queue()

        def worker():
            self._git_queue.put(self.run_git(["pull", "--rebase"], timeout=180))

        threading.Thread(target=worker, daemon=True).start()
        self.root.after(150, lambda: self._poll_git(lambda r: self._pull_finished(*r)))

    def _pull_finished(self, ok, out):
        self._log(("OK  " if ok else "FAIL  ") + "Getting the latest\n" +
                  "\n".join("      " + l for l in (out or "").splitlines()))
        self._set_publish_busy(False, "")
        self.data = self.load_data()
        self.refresh_product_list()
        self.refresh_publish_status()
        if ok:
            messagebox.showinfo("Up to date", "This computer now has the latest changes.")
        else:
            messagebox.showerror("Couldn't fetch", out or "Unknown error")

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
        
        # Sale flag names
        flag_frame = ttk.LabelFrame(main_frame, text="Sale Flag Names", padding=15)
        flag_frame.pack(fill='x', pady=10)
        ttk.Label(flag_frame, text="Rename the flags used to group products for sales. "
                                   "Flags are never shown on the website.",
                  foreground='gray', wraplength=560).pack(anchor='w', pady=(0, 8))

        names = self.flag_names()
        self.flag_name_entries = {}
        for key in FLAG_KEYS:
            row = ttk.Frame(flag_frame)
            row.pack(fill='x', pady=3)
            ttk.Label(row, text=f"{key}:", width=8, font=('Courier', 9)).pack(side='left')
            entry = ttk.Entry(row, width=30)
            entry.insert(0, names[key])
            entry.pack(side='left', padx=5)
            self.flag_name_entries[key] = entry

        ttk.Button(flag_frame, text="Save Flag Names", command=self.save_flag_names).pack(anchor='w', pady=(10, 0))

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
    
    def save_flag_names(self):
        new_names = {}
        for key, entry in self.flag_name_entries.items():
            value = entry.get().strip()
            new_names[key] = value or DEFAULT_FLAG_NAMES[key]

        # Names are used to identify the flag in the Sales dropdown, so they must differ.
        if len(set(new_names.values())) != len(new_names):
            return messagebox.showerror("Error", "Each flag needs a different name.")

        self.settings['flagNames'] = new_names
        self.save_settings()

        # Refresh every label that shows a flag name.
        for key in FLAG_KEYS:
            label = self.flag_label(key)
            self.add_flag_checks[key].config(text=label)
            self.batch_flag_checks[key].config(text=label)
            self.product_tree.heading(key, text=label)
            self.flag_name_entries[key].delete(0, tk.END)
            self.flag_name_entries[key].insert(0, label)
        self.refresh_product_list()
        self.refresh_sales_list()
        self.refresh_flag_sale_counts()
        messagebox.showinfo("Done", "Flag names saved!")

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
