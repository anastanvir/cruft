Output "demo.gif"

Set FontSize 14
Set Width 800
Set Height 600
Set PlaybackSpeed 2

Type "cruft"
Sleep 500ms

# Show items
Sleep 2s

# Navigate down
Type "↓"
Sleep 100ms
Type "↓"
Sleep 100ms
Type "↓"
Sleep 100ms

# Filter to unused 90d+
Type "f"
Sleep 200ms
Type "u"
Sleep 200ms
Type "escape"
Sleep 500ms

# Select items
Type "a"
Sleep 300ms

# Delete
Type "d"
Sleep 500ms

# Confirm
Type "y"
Sleep 1s

# Undo
Type "u"
Sleep 1s

# Quit
Type "q"
