"""Install the produced APK, verify its WebView content and leave the welcome screen."""
from pathlib import Path
import subprocess
import time
import xml.etree.ElementTree as ET

out = Path('android-smoke')
out.mkdir(exist_ok=True)

def adb(*args, check=True):
    return subprocess.run(['adb', *args], check=check, capture_output=True)

apk = next(Path('apk').glob('*.apk'))
adb('install', '-r', str(apk))
adb('shell', 'am', 'start', '-W', '-n', 'de.beifusskompass.app/.MainActivity')

def dump():
    adb('shell', 'uiautomator', 'dump', '/sdcard/beifuss-window.xml', check=False)
    result = adb('shell', 'cat', '/sdcard/beifuss-window.xml', check=False)
    return result.stdout.decode('utf-8', errors='replace')

welcome = None
for attempt in range(8):
    time.sleep(3)
    text = dump()
    (out / 'welcome.xml').write_text(text)
    if 'Verstanden' in text:
        welcome = ET.fromstring(text)
        break
    adb('shell', 'input', 'swipe', '540', '1900', '540', '650', '450', check=False)
if welcome is None:
    (out / 'logcat.txt').write_bytes(adb('logcat', '-d').stdout)
    raise AssertionError('Packaged JavaScript welcome screen did not appear on Android')

for node in welcome.iter('node'):
    if 'Verstanden' in (node.attrib.get('text', '') + node.attrib.get('content-desc', '')):
        import re
        x1, y1, x2, y2 = map(int, re.findall(r'\d+', node.attrib['bounds']))
        adb('shell', 'input', 'tap', str((x1+x2)//2), str((y1+y2)//2))
        break
time.sleep(2)
home = dump()
(out / 'home.xml').write_text(home)
if 'Chicken Nuggets' not in home and 'Lebensmittel' not in home:
    raise AssertionError('Food guide was not exposed after dismissing welcome')
(out / 'home.png').write_bytes(adb('exec-out', 'screencap', '-p').stdout)
print('APK installed and launched; offline WebView guide and welcome interaction verified on Android 15.')
