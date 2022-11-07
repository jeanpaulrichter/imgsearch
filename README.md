# imgsearch

### why?
Sometimes one needs a lot of images and searching for them one by one is too cumbersome. i.e. I for some reason wanted 250x250 portraits for a list of composers. This is a small tool to speed up the process a bit.

### how?
```bash
git clone https://github.com/jeanpaulrichter/imgsearch.git
cd imgsearch
```
create a file called `config.ini` with the following content:

```
port=8073 (some valid port number)
chromium=/path/to/chromium (https://www.chromium.org/getting-involved/download-chromium/)
cachesize=16 (number of images the server will cache)
```

```bash
npm install
npm run build
```
[ now you could start the server via `node dist/server.cjs` and use your browser
as gui under http://localhost:port. ]

But if you want to bundle everything run:

```bash
npm run package
```

This should create a binary bundle (with node included) in /bin (ie. /bin/server.exe)

It is possible to create a small webview binary that starts the server is background process, but 
requires ab bit more preparation:
- (1) download https://raw.githubusercontent.com/webview/webview/master/webview.h to webview/libs/webview/include
- (2a windows): save WebView2.h from https://www.nuget.org/api/v2/package/Microsoft.Web.WebView2 (build/native/include) to webview/libs/webview2/include
and WebView2LoaderStatic.lib (build/native/x64) to webview/libs/webview2/lib
- (2b linux): make sure you have libgtk-3-dev and libwebkit2gtk-4.0-dev

```bash
mkdir webview/obj
cd webview/obj
cmake ..
cmake --build . --config Release
cmake --install . --config Release
```

This should create a small webview binary that displays the interface and runs the server in the background.

### question?
wouldnt it be better to write the whole program in c++ without this node server stuff and webview? Yes, probably.