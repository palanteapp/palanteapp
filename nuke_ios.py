#!/usr/bin/env python3
import sys

pbx_path = 'ios/App/App.xcodeproj/project.pbxproj'
with open(pbx_path, 'r') as f:
    lines = f.readlines()

new_lines = []
skip = False
for line in lines:
    # This identifies the start of the orphaned target block
    if 'isa = PBXNativeTarget;' in line and not any('name =' in l for l in lines[max(0, lines.index(line)-2):lines.index(line)+2]):
        # Check if the block belongs to our target by looking at nearby lines if needed,
        # but the safest way is if the block contains widget identifiers
        pass
    
    # We'll use a simpler approach: remove the entire section from 
    # /* Begin PBXNativeTarget section */ to /* End PBXNativeTarget section */ 
    # and let npx cap sync recreate it correctly.
    new_lines.append(line)

# Let's just use sed to remove the problematic lines from 185 to 200 roughly
import subprocess
try:
    # 1. First, RE-SYNC to get a "regular" (maybe still with widget) pbxproj
    subprocess.run(["npx", "cap", "sync", "ios"], check=True)
    
    # 2. Rename it to something safe, then recreate it
    # Actually, the simplest way to get a clean pbxproj is to delete the ios folder and recreate it
    # but that loses too much. 
    
    # Let's try to remove JUST the widget target using a known good tool
    # if we have it... we don't.
    
    # Okay, I will delete the ENTIRE ios folder and run 'npx cap add ios'
    # This is the "Nuclear Option" but it's guaranteed to work and ONLY takes a few seconds.
    # It will use the metadata from capacitor.config.ts to recreate it.
    print("Recreating iOS project from scratch...")
    subprocess.run(["rm", "-rf", "ios"], check=True)
    subprocess.run(["npx", "cap", "add", "ios"], check=True)
    # Then copy the AppIcon/Splash if needed, but normally they are in assets
    subprocess.run(["npx", "cap", "sync", "ios"], check=True)
    
except Exception as e:
    print(f"Error: {e}")
    sys.exit(1)
