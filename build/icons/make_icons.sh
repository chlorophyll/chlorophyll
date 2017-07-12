echo 'windows'; convert chlorophyll1024.png -scale 256 icon.ico
echo 'osx'
mkdir chlorophyll.iconset
echo "  16x16      "           ;convert chlorophyll1024.png -scale  16  chlorophyll.iconset/icon_16x16.png
echo "  16x16@2x   "           ;convert chlorophyll1024.png -scale  32  chlorophyll.iconset/icon_16x16@2x.png
echo "  32x32      "           ;convert chlorophyll1024.png -scale  32  chlorophyll.iconset/icon_32x32.png
echo "  32x32@2x   "           ;convert chlorophyll1024.png -scale  64  chlorophyll.iconset/icon_32x32@2x.png
echo "  128x128    "           ;convert chlorophyll1024.png -scale 128  chlorophyll.iconset/icon_128x128.png
echo "  128x128@2x "           ;convert chlorophyll1024.png -scale 256  chlorophyll.iconset/icon_128x128@2x.png
echo "  256x256    "           ;convert chlorophyll1024.png -scale 256  chlorophyll.iconset/icon_256x256.png
echo "  256x256@2x "           ;convert chlorophyll1024.png -scale 512  chlorophyll.iconset/icon_256x256@2x.png
echo "  512x512    "           ;convert chlorophyll1024.png -scale 512  chlorophyll.iconset/icon_512x512.png
echo "  512x512@2x "           ;convert chlorophyll1024.png -scale 1024 chlorophyll.iconset/icon_512x512@2x.png

echo 'linux'; cp chlorophyll.iconset/icon_512x512.png icon.png

iconutil -c icns chlorophyll.iconset
mv chlorophyll.icns icon.icns
rm -rf chlorophyll.iconset
