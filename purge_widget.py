import os
import re

pbx_path = 'ios/App/App.xcodeproj/project.pbxproj'
if not os.path.exists(pbx_path):
    print(f"Error: {pbx_path} not found")
    exit(1)

with open(pbx_path, 'r') as f:
    content = f.read()

# Targets and names to remove
TARGET_NAME = 'PalanteWidgetExtension'
FILE_REFS_TO_REMOVE = [
    'PalanteWidgetExtension.appex',
    'PalanteWidgetBundle.swift',
    'PalanteWidgetExtension.entitlements',
    'Pods_PalanteWidgetExtension.framework',
    'PalanteWidget'
]

# 1. Remove blocks (isa = PBXNativeTarget, PBXContainerItemProxy, etc.)
# We look for the start of the block and read until the matching closing brace
def remove_blocks(text, pattern):
    while True:
        match = re.search(pattern, text)
        if not match:
            break
        
        start_idx = match.start()
        # Find matching closing brace
        brace_count = 0
        end_idx = -1
        for j in range(start_idx, len(text)):
            if text[j] == '{':
                brace_count += 1
            elif text[j] == '}':
                brace_count -= 1
                if brace_count == 0:
                    end_idx = j + 1
                    break
        
        if end_idx != -1:
            # Check if there's a semicolon after
            if end_idx < len(text) and text[end_idx] == ';':
                end_idx += 1
            text = text[:start_idx] + text[end_idx:]
        else:
            break
    return text

# Remove Native Target
content = remove_blocks(content, r'[A-F0-9]{24} /\* ' + re.escape(TARGET_NAME) + r' \*/ = \{')
# Remove Container Proxy
content = remove_blocks(content, r'[A-F0-9]{24} /\* PBXContainerItemProxy \*/ = \{[^{}]*containerPortal = [A-F0-9]{24} /\* Project object \*/;[^{}]*remoteInfo = ' + re.escape(TARGET_NAME))
# Remove Target Dependency
content = remove_blocks(content, r'[A-F0-9]{24} /\* PBXTargetDependency \*/ = \{[^{}]*target = [A-F0-9]{24} /\* ' + re.escape(TARGET_NAME))
# Remove Configuration List
content = remove_blocks(content, r'[A-F0-9]{24} /\* Build configuration list for PBXNativeTarget "' + re.escape(TARGET_NAME) + r'" \*/ = \{')

# 2. Remove single line references (in lists)
for item in FILE_REFS_TO_REMOVE:
    content = re.sub(r'^\s*[A-F0-9]{24} /\* ' + re.escape(item) + r'.*? \*/,?\n', '', content, flags=re.MULTILINE)
    content = re.sub(r'[A-F0-9]{24} /\* ' + re.escape(item) + r'.*? \*/,?', '', content)

# 3. Specifically remove the target from the main Project's target list
content = re.sub(r'[A-F0-9]{24} /\* ' + re.escape(TARGET_NAME) + r' \*/,', '', content)

# 4. Clean up any double commas or empty lines created
content = content.replace(',,', ',')

with open(pbx_path, 'w') as f:
    f.write(content)

print("Purged widget references robustly from pbxproj.")
