# CMS Comprehensive Testing Guide

## Test Environment
- **Frontend**: https://epcs-reliability-report.netlify.app/
- **Backend**: https://epcs-reliability-report.onrender.com
- **Browser**: Chrome/Firefox with DevTools Console open

---

## Phase 1: Page Creation from All Templates

### Test 1.1: Create Text-Only Page
1. Go to any page and click "✏️ Edit"
2. Click "➕ Add" button
3. Enter title: "Test Text Page"
4. Select template: "Text Only"
5. Choose position: "After current page"
6. Click "Create Page"
7. **Expected**: Page appears in navigation, content shows text editor with blocks

### Test 1.2: Create Just-Links Page
1. Click "➕ Add"
2. Enter title: "Navigation Links"
3. Select template: "Just Links"
4. Choose position: "Before current page"
5. Click "Create Page"
6. **Expected**: Page appears with link management interface
7. Add 3 test links (e.g., "Page 1", "Page 2", "Page 3")
8. **Expected**: Links display in read-only view as clickable items

### Test 1.3: Create Just-Tables Page
1. Click "➕ Add"
2. Enter title: "Data Table"
3. Select template: "Just Tables"
4. Click "Create Page"
5. **Expected**: Table editor appears with empty table
6. Add 2 columns and 3 rows
7. Fill with sample data
8. **Expected**: Table displays correctly in read-only view

