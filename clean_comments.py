import os
import re

# Regex to match decorative lines
# Cases to handle:
# 1. // ============
# 2. {/* ============
# 3. /* ============
# 4. * ============
# 5. # ============
# 6. ============ */
# 7. ============ */}
# 8. # ─── Title ─── (We shouldn't remove titles if they have text, user said "garis seperti ini" meaning pure decorative lines)

pattern = re.compile(r'^\s*(?:\{\s*/\*\s*|//|/\*|\*|#|<!--)?\s*[=═─-]{7,}\s*(?:\*/\s*\}|\*/|-->)?\s*$')

def clean_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        lines = f.readlines()
    
    new_lines = []
    changed = False
    for line in lines:
        if pattern.match(line) and not '---' in line: # Exclude markdown --- maybe? Wait, this is for code files.
            # It's a purely decorative line
            changed = True
        else:
            new_lines.append(line)
            
    if changed:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.writelines(new_lines)
        print(f"Cleaned {filepath}")

def main():
    extensions = {'.js', '.jsx', '.ts', '.tsx', '.py', '.css'}
    for root, dirs, files in os.walk('.'):
        if 'node_modules' in root or '.git' in root or '.venv' in root or 'venv' in root or '__pycache__' in root:
            continue
        for file in files:
            if any(file.endswith(ext) for ext in extensions):
                filepath = os.path.join(root, file)
                try:
                    clean_file(filepath)
                except Exception as e:
                    print(f"Error reading {filepath}: {e}")

if __name__ == '__main__':
    main()
