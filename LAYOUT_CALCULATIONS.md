# Layout Calculations (1920×1080)

## Fixed Heights Breakdown

### Vertical Space (1080px total)
```
Status Strip:
  - Default:  48px
  - Hover:    68px  
  - Expanded: 88px

Context Drawer:
  - Collapsed: 24px
  - Expanded:  280px

Main Content Area (when both collapsed):
  = 1080px - 48px (status) - 24px (drawer) = 1008px

Main Content Area (status expanded, drawer expanded):
  = 1080px - 88px (status) - 280px (drawer) = 712px
```

## Spacing Reductions

**Before → After:**
- Dashboard padding: 16px → 12px
- Context sections gap: 20px → 12px
- Control stack gap: 16px → 12px
- Status strip details padding: 24px → 20px
- Health metric padding: 12px → 8px
- Context section padding: 16px → 12px

## Result
- **No scrolling required** in any state
- All content fits within viewport
- Tighter, more professional spacing
- Context drawer max height: 280px (fits comfortably)