### Test 1.4: Create Just-Images Page
1. Click "➕ Add"
2. Enter title: "Photo Gallery"
3. Select template: "Just Images"
4. Click "Create Page"
5. **Expected**: Images editor appears
6. Click "➕ Add Image" 3 times
7. Add image URLs (use public URLs like https://via.placeholder.com/400)
8. Add captions for each image
9. **Expected**: Gallery displays with images and captions in read-only view

### Test 1.5: Create Heading Page
1. Click "➕ Add"
2. Enter title: "New Section"
3. Select template: "Heading"
4. Click "Create Page"
5. **Expected**: Page appears with editable title and subtitle
6. Edit both fields
7. **Expected**: Changes persist on save

### Test 1.6: Create Index Page
1. Click "➕ Add"
2. Enter title: "Table of Contents"
3. Select template: "Index"
4. Click "Create Page"
5. **Expected**: Index page automatically shows all other pages as links
6. **Expected**: Clicking links navigates to corresponding pages

### Test 1.7: Create Image + Text Page
1. Click "➕ Add"
2. Enter title: "Content with Image"
3. Select template: "Image + Text"
4. Click "Create Page"
5. **Expected**: Flexible layout editor appears with 4 layout options
6. Select "Image Left, Text Right"
7. Add image URL and text content
8. **Expected**: Read-only view shows image and text in selected layout

### Test 1.8: Create Split Content + Image Page
1. Click "➕ Add"
2. Select template: "Split Content + Image"
3. Click "Create Page"
4. **Expected**: Editor for split layout appears
5. Fill left content, right content, and image
6. **Expected**: All content displays correctly

### Test 1.9: Create Table Page (Primary Type)
1. Click "➕ Add"
2. Select template: "Table"
3. Click "Create Page"
4. **Expected**: Advanced table editor appears

---

## Phase 2: Page Editing with Specialized Editors

### Test 2.1: Edit Text-Only Page
1. Navigate to text-only page created in Test 1.1
2. Click "✏️ Edit"
3. Add 3 blocks: paragraph, heading, list
4. Fill with sample content
5. **Expected**: Preview updates in real-time
6. Delete middle block
7. **Expected**: Block is removed and preview updates
8. Click "💾 Save"
9. **Expected**: Changes persist on reload

### Test 2.2: Edit Just-Links Page
1. Navigate to links page (Test 1.2)
2. Click "✏️ Edit"
3. Edit first link title
4. Add new link
5. Reorder links using arrow buttons
6. Delete a link
7. **Expected**: All operations work correctly

### Test 2.3: Edit Just-Images Page
1. Navigate to images gallery (Test 1.4)
2. Click "✏️ Edit"
3. Reorder images using up/down buttons
4. Update captions
5. Delete middle image
6. Add new image with URL and caption
7. Click "💾 Save"
8. **Expected**: All changes persist on reload

### Test 2.4: Edit Advanced Table Page
1. Navigate to table page (Test 1.3 or 1.9)
2. Click "✏️ Edit"
3. Add row at top
4. Add column on right
5. Edit cell content
6. Add caption above and below table
7. **Expected**: All edits work, table structure updates correctly
8. Delete a row and column
9. **Expected**: Deletion works, no data corruption

### Test 2.5: Edit Index Page (Auto-Sync)
1. Go to Index page
2. Click "Next" several times to verify all pages link correctly
3. Go back to any page and click "✏️ Edit"
4. Click "📄 Manage" to reorder pages
5. Drag and reorder 3 pages
6. Click "💾 Save"
7. Go back to Index page
8. **Expected**: Index links have updated page numbers reflecting new order

---

## Phase 3: Advanced CMS Operations

### Test 3.1: Insert Before Current Page
1. Navigate to page 5
2. Click "➕ Add"
3. Enter title: "Inserted Before"
4. Select "Before current page"
5. Click "Create Page"
6. **Expected**: Page appears at position 5, original page 5 becomes 6
7. Click "Next" to verify navigation numbering

### Test 3.2: Insert After Current Page
1. Navigate to page 3
2. Click "➕ Add"
3. Enter title: "Inserted After"
4. Select "After current page"
5. Click "Create Page"
6. **Expected**: New page appears after current position
7. Navigate and verify numbering

### Test 3.3: Insert at End of Document
1. Click "➕ Add"
2. Select "At end of document"
3. Enter title and template
4. Click "Create Page"
5. **Expected**: Page appears with highest page number

### Test 3.4: Delete Page and Verify Renumbering
1. Navigate to page 7
2. Note current page number
3. Click "✏️ Edit"
4. Click "🗑️ Delete"
5. Confirm deletion
6. **Expected**: Page removed, subsequent pages renumbered down
7. Navigate to verify no gap in numbering

### Test 3.5: Reorder Pages (Drag)
1. Click "✏️ Edit"
2. Click "📄 Manage"
3. Drag page 3 to position 1
4. Drag page 10 to position 5
5. Click "Save"
6. **Expected**: Pages reordered correctly
7. Click "Home" → "Index" to verify page numbers updated

### Test 3.6: Reorder Pages (Arrow Buttons)
1. Open Page Manager
2. Select a page
3. Click up/down arrows to move it
4. Click "Save"
5. **Expected**: Pages reorder correctly

---

## Phase 4: Data Persistence & Navigation

### Test 4.1: Save and Reload
1. Edit multiple pages with different content
2. Click "💾 Save"
3. Refresh page (F5)
4. **Expected**: All edited content persists
5. Navigate between pages
6. **Expected**: All pages display saved content correctly

### Test 4.2: Navigation Links Work Correctly
1. Go to Index page
2. Click on any link
3. **Expected**: Navigate to that page with correct page number
4. Click "Previous" and "Next"
5. **Expected**: Navigation works correctly throughout document

### Test 4.3: Page Lookup by Number
1. Manually change URL to /page/7
2. **Expected**: Page 7 loads correctly
3. Try /page/50
4. **Expected**: Page not found or navigates to last page

### Test 4.4: Edit Mode Toggle
1. Click "✏️ Edit"
2. **Expected**: Page becomes editable with new buttons
3. Make edits but don't save
4. Click "❌ Cancel"
5. **Expected**: Changes discarded, view reverts to read-only

---

## Phase 5: Template-Specific Features

### Test 5.1: Table with Captions
1. Create or edit a table page
2. Add caption text above and below table
3. Save and reload
4. **Expected**: Captions display in read-only view

### Test 5.2: Images with Multiple Captions
1. Edit Just-Images page
2. Add 5 images with unique captions  
3. Reorder images
4. **Expected**: Captions stay with correct images after reorder

### Test 5.3: Links to New Pages
1. Create Just-Links page
2. Add links with page numbers (e.g., target=7, target=12)
3. Click links
4. **Expected**: Navigate to correct pages

### Test 5.4: Flexible Layouts
1. Create Image + Text page with each layout option:
   - Image Left, Text Right
   - Image Right, Text Left
   - Full Width Image
   - Full Width Text
2. **Expected**: Each layout displays correctly

---

## Phase 6: Performance & Edge Cases

### Test 6.1: Large Number of Pages
1. Create 50+ pages
2. Navigate through them
3. **Expected**: No lag, smooth navigation

### Test 6.2: Large Table
1. Create table with 20 columns × 50 rows
2. Edit cells
3. **Expected**: No performance issues

### Test 6.3: Long Text Content
1. Add text-only page with 5000+ characters
2. **Expected**: Content displays and edits smoothly

### Test 6.4: Many Images
1. Create images page with 20+ images  
2. **Expected**: Load time reasonable, gallery functions properly

### Test 6.5: Special Characters in Text
1. Add text with: é, ñ, 中文, emoji 🎉
2. Save and reload
3. **Expected**: All characters display correctly

---

## Phase 7: Error Handling

### Test 7.1: Invalid Image URLs
1. Add just-images page
2. Enter invalid URL (e.g., "not a valid url")
3. **Expected**: Shows placeholder or broken image indicator
4. Replace with valid URL
5. **Expected**: Image loads correctly

### Test 7.2: Network Error Recovery
1. Create page while offline (should fail)
2. Go back online
3. Try again
4. **Expected**: Creation succeeds, error message displayed appropriately

### Test 7.3: Concurrent Edits
1. Open same page in two browser windows
2. Edit in first window, save
3. In second window, make different edits, save
4. Reload first window
5. **Expected**: See latest saved version

---

## Phase 8: Index Page Auto-Sync Validation

### Test 8.1: Index Updates After Page Creation
1. Note current index page content
2. Create 2 new pages
3. Go Back to Index
4. **Expected**: New pages appear in index with correct page numbers

### Test 8.2: Index Updates After Page Deletion
1. Delete last page
2. Go to Index
3. **Expected**: Deleted page removed from index

### Test 8.3: Index Updates After Reordering
1. Reorder pages using Page Manager
2. Go to Index
3. **Expected**: Index reflects new page order with updated page numbers
4. Click links in index
5. **Expected**: All links navigate to correct pages with correct numbers

### Test 8.4: Index Auto-Update Doesn't Interfere
1. Create an index page
2. Manually edit index content
3. Create new page
4. Go back to Index
5. **Expected**: Index auto-updated with new pages
6. Manual index edits merged correctly with auto-sync

---

## Sign-Off Checklist

- [ ] All templates create successfully
- [ ] All editors work correctly
- [ ] Before/After/End insertion positions work
- [ ] Page deletion and renumbering works
- [ ] Page reordering works and updates all references
- [ ] Index page auto-updates on all changes
- [ ] All links navigate correctly
- [ ] Save/reload preserves all data
- [ ] No console errors
- [ ] Performance acceptable with 50+ pages
- [ ] Special characters and emoji work correctly
- [ ] Mobile view works (if applicable)

---

## Known Limitations

*(Document any limitations found during testing)*

---

## Notes

Test started: _____________
Test completed: _____________
Tester: _____________
Issues found: _____________
