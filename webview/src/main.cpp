#include <iostream>
#include <fstream>
#include <string>
#include "webview.h"

#ifdef _WIN32
#include <windows.h>
#include <winuser.h>
#endif

// Read port from config.ini & return location for webview
bool getLocation(std::string& loc) {
    try {
        std::string line;
        std::ifstream f("config.ini");

        if (!f.is_open()) {
            return false;
        }

        size_t i_temp{}, line_length{}, i_start{}, i_end{}, i_equal{};
        std::string key{}, value{};

        while (std::getline(f, line)) {
            line_length = line.length();

            // Skip first spaces & tabs
            while (i_temp < line_length && (line[i_temp] == 32 || line[i_temp] == 9)) {
                ++i_temp;
            }
            // empty or comment line
            if (i_temp >= line_length || line[i_temp] == ';') {
                continue;
            }

            i_start = i_temp;
            i_equal = line.find_first_of('=', i_start);

            if (i_equal == std::string::npos) {
                continue;
            } else if (i_equal == 0) {
                continue;
            }

            // Trim key from the right
            for (i_end = i_equal - 1; i_end > 0; --i_end) {
                if (!(line[i_end] == 32 || line[i_end] == 9)) {
                    break;
                }
            }

            key.assign(&line[i_start], i_end - i_start + 1);

            if (key.compare("port") != 0) {
                continue;
            }

            // Skip spaces & tabs before value
            i_start = i_equal + 1;
            while (i_start < line_length && (line[i_start] == 32 || line[i_start] == 9)) {
                i_start++;
            }
            if (i_start == line_length) {
                continue;
            }

            // Trim value from the right
            for (i_end = line_length - 1; i_end >= i_start; --i_end) {
                if (!(line[i_end] == 32 || line[i_end] == 9)) {
                    break;
                }
            }

            value.assign(&line[i_start], i_end - i_start + 1);
            int port = std::stoi(value);
            if (port > 0 && port < 65535) {
                loc = "http://localhost:" + value;
                return true;
            } else {
                return false;
            }            
        }
        return false;
    } catch (...) {
        return false;
    }
}

#ifdef _WIN32
int WINAPI WinMain(HINSTANCE hInt, HINSTANCE hPrevInst, LPSTR lpCmdLine, int nCmdShow)
{
    STARTUPINFO si{};
    PROCESS_INFORMATION pi{};

    std::string location;
    if (!getLocation(location)) {
        return 1;
    }

    wchar_t exe[] = L"server.exe";

    ZeroMemory(&si, sizeof(si));
    si.cb = sizeof(si);
    ZeroMemory(&pi, sizeof(pi));

    if (!CreateProcess(NULL, exe, NULL, NULL, FALSE, CREATE_NO_WINDOW, NULL, NULL, &si, &pi)) {
        return 2;
    }

    webview::webview w(false, nullptr);
    w.set_title("ImgSearch");
    w.set_size(800, 600, WEBVIEW_HINT_NONE);
    w.navigate(location);

    HICON hIcon = (HICON)LoadImageW((HINSTANCE)GetModuleHandleW(NULL), MAKEINTRESOURCEW(101), IMAGE_ICON, GetSystemMetrics(SM_CXSMICON), GetSystemMetrics(SM_CYSMICON), 0);
    if (hIcon) {
        SendMessage((HWND)w.window(), WM_SETICON, ICON_SMALL, (LPARAM)hIcon);
    }

    w.run();
    
    TerminateProcess(pi.hProcess, 0);
    CloseHandle(pi.hProcess);
    CloseHandle(pi.hThread);

    w.terminate();

    return 0;
}

#else
int main()
{
    std::string location;
    if (!getLocation(location)) {
        return 1;
    }

    webview::webview w(false, nullptr);
    w.set_title("ImgSearch");
    w.set_size(800, 600, WEBVIEW_HINT_NONE);
    w.navigate(location);
    w.run();
    w.terminate();

    return 0;
}
#endif
