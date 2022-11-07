#include <iostream>
#include <fstream>
#include <string>
#include <filesystem>
#include <webview.h>
#include <atomic>

#ifdef _WIN32
#include <windows.h>
#include <winuser.h>
#include <stdlib.h>
#include <signal.h>
#else
#include <unistd.h>
#include <sys/wait.h>
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
    if (!std::filesystem::exists("server.exe")) {
        return 2;
    }

    wchar_t exe[] = L"server.exe";

    ZeroMemory(&si, sizeof(si));
    si.cb = sizeof(si);
    ZeroMemory(&pi, sizeof(pi));

    HANDLE ghJob = CreateJobObject(NULL, NULL);
    if(ghJob == NULL) {
        return 3;
    }

    JOBOBJECT_EXTENDED_LIMIT_INFORMATION jeli = { 0 };
    jeli.BasicLimitInformation.LimitFlags = JOB_OBJECT_LIMIT_KILL_ON_JOB_CLOSE;

    if(!SetInformationJobObject(ghJob, JobObjectExtendedLimitInformation, &jeli, sizeof(jeli))) {
        return 4;
    }

    if (!CreateProcess(NULL, exe, NULL, NULL, FALSE, CREATE_NO_WINDOW, NULL, NULL, &si, &pi)) {
        return 3;
    }
    bool gotjob = AssignProcessToJobObject(ghJob, pi.hProcess);

    CloseHandle(pi.hThread);

    webview::webview w(false, nullptr);
    w.set_title("ImgSearch");
    w.set_size(800, 600, WEBVIEW_HINT_NONE);
    w.navigate(location);

    HICON hIcon = (HICON)LoadImageW((HINSTANCE)GetModuleHandleW(NULL), MAKEINTRESOURCEW(101), IMAGE_ICON, GetSystemMetrics(SM_CXSMICON), GetSystemMetrics(SM_CYSMICON), 0);
    if (hIcon) {
        SendMessage((HWND)w.window(), WM_SETICON, ICON_SMALL, (LPARAM)hIcon);
    }

    w.run();
    
    if(!gotjob) {
        TerminateProcess(pi.hProcess, 0);
        WaitForSingleObject(pi.hProcess, 1000);
    }

    CloseHandle(pi.hProcess);    

    w.terminate();

    return 0;
}

#else

std::atomic<int> pid_server;

void sigquitHandler(int signal_number)
{
    kill(pid_server, SIGTERM);
    wait(nullptr);
    _exit(10);
}

int main()
{
    std::string location;
    if (!getLocation(location)) {
        exit(1);
    }

    if(!std::filesystem::exists("server")) {
        exit(2);
    }
    
    signal(SIGQUIT, sigquitHandler);

    pid_server = fork();
    if (pid_server == -1) {
        exit(3);
    } else if (pid_server > 0) {
        sleep(1);
        webview::webview w(false, nullptr);
        w.set_title("ImgSearch");
        w.set_size(800, 600, WEBVIEW_HINT_NONE);
        w.navigate(location);
        w.run();
        w.terminate();
        kill(pid_server, SIGTERM);
        wait(nullptr);
        return 0;
    } else {
        char* args[] = { NULL };
        execve("server", args, nullptr);
        exit(4);
    }
}
#endif
