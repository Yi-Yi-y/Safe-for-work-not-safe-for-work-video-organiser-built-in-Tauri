# VideoVault → Figma/Locofy Import Guide

## ✅ DONE FOR YOU (Technical Setup)

1. ✅ Tauri dev server is running
2. ✅ Added semantic class names to all UI elements
3. ✅ Optimized HTML structure for import
4. ✅ App is ready at: **http://localhost:1420**

---

## 🎨 YOUR STEPS (Visual Design in Figma)

### STEP 1 — Import Your App into Locofy

1. Open Figma (https://figma.com)
2. Install the **Locofy Plugin** from Figma Community
3. Open a new Figma file
4. Go to: **Plugins → Locofy → Open**
5. In the Locofy panel → Click **"Import from URL"**
6. Paste this URL: **http://localhost:1420**
7. Click **Import**

⏳ Wait for it to scan your app... Done!

---

### STEP 2 — What You'll See in Figma

All your UI elements will appear as Figma frames with these clear names:

#### **Toolbar (Top Bar)**
- `app-toolbar` - The main toolbar container
- `app-title` - "VideoVault" heading
- `toolbar-controls` - Button group
- `control-btn` - Individual buttons (Load 1k, 10k, 50k, Clear)
- `stats-display` - FPS counter

#### **Filter Panel (Purple Bar)**
- `filter-panel-wrapper` - Main container
- `orientation-filters` - All/Landscape/Portrait/Square/Panorama buttons
- `column-filters` - Column count buttons (2/3/4)
- `filter-btn` - Individual filter buttons

#### **Alert Banner (Red Warning)**
- `failed-thumbnails-banner` - Main container
- `banner-content` - Left side (icon + text)
- `alert-icon` - Warning emoji
- `banner-title` - "Failed Thumbnails" text
- `banner-description` - Subtext
- `action-btn` - "Move to CORRUPTED" button

#### **Grid Area**
- `video-grid` - The thumbnail grid container
- Individual cards will show up as canvas elements

---

### STEP 3 — Adjust Visually in Figma

Now you can click any element and modify:

✏️ **Margins & Spacing**
- Select any frame → Adjust padding in right panel
- Use Auto Layout for automatic spacing

🎨 **Colors & Gradients**
- Select element → Fill section → Adjust colors
- Gradients are preserved from CSS

✨ **Blur & Effects**
- Select element → Effects section → See backdrop blur
- Modify blur radius, shadows, glows

📐 **Sizing & Alignment**
- Drag elements to resize
- Use alignment tools to center/distribute

💡 **Pro Tip**: Use `Ctrl+D` to duplicate elements, `Shift+A` for Auto Layout

---

### STEP 4 — Export Back to Code

#### Option A: Copy Individual Styles
1. Select any element in Figma
2. Right-click → **Copy/Paste → Copy as CSS**
3. Paste into your `styles.css` file

#### Option B: Export Full Component
1. In Locofy panel → Click **"Export to Code"**
2. Choose **React (TypeScript)**
3. Download the generated files
4. Copy the CSS into your project

---

## 🔧 Technical Reference

### Key CSS Classes Added

| Class Name | Element | Purpose |
|------------|---------|---------|
| `app-toolbar` | Toolbar | Top navigation bar |
| `filter-panel-wrapper` | Filter panel | Purple filter container |
| `failed-thumbnails-banner` | Alert banner | Red warning banner |
| `video-grid` | Grid container | Thumbnail grid area |
| `filter-btn` | Buttons | All filter buttons |
| `control-btn` | Buttons | Load/Clear buttons |

### Current Spacing Values

- **Outer margins**: 8px
- **Card gaps**: 10px
- **Toolbar height**: 44px
- **Filter panel**: 50px from top
- **Banner**: 102px from top
- **Grid starts**: 150px from top

---

## 🚀 Workflow

1. **Adjust in Figma** → Get it looking exactly how you want
2. **Copy CSS** → Right-click element → Copy as CSS
3. **Paste into your project** → Update `styles.css`
4. **Save & hot-reload** → Changes appear instantly in Tauri app
5. **Repeat** for each element you want to customize

---

## 📝 Notes

- The **PixiJS canvas grid** (video thumbnails) won't render in Figma import - it's a dynamic canvas element. You'll only see the container. That's normal!
- **Backdrop blur** effects will show in Figma as blur layers
- **Glass-morphism** gradients are preserved
- Use the **layer names** in Figma to identify which CSS class to modify

---

## 🎯 Your URL for Locofy Import

```
http://localhost:1420
```

**Status**: ✅ Server is running and ready!

---

*Keep the terminal/Tauri app running while you work in Figma - Locofy needs the live URL to import from.*
