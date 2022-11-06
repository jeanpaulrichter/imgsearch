# imgsearch

### why?
Sometimes one needs a lot of images and searching for them one by one is too cumbersome. i.e. I for some reason wanted 250x250 portraits for a list of composers. This is a small tool to speed up the process a bit.

### how?
```bash
git clone https://github.com/jeanpaulrichter/imgsearch.git
cd imgsearch
```
create a file called `config.ini` with the following content:

port=8073 (some valid port number)
chromium=/path/to/chromium (https://www.chromium.org/getting-involved/download-chromium/)
cachesize=16 (number of images the server will cache)


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

```bash
mkdir webview/obj
cd webview/obj
cmake ..
cmake --build . --config Release
cmake --install
```

This should create a small webview binary that displays the interface and runs the server in the background.

### question?
wouldnt it be better to write the whole program in c++ without this node server stuff and webview? Yes, probably.